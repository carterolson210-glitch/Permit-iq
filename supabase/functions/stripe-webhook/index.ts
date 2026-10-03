// Supabase Edge Function: stripe-webhook
// Keeps users.plan / billing state in sync with Stripe.
//
// Deploy: `supabase functions deploy stripe-webhook --no-verify-jwt`
//   (Stripe cannot send a Supabase JWT; authenticity comes from the
//   webhook signature instead)
// Secrets: STRIPE_WEBHOOK_SECRET, plus the STRIPE_PRICE_* map (same values
//   as stripe-checkout) and optionally RESEND_API_KEY for the confirmation
//   email. SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are platform-provided.
//
// Handled events:
//   checkout.session.completed      → activate plan, store customer/sub ids
//   customer.subscription.updated   → period end, plan switches (proration),
//                                     cancel-at-period-end, clear grace
//   customer.subscription.deleted   → downgrade to free (fires at period end
//                                     for cancellations, immediately for
//                                     hard cancels)
//   invoice.payment_failed          → start 7-day grace period

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const GRACE_DAYS = 7
// Slack past the Stripe period end so access never flickers while the
// renewal invoice settles; the next subscription.updated re-extends it.
const PERIOD_END_SLACK_MS = 24 * 3600 * 1000

function planFromPriceId(priceId: string | undefined): 'pro' | 'contractor' | null {
  if (!priceId) return null
  if (
    priceId === Deno.env.get('STRIPE_PRICE_PRO_MONTHLY') ||
    priceId === Deno.env.get('STRIPE_PRICE_PRO_ANNUAL')
  ) {
    return 'pro'
  }
  if (
    priceId === Deno.env.get('STRIPE_PRICE_CONTRACTOR_MONTHLY') ||
    priceId === Deno.env.get('STRIPE_PRICE_CONTRACTOR_ANNUAL')
  ) {
    return 'contractor'
  }
  return null
}

Deno.serve(async (req: Request) => {
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!webhookSecret || !supabaseUrl || !serviceKey) {
    return new Response('Server not configured', { status: 500 })
  }

  const signature = req.headers.get('stripe-signature') ?? ''
  const payload = await req.text()
  const ok = await verifyStripeSignature(payload, signature, webhookSecret)
  if (!ok) return new Response('Invalid signature', { status: 400 })

  const event = JSON.parse(payload)
  const admin = createClient(supabaseUrl, serviceKey)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode !== 'subscription') break
        const userId = session.client_reference_id ?? session.metadata?.user_id
        const plan =
          session.metadata?.plan === 'contractor' ? 'contractor' : 'pro'
        const billing =
          session.metadata?.billing === 'annual' ? 'annual' : 'monthly'
        if (!userId) break

        // Fallback expiry in case subscription.updated arrives out of order;
        // it will be overwritten with the exact period end.
        const fallbackDays = billing === 'annual' ? 367 : 32
        await admin
          .from('users')
          .update({
            plan,
            billing_interval: billing,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            subscription_status: 'active',
            cancel_at_period_end: false,
            grace_until: null,
            plan_expires_at: new Date(
              Date.now() + fallbackDays * 24 * 3600 * 1000
            ).toISOString(),
          })
          .eq('id', userId)

        const { data: user } = await admin
          .from('users')
          .select('referred_by, email')
          .eq('id', userId)
          .maybeSingle()
        if (user?.referred_by) {
          await admin
            .from('referrals')
            .update({ converted: true })
            .eq('referrer_id', user.referred_by)
            .eq('referee_email', user.email)
        }
        if (resendKey && user?.email) {
          await sendConfirmationEmail(resendKey, user.email, plan)
        }
        await logEvent(admin, 'upgrade', userId, { plan, billing })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        const customerId = sub.customer
        const item = sub.items?.data?.[0]
        const plan = planFromPriceId(item?.price?.id)
        const periodEndSec = sub.current_period_end ?? item?.current_period_end
        const status = sub.status as string

        if (status === 'active' || status === 'trialing') {
          const update: Record<string, unknown> = {
            subscription_status: status,
            stripe_subscription_id: sub.id,
            cancel_at_period_end: Boolean(sub.cancel_at_period_end),
            grace_until: null, // payment is current again
          }
          if (plan) update.plan = plan
          if (item?.price?.recurring?.interval) {
            update.billing_interval =
              item.price.recurring.interval === 'year' ? 'annual' : 'monthly'
          }
          if (periodEndSec) {
            update.plan_expires_at = new Date(
              periodEndSec * 1000 + PERIOD_END_SLACK_MS
            ).toISOString()
          }
          await admin.from('users').update(update).eq('stripe_customer_id', customerId)
        } else if (status === 'past_due' || status === 'unpaid') {
          await startGrace(admin, customerId, status, resendKey)
        } else if (status === 'canceled') {
          await downgrade(admin, customerId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        await downgrade(admin, event.data.object.customer)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        // Only subscription renewals start a grace period.
        if (invoice.subscription || invoice.parent?.subscription_details) {
          await startGrace(admin, invoice.customer, 'past_due', resendKey)
        }
        break
      }
    }
    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response('error', { status: 500 })
  }
})

