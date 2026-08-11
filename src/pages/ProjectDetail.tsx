import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { logClientError } from '../lib/monitor'
import { Results } from './Analyze'
import type { Project } from '../lib/types'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null | undefined>(undefined)
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
    return () => {
      cancelled = true
    }
  }, [id])

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
        )}
      </main>
    </div>
  )
}
