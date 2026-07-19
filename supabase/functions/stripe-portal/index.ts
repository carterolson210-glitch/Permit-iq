// Supabase Edge Function: stripe-portal
// Creates a Stripe hosted Customer Portal session so subscribers can
// self-manage billing (update card, switch plan, cancel). We never build
// billing UI ourselves.
//
// Deploy: `supabase functions deploy stripe-portal`
// Secrets: STRIPE_SECRET_KEY, APP_URL

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

function corsHeaders(req: Request): Record<string, string> {
  const appUrl = Deno.env.get('APP_URL')
  const origin = req.headers.get('origin') ?? ''
  // Both Vercel projects deploy this app; any localhost port covers Vite's
  // auto-increment when 5173 is taken.
  const allowed = new Set(
    [appUrl, 'https://permit-iq-rho.vercel.app', 'https://permit-iq-1gzx.vercel.app'].filter(Boolean)
  )
  const ok = allowed.has(origin) || /^http:\/\/localhost:\d+$/.test(origin)
  return {
    'Access-Control-Allow-Origin': ok ? origin : (appUrl ?? '*'),
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
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

    const authHeader = req.headers.get('authorization') ?? ''
    const authed = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await authed.auth.getUser()
    if (!user) return json({ error: 'Not signed in', code: 'auth' }, 401, cors)

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: profile } = await admin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()
    if (!profile?.stripe_customer_id) {
      return json({ error: 'No billing account yet — subscribe first.' }, 400, cors)
    }

    const form = new URLSearchParams()
    form.append('customer', profile.stripe_customer_id)
    form.append('return_url', `${appUrl}/analyze`)

    const resp = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    })
    if (!resp.ok) {
      console.error('Stripe error:', await resp.text())
      return json({ error: 'Could not open the billing portal.' }, 502, cors)
    }
    const session = await resp.json()
    return json({ url: session.url }, 200, cors)
  } catch (err) {
    console.error(err)
    return json({ error: 'Unexpected error.' }, 500, cors)
  }
})

function json(payload: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', ...cors },
  })
}
