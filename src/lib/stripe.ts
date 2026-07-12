import { functionUrl, supabase } from './supabase'
import type { Billing, PlanKey } from './plans'

export type { Billing, PlanKey }

async function callBillingFunction(
  name: 'stripe-checkout' | 'stripe-portal',
  body: Record<string, unknown>
): Promise<{ url: string }> {
  const { data: session } = await supabase.auth.getSession()
  if (!session.session) {
    window.location.href = `/login?next=${encodeURIComponent('/pricing')}`
    throw new Error('Please sign in first.')
  }

  const url = functionUrl(name)
  if (!url) throw new Error('Billing is not configured yet. Please try again later.')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)
  let resp: Response
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${session.session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch {
    throw new Error(
      'Could not reach the billing service — check your connection and try again. You have not been charged.'
    )
  } finally {
    clearTimeout(timer)
  }

  if (!resp.ok) {
    const payload = await resp.json().catch(() => ({}))
    throw new Error(payload?.error ?? 'Billing request failed. You have not been charged.')
  }
  return (await resp.json()) as { url: string }
}

/**
 * Start a Stripe hosted Checkout session. The server maps plan+billing to a
 * Stripe price ID from its own secrets — the client never chooses a price.
 */
export async function startCheckout(plan: PlanKey, billing: Billing) {
  const { url } = await callBillingFunction('stripe-checkout', { plan, billing })
  window.location.href = url
}

/** Open Stripe's hosted customer portal (self-manage billing/cancel/upgrade). */
export async function openBillingPortal() {
  const { url } = await callBillingFunction('stripe-portal', {})
  window.location.href = url
}
