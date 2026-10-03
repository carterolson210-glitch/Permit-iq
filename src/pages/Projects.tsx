import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { fadeUp, staggerChildren } from '../lib/motionVariants'
import { ScanCounter } from '../components/ScanCounter'
import { logClientError } from '../lib/monitor'
import type { Project } from '../lib/types'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Surfaces the referral_code every account gets on signup (previously
 *  generated but never shown anywhere). Redemption on the other end is
 *  handled by auth.tsx's redeem_referral call. */
function ReferralCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/?ref=${code}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard permission denied — the link is still visible to copy manually
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <h2 className="text-sm font-semibold text-ink">Refer a friend</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Share your link — when someone you refer subscribes, it's tied back to you.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {link}
        </code>
        <button
          onClick={copy}
          className="btn-secondary flex-none border-primary text-primary hover:bg-blue-50"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}

export default function Projects() {
  const { isPaid, profileLoading, profile } = useAuth()
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isPaid) return
    let cancelled = false
    supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) {
          setError('Could not load your saved projects.')
          logClientError('projects_load_failed', err)
        } else {
          setProjects((data ?? []) as Project[])
        }
      })
    return () => {
      cancelled = true
    }
  }, [isPaid])

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-line">
        <nav className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-primary">
            PermitIQ
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/analyze" className="text-sm font-medium text-ink-muted hover:text-primary transition">
              New scan
            </Link>
            <ScanCounter />
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
        <motion.div variants={staggerChildren} initial="hidden" animate="show">
          <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            My projects
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-2 text-ink-muted">
            Every scan you run is saved here so you can come back to it later.
          </motion.p>

          {profile?.referral_code && (
            <motion.div variants={fadeUp} className="mt-6">
              <ReferralCard code={profile.referral_code} />
            </motion.div>
          )}

          {profileLoading ? (
            <motion.div variants={fadeUp} className="mt-8 animate-pulse space-y-3">
              <div className="h-20 rounded-xl bg-slate-100" />
              <div className="h-20 rounded-xl bg-slate-100" />
            </motion.div>
          ) : !isPaid ? (
            <motion.div
              variants={fadeUp}
              className="mt-8 rounded-2xl border border-line bg-white p-8 text-center shadow-card"
            >
              <h2 className="text-lg font-semibold text-ink">Saved projects are a Pro feature</h2>
              <p className="mt-2 text-sm text-ink-muted">
                Upgrade to Pro or Contractor to automatically save every scan and come back to it
                anytime — no re-entering project details.
              </p>
              <Link to="/pricing" className="btn-primary mt-6 inline-flex">
                See plans from $29/mo
              </Link>
            </motion.div>
          ) : error ? (
            <motion.p variants={fadeUp} className="mt-8 text-sm text-error">
              {error}
            </motion.p>
          ) : projects === null ? (
            <motion.div variants={fadeUp} className="mt-8 animate-pulse space-y-3">
              <div className="h-20 rounded-xl bg-slate-100" />
              <div className="h-20 rounded-xl bg-slate-100" />
            </motion.div>
          ) : projects.length === 0 ? (
            <motion.div
              variants={fadeUp}
              className="mt-8 rounded-2xl border border-line bg-white p-8 text-center shadow-card"
            >
              <h2 className="text-lg font-semibold text-ink">No saved projects yet</h2>
              <p className="mt-2 text-sm text-ink-muted">
                Run a scan and it'll show up here automatically.
              </p>
              <Link to="/analyze" className="btn-primary mt-6 inline-flex">
                Analyze a project
              </Link>
            </motion.div>
          ) : (
            <motion.ul variants={staggerChildren} className="mt-8 space-y-3">
              {projects.map((p) => (
                <motion.li key={p.id} variants={fadeUp}>
                  <Link
                    to={`/projects/${p.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-5 shadow-card transition hover:shadow-lift"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-ink">{p.title}</h3>
                      <p className="mt-1 text-sm text-ink-muted">
                        {p.town}
                        {p.category ? ` · ${p.category}` : ''} · {formatDate(p.created_at)}
                      </p>
                    </div>
                    <span className="flex-none text-sm font-medium text-primary">View →</span>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </motion.div>
      </main>
    </div>
  )
}
