import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fadeUp, staggerChildren } from '../lib/motionVariants'
import { useAuth } from '../lib/auth'
import { startCheckout, type PlanKey, type Billing } from '../lib/stripe'
import Hero3D, { use3DHero } from '../components/home3d/Hero3D'
import TownProofSection from '../components/townproof/TownProofSection'
import VarianceSection from '../components/townproof/VarianceSection'
import PenaltySection from '../components/townproof/PenaltySection'
import CompareSection from '../components/townproof/CompareSection'
import { TOWN_PROFILES } from '../data/townPermits'
import SocialProof from '../components/SocialProof'

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const show3D = use3DHero()
  const [projectText, setProjectText] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState<PlanKey | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const handleSubmit = () => {
    const params = new URLSearchParams()
    if (projectText.trim()) params.set('project', projectText.trim())
    const qs = params.toString()
    navigate(qs ? `/analyze?${qs}` : '/analyze')
  }

  const handleCheckout = async (plan: PlanKey, billing: Billing) => {
    setCheckoutError(null)
    setCheckoutLoading(plan)
    try {
      await startCheckout(plan, billing)
      // On success startCheckout redirects the browser to Stripe; on
      // "not signed in" it redirects to /login. Either way we navigate
      // away, so no need to clear checkoutLoading here.
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : 'Could not start checkout.')
      setCheckoutLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* NAVBAR */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#top" className="text-xl sm:text-2xl font-bold text-blue-700">
            PermitIQ
          </a>
          <div className="flex items-center gap-4">
            <Link
              to={user ? '/analyze' : '/login'}
              className="px-2 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-700 transition"
            >
              {user ? 'My scans' : 'Sign in'}
            </Link>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              className="inline-flex items-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition"
            >
              Start Free
            </motion.button>
          </div>
        </nav>
      </header>

      {/* 3D SCROLL HERO (desktop + WebGL + motion-ok; otherwise 2D hero below) */}
      {show3D && <Hero3D />}

      {/* HERO */}
      <section id="top">
        <motion.div
          variants={staggerChildren}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-4xl px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center"
        >
          {!show3D && (
            <>
              <motion.h1
                variants={fadeUp}
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900"
              >
                Get your Massachusetts building permit{' '}
                <span className="text-blue-700">right the first time</span>
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto"
              >
                Describe your project in plain English. PermitIQ tells you exactly what
                permits you need, what to submit, and what it costs — specific to your town.
              </motion.p>
            </>
          )}

          <motion.div variants={fadeUp} className="mt-10 mx-auto max-w-2xl text-left">
            <label htmlFor="project" className="block text-sm font-medium text-slate-700 mb-2">
              Your project
            </label>
            <textarea
              id="project"
              value={projectText}
              onChange={(e) => setProjectText(e.target.value)}
              rows={4}
              placeholder="e.g. I want to build a 400 sq ft deck attached to my house in Marblehead MA"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base shadow-sm placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/30 resize-none"
            />
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              className="mt-6 w-full inline-flex items-center justify-center rounded-lg bg-blue-700 px-6 py-3.5 text-base font-semibold text-white shadow hover:bg-blue-800 transition"
            >
              Get My Permit Checklist
            </motion.button>
            <p className="mt-4 text-center text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-600" />
                3 free scans with a new account — no credit card required
              </span>
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* TOWN-BY-TOWN PROOF */}
      <TownProofSection />

      {/* TOWN VARIANCE */}
      <VarianceSection />

      {/* GENERIC VS PERMITIQ */}
      <CompareSection />

      {/* REJECTIONS + PENALTIES */}
      <PenaltySection />

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">How it works</h2>
            <p className="mt-3 text-slate-600">
              From plain-English description to a complete, town-specific permit packet in seconds.
            </p>
          </div>

          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                n: 1,
                title: 'Describe your project',
                body: 'Tell PermitIQ what you want to build, in plain English. No forms, no jargon.',
              },
              {
                n: 2,
                title: 'AI identifies every permit',
                body: 'Our AI maps your project to every permit required by your specific Massachusetts town.',
              },
              {
                n: 3,
                title: 'Get your complete checklist',
                body: 'Receive the full list of forms, documents, fees, and contacts — ready to submit.',
              },
            ].map((step, i) => (
              <motion.li
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-white font-bold">
                  {step.n}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-slate-600">{step.body}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* SOCIAL PROOF (renders nothing until there are real numbers) */}
      <SocialProof />

      {/* PRICING */}
      <section id="pricing">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Simple, transparent pricing</h2>
            <p className="mt-3 text-slate-600">Pick the plan that fits your project. Cancel anytime.</p>
            {checkoutError && (
              <p className="mt-4 text-sm text-red-600" role="alert">
                {checkoutError}
              </p>
            )}
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* Free */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Free</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$0</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-600 flex-1">
                <li className="flex gap-2"><Check /> 3 permit scans</li>
                <li className="flex gap-2"><Check /> Town requirement summaries</li>
                <li className="flex gap-2"><Check /> Watermarked PDF export</li>
                <li className="flex gap-2"><Check /> No credit card required</li>
              </ul>
              <Link
                to="/analyze"
                className="mt-8 inline-flex items-center justify-center rounded-md border border-blue-700 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
              >
                Start free
              </Link>
            </div>

            {/* Pro (most popular) */}
            <div className="relative flex flex-col rounded-2xl border-2 border-blue-700 bg-white p-8 shadow-lg md:-translate-y-2">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow">
                Most Popular
              </span>
              <h3 className="text-lg font-semibold text-blue-700">Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$29</span>
                <span className="text-slate-500">/month</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-green-700">
                or $290/yr — 2 months free
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600 flex-1">
                <li className="flex gap-2"><Check /> Unlimited permit scans</li>
                <li className="flex gap-2"><Check /> Rejection-prevention analysis</li>
                <li className="flex gap-2"><Check /> Document checklists &amp; timelines</li>
                <li className="flex gap-2"><Check /> Unwatermarked PDF export</li>
                <li className="flex gap-2"><Check /> Saved projects</li>
              </ul>
              <button
                onClick={() => handleCheckout('pro', 'monthly')}
                disabled={checkoutLoading !== null}
                className="mt-8 inline-flex items-center justify-center rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading === 'pro' ? 'Redirecting…' : 'Get Pro'}
              </button>
            </div>

            {/* Contractor */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Contractor</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$79</span>
                <span className="text-slate-500">/month</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-green-700">
                or $790/yr — 2 months free
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600 flex-1">
                <li className="flex gap-2"><Check /> Everything in Pro</li>
                <li className="flex gap-2"><Check /> Multi-project dashboard</li>
                <li className="flex gap-2"><Check /> Up to 5 team seats</li>
                <li className="flex gap-2"><Check /> Client-shareable branded reports</li>
                <li className="flex gap-2"><Check /> Permit deadline reminders</li>
              </ul>
              <button
                onClick={() => handleCheckout('contractor', 'monthly')}
                disabled={checkoutLoading !== null}
                className="mt-8 inline-flex items-center justify-center rounded-md border border-blue-700 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading === 'contractor' ? 'Redirecting…' : 'Get Contractor'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="text-xl font-bold text-blue-700">PermitIQ</div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <li><a href="#your-town" className="hover:text-blue-700">Your town</a></li>
              <li><a href="#how-it-works" className="hover:text-blue-700">How it works</a></li>
              <li><a href="#pricing" className="hover:text-blue-700">Pricing</a></li>
              <li><Link to="/how-we-verify" className="hover:text-blue-700">How we verify</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-700">Privacy</Link></li>
              <li><Link to="/terms" className="hover:text-blue-700">Terms</Link></li>
            </ul>
          </div>
          <div className="mt-8">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Massachusetts town permit guides
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              {TOWN_PROFILES.map((t) => (
                <li key={t.slug}>
                  <Link to={`/permits/${t.slug}`} className="hover:text-blue-700">
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-8 text-xs text-slate-500 leading-relaxed max-w-3xl">
            PermitIQ provides informational guidance only. Always verify requirements with
            your local building department. Not a licensed legal or engineering service.
          </p>
          <p className="mt-4 text-xs text-slate-400">
            © {new Date().getFullYear()} PermitIQ. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function Check() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="mt-0.5 h-5 w-5 flex-none text-green-600"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}
