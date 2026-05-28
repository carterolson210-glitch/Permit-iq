import { functionUrl, supabase } from './supabase'

export type PlanKey = 'homeowner' | 'contractor' | 'firm'
export type Billing = 'monthly' | 'annual' | 'once'

const PRICE_IDS: Record<PlanKey, Partial<Record<Billing, string>>> = {
  homeowner: {
    once: import.meta.env.VITE_STRIPE_PRICE_HOMEOWNER as string,
  },
  contractor: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_CONTRACTOR_MONTHLY as string,
    annual: import.meta.env.VITE_STRIPE_PRICE_CONTRACTOR_ANNUAL as string,
  },
  firm: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_FIRM_MONTHLY as string,
    annual: import.meta.env.VITE_STRIPE_PRICE_FIRM_ANNUAL as string,
  },
}

export async function startCheckout(plan: PlanKey, billing: Billing) {
  const priceId = PRICE_IDS[plan]?.[billing]
  if (!priceId) {
    throw new Error('Stripe price ID is not configured for this plan.')
  }
  const { data: session } = await supabase.auth.getSession()
  const user = session.session?.user
  if (!user) {
    window.location.href = '/login?next=/pricing'
    return
  }

  const url = functionUrl('stripe-checkout')
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session.session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
    },
    body: JSON.stringify({
      price_id: priceId,
      mode: billing === 'once' ? 'payment' : 'subscription',
      user_id: user.id,
      user_email: user.email,
      plan_name: plan,
    }),
  })

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}))
    throw new Error(body?.error ?? 'Could not start checkout.')
  }
  const { url: redirectUrl } = (await resp.json()) as { url: string }
  window.location.href = redirectUrl
}
