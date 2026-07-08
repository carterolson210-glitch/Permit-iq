import { Link } from 'react-router-dom'

// Side-by-side: what a generic national permit tool tells you vs what a
// town-specific scan returns. Left column deliberately mirrors the vague
// output generic tools produce; right column uses real Marblehead data.
const GENERIC = [
  'You may need a building permit',
  'Check with your local building department',
  'Fees vary by location',
  'Processing times vary',
  'Requirements depend on your municipality',
]

const PERMITIQ = [
  { k: 'Permit', v: 'Building permit — Town of Marblehead, Form via ViewPoint Cloud portal' },
  { k: 'Fee', v: '$15 per $1,000 of project cost ($30 min) — includes wiring & plumbing permits' },
  { k: 'Where', v: 'Building Inspection Dept, 7 Widger Rd — (781) 631-2220' },
  { k: 'Watch out', v: 'Coastal lots may trigger Conservation Commission review (wetlands)' },
  { k: 'Source', v: 'marblehead.org building department pages — verified Jul 2026' },
]

export default function CompareSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
          &ldquo;Check with your local building department&rdquo; isn&apos;t an answer
        </h2>
        <p className="mt-3 text-slate-600">
          The same deck project, described to a generic permit tool and to PermitIQ.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Generic permit software
          </div>
          <ul className="mt-4 space-y-3">
            {GENERIC.map((g) => (
              <li key={g} className="flex items-start gap-2.5 text-sm text-slate-500">
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-slate-300" />
                {g}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs italic text-slate-400">
            …so you still end up calling town hall.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-blue-700 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wide text-blue-700">
              PermitIQ — Marblehead, MA
            </div>
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
              ✓ Verified town data
            </span>
          </div>
          <dl className="mt-4 space-y-3">
            {PERMITIQ.map((row) => (
              <div key={row.k} className="flex gap-3 text-sm">
                <dt className="w-20 flex-none font-semibold text-slate-500">{row.k}</dt>
                <dd className="text-slate-800">{row.v}</dd>
              </div>
            ))}
          </dl>
          <Link
            to="/analyze"
            className="mt-6 inline-flex items-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-800 transition"
          >
            Run this scan on my project
          </Link>
        </div>
      </div>
    </section>
  )
}
