import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fadeUp, staggerChildren } from '../lib/motionVariants'
import { checkoutPath } from '../lib/stripe'
import { annualSavingsLabel, PLAN_DEFS, type Billing, type PlanKey } from '../lib/plans'
import { BillingToggle } from '../components/Paywall'
import ExitIntentModal from '../components/ExitIntentModal'
import SocialProof from '../components/SocialProof'

type Cell = boolean | string

const COMPARISON: { feature: string; free: Cell; pro: Cell; contractor: Cell }[] = [
  { feature: 'Permit scans', free: '3 total', pro: 'Unlimited', contractor: 'Unlimited' },
  { feature: 'Town requirement summaries', free: true, pro: true, contractor: true },
  { feature: 'Full permit reports', free: false, pro: true, contractor: true },
  { feature: 'Rejection-prevention analysis', free: false, pro: true, contractor: true },
  { feature: 'Document checklists & timeline estimates', free: false, pro: true, contractor: true },
  { feature: 'PDF export', free: 'Watermarked', pro: 'Unwatermarked', contractor: 'Unwatermarked' },
  { feature: 'Saved projects', free: false, pro: true, contractor: true },
  { feature: 'Multi-project dashboard', free: false, pro: false, contractor: true },
  { feature: 'Team seats', free: false, pro: false, contractor: 'Up to 5' },
  { feature: 'Client-shareable branded reports', free: false, pro: false, contractor: true },
  { feature: 'Priority processing', free: false, pro: false, contractor: true },
  { feature: 'Permit deadline reminders', free: false, pro: false, contractor: true },
]

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel in one click from the billing portal — no emails, no phone calls. You keep full access until the end of the period you already paid for, and you are never charged again after that.',
  },
  {
    q: 'Do you cover my town?',
    a: 'PermitIQ covers all 351 Massachusetts cities and towns. For 30 of them (and growing), fees and requirements are hand-verified against the town’s own published fee schedules, with the source and verification date shown on every fact. For all other towns, our AI researches the town’s current requirements at scan time and cites its sources so you can confirm each item.',
  },
  {
    q: 'What is your refund policy?',
    a: 'If PermitIQ doesn’t work for you, email us within 7 days of your first payment and we’ll refund it in full — no questions asked. Renewals can be stopped anytime before the billing date via the portal.',
  },
  {
    q: 'What happens when I use my 3 free scans?',
    a: 'Nothing is deleted — your account and past results stay. You just can’t run new scans until you upgrade. The free scans are per account (lifetime), not per month.',
  },
  {
    q: 'Is this legal advice? Will the town accept it?',
    a: 'No — PermitIQ is informational guidance built from public municipal sources, and your local building department is always the final authority. Our reports are designed to make that conversation fast: they tell you exactly which permits to ask about, what documents to bring, and what the town’s published fees say.',
  },
  {
    q: 'Pro vs. Contractor — which one do I need?',
    a: 'Pro fits a homeowner or DIYer managing their own project(s). Contractor adds the tools a pro needs across many jobs: a multi-project dashboard, up to 5 team seats, deadline reminders, and client-shareable reports with your branding.',
  },
]

function setMeta(title: string, description: string) {
  document.title = title
  let el = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (!el) {
    el = document.createElement('meta')
    el.name = 'description'
    document.head.appendChild(el)
  }
  el.content = description
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="mx-auto h-5 w-5 text-accent" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z" clipRule="evenodd" />
    </svg>
  )
}

function CellValue({ v }: { v: Cell }) {
  if (v === true) return <CheckIcon />
  if (v === false) return <span className="text-slate-300" aria-label="Not included">—</span>
  return <span className="text-sm text-ink">{v}</span>
}

