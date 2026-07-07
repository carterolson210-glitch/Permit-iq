import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from 'framer-motion'
import { AnimatedCheck } from '../lib/motion'
import { EASE } from '../lib/motionVariants'

export type ScanPhase = 'scanning' | 'success' | 'error'

export interface ScanDataPoint {
  id: string
  label: string
  value: string
}

const STAGE_MS = 2600
/** Document line each data chip "pops out" of (index into LINE_WIDTHS). */
const CHIP_SOURCE_LINES = [1, 3, 5, 7, 9]
const LINE_WIDTHS = ['84%', '95%', '70%', '90%', '76%', '88%', '64%', '92%', '58%', '80%']

type Props = {
  phase: ScanPhase
  errorMessage?: string
  town: string
  documentName?: string | null
  dataPoints: ScanDataPoint[]
  /** Called when the success beat finishes and results should be revealed. */
  onComplete: () => void
  onRetry: () => void
  onClose: () => void
}

/**
 * Full-screen takeover shown while a permit analysis is in flight.
 * A glowing beam sweeps the document, lines highlight as they're "read",
 * and the user's real project details fly out of the document into an
 * extracted-details card. Ends with a completion beat (success) or a
 * calm amber warning panel (error). Every animation has a reduced-motion
 * fallback: fades only, no beam, no chip flight, no rings.
 */
