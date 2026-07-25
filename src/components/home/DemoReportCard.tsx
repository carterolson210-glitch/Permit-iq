import { DEMO_REPORT } from '../../data/demoReport'

/**
 * The demo permit report — real, sourced Worcester data. Shared by the 3D
 * scroll finale and the 2D fallback so the "money shot" is identical in both.
 * Every line shows its own municipal source and verification date, which is
 * the whole point: specific, legible, checkable.
 */
export default function DemoReportCard({ className = '' }: { className?: string }) {
  const r = DEMO_REPORT
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${className}`}
    >
      {/* title bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3">
        <span className="h-3 w-3 rounded-full bg-slate-300" />
        <span className="h-3 w-3 rounded-full bg-slate-300" />
        <span className="h-3 w-3 rounded-full bg-slate-300" />
        <span className="ml-3 text-sm font-semibold text-slate-700">
          PermitIQ · {r.townName}, MA
        </span>
        <span className="ml-auto rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
          {r.sourcedCount} sourced requirements
        </span>
      </div>

      <div className="p-5 sm:p-6">
        {/* requirement lines — each carries its own citation */}
        <ul className="space-y-3.5">
          {r.lines.map((line) => (
            <li
              key={line.label}
              className="rounded-lg border border-slate-200 bg-white p-3.5 sm:p-4"
            >
              <div className="flex items-start gap-3">
                <svg
                  viewBox="0 0 20 20"
                  className="mt-0.5 h-5 w-5 flex-none text-green-600"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{line.label}</div>
                  <div className="mt-0.5 text-sm text-slate-600">{line.value}</div>
                  <a
                    href={line.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
                  >
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 flex-none" fill="currentColor" aria-hidden="true">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                    {line.sourceName}
                  </a>
                  <span className="ml-2 text-xs text-slate-400">
                    verified {line.verifiedAt}
                    {line.effectiveDate ? ` · effective ${line.effectiveDate}` : ''}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* penalty callout — the cost of getting it wrong, also sourced */}
        {r.penalty && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3.5 sm:p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">
              {r.penalty.label}
            </div>
            <div className="mt-1 text-sm text-amber-900">{r.penalty.value}</div>
            <a
              href={r.penalty.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:underline"
            >
              {r.penalty.sourceName}
            </a>
          </div>
        )}

        {/* department to file with */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-200 pt-4 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{r.dept.name}</span>
          {r.dept.phone && <span>{r.dept.phone}</span>}
          {r.portal && (
            <span>
              Files online via{' '}
              <a
                href={r.portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-700 hover:underline"
              >
                {r.portal.vendor}
              </a>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