export default function Pricing() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [billing, setBilling] = useState<Billing>('annual') // annual anchored ON
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const cancelled = searchParams.get('checkout') === 'cancelled'

  useEffect(() => {
    setMeta(
      'PermitIQ Pricing — Free, Pro & Contractor plans',
      'Unlimited Massachusetts permit scans from $29/month. Town-verified fees, rejection-prevention analysis, and contractor tools. Start with 3 free scans.'
    )
    // FAQPage structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    })
    document.head.appendChild(script)
    return () => {
      document.title = 'PermitIQ'
      script.remove()
    }
  }, [])

  // Payment happens on our own /checkout page (embedded Stripe form — no
  // redirect off-site).
  const handleUpgrade = (plan: PlanKey) => navigate(checkoutPath(plan, billing))

  return (
    <div className="min-h-screen bg-bg text-ink">
      <ExitIntentModal />

      {/* NAVBAR */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-line">
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-primary">
            PermitIQ
          </Link>
          <Link to="/analyze" className="btn-primary text-sm">
            Start free
          </Link>
        </nav>
      </header>

      <motion.main
        variants={staggerChildren}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-6xl px-4 sm:px-6 py-14"
      >
        <motion.div variants={fadeUp} className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Pricing that pays for itself in one avoided mistake
          </h1>
          <p className="mt-4 text-lg text-ink-muted">
            A rejected application costs weeks. Unpermitted work costs double, triple — in some
            towns quadruple — the fee. PermitIQ costs less than a re-inspection.
          </p>
        </motion.div>

        {cancelled && (
          <motion.p
            variants={fadeUp}
            role="status"
            className="mx-auto mt-6 max-w-md rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-sm text-ink-muted"
          >
            Checkout cancelled — you have not been charged. Your free scans are unaffected.
          </motion.p>
        )}
        <motion.div variants={fadeUp} className="mt-10 flex justify-center">
          <BillingToggle billing={billing} onChange={setBilling} />
        </motion.div>

        {/* Plan header cards */}
        <motion.div variants={fadeUp} className="mt-10 grid gap-6 md:grid-cols-3">
          {PLAN_DEFS.map((plan) => {
            const price =
              plan.key === 'free' ? 0 : billing === 'annual' ? plan.annual : plan.monthly
            const savings = annualSavingsLabel(plan)
            return (
              <div
                key={plan.key}
                className={`relative flex flex-col rounded-2xl bg-white p-8 ${
                  plan.highlight
                    ? 'border-2 border-primary shadow-lift md:-translate-y-2'
                    : 'border border-line shadow-card'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow">
                    Recommended
                  </span>
                )}
                <h2 className={`text-lg font-semibold ${plan.highlight ? 'text-primary' : 'text-ink'}`}>
                  {plan.name}
                </h2>
                <p className="mt-1 text-xs text-ink-muted">{plan.tagline}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">${price}</span>
                  {plan.key !== 'free' && (
                    <span className="text-ink-muted">{billing === 'annual' ? '/yr' : '/mo'}</span>
                  )}
                </div>
                {plan.key !== 'free' && billing === 'annual' && savings && (
                  <p className="mt-1 text-xs font-semibold text-accent">{savings}</p>
                )}
                {plan.key === 'free' ? (
                  <Link to="/analyze" className="btn-secondary mt-6 w-full text-center border-primary text-primary hover:bg-blue-50">
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.key as PlanKey)}
                    className={plan.highlight ? 'btn-primary mt-6 w-full' : 'btn-secondary mt-6 w-full border-primary text-primary hover:bg-blue-50'}
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            )
          })}
        </motion.div>

        {/* Comparison table */}
        <motion.div variants={fadeUp} className="mt-14 overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
          <table className="w-full min-w-[640px] text-left">
            <caption className="sr-only">Feature comparison across Free, Pro, and Contractor plans</caption>
            <thead>
              <tr className="border-b border-line text-sm">
                <th scope="col" className="px-6 py-4 font-semibold text-ink">Features</th>
                <th scope="col" className="w-36 px-4 py-4 text-center font-semibold text-ink">Free</th>
                <th scope="col" className="w-36 bg-blue-50/60 px-4 py-4 text-center font-semibold text-primary">Pro</th>
                <th scope="col" className="w-36 px-4 py-4 text-center font-semibold text-ink">Contractor</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="border-b border-line last:border-0 text-center">
                  <th scope="row" className="px-6 py-3.5 text-left text-sm font-medium text-ink-muted">
                    {row.feature}
                  </th>
                  <td className="px-4 py-3.5"><CellValue v={row.free} /></td>
                  <td className="bg-blue-50/60 px-4 py-3.5"><CellValue v={row.pro} /></td>
                  <td className="px-4 py-3.5"><CellValue v={row.contractor} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Social proof (renders nothing until there are real numbers) */}
        <SocialProof />

        {/* FAQ */}
        <motion.section variants={fadeUp} className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-center text-2xl font-bold">Questions homeowners and contractors ask us</h2>
          <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-white shadow-card">
            {FAQS.map((faq, i) => (
              <div key={faq.q}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-sm font-semibold text-ink hover:bg-slate-50"
                >
                  {faq.q}
                  <span aria-hidden="true" className="text-ink-muted">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <p className="px-6 pb-5 text-sm leading-relaxed text-ink-muted">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-ink-muted">
            Secure checkout via Stripe · Cancel anytime · Informational guidance, not legal
            advice — see our <Link to="/terms" className="underline hover:text-primary">terms</Link>.
          </p>
        </motion.section>
      </motion.main>
    </div>
  )
}