export default function ScanOverlay({
  phase,
  errorMessage,
  town,
  documentName,
  dataPoints,
  onComplete,
  onRetry,
  onClose,
}: Props) {
  const reduceMotion = useReducedMotion() ?? false
  const dialogRef = useRef<HTMLDivElement | null>(null)

  const steps = [
    documentName ? `Reading ${documentName}` : 'Reading project description',
    'Extracting key details',
    `Checking ${town || 'local'} bylaws`,
    'Matching 780 CMR requirements',
    'Drafting your checklist',
  ]

  const [stageIdx, setStageIdx] = useState(0)
  useEffect(() => {
    if (phase !== 'scanning') return
    const id = setInterval(
      () => setStageIdx((i) => Math.min(i + 1, steps.length - 1)),
      STAGE_MS
    )
    return () => clearInterval(id)
  }, [phase, steps.length])

  const done = phase === 'success'
  const landedCount = done ? dataPoints.length : Math.min(dataPoints.length, stageIdx)
  const highlightedLines = done
    ? LINE_WIDTHS.length
    : Math.round(((stageIdx + 1) / steps.length) * LINE_WIDTHS.length)

  // Pseudo-progress: eases toward 90% while waiting, snaps to 100% on success.
  const progress = useMotionValue(0)
  const progressScaleX = useTransform(progress, (v) => v / 100)
  const [pct, setPct] = useState(0)
  useMotionValueEvent(progress, 'change', (v) => setPct(Math.round(v)))
  useEffect(() => {
    if (phase === 'scanning') {
      const c = animate(progress, 90, { duration: 26, ease: 'easeOut' })
      return () => c.stop()
    }
    if (phase === 'success') {
      const c = animate(progress, 100, { duration: 0.4, ease: 'easeOut' })
      return () => c.stop()
    }
  }, [phase, progress])

  // Success beat → hand off to results. Shorter hold under reduced motion.
  useEffect(() => {
    if (phase !== 'success') return
    const t = setTimeout(onComplete, reduceMotion ? 700 : 1500)
    return () => clearTimeout(t)
  }, [phase, onComplete, reduceMotion])

  // Scroll lock + initial focus + Escape (dismiss only from the error state,
  // so an in-flight scan can't be abandoned by accident).
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
    }
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase === 'error') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, onClose])

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Analyzing your permit document"
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md px-4 outline-none"
    >
      <AnimatePresence mode="wait">
        {phase === 'success' ? (
          <SuccessBeat key="success" reduceMotion={reduceMotion} />
        ) : phase === 'error' ? (
          <ErrorPanel
            key="error"
            message={errorMessage ?? 'Something went wrong. Your scan was not used.'}
            reduceMotion={reduceMotion}
            onRetry={onRetry}
            onClose={onClose}
          />
        ) : (
          <motion.div
            key="scanning"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            transition={{ duration: 0.35, ease: EASE }}
            className="grid w-full max-w-4xl items-center gap-10 md:grid-cols-[300px_1fr]"
          >
            {/* ── Document being scanned ─────────────────────────── */}
            <div className="relative mx-auto w-full max-w-[300px]">
              <div className="relative overflow-hidden rounded-xl bg-white p-5 shadow-[0_0_60px_-12px_rgba(59,130,246,0.45)]">
                <div className="flex items-center gap-2 border-b border-line pb-3">
                  <div className="h-8 w-8 rounded bg-primary-light" />
                  <div className="space-y-1.5">
                    <div className="h-2 w-24 rounded bg-slate-300" />
                    <div className="h-2 w-16 rounded bg-slate-200" />
                  </div>
                </div>
                <div className="mt-4 space-y-2.5">
                  {LINE_WIDTHS.map((w, i) => {
                    const isRead = i < highlightedLines
                    const chipIdx = CHIP_SOURCE_LINES.indexOf(i)
                    const annotated = chipIdx !== -1 && chipIdx < landedCount
                    return (
                      <div key={i} className="relative h-2" style={{ width: w }}>
                        <div className="absolute inset-0 rounded bg-slate-200" />
                        {/* Read-highlight sweeps in from the left as the beam passes */}
                        <motion.div
                          className="absolute inset-0 origin-left rounded bg-blue-200"
                          initial={false}
                          animate={{ scaleX: isRead ? 1 : 0 }}
                          transition={
                            reduceMotion
                              ? { duration: 0 }
                              : { duration: 0.5, delay: (i % 3) * 0.12, ease: EASE }
                          }
                        />
                        {/* Annotation stroke under lines a data chip came from */}
                        {annotated && (
                          <motion.div
                            className="absolute -bottom-1 left-0 h-[2px] w-full origin-left rounded bg-accent"
                            initial={{ scaleX: reduceMotion ? 1 : 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.45, ease: EASE }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Glowing scan beam (skipped entirely under reduced motion) */}
                {!reduceMotion && (
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 h-20 will-change-transform"
                    style={{
                      background:
                        'linear-gradient(to bottom, transparent, rgba(59,130,246,0.12) 40%, rgba(59,130,246,0.28) 50%, rgba(59,130,246,0.12) 60%, transparent)',
                    }}
                    initial={{ top: '-5rem' }}
                    animate={{ top: ['-5rem', 'calc(100% + 1rem)'] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div
                      className="absolute inset-x-4 top-1/2 h-[2px] rounded-full bg-blue-400"
                      style={{ boxShadow: '0 0 12px 2px rgba(96,165,250,0.9)' }}
                    />
                  </motion.div>
                )}

                {/* Un-landed chips float over their source lines before flying out */}
                {!reduceMotion &&
                  dataPoints.map((dp, i) =>
                    i >= landedCount ? (
                      <motion.span
                        key={dp.id}
                        layoutId={dp.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: i === landedCount ? 1 : 0, scale: 1 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="absolute left-[8%] z-10 rounded-full border border-blue-300/60 bg-blue-500/90 px-2.5 py-0.5 text-[11px] font-medium text-white shadow-lg backdrop-blur"
                        style={{
                          top: `${24 + CHIP_SOURCE_LINES[i % CHIP_SOURCE_LINES.length] * 6.5}%`,
                        }}
                      >
                        {dp.value}
                      </motion.span>
                    ) : null
                  )}
              </div>
              {documentName && (
                <p className="mt-3 truncate text-center text-xs text-slate-400" title={documentName}>
                  {documentName}
                </p>
              )}
            </div>

            {/* ── Extraction feed ────────────────────────────────── */}
            <div className="text-white">
              <h2 className="text-2xl font-bold tracking-tight">Analyzing your project…</h2>
              <p className="mt-1 text-sm text-slate-400">
                Usually 15–30 seconds. If anything fails, your scan is not used.
              </p>

              <ol className="mt-6 space-y-3.5" aria-live="polite">
                {steps.map((label, i) => {
                  const stepDone = i < stageIdx
                  const active = i === stageIdx
                  return (
                    <li key={label} className="flex items-center gap-3">
                      <span className="flex h-5 w-5 flex-none items-center justify-center">
                        {stepDone ? (
                          <AnimatedCheck className="h-5 w-5 text-emerald-400" />
                        ) : active ? (
                          <motion.span
                            className="h-3.5 w-3.5 rounded-full border-2 border-blue-400 border-t-transparent"
                            animate={reduceMotion ? undefined : { rotate: 360 }}
                            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                          />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                        )}
                      </span>
                      <span
                        className={`text-sm transition-colors duration-300 ${
                          stepDone ? 'text-slate-400' : active ? 'font-medium text-white' : 'text-slate-500'
                        }`}
                      >
                        {label}
                      </span>
                    </li>
                  )
                })}
              </ol>

              {/* Extracted details card — chips land here */}
              <div className="mt-7 min-h-[92px] rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Extracted details
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {dataPoints.slice(0, landedCount).map((dp) => (
                    <motion.span
                      key={dp.id}
                      layoutId={reduceMotion ? undefined : dp.id}
                      initial={reduceMotion ? { opacity: 0 } : false}
                      animate={{ opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-blue-300/40 bg-blue-500/20 px-3 py-1 text-xs text-blue-100"
                    >
                      <span className="text-blue-300/80">{dp.label}:</span>
                      <span className="font-medium text-white">{dp.value}</span>
                    </motion.span>
                  ))}
                  {landedCount === 0 && (
                    <span className="text-xs text-slate-500">Listening for key fields…</span>
                  )}
                </div>
              </div>

              {/* Progress bar synced with the sweep */}
              <div className="mt-6 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full origin-left rounded-full bg-gradient-to-r from-blue-500 to-blue-300"
                    style={{ scaleX: progressScaleX }}
                  />
                </div>
                <span className="w-10 text-right font-mono text-xs text-slate-400">{pct}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/** Completion beat: check draws in, two soft rings expand, then hand-off. */
function SuccessBeat({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="relative flex flex-col items-center text-center"
      role="status"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        {!reduceMotion &&
          [0, 0.18].map((delay) => (
            <motion.span
              key={delay}
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-emerald-400/60"
              initial={{ scale: 0.7, opacity: 0.7 }}
              animate={{ scale: 2.1, opacity: 0 }}
              transition={{ duration: 1.1, delay, ease: 'easeOut' }}
            />
          ))}
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <AnimatedCheck className="h-20 w-20 text-emerald-400" />
        </motion.div>
      </div>
      <motion.h2
        initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35, ease: EASE }}
        className="mt-5 text-2xl font-bold text-white"
      >
        Analysis complete
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="mt-1 text-sm text-slate-400"
      >
        Preparing your results…
      </motion.p>
    </motion.div>
  )
}

/** Calm amber warning: soft pulsing halo (3 pulses, then still), never red flashing. */
function ErrorPanel({
  message,
  reduceMotion,
  onRetry,
  onClose,
}: {
  message: string
  reduceMotion: boolean
  onRetry: () => void
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      transition={{ duration: 0.3, ease: EASE }}
      className="w-full max-w-md rounded-2xl border border-amber-300/25 bg-slate-900 p-8 text-center shadow-lift"
      role="alertdialog"
      aria-label="Scan problem"
    >
      <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
        {!reduceMotion && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-amber-400/25 blur-md"
            animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.75, 0.4] }}
            transition={{ duration: 1.6, repeat: 2, ease: 'easeInOut' }}
          />
        )}
        <svg viewBox="0 0 24 24" fill="none" className="relative h-10 w-10 text-amber-400" aria-hidden="true">
          <path
            d="M12 3.5l9 16h-18l9-16z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M12 10v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="16.8" r="0.9" fill="currentColor" />
        </svg>
      </div>
      <h2 className="mt-4 text-xl font-bold text-white">That scan didn't go through</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{message}</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-300 transition"
        >
          Try again
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition"
        >
          Back to form
        </motion.button>
      </div>
    </motion.div>
  )
}
