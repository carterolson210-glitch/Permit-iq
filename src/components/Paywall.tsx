import { useState } from 'react'
import { motion } from 'framer-motion'
import { startCheckout } from '../lib/stripe'
import { PLAN_DEFS, annualSavingsLabel, type Billing, type PlanKey } from '../lib/plans'
import { fadeUp, staggerChildren } from '../lib/motionVariants'
import { FREE_SCAN_LIMIT } from '../lib/auth'
import type { ScanPreview } from '../lib/anthropic'

/**
 * Upgrade screen shown when a free account has used all its scans
 * (or when the server rejects a scan with code `scan_limit`).
 * When the server produced a metadata preview of the blocked scan, it is
 * rendered as a locked report card — value first, wall second.
 */
export default function Paywall({
  message,
  preview,
}: {
  message?: string
  preview?: ScanPreview
}) {
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
          {preview ? 'Your report is ready to unlock' : "You've used your free scans"}
        </h1>
        <p className="mt-3 text-ink-muted">
          {message ??
            'Upgrade to keep analyzing projects. Every plan includes town-specific permit checklists, fee estimates, and document lists.'}
        </p>
      </motion.div>

      {preview && (
        <motion.div
          variants={fadeUp}
          className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-2xl border border-line bg-white shadow-card"
        >
          <div className="border-b border-line bg-slate-50 px-6 py-4 text-left">
            <p className="text-sm text-ink">
              We analyzed your project and found{' '}
              <strong className="text-primary">
                {preview.permit_count} permit{preview.permit_count === 1 ? '' : 's'}
              </strong>{' '}
              required in <strong>{preview.town}</strong>
              {preview.commonly_missed_count > 0 && (
                <>
                  , including{' '}
                  <strong className="text-red-600">
                    {preview.commonly_missed_count} that{' '}
                    {preview.commonly_missed_count === 1 ? 'is' : 'are'} commonly missed
                  </strong>
                </>
              )}
              {preview.timeline_estimate && (
                <>
                  . Estimated approval timeline: <strong>{preview.timeline_estimate}</strong>
                </>
              )}
              .
            </p>
          </div>
          <div className="relative px-6 py-5 text-left" aria-hidden="true">
            <ul className="space-y-3 blur-[6px] select-none">
              {(preview.permit_names.length > 0
                ? preview.permit_names
                : ['Building Permit', 'Zoning Review', 'Trade Permit']
              ).map((name, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="h-5 w-5 flex-none rounded-full bg-slate-200" />
                  <span className="text-sm text-ink">{name} — requirements, fees, documents…</span>
                </li>
              ))}
            </ul>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-ink/80 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
                Unlock the full report
              </span>
            </div>
          </div>
        </motion.div>
      )}

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
