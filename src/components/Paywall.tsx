import { useState } from 'react'
import { motion } from 'framer-motion'
import { startCheckout, type Billing, type PlanKey } from '../lib/stripe'
import { fadeUp, staggerChildren } from '../lib/motion'
import { FREE_SCAN_LIMIT } from '../lib/auth'

type PlanCard = {
  key: PlanKey
  name: string
  price: string
  per: string
  billing: Billing
  features: string[]
  highlight?: boolean
}

const PLANS: PlanCard[] = [
  {
    key: 'homeowner',
    name: 'Homeowner',
    price: '$19',
    per: 'one-time',
    billing: 'once',
    features: ['One permit checklist', 'Document list', 'Fee estimate', 'PDF export'],
  },
  {
    key: 'contractor',
    name: 'Contractor',
    price: '$49',
    per: '/month',
    billing: 'monthly',
    features: ['Unlimited scans', 'Save projects', 'Client sharing', 'Priority AI'],
    highlight: true,
  },
  {
    key: 'firm',
    name: 'Firm',
    price: '$99',
    per: '/month',
    billing: 'monthly',
    features: ['Everything in Contractor', 'Team seats', 'White-label PDF', 'API access'],
  },
]

/**
 * Upgrade screen shown when a free account has used all its scans
 * (or when the server rejects a scan with code `scan_limit`).
 */
export default function Paywall({ message }: { message?: string }) {
  const [busyPlan, setBusyPlan] = useState<PlanKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async (plan: PlanKey, billing: Billing) => {
    setError(null)
    setBusyPlan(plan)
    try {
      await startCheckout(plan, billing)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout. Please try again.')
      setBusyPlan(null)
    }
  }

  return (
    <motion.section
      variants={staggerChildren}
      initial="hidden"
      animate="show"
      className="py-10 sm:py-16"
    >
      <motion.div variants={fadeUp} className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800">
          {FREE_SCAN_LIMIT} of {FREE_SCAN_LIMIT} free scans used
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
          You've used your free scans
        </h1>
        <p className="mt-3 text-ink-muted">
          {message ??
            'Upgrade to keep analyzing projects. Every plan includes town-specific permit checklists, fee estimates, and document lists.'}
        </p>
      </motion.div>

      {error && (
        <motion.p
          variants={fadeUp}
          role="alert"
          className="mx-auto mt-6 max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700"
        >
          {error}
        </motion.p>
      )}

      <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <motion.div
            key={plan.key}
            variants={fadeUp}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className={`relative flex flex-col rounded-2xl bg-white p-8 ${
              plan.highlight
                ? 'border-2 border-primary shadow-lift'
                : 'border border-line shadow-card'
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow">
                Most Popular
              </span>
            )}
            <h2 className={`text-lg font-semibold ${plan.highlight ? 'text-primary' : 'text-ink'}`}>
              {plan.name}
            </h2>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-ink">{plan.price}</span>
              <span className="text-ink-muted">{plan.per}</span>
            </div>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm text-ink-muted">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 flex-none text-accent" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z" clipRule="evenodd" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleUpgrade(plan.key, plan.billing)}
              disabled={busyPlan !== null}
              className={
                plan.highlight
                  ? 'btn-primary mt-8 w-full'
                  : 'btn-secondary mt-8 w-full border-primary text-primary hover:bg-blue-50'
              }
            >
              {busyPlan === plan.key ? 'Redirecting…' : `Choose ${plan.name}`}
            </motion.button>
          </motion.div>
        ))}
      </div>

      <motion.p variants={fadeUp} className="mt-8 text-center text-sm text-ink-muted">
        Secure checkout via Stripe. Annual billing for Contractor and Firm plans is available at
        checkout.
      </motion.p>
    </motion.section>
  )
}
