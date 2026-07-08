import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MA_TOWNS } from '../../data/towns'
import {
  TOWN_PROFILES,
  getTownBySlug,
  getTownByName,
  type TownPermitProfile,
} from '../../data/townPermits'
import CoverageMap from './CoverageMap'

function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function TownProofSection() {
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<TownPermitProfile | undefined>(() =>
    getTownBySlug('marblehead-ma')
  )
  const [unverifiedPick, setUnverifiedPick] = useState<string | null>(null)

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return MA_TOWNS.filter((t) => t.toLowerCase().startsWith(q)).slice(0, 8)
  }, [query])

  const pickByName = (name: string) => {
    setQuery('')
    const profile = getTownByName(name)
    if (profile) {
      setPicked(profile)
      setUnverifiedPick(null)
    } else {
      setUnverifiedPick(name)
    }
  }

  return (
    <section id="your-town" className="bg-white border-y border-slate-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Permitting isn&apos;t a Massachusetts question.{' '}
            <span className="text-blue-700">It&apos;s a your-town question.</span>
          </h2>
          <p className="mt-3 text-slate-600">
            Fees, forms, and thresholds change at every town line. Pick your town and
            see the actual numbers — every fact linked to the official municipal source
            it came from.
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* left: map + picker */}
          <div>
            <CoverageMap
              activeSlug={picked?.slug}
              onPick={(slug) => {
                setPicked(getTownBySlug(slug))
                setUnverifiedPick(null)
              }}
            />
            <div className="relative mt-6 max-w-md mx-auto">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type your town — e.g. Worcester"
                aria-label="Search for your Massachusetts town"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base shadow-sm placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/30"
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                  {suggestions.map((t) => (
                    <li key={t}>
                      <button
                        onClick={() => pickByName(t)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-blue-50"
                      >
                        <span>{t}</span>
                        {getTownByName(t) && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                            Verified
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {TOWN_PROFILES.map((t) => (
                <button
                  key={t.slug}
                  onClick={() => {
                    setPicked(t)
                    setUnverifiedPick(null)
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    picked?.slug === t.slug && !unverifiedPick
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-blue-100'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* right: facts panel */}
          <div className="min-h-[24rem]">
            <AnimatePresence mode="wait">
              {unverifiedPick ? (
                <motion.div
                  key={`u-${unverifiedPick}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
                >
                  <h3 className="text-xl font-bold text-slate-900">{unverifiedPick}, MA</h3>
                  <p className="mt-3 text-slate-600">
                    We haven&apos;t hand-verified {unverifiedPick}&apos;s fee schedule yet —
                    we only stamp &ldquo;verified&rdquo; on data we&apos;ve checked against the
                    town&apos;s own website. Our AI researches {unverifiedPick}&apos;s
                    requirements at scan time and shows you where each answer came from, so
                    you can confirm before you file.
                  </p>
                  <Link
                    to="/analyze"
                    className="mt-6 inline-flex items-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-800 transition"
                  >
                    Scan a {unverifiedPick} project free
                  </Link>
                </motion.div>
              ) : picked ? (
                <motion.div
                  key={picked.slug}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {picked.name}, MA
                      </h3>
                      <p className="text-sm text-slate-500">{picked.dept.name}</p>
                    </div>
                    <span className="flex-none rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      ✓ Verified {formatDate(picked.facts[0].verifiedAt)}
                    </span>
                  </div>

                  <ul className="mt-5 space-y-4">
                    {picked.facts.slice(0, 3).map((f) => (
                      <li key={f.label} className="border-l-2 border-blue-200 pl-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {f.label}
                        </div>
                        <div className="mt-0.5 text-sm font-medium text-slate-800">
                          {f.value}
                        </div>
                        <a
                          href={f.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs text-blue-700 hover:underline"
                        >
                          Source: {f.sourceName}
                          {f.effectiveDate
                            ? ` (effective ${formatDate(f.effectiveDate)})`
                            : ''}
                        </a>
                      </li>
                    ))}
                    {picked.penalty && (
                      <li className="border-l-2 border-red-300 pl-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-red-600">
                          {picked.penalty.label}
                        </div>
                        <div className="mt-0.5 text-sm font-medium text-slate-800">
                          {picked.penalty.value}
                        </div>
                      </li>
                    )}
                  </ul>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      to={`/permits/${picked.slug}`}
                      className="inline-flex items-center rounded-lg border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
                    >
                      Full {picked.name} permit guide
                    </Link>
                    <Link
                      to="/analyze"
                      className="inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-800 transition"
                    >
                      Scan my {picked.name} project
                    </Link>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
