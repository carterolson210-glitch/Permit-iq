// Supabase Edge Function: stripe-webhook
// Receives Stripe events and upgrades the user's plan in Supabase.
// Deploy: `supabase functions deploy stripe-webhook --no-verify-jwt`
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY,
//   SUPABASE_URL, RESEND_API_KEY (optional)

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const PLAN_FROM_METADATA: Record<string, string> = {
  homeowner: 'homeowner',
  contractor: 'contractor',
  firm: 'firm',
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

  // Stripe signature verification (HMAC-SHA256 of "t.payload")
  const ok = await verifyStripeSignature(payload, signature, webhookSecret)
  if (!ok) return new Response('Invalid signature', { status: 400 })

  const event = JSON.parse(payload)
  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.client_reference_id ?? session.metadata?.user_id
      const plan = PLAN_FROM_METADATA[session.metadata?.plan] ?? 'homeowner'
      const customerId = session.customer
      if (userId) {
        await supabase
          .from('users')
          .update({
            plan,
            stripe_customer_id: customerId,
            plan_expires_at:
              plan === 'homeowner'
                ? null
                : new Date(Date.now() + 32 * 24 * 3600 * 1000).toISOString(),
          })
          .eq('id', userId)

        // Mark referral converted, if any
        const { data: user } = await supabase
          .from('users')
          .select('referred_by, email')
          .eq('id', userId)
          .maybeSingle()
        if (user?.referred_by) {
          await supabase
            .from('referrals')
            .update({ converted: true })
            .eq('referrer_id', user.referred_by)
            .eq('referee_email', user.email)
        }

        if (resendKey && user?.email) {
          await sendConfirmationEmail(resendKey, user.email, plan)
        }
      }
    } else if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const sub = event.data.object
      const customerId = sub.customer
      const periodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null
      const isActive = sub.status === 'active' || sub.status === 'trialing'
      await supabase
        .from('users')
        .update({
          plan_expires_at: periodEnd,
          plan: isActive ? undefined : 'free',
        })
        .eq('stripe_customer_id', customerId)
    }
    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response('error', { status: 500 })
  }
})

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
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(`${t}.${payload}`)
  )
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return hex === v1
}

async function sendConfirmationEmail(
  apiKey: string,
  to: string,
  plan: string
) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'PermitIQ <hello@permitiq.app>',
      to,
      subject: `Welcome to PermitIQ ${plan}`,
      html: `<p>Your <strong>${plan}</strong> plan is active. Head to your dashboard to get started.</p>`,
    }),
  })
}
