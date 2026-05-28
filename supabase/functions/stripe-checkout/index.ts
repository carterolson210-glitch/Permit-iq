// Supabase Edge Function: stripe-checkout
// Creates a Stripe Checkout Session for the requested plan.
// Deploy: `supabase functions deploy stripe-checkout`
// Secrets: STRIPE_SECRET_KEY, APP_URL

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CheckoutRequest {
  price_id: string
  mode: 'subscription' | 'payment'
  user_id: string
  user_email: string
  plan_name: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:5173'
    if (!stripeKey) return json({ error: 'Server not configured' }, 500)

    const body = (await req.json()) as CheckoutRequest
    if (!body?.price_id || !body?.mode || !body?.user_email) {
      return json({ error: 'price_id, mode, user_email required' }, 400)
    }

    const form = new URLSearchParams()
    form.append('mode', body.mode)
    form.append('line_items[0][price]', body.price_id)
    form.append('line_items[0][quantity]', '1')
    form.append('customer_email', body.user_email)
    form.append('success_url', `${appUrl}/dashboard?checkout=success`)
    form.append('cancel_url', `${appUrl}/pricing?checkout=cancelled`)
    form.append('client_reference_id', body.user_id)
    form.append('metadata[plan]', body.plan_name)
    form.append('metadata[user_id]', body.user_id)
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
      const text = await resp.text()
      console.error('Stripe error:', text)
      return json({ error: 'Stripe error' }, 502)
    }
    const session = await resp.json()
    return json({ url: session.url, id: session.id }, 200)
  } catch (err) {
    console.error(err)
    return json({ error: 'Unexpected error' }, 500)
  }
})

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders },
  })
}