/** Cancellation / final downgrade: back to free, clear billing state. */
async function downgrade(
  admin: ReturnType<typeof createClient>,
  customerId: string
) {
  const { data: user } = await admin
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  await admin
    .from('users')
    .update({
      plan: 'free',
      subscription_status: 'canceled',
      stripe_subscription_id: null,
      cancel_at_period_end: false,
      grace_until: null,
      plan_expires_at: null,
    })
    .eq('stripe_customer_id', customerId)
  if (user?.id) await logEvent(admin, 'cancel', user.id)
}

/** Fire-and-forget funnel event, written server-side since the webhook is
 *  the only reliable source of truth for billing lifecycle changes. */
async function logEvent(
  admin: ReturnType<typeof createClient>,
  event: string,
  userId: string | null,
  props?: Record<string, unknown>
) {
  try {
    await admin.from('analytics_events').insert({ event, user_id: userId, props: props ?? null })
  } catch (err) {
    console.error('analytics insert failed:', err)
  }
}

/** Failed payment: keep access for GRACE_DAYS while Stripe retries. */
async function startGrace(
  admin: ReturnType<typeof createClient>,
  customerId: string,
  status: string,
  resendKey: string | undefined
) {
  const { data: user } = await admin
    .from('users')
    .select('id, email, grace_until')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  if (!user) return
  const existing = user.grace_until ? new Date(user.grace_until).getTime() : 0
  const isNewGraceWindow = existing < Date.now()
  const update: Record<string, unknown> = { subscription_status: status }
  if (isNewGraceWindow) {
    // Don't extend an already-running grace window on repeated retries.
    update.grace_until = new Date(
      Date.now() + GRACE_DAYS * 24 * 3600 * 1000
    ).toISOString()
  }
  await admin.from('users').update(update).eq('id', user.id)
  // Only email once per grace window, not on every Stripe retry within it.
  if (isNewGraceWindow && resendKey && user.email) {
    await sendPaymentFailedEmail(resendKey, user.email)
  }
}

async function sendPaymentFailedEmail(apiKey: string, to: string) {
  const appUrl = Deno.env.get('APP_URL') ?? 'https://permit-iq-rho.vercel.app'
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'PermitIQ <hello@permitiq.app>',
      to,
      subject: "Your PermitIQ payment didn't go through",
      html: `<p>Your last payment for PermitIQ didn't go through.</p>
<p>Your plan stays active for ${GRACE_DAYS} days while we retry — update your card from the billing portal to avoid losing access.</p>
<p><a href="${appUrl}/analyze" style="background:#1e40af;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">Update payment method →</a></p>`,
    }),
  })
}

async function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string
): Promise<boolean> {
  const parts = Object.fromEntries(
    header.split(',').map((kv) => kv.split('=') as [string, string])
  )
  const t = parts['t']
  const v1 = parts['v1']
  if (!t || !v1) return false
  // Reject stale signatures (replay protection, 5 minute tolerance).
  const age = Math.abs(Date.now() / 1000 - Number(t))
  if (!Number.isFinite(age) || age > 300) return false
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${payload}`))
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return hex === v1
}

async function sendConfirmationEmail(apiKey: string, to: string, plan: string) {
  const planName = plan === 'contractor' ? 'Contractor' : 'Pro'
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'PermitIQ <hello@permitiq.app>',
      to,
      subject: `Your PermitIQ ${planName} plan is active`,
      html: `<p>Thanks for subscribing to <strong>PermitIQ ${planName}</strong>.</p>
<p>You now have unlimited permit scans. Manage your subscription any time from the billing portal inside the app.</p>`,
    }),
  })
}
