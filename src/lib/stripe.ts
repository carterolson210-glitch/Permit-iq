import { functionUrl, supabase } from './supabase'
import type { Billing, PlanKey } from './plans'

export type { Billing, PlanKey }

async function callBillingFunction<T>(
  name: 'stripe-checkout' | 'stripe-portal',
  body: Record<string, unknown>
): Promise<T> {
  const { data: session } = await supabase.auth.getSession()
  if (!session.session) {
    const next = window.location.pathname + window.location.search
    window.location.href = `/login?next=${encodeURIComponent(next)}`
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
  return (await resp.json()) as T
}

/** In-app route for the embedded checkout page. */
export function checkoutPath(plan: PlanKey, billing: Billing): string {
  return `/checkout?plan=${plan}&billing=${billing}`
}

/**
 * Create an embedded Checkout Session and return its client secret. The server
 * maps plan+billing to a Stripe price ID from its own secrets — the client
 * never chooses a price. The secret is mounted by <EmbeddedCheckout /> on the
 * /checkout page, so payment happens entirely on-site.
 */
export async function fetchCheckoutClientSecret(
  plan: PlanKey,
  billing: Billing
): Promise<string> {
  const { clientSecret } = await callBillingFunction<{ clientSecret?: string }>(
    'stripe-checkout',
    { plan, billing }
  )
  if (!clientSecret) {
    throw new Error('Checkout is not available right now. You have not been charged.')
  }
  return clientSecret
}

/** Open Stripe's hosted customer portal (self-manage billing/cancel/upgrade). */
export async function openBillingPortal() {
  const { url } = await callBillingFunction<{ url: string }>('stripe-portal', {})
  window.location.href = url
}
