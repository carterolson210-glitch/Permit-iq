import { motion } from 'framer-motion'
import type { PermitAnalysis } from '../lib/types'
import { getTownByName } from '../data/townPermits'
import { fadeUp } from '../lib/motionVariants'

function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Sourcing & accuracy panel shown with every scan result. Two honest tiers:
// hand-verified town data (with links to the official source), and
// AI-researched output (labeled as such, with the model's cited sources and
// confidence when the scan includes them).
export default function TrustPanel({
  town,
  analysis,
}: {
  town: string
  analysis: PermitAnalysis
}) {
  const profile = getTownByName(town)

  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border border-line bg-white p-6 shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Where this information comes from
        </h2>
        <ConfidenceBadge
          level={profile ? 'high' : analysis.confidence}
          verified={Boolean(profile)}
        />
      </div>

      {profile && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
            <span aria-hidden>✓</span> {profile.name} is a hand-verified town
            <span className="font-normal text-green-700">
              · checked {formatDate(profile.facts[0].verifiedAt)}
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {profile.facts.slice(0, 2).map((f) => (
              <li key={f.label} className="text-sm text-slate-700">
                <span className="font-medium">{f.label}:</span> {f.value}{' '}
                <a
                  href={f.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  [official source]
                </a>
              </li>
            ))}
          </ul>
          {profile.portal && (
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-medium">Apply online:</span>{' '}
              <a
                href={profile.portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 hover:underline"
              >
                {profile.name} {profile.portal.vendor} portal
              </a>
            </p>
          )}
        </div>
      )}

      <div className="mt-4 text-sm text-slate-600">
        <p>
          {profile
            ? 'The checklist above was AI-generated for your specific project, cross-referenced with the verified town data shown here.'
            : `The checklist above was AI-researched for ${town} from publicly available municipal information.`}{' '}
          Fee schedules change — confirm amounts with the building department before
          filing.
        </p>
        {analysis.sources && analysis.sources.length > 0 && (
          <ul className="mt-3 space-y-1">
            {analysis.sources.map((s) => (
              <li key={s.url} className="truncate text-xs">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  {s.title || s.url}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  )
}

function ConfidenceBadge({
  level,
  verified,
}: {
  level?: 'high' | 'medium' | 'low'
  verified: boolean
}) {
  if (!level) {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        AI-researched — verify before filing
      </span>
    )
  }
  const styles = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-red-100 text-red-700',
  } as const
  const label = verified
    ? 'High confidence · town-verified data'
    : `${level[0].toUpperCase()}${level.slice(1)} confidence · AI-researched`
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[level]}`}>
      {label}
    </span>
  )
}
