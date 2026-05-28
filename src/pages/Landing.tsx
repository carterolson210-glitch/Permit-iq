import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MA_TOWNS } from '../data/towns'

export default function Landing() {
  const navigate = useNavigate()
  const [projectText, setProjectText] = useState('')
  const [town, setTown] = useState('')
  const [townQuery, setTownQuery] = useState('')
  const [townOpen, setTownOpen] = useState(false)
  const townWrapRef = useRef<HTMLDivElement | null>(null)

  const filteredTowns = useMemo(() => {
    const q = townQuery.trim().toLowerCase()
    if (!q) return MA_TOWNS
    return MA_TOWNS.filter((t) => t.toLowerCase().includes(q))
  }, [townQuery])

  const handleSubmit = () => {
    const params = new URLSearchParams()
    if (projectText.trim()) params.set('project', projectText.trim())
    if (town) params.set('town', town)
    navigate(`/analyze?${params.toString()}`)
  }

  const handleSelectTown = (t: string) => {
    setTown(t)
    setTownQuery(t)
    setTownOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* NAVBAR */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#top" className="text-xl sm:text-2xl font-bold text-[#1e40af]">
            PermitIQ
          </a>
          <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
            <li><a href="#features" className="hover:text-[#1e40af]">Features</a></li>
            <li><a href="#how-it-works" className="hover:text-[#1e40af]">How It Works</a></li>
            <li><a href="#pricing" className="hover:text-[#1e40af]">Pricing</a></li>
          </ul>
          <button
            onClick={handleSubmit}
            className="inline-flex items-center rounded-md bg-[#1e40af] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-900 transition"
          >
            Start Free
          </button>
        </nav>
      </header>

      {/* HERO */}
      <section id="top" className="relative">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
            Get your Massachusetts building permit{' '}
            <span className="text-[#1e40af]">right the first time</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            Describe your project in plain English. PermitIQ tells you exactly what
            permits you need, what to submit, and what it costs — specific to your town.
          </p>

          <div className="mt-10 mx-auto max-w-2xl text-left">
            <label htmlFor="project" className="block text-sm font-medium text-slate-700 mb-2">
              Your project
            </label>
            <textarea
              id="project"
              value={projectText}
              onChange={(e) => setProjectText(e.target.value)}
              rows={4}
              placeholder="e.g. I want to build a 400 sq ft deck attached to my house in Marblehead MA"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base shadow-sm placeholder:text-slate-400 focus:border-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1e40af]/30 resize-none"
            />

            <label htmlFor="town" className="block text-sm font-medium text-slate-700 mt-5 mb-2">
              Your Massachusetts town
            </label>
            <div ref={townWrapRef} className="relative">
              <input
                id="town"
                type="text"
                value={townQuery}
                onChange={(e) => {
                  setTownQuery(e.target.value)
                  setTownOpen(true)
                  if (e.target.value === '') setTown('')
                }}
                onFocus={() => setTownOpen(true)}
                onBlur={() => setTimeout(() => setTownOpen(false), 120)}
                placeholder="Search 351 cities and towns…"
                autoComplete="off"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base shadow-sm placeholder:text-slate-400 focus:border-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1e40af]/30"
              />
              {townOpen && filteredTowns.length > 0 && (
                <ul
                  role="listbox"
                  className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg"
                >
                  {filteredTowns.slice(0, 100).map((t) => (
                    <li
                      key={t}
                      role="option"
                      aria-selected={town === t}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelectTown(t)
                      }}
                      className={`cursor-pointer px-4 py-2 text-sm hover:bg-blue-50 ${
                        town === t ? 'bg-blue-50 text-[#1e40af] font-medium' : 'text-slate-700'
                      }`}
                    >
                      {t}
                    </li>
                  ))}
                  {filteredTowns.length > 100 && (
                    <li className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100">
                      Showing first 100 of {filteredTowns.length} — keep typing to refine
                    </li>
                  )}
                </ul>
              )}
              {townOpen && filteredTowns.length === 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg">
                  No matching MA towns.
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              className="mt-6 w-full inline-flex items-center justify-center rounded-lg bg-[#1e40af] px-6 py-3.5 text-base font-semibold text-white shadow hover:bg-blue-900 transition"
            >
              Get My Permit Checklist
            </button>

            <p className="mt-4 text-center text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#059669]" />
                Works for all 351 MA cities and towns
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-white border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">How it works</h2>
            <p className="mt-3 text-slate-600">
              From plain-English description to a complete, town-specific permit packet in seconds.
            </p>
          </div>

          <ol className="mt-12 grid gap-8 md:grid-cols-3" id="features">
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
            ].map((step) => (
              <li
                key={step.n}
                className="relative rounded-xl border border-slate-200 bg-[#f8fafc] p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e40af] text-white font-bold">
                  {step.n}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Simple, transparent pricing</h2>
            <p className="mt-3 text-slate-600">
              Pick the plan that fits your project. Cancel anytime.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* Homeowner */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Homeowner</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$19</span>
                <span className="text-slate-500">one-time</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-600 flex-1">
                <li className="flex gap-2"><Check /> One permit checklist</li>
                <li className="flex gap-2"><Check /> Document list</li>
                <li className="flex gap-2"><Check /> Fee estimate</li>
                <li className="flex gap-2"><Check /> Town office contact</li>
                <li className="flex gap-2"><Check /> PDF export</li>
              </ul>
              <button
                onClick={handleSubmit}
                className="mt-8 inline-flex items-center justify-center rounded-md border border-[#1e40af] px-4 py-2.5 text-sm font-semibold text-[#1e40af] hover:bg-blue-50 transition"
              >
                Get started
              </button>
            </div>

            {/* Contractor (most popular) */}
            <div className="relative flex flex-col rounded-2xl border-2 border-[#1e40af] bg-white p-8 shadow-lg md:-translate-y-2">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#059669] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow">
                Most Popular
              </span>
              <h3 className="text-lg font-semibold text-[#1e40af]">Contractor</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$49</span>
                <span className="text-slate-500">/month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-600 flex-1">
                <li className="flex gap-2"><Check /> Unlimited checklists</li>
                <li className="flex gap-2"><Check /> Save projects</li>
                <li className="flex gap-2"><Check /> Client sharing</li>
                <li className="flex gap-2"><Check /> Priority AI</li>
              </ul>
              <button
                onClick={handleSubmit}
                className="mt-8 inline-flex items-center justify-center rounded-md bg-[#1e40af] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-900 transition"
              >
                Start free trial
              </button>
            </div>

            {/* Firm */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Firm</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$99</span>
                <span className="text-slate-500">/month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-600 flex-1">
                <li className="flex gap-2"><Check /> Everything in Contractor</li>
                <li className="flex gap-2"><Check /> Team seats</li>
                <li className="flex gap-2"><Check /> White-label PDF</li>
                <li className="flex gap-2"><Check /> API access</li>
              </ul>
              <button
                onClick={handleSubmit}
                className="mt-8 inline-flex items-center justify-center rounded-md border border-[#1e40af] px-4 py-2.5 text-sm font-semibold text-[#1e40af] hover:bg-blue-50 transition"
              >
                Contact sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="text-xl font-bold text-[#1e40af]">PermitIQ</div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <li><a href="/about" className="hover:text-[#1e40af]">About</a></li>
              <li><a href="#pricing" className="hover:text-[#1e40af]">Pricing</a></li>
              <li><a href="/privacy" className="hover:text-[#1e40af]">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-[#1e40af]">Terms of Service</a></li>
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
      className="mt-0.5 h-5 w-5 flex-none text-[#059669]"
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
