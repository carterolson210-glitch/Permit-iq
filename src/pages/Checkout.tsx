import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { fadeUp, staggerChildren } from '../lib/motionVariants'
import { fetchCheckoutClientSecret } from '../lib/stripe'
import {
  PLAN_DEFS,
  annualSavingsLabel,
  type Billing,
  type PlanKey,
} from '../lib/plans'
import { BillingToggle } from '../components/Paywall'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as
  | string
  | undefined
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

function CheckItem({ children }: { children: string }) {
  return (
    <li className="flex gap-2 text-sm text-ink-muted">
      <svg
        viewBox="0 0 20 20"
        className="mt-0.5 h-4 w-4 flex-none text-accent"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
          clipRule="evenodd"
        />
      </svg>
      {children}
    </li>
  )
}

function PaymentSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-8" aria-hidden="true">
      <div className="h-4 w-1/3 rounded bg-slate-200" />
      <div className="h-11 rounded-lg bg-slate-100" />
      <div className="h-4 w-1/4 rounded bg-slate-200" />
      <div className="h-11 rounded-lg bg-slate-100" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-11 rounded-lg bg-slate-100" />
        <div className="h-11 rounded-lg bg-slate-100" />
      </div>
      <div className="h-12 rounded-lg bg-slate-200" />
    </div>
  )
}

function SuccessPanel({ planName }: { planName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-lg rounded-2xl border border-line bg-white p-10 text-center shadow-lift"
    >
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 text-accent"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </span>
      <h1 className="mt-6 text-2xl font-extrabold text-ink">
        Welcome to {planName} 🎉
      </h1>
      <p className="mt-3 text-ink-muted">
        Your subscription is active. A receipt is on its way to your inbox —
        unlimited scans are unlocked right now.
      </p>
      <Link to="/analyze" className="btn-primary mt-8 inline-block w-full">
        Start scanning
      </Link>
      <p className="mt-4 text-xs text-ink-muted">
        Manage or cancel anytime from the billing portal.
      </p>
    </motion.div>
  )
}

export default function Checkout() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const planParam = searchParams.get('plan')
  const billingParam = searchParams.get('billing')
  const plan: PlanKey | null =
    planParam === 'pro' || planParam === 'contractor' ? planParam : null
  const billing: Billing = billingParam === 'monthly' ? 'monthly' : 'annual'

  const planDef = useMemo(
    () => PLAN_DEFS.find((p) => p.key === plan) ?? null,
    [plan]
  )

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [complete, setComplete] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!plan) return
    document.title = 'Secure checkout — PermitIQ'
    return () => {
      document.title = 'PermitIQ'
    }
  }, [plan])

  // A checkout session is priced at creation, so switching plan/billing (or
  // retrying) creates a fresh session.
  useEffect(() => {
    if (!plan || !stripePromise) return
    let cancelled = false
    setClientSecret(null)
    setError(null)
    fetchCheckoutClientSecret(plan, billing)
      .then((secret) => {
        if (!cancelled) setClientSecret(secret)
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Could not start checkout.')
      })
    return () => {
      cancelled = true
    }
  }, [plan, billing, attempt])

  const onComplete = useCallback(() => setComplete(true), [])

  if (!plan || !planDef) return <Navigate to="/pricing" replace />

  const price = billing === 'annual' ? planDef.annual : planDef.monthly
  const savings = annualSavingsLabel(planDef)

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* NAVBAR */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-xl font-bold text-primary sm:text-2xl">
            PermitIQ
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                clipRule="evenodd"
              />
            </svg>
            Secure checkout · powered by Stripe
          </span>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {complete ? (
          <SuccessPanel planName={planDef.name} />
        ) : (
          <motion.div variants={staggerChildren} initial="hidden" animate="show">
            <motion.button
              variants={fadeUp}
              onClick={() => navigate(-1)}
              className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-ink-muted transition hover:text-primary"
            >
              <span aria-hidden="true">←</span> Back
            </motion.button>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
              {/* ORDER SUMMARY */}
              <motion.aside
                variants={fadeUp}
                className="rounded-2xl border border-line bg-white p-8 shadow-card lg:sticky lg:top-24"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-lg font-semibold text-primary">
                      PermitIQ {planDef.name}
                    </h1>
                    <p className="mt-1 text-xs text-ink-muted">{planDef.tagline}</p>
                  </div>
                  {planDef.highlight && (
                    <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">${price}</span>
                  <span className="text-ink-muted">
                    {billing === 'annual' ? '/yr' : '/mo'}
                  </span>
                </div>
                {billing === 'annual' && savings && (
                  <p className="mt-1 text-xs font-semibold text-accent">{savings}</p>
                )}

                <div className="mt-5">
                  <BillingToggle
                    billing={billing}
                    onChange={(b) =>
                      navigate(`/checkout?plan=${plan}&billing=${b}`, { replace: true })
                    }
                  />
                </div>

                <hr className="my-6 border-line" />

                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  What you get
                </p>
                <ul className="mt-3 space-y-2.5">
                  {planDef.features.map((f) => (
                    <CheckItem key={f}>{f}</CheckItem>
                  ))}
                </ul>

                <hr className="my-6 border-line" />

                <ul className="space-y-2 text-xs text-ink-muted">
                  <li>🔒 Payments processed securely by Stripe — card details never touch our servers.</li>
                  <li>↩️ 7-day no-questions refund on your first payment.</li>
                  <li>✋ Cancel anytime in one click; access lasts through the paid period.</li>
                </ul>
              </motion.aside>

              {/* EMBEDDED PAYMENT FORM */}
              <motion.section
                variants={fadeUp}
                aria-label="Payment"
                className="overflow-hidden rounded-2xl border border-line bg-white shadow-lift"
              >
                {!publishableKey || !stripePromise ? (
                  <p className="p-8 text-sm text-ink-muted">
                    Checkout isn’t configured in this environment yet. Please try
                    again later — you have not been charged.
                  </p>
                ) : error ? (
                  <div className="p-8">
                    <p
                      role="alert"
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                      {error}
                    </p>
                    <button
                      onClick={() => setAttempt((n) => n + 1)}
                      className="btn-secondary mt-4 border-primary text-primary hover:bg-blue-50"
                    >
                      Try again
                    </button>
                  </div>
                ) : !clientSecret ? (
                  <PaymentSkeleton />
                ) : (
                  <div className="p-2 sm:p-4">
                    <EmbeddedCheckoutProvider
                      key={clientSecret}
                      stripe={stripePromise}
                      options={{ clientSecret, onComplete }}
                    >
                      <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                  </div>
                )}
              </motion.section>
            </div>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-10 max-w-2xl text-center text-xs text-ink-muted"
            >
              By subscribing you agree to our{' '}
              <Link to="/terms" className="underline hover:text-primary">
                terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="underline hover:text-primary">
                privacy policy
              </Link>
              . PermitIQ provides informational guidance, not legal advice.
            </motion.p>
          </motion.div>
        )}
      </main>
    </div>
  )
}
