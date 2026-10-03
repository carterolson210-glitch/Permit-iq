import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TOWN_PROFILES, VERIFIED_TOWN_COUNT } from '../data/townPermits'
import { MA_TOWNS, slugifyTown } from '../data/towns'
import CoverageMap from '../components/townproof/CoverageMap'

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

/**
 * Standalone coverage map — which of the 351 MA towns are hand-verified
 * vs. still AI-researched-only, each linking into its /permits/:slug page.
 * Real, non-duplicated content (a single list, not 351 near-identical
 * pages), so unlike individual unverified town pages this one stays
 * indexable.
 */
export default function CoveragePage() {
  useEffect(() => {
    setMeta(
      `Massachusetts Permit Coverage Map — ${VERIFIED_TOWN_COUNT} Towns Verified | PermitIQ`,
      `See which of Massachusetts's 351 cities and towns have hand-verified building permit fees and requirements on PermitIQ, and which are coming soon.`
    )
    return () => {
      document.title = 'PermitIQ'
    }
  }, [])

  const verifiedSlugs = useMemo(() => new Set(TOWN_PROFILES.map((t) => t.slug)), [])
  const comingSoon = useMemo(
    () => MA_TOWNS.filter((name) => !verifiedSlugs.has(slugifyTown(name))).sort(),
    [verifiedSlugs]
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-xl font-bold text-blue-700 sm:text-2xl">
            PermitIQ
          </Link>
          <Link
            to="/analyze"
            className="inline-flex items-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            Start Free
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <nav className="text-xs text-slate-400">
          <Link to="/" className="hover:text-blue-700">
            PermitIQ
          </Link>{' '}
          / <span className="text-slate-600">Coverage</span>
        </nav>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Massachusetts permit coverage
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          PermitIQ covers all 351 Massachusetts cities and towns. {VERIFIED_TOWN_COUNT} are
          hand-verified against the town&apos;s own published fee schedule, with a source
          link and verification date on every fact. The rest are researched by AI at scan
          time, clearly labeled as such, while we work through the hand-verification
          backlog.
        </p>

        <div className="mt-10 max-w-xl">
          <CoverageMap />
        </div>

        <section className="mt-12">
          <h2 className="text-sm font-bold uppercase tracking-wide text-green-700">
            {VERIFIED_TOWN_COUNT} hand-verified
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {TOWN_PROFILES.map((t) => (
              <Link
                key={t.slug}
                to={`/permits/${t.slug}`}
                className="rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-800 transition hover:bg-green-100"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            {comingSoon.length} coming soon — AI-researched for now
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {comingSoon.map((name) => (
              <Link
                key={name}
                to={`/permits/${slugifyTown(name)}`}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700 transition hover:bg-blue-100 hover:text-blue-700"
              >
                {name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
