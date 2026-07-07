import { motion } from 'framer-motion'
import { useAuth, FREE_SCAN_LIMIT } from '../lib/auth'
import { Skeleton } from './Skeleton'

/**
 * Pill showing "N of 3 free scans remaining" (or the plan name for paid
 * users). Rendered in page headers wherever scans can be started.
 */
export function ScanCounter() {
  const { profile, profileLoading, isPaid, scansRemaining } = useAuth()

  if (profileLoading) return <Skeleton className="h-7 w-40 rounded-full" />
  if (!profile) return null

  if (isPaid) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)} plan · unlimited scans
      </span>
    )
  }

  const remaining = scansRemaining ?? 0
  const exhausted = remaining === 0

  return (
    <motion.span
      key={remaining}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        exhausted
          ? 'border-amber-300 bg-amber-50 text-amber-800'
          : 'border-blue-200 bg-blue-50 text-blue-800'
      }`}
      aria-label={`${remaining} of ${FREE_SCAN_LIMIT} free scans remaining`}
    >
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: FREE_SCAN_LIMIT }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${
              i < remaining ? (exhausted ? 'bg-amber-500' : 'bg-blue-600') : 'bg-slate-300'
            }`}
          />
        ))}
      </span>
      {exhausted
        ? 'Free scans used'
        : `${remaining} of ${FREE_SCAN_LIMIT} free scans remaining`}
    </motion.span>
  )
}
