import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { AnimatedCheck, EASE } from '../lib/motion'
import { ResultsSkeleton } from './Skeleton'

const STEP_INTERVAL_MS = 2400

/**
 * Shown while an analysis is in flight: a stylized document with a scanning
 * beam sweeping over it, plus a list of extraction steps that check off
 * progressively. The final step stays "working" until the request resolves
 * and the parent unmounts this component.
 */
export default function ScanAnimation({
  town,
  documentName,
}: {
  town: string
  documentName?: string | null
}) {
  const reduceMotion = useReducedMotion()
  const steps = [
    documentName ? `Reading ${documentName}` : 'Reading your project description',
    `Checking ${town || 'local'} bylaws and 780 CMR`,
    'Identifying required permits',
    'Estimating fees and timelines',
    'Building your application checklist',
  ]
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(
      () => setStepIdx((i) => Math.min(i + 1, steps.length - 1)),
      STEP_INTERVAL_MS
    )
    return () => clearInterval(id)
  }, [steps.length])

  // Widths for the fake document's text lines (deterministic, not random,
  // so the layout is stable across renders).
  const lineWidths = ['82%', '95%', '68%', '90%', '74%', '88%', '60%', '79%']

  return (
    <section className="py-10 sm:py-16" aria-busy="true">
      <div className="mx-auto grid max-w-4xl items-start gap-10 md:grid-cols-[280px_1fr]">
        {/* Document being scanned */}
        <div className="mx-auto w-full max-w-[280px]">
          <div className="relative overflow-hidden rounded-xl border border-line bg-white p-5 shadow-lift">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <div className="h-8 w-8 rounded bg-primary-light" />
              <div className="space-y-1.5">
                <div className="h-2 w-24 rounded bg-slate-300" />
                <div className="h-2 w-16 rounded bg-slate-200" />
              </div>
            </div>
            <div className="mt-4 space-y-2.5">
              {lineWidths.map((w, i) => (
                <motion.div
                  key={i}
                  className="h-2 rounded bg-slate-200"
                  style={{ width: w }}
                  animate={{
                    backgroundColor: ['#e2e8f0', '#bfdbfe', '#e2e8f0'],
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
            {/* Scanning beam */}
            {!reduceMotion && (
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 h-16"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent, rgba(30,64,175,0.10) 45%, rgba(30,64,175,0.35) 50%, rgba(30,64,175,0.10) 55%, transparent)',
                }}
                initial={{ top: '-4rem' }}
                animate={{ top: ['-4rem', 'calc(100% + 1rem)'] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </div>
          {documentName && (
            <p className="mt-3 truncate text-center text-xs text-ink-muted" title={documentName}>
              {documentName}
            </p>
          )}
        </div>

        {/* Extraction steps */}
        <div>
          <h2 className="text-2xl font-bold text-ink">Analyzing your project…</h2>
          <p className="mt-1 text-sm text-ink-muted">
            This usually takes 15–30 seconds. If anything goes wrong, your scan is not used.
          </p>
          <ol className="mt-6 space-y-4" aria-live="polite">
            {steps.map((label, i) => {
              const done = i < stepIdx
              const active = i === stepIdx
              return (
                <motion.li
                  key={label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: done || active ? 1 : 0.4, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.08, ease: EASE }}
                  className="flex items-center gap-3"
                >
                  <span className="flex h-6 w-6 flex-none items-center justify-center">
                    {done ? (
                      <AnimatedCheck className="h-6 w-6 text-accent" />
                    ) : active ? (
                      <motion.span
                        className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent"
                        animate={reduceMotion ? undefined : { rotate: 360 }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                      />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                    )}
                  </span>
                  <span
                    className={`text-sm ${
                      done ? 'text-ink-muted' : active ? 'font-medium text-ink' : 'text-ink-muted'
                    }`}
                  >
                    {label}
                  </span>
                </motion.li>
              )
            })}
          </ol>
          <div className="mt-8">
            <ResultsSkeleton />
          </div>
        </div>
      </div>
    </section>
  )
}
