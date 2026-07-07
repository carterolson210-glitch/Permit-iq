import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { EASE } from './motionVariants'

/** Route-level wrapper used with AnimatePresence for page transitions. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/** Inline animated banner for error / success messages inside forms. */
export function StatusBanner({
  kind,
  children,
}: {
  kind: 'error' | 'success' | 'info'
  children: ReactNode
}) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-green-200 bg-green-50 text-green-800',
    info: 'border-blue-200 bg-blue-50 text-blue-900',
  }[kind]
  return (
    <motion.div
      role={kind === 'error' ? 'alert' : 'status'}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="overflow-hidden"
    >
      <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</div>
    </motion.div>
  )
}

/** Animated checkmark that draws itself in — used for success states. */
export function AnimatedCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
      />
      <motion.path
        d="M7.5 12.5l3 3 6-6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.3, ease: EASE }}
      />
    </svg>
  )
}
