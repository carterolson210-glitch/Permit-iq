import { useState } from 'react'
import { motion } from 'framer-motion'
import { startCheckout } from '../lib/stripe'
import { PLAN_DEFS, annualSavingsLabel, type Billing, type PlanKey } from '../lib/plans'
import { fadeUp, staggerChildren } from '../lib/motionVariants'
import { FREE_SCAN_LIMIT } from '../lib/auth'

/**
 * Upgrade screen shown when a free account has used all its scans
 * (or when the server rejects a scan with code `scan_limit`).
 */
export default function Paywall({ message }: { message?: string }) {
  const [billing, setBilling] = useState<Billing>('annual')
  const [busyPlan, setBusyPlan] = useState<PlanKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async (plan: PlanKey) => {
    setError(null)
    setBusyPlan(plan)
    try {
      await startCheckout(plan, billing)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout. Please try again.')
      setBusyPlan(null)
    }
  }

  const paidPlans = PLAN_DEFS.filter((p) => p.key !== 'free')

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

      <motion.div variants={fadeUp} className="mt-8 flex items-center justify-center gap-3">
        <BillingToggle billing={billing} onChange={setBilling} />
      </motion.div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-6 md:grid-cols-2">
        {paidPlans.map((plan) => {
          const price = billing === 'annual' ? plan.annual : plan.monthly
          const savings = annualSavingsLabel(plan)
          return (
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
              <p className="mt-1 text-xs text-ink-muted">{plan.tagline}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-ink">${price}</span>
                <span className="text-ink-muted">{billing === 'annual' ? '/yr' : '/mo'}</span>
              </div>
              {billing === 'annual' && savings && (
                <p className="mt-1 text-xs font-semibold text-accent">{savings}</p>
              )}
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
                onClick={() => handleUpgrade(plan.key as PlanKey)}
                disabled={busyPlan !== null}
                className={
                  plan.highlight
                    ? 'btn-primary mt-8 w-full'
                    : 'btn-secondary mt-8 w-full border-primary text-primary hover:bg-blue-50'
                }
              >
                {busyPlan === plan.key ? 'Redirecting…' : plan.cta}
              </motion.button>
            </motion.div>
          )
        })}
      </div>

      <motion.p variants={fadeUp} className="mt-8 text-center text-sm text-ink-muted">
        Secure checkout via Stripe. Cancel anytime — you keep access until the end of your
        billing period.
      </motion.p>
    </motion.section>
  )
}

export function BillingToggle({
  billing,
  onChange,
}: {
  billing: Billing
  onChange: (b: Billing) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Billing period"
      className="inline-flex rounded-full border border-line bg-white p-1 text-sm shadow-card"
    >
      {(['monthly', 'annual'] as const).map((b) => (
        <button
          key={b}
          role="radio"
          aria-checked={billing === b}
          onClick={() => onChange(b)}
          className={`rounded-full px-4 py-1.5 font-semibold transition ${
            billing === b ? 'bg-primary text-white shadow' : 'text-ink-muted hover:text-ink'
          }`}
        >
          {b === 'monthly' ? 'Monthly' : 'Annual (2 months free)'}
        </button>
      ))}
    </div>
  )
}
