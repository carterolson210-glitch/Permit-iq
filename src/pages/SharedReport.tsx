import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { logClientError } from '../lib/monitor'
import { Results } from './Analyze'
import type { SharedProject } from '../lib/types'

/**
 * Public, read-only view of a Contractor's shared report
 * (see ShareControl in ProjectDetail.tsx). No auth required — the token in
 * the URL is the only credential, looked up via the get_shared_project RPC
 * so a visitor can never enumerate other contractors' shared reports.
 * Checklist/mistake/tip toggles are local-only (not persisted) since the
 * viewer isn't the report's owner.
 */
export default function SharedReport() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<SharedProject | null | undefined>(undefined)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [openMistakes, setOpenMistakes] = useState<Set<number>>(new Set())
  const [openTips, setOpenTips] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!token) return
    let cancelled = false
    supabase
      .rpc('get_shared_project', { p_token: token })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) logClientError('shared_report_load_failed', error)
        setProject((data as SharedProject | null) ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const toggleInSet = (
    setter: React.Dispatch<React.SetStateAction<Set<number>>>,
    n: number
  ) => {
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-bg text-ink print:bg-white">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur print:hidden">
        <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="text-xl font-bold text-primary sm:text-2xl">
            PermitIQ
          </Link>
          <Link
            to="/analyze"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900"
          >
            Scan my own project — free
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {project === undefined ? (
          <div className="animate-pulse space-y-3">
            <div className="h-24 rounded-2xl bg-slate-100" />
            <div className="h-64 rounded-2xl bg-slate-100" />
          </div>
        ) : project === null ? (
          <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
            <h1 className="text-lg font-semibold text-ink">This link isn't active</h1>
            <p className="mt-2 text-sm text-ink-muted">
              It may have been turned off, or the link is incorrect.
            </p>
            <Link to="/" className="btn-primary mt-6 inline-flex">
              Go to PermitIQ
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-line bg-white px-5 py-3 text-sm text-ink-muted shadow-card print:hidden">
              Shared permit report for <span className="font-medium text-ink">{project.title}</span> —
              read-only, via a link from a PermitIQ Contractor.
            </div>
            <Results
              analysis={project.ai_analysis}
              town={project.town}
              checked={checked}
              onToggleStep={(n) => toggleInSet(setChecked, n)}
              openMistakes={openMistakes}
              openTips={openTips}
              onToggleMistake={(n) => toggleInSet(setOpenMistakes, n)}
              onToggleTip={(n) => toggleInSet(setOpenTips, n)}
              onReset={() => navigate('/analyze')}
            />
            <p className="rounded-xl border border-line bg-slate-50 px-5 py-4 text-center text-sm text-ink-muted print:hidden">
              Made with{' '}
              <Link to="/" className="font-semibold text-primary hover:underline">
                PermitIQ
              </Link>{' '}
              — AI-powered Massachusetts permit guidance.{' '}
              <Link to="/analyze" className="font-semibold text-primary hover:underline">
                Scan your own project free
              </Link>
              .
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
