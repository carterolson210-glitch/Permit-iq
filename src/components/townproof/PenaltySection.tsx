import { Link } from 'react-router-dom'
import { TOWN_PROFILES } from '../../data/townPermits'

// Why permits get rejected (statewide guidance) + what unpermitted work costs
// (town-verified penalties). The penalty table is real data; the rejection
// reasons are general MA guidance and labeled as such.
const REJECTION_REASONS: { title: string; body: string }[] = [
  {
    title: 'Undervalued project cost',
    body:
      'Fees scale with declared value, and inspectors compare your number against real construction costs. Boston’s schedule explicitly doubles the fee for undervalued estimates.',
  },
  {
    title: 'Missing plot plan or site plan',
    body:
      'Most towns want a certified plot plan showing setbacks for anything that changes a footprint — decks, additions, sheds over the exemption size, pools.',
  },
  {
    title: 'Wrong form for the job',
    body:
      'Cities like Boston separate short-form (minor alteration) from long-form (major work) applications; filing the wrong one restarts the clock.',
  },
  {
    title: 'Skipped zoning or conservation review',
    body:
      'Zoning setbacks, historic districts, and wetlands buffers are town-specific. Somerville charges a separate $250 zoning review on top of the building permit.',
  },
  {
    title: 'Unlicensed or uninsured contractor listed',
    body:
      'Towns verify CSL/HIC licensure and workers’ comp affidavits as part of intake. An expired license stalls the application.',
  },
  {
    title: 'Homeowner pulling permits for contractor work',
    body:
      'If a contractor does the work, the contractor should pull the permit — homeowner-pulled permits can waive your Guaranty Fund protection under MA law.',
  },
]

export default function PenaltySection() {
  const withPenalty = TOWN_PROFILES.filter((t) => t.penalty)
  return (
    <section className="bg-white border-y border-slate-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Rejections and re-dos are the expensive part
          </h2>
          <p className="mt-3 text-slate-600">
            A denied application costs weeks. Unpermitted work costs multiples of the fee —
            and every town sets its own penalty.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Common reasons MA applications stall
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium normal-case text-slate-500">
                General MA guidance
              </span>
            </h3>
            <ul className="mt-4 space-y-4">
              {REJECTION_REASONS.map((r) => (
                <li key={r.title} className="rounded-lg border border-slate-200 p-4">
                  <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                  <p className="mt-1 text-sm text-slate-600">{r.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              What unpermitted work costs, by town
              <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium normal-case text-green-700">
                Town-verified
              </span>
            </h3>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Town</th>
                    <th className="px-4 py-3">Penalty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withPenalty.map((t) => (
                    <tr key={t.slug}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <Link to={`/permits/${t.slug}`} className="hover:text-blue-700">
                          {t.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{t.penalty!.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              From each town&apos;s published fee schedule; linked on the town guide pages.
            </p>
            <div className="mt-6 rounded-xl bg-blue-50 p-5">
              <p className="text-sm text-slate-700">
                PermitIQ&apos;s scan flags the permits you&apos;d otherwise miss — before the
                building department does.
              </p>
              <Link
                to="/analyze"
                className="mt-3 inline-flex items-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-800 transition"
              >
                Scan my project free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
