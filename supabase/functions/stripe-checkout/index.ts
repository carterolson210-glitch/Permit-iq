// Supabase Edge Function: stripe-checkout
// Creates a Stripe hosted Checkout Session for the signed-in user.
//
// Deploy: `supabase functions deploy stripe-checkout`
//   (JWT verification stays ON — the caller must be signed in)
// Secrets: STRIPE_SECRET_KEY, APP_URL, and the plan→price map:
//   STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_ANNUAL,
//   STRIPE_PRICE_CONTRACTOR_MONTHLY, STRIPE_PRICE_CONTRACTOR_ANNUAL
// Test mode: put test-mode values (sk_test_…, price_… from test dashboard)
//   in those secrets — nothing else changes.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

function corsHeaders(req: Request): Record<string, string> {
  const appUrl = Deno.env.get('APP_URL')
  const origin = req.headers.get('origin') ?? ''
  const allowed = new Set(
    [appUrl, 'http://localhost:5173', 'http://localhost:4173'].filter(Boolean)
  )
  return {
    'Access-Control-Allow-Origin': allowed.has(origin) ? origin : (appUrl ?? '*'),
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

function priceIdFor(plan: string, billing: string): string | undefined {
  const key = `STRIPE_PRICE_${plan.toUpperCase()}_${billing.toUpperCase()}`
  return Deno.env.get(key) ?? undefined
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors)

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:5173'
    if (!stripeKey || !supabaseUrl || !anonKey || !serviceKey) {
      return json({ error: 'Billing is not configured on the server yet.' }, 500, cors)
    }

    // Identity comes from the JWT — never from the request body.
    const authHeader = req.headers.get('authorization') ?? ''
    const authed = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await authed.auth.getUser()
    if (!user) return json({ error: 'Not signed in', code: 'auth' }, 401, cors)

    const body = (await req.json().catch(() => ({}))) as {
      plan?: string
      billing?: string
    }
    const plan = body.plan === 'pro' || body.plan === 'contractor' ? body.plan : null
    const billing =
      body.billing === 'monthly' || body.billing === 'annual' ? body.billing : null
    if (!plan || !billing) {
      return json({ error: 'plan (pro|contractor) and billing (monthly|annual) required' }, 400, cors)
    }

    const priceId = priceIdFor(plan, billing)
    if (!priceId) {
      return json({ error: `Price for ${plan}/${billing} is not configured.` }, 500, cors)
    }

    // Reuse the Stripe customer if we have one, so upgrades prorate and the
    // portal shows full history.
    const admin = createClient(supabaseUrl, serviceKey)
    const { data: profile } = await admin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    const form = new URLSearchParams()
    form.append('mode', 'subscription')
    form.append('line_items[0][price]', priceId)
    form.append('line_items[0][quantity]', '1')
    if (profile?.stripe_customer_id) {
      form.append('customer', profile.stripe_customer_id)
    } else if (user.email) {
      form.append('customer_email', user.email)
    }
    form.append('success_url', `${appUrl}/analyze?checkout=success`)
    form.append('cancel_url', `${appUrl}/pricing?checkout=cancelled`)
    form.append('client_reference_id', user.id)
    form.append('metadata[plan]', plan)
    form.append('metadata[billing]', billing)
    form.append('metadata[user_id]', user.id)
    form.append('subscription_data[metadata][plan]', plan)
    form.append('subscription_data[metadata][user_id]', user.id)
    form.append('allow_promotion_codes', 'true')

    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    })
    if (!resp.ok) {
      console.error('Stripe error:', await resp.text())
      return json({ error: 'Could not start checkout. You have not been charged.' }, 502, cors)
    }
    const session = await resp.json()
    return json({ url: session.url, id: session.id }, 200, cors)
  } catch (err) {
    console.error(err)
    return json({ error: 'Unexpected error. You have not been charged.' }, 500, cors)
  }
})

function json(payload: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', ...cors },
  })
}
