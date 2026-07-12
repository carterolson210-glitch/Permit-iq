// Single source of truth for pricing tiers.
//
// Prices shown in the UI live here; the *authoritative* plan→Stripe-price
// mapping lives in edge-function secrets (STRIPE_PRICE_*) so the client can
// never substitute its own price ID. Keep the two in sync via SETUP.md.

export type PlanKey = 'pro' | 'contractor'
export type Billing = 'monthly' | 'annual'

export type PlanDef = {
  key: PlanKey | 'free'
  name: string
  tagline: string
  monthly: number | null
  annual: number | null
  features: string[]
  highlight?: boolean
  cta: string
}

export const FREE_SCAN_LIMIT = 3

export const PLAN_DEFS: PlanDef[] = [
  {
    key: 'free',
    name: 'Free',
    tagline: 'See what your project needs',
    monthly: null,
    annual: null,
    cta: 'Start free',
    features: [
      `${FREE_SCAN_LIMIT} permit scans (lifetime)`,
      'Town requirement summaries',
      'Watermarked PDF export',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    tagline: 'For homeowners & serious DIYers',
    monthly: 29,
    annual: 290,
    highlight: true,
    cta: 'Get Pro',
    features: [
      'Unlimited permit scans',
      'Full reports with rejection-prevention analysis',
      'Document checklists & timeline estimates',
      'Unwatermarked PDF export',
      'Saved projects',
    ],
  },
  {
    key: 'contractor',
    name: 'Contractor',
    tagline: 'For pros running multiple jobs',
    monthly: 79,
    annual: 790,
    cta: 'Get Contractor',
    features: [
      'Everything in Pro',
      'Multi-project dashboard',
      'Up to 5 team seats',
      'Client-shareable reports with your branding',
      'Priority processing',
      'Permit deadline reminders',
    ],
  },
]

/** "$290/yr (2 months free)" helper — annual is priced at 10× monthly. */
export function annualSavingsLabel(def: PlanDef): string | null {
  if (!def.monthly || !def.annual) return null
  const savings = def.monthly * 12 - def.annual
  return savings > 0 ? `2 months free (save $${savings})` : null
}
