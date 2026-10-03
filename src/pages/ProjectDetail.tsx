import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { logClientError } from '../lib/monitor'
import { useAuth } from '../lib/auth'
import { Results } from './Analyze'
import type { ChecklistItem, Project } from '../lib/types'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { tier } = useAuth()
  const [project, setProject] = useState<Project | null | undefined>(undefined)
  // Keyed by step_number so toggling can look up each item's id to persist
  // against. Empty for projects saved before checklist persistence shipped
  // — toggling then just falls back to local-only state, same as before.
  const [checklistItems, setChecklistItems] = useState<Map<number, ChecklistItem>>(new Map())
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [openMistakes, setOpenMistakes] = useState<Set<number>>(new Set())
  const [openTips, setOpenTips] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!id) return
    let cancelled = false
    supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) logClientError('project_detail_load_failed', error)
        setProject((data as Project | null) ?? null)
      })
    supabase
      .from('checklist_items')
      .select('*')
      .eq('project_id', id)
      .order('step_number')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          logClientError('checklist_items_load_failed', error)
          return
        }
        const items = (data ?? []) as ChecklistItem[]
        setChecklistItems(new Map(items.map((i) => [i.step_number, i])))
        setChecked(new Set(items.filter((i) => i.completed).map((i) => i.step_number)))
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const toggleChecklistStep = (n: number) => {
    const wasChecked = checked.has(n)
    toggleInSet(setChecked, n)
    const item = checklistItems.get(n)
    if (!item) return // pre-persistence project — local-only, as before
    void supabase
      .from('checklist_items')
      .update({ completed: !wasChecked, completed_at: !wasChecked ? new Date().toISOString() : null })
      .eq('id', item.id)
      .then(({ error }) => {
        if (error) logClientError('checklist_item_update_failed', error)
      })
  }

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
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-line print:hidden">
        <nav className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-primary">
            PermitIQ
          </Link>
          <Link to="/projects" className="text-sm font-medium text-ink-muted hover:text-primary transition">
            ← My projects
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
        {project === undefined ? (
          <div className="animate-pulse space-y-3">
            <div className="h-24 rounded-2xl bg-slate-100" />
            <div className="h-64 rounded-2xl bg-slate-100" />
          </div>
        ) : project === null || !project.ai_analysis ? (
          <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
            <h1 className="text-lg font-semibold text-ink">Project not found</h1>
            <p className="mt-2 text-sm text-ink-muted">
              It may have been deleted, or belongs to a different account.
            </p>
            <Link to="/projects" className="btn-primary mt-6 inline-flex">
              Back to my projects
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <ShareControl tier={tier} project={project} onUpdate={setProject} />
            <Results
              analysis={project.ai_analysis}
              town={project.town}
              checked={checked}
              onToggleStep={toggleChecklistStep}
              openMistakes={openMistakes}
              openTips={openTips}
              onToggleMistake={(n) => toggleInSet(setOpenMistakes, n)}
              onToggleTip={(n) => toggleInSet(setOpenTips, n)}
              onReset={() => navigate('/analyze')}
            />
          </div>
        )}
      </main>
    </div>
  )
}

/**
 * Contractor differentiator: a public, read-only link to this exact report
 * (view at /share/:token, see SharedReport.tsx). Enabling is gated
 * server-side by a trigger on `projects` (enforce_project_share_gate) — the
 * tier check here only controls what the UI offers, not the real gate.
 */
function ShareControl({
  tier,
  project,
  onUpdate,
}: {
  tier: 'free' | 'pro' | 'contractor'
  project: Project
  onUpdate: (p: Project) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  if (tier !== 'contractor') {
    return (
      <div className="rounded-xl border border-dashed border-line bg-slate-50 p-4 text-sm text-ink-muted print:hidden">
        <span className="font-medium text-ink">Shareable report links</span> are a Contractor
        feature — send homeowners a read-only link to this exact report, no account needed.{' '}
        <Link to="/pricing" className="font-semibold text-primary underline">
          Upgrade to Contractor
        </Link>
      </div>
    )
  }

  const shareUrl = project.share_token
    ? `${window.location.origin}/share/${project.share_token}`
    : null

  const setSharing = async (token: string | null) => {
    setBusy(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('projects')
      .update({ share_token: token, shared_at: token ? new Date().toISOString() : null })
      .eq('id', project.id)
      .select()
      .single()
    setBusy(false)
    if (err || !data) {
      setError(
        token
          ? 'Could not enable sharing. Please try again.'
          : 'Could not turn off sharing. Please try again.'
      )
      logClientError('project_share_toggle_failed', err)
      return
    }
    onUpdate(data as Project)
  }

  const copy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard permission denied — the URL is still visible to copy manually
    }
  }

  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-card print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-medium text-ink">Shareable report link</span>
          <p className="mt-0.5 text-sm text-ink-muted">
            {shareUrl
              ? 'Anyone with this link can view a read-only copy of this report — no account needed.'
              : 'Send homeowners a read-only link to this exact report.'}
          </p>
        </div>
        {shareUrl ? (
          <div className="flex items-center gap-3">
            <button
              onClick={copy}
              className="btn-secondary border-primary text-primary hover:bg-blue-50"
            >
              {copied ? 'Copied!' : 'Copy link'}
            </button>
            <button
              onClick={() => setSharing(null)}
              disabled={busy}
              className="text-sm font-medium text-ink-muted hover:text-error transition disabled:opacity-60"
            >
              Turn off
            </button>
          </div>
        ) : (
          <button onClick={() => setSharing(crypto.randomUUID())} disabled={busy} className="btn-primary">
            {busy ? 'Enabling…' : 'Enable share link'}
          </button>
        )}
      </div>
      {shareUrl && (
        <p className="mt-3 truncate rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {shareUrl}
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
