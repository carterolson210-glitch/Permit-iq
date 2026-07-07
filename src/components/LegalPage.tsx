import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fadeUp, staggerChildren } from '../lib/motionVariants'

/**
 * Shared shell for the Privacy Policy and Terms of Service pages, including
 * the prominent "draft — get attorney review" banner both must carry.
 */
export default function LegalPage({
  title,
  effectiveDate,
  children,
}: {
  title: string
  effectiveDate: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-line">
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-primary">PermitIQ</Link>
          <Link to="/" className="text-sm font-medium text-ink-muted hover:text-primary transition">
            ← Home
          </Link>
        </nav>
      </header>

      <motion.main
        variants={staggerChildren}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16"
      >
        <motion.div
          variants={fadeUp}
          role="note"
          className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900"
        >
          <strong className="font-semibold">Draft — not yet reviewed by counsel.</strong> This
          document is a starting template generated for PermitIQ. It is not legal advice. Have a
          licensed attorney review and adapt it before relying on it in production.
        </motion.div>

        <motion.h1 variants={fadeUp} className="mt-8 text-3xl sm:text-4xl font-extrabold tracking-tight">
          {title}
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-2 text-sm text-ink-muted">
          Effective date: {effectiveDate}
        </motion.p>

        <motion.div variants={fadeUp} className="legal-prose mt-8">
          {children}
        </motion.div>

        <motion.div variants={fadeUp} className="mt-12 border-t border-line pt-6 text-sm text-ink-muted">
          Questions? Contact us at{' '}
          <span className="font-medium text-ink">[contact email — fill in before launch]</span>.
          See also our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>{' '}
          and <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>.
        </motion.div>
      </motion.main>
    </div>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-muted">{children}</div>
    </section>
  )
}
