import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MA_TOWNS } from '../data/towns'

type Permit = {
  name: string
  issuing_authority: string
  description: string
  typical_fee_range: string
  typical_timeline: string
  required_documents: string[]
  notes: string
}

type ChecklistStep = {
  step_number: number
  action: string
  details: string
  who_does_this: string
  estimated_time: string
}

type Analysis = {
  project_summary: string
  permits_required: Permit[]
  total_estimated_fees: { low: number; high: number }
  total_estimated_timeline: string
  checklist: ChecklistStep[]
  common_mistakes: string[]
  pro_tips: string[]
  town_specific_notes: string
  disclaimer: string
}

const CATEGORIES = [
  'New Construction',
  'Addition',
  'Deck or Porch',
  'Garage',
  'ADU',
  'Kitchen or Bath Remodel',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Roof',
  'Windows and Doors',
  'Shed or Outbuilding',
  'Pool',
  'Commercial',
  'Other',
] as const

const SYSTEM_PROMPT = `You are an expert Massachusetts building permit consultant. When given a project description and town, return ONLY valid JSON with no other text, with these exact fields:
{
  "project_summary": "string",
  "permits_required": [{
    "name": "string",
    "issuing_authority": "string",
    "description": "string",
    "typical_fee_range": "string",
    "typical_timeline": "string",
    "required_documents": ["string"],
    "notes": "string"
  }],
  "total_estimated_fees": {
    "low": number,
    "high": number
  },
  "total_estimated_timeline": "string",
  "checklist": [{
    "step_number": number,
    "action": "string",
    "details": "string",
    "who_does_this": "string",
    "estimated_time": "string"
  }],
  "common_mistakes": ["string"],
  "pro_tips": ["string"],
  "town_specific_notes": "string",
  "disclaimer": "string"
}
Base all answers on Massachusetts 780 CMR 8th Edition and local bylaws for the specified town.`

export default function Analyze() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [step, setStep] = useState<'input' | 'loading' | 'results'>('input')
  const [description, setDescription] = useState(searchParams.get('project') ?? '')
  const [town, setTown] = useState(searchParams.get('town') ?? '')
  const [townQuery, setTownQuery] = useState(searchParams.get('town') ?? '')
  const [townOpen, setTownOpen] = useState(false)
  const [category, setCategory] = useState<string>('')
  const [sqft, setSqft] = useState('')
  const [value, setValue] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingIdx, setLoadingIdx] = useState(0)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [openMistakes, setOpenMistakes] = useState<Set<number>>(new Set())
  const [openTips, setOpenTips] = useState<Set<number>>(new Set())
  const formRef = useRef<HTMLDivElement | null>(null)

  const filteredTowns = useMemo(() => {
    const q = townQuery.trim().toLowerCase()
    if (!q) return MA_TOWNS
    return MA_TOWNS.filter((t) => t.toLowerCase().includes(q))
  }, [townQuery])

  const loadingMessages = useMemo(
    () => [
      'Reading your project description...',
      `Checking ${town || 'town'} local bylaws...`,
      'Identifying required permits...',
      'Calculating fee estimates...',
      'Building your checklist...',
    ],
    [town],
  )

  useEffect(() => {
    if (step !== 'loading') return
    setLoadingIdx(0)
    const id = setInterval(() => {
      setLoadingIdx((i) => (i + 1) % loadingMessages.length)
    }, 1500)
    return () => clearInterval(id)
  }, [step, loadingMessages.length])

  const canSubmit = description.trim().length > 0 && town.length > 0

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Please describe your project and choose your Massachusetts town.')
      return
    }
    setError(null)
    setStep('loading')

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined
    if (!apiKey) {
      setError('Missing VITE_ANTHROPIC_API_KEY. Add it to your .env.local and restart the dev server.')
      setStep('input')
      return
    }

    const userContent =
      `Project: ${description}\n` +
      `Town: ${town}\n` +
      `Category: ${category || 'not specified'}\n` +
      `Square footage: ${sqft || 'not specified'}\n` +
      `Project value: ${value || 'not specified'}`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          system: [
            {
              type: 'text',
              text: SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: userContent }],
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`API error ${response.status}: ${errText}`)
      }

      const data = await response.json()
      const text: string = data?.content?.[0]?.text ?? ''
      const parsed = parseAnalysis(text)
      if (!parsed) {
        throw new Error('Could not parse AI response. Please try again.')
      }
      setAnalysis(parsed)
      setChecked(new Set())
      setStep('results')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.'
      setError(msg)
      setStep('input')
    }
  }

  const handleReset = () => {
    setAnalysis(null)
    setError(null)
    setChecked(new Set())
    setOpenMistakes(new Set())
    setOpenTips(new Set())
    setStep('input')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const toggleChecked = (n: number) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    })
  }

  const toggleInSet = (
    setter: React.Dispatch<React.SetStateAction<Set<number>>>,
    n: number,
  ) => {
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 print:bg-white">
      {/* NAVBAR (hidden in print) */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 print:hidden">
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-xl sm:text-2xl font-bold text-[#1e40af]"
          >
            PermitIQ
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-sm font-medium text-slate-600 hover:text-[#1e40af]"
          >
            ← Home
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
        {step === 'input' && (
          <section ref={formRef}>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Analyze your project
            </h1>
            <p className="mt-2 text-slate-600">
              Tell us about your project and we'll generate a complete, town-specific permit checklist.
            </p>

            <div className="mt-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                  Describe your project
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="e.g. I want to build a 400 sq ft deck attached to my house"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base shadow-sm placeholder:text-slate-400 focus:border-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1e40af]/30 resize-none"
                />
              </div>

              {/* Town */}
              <div>
                <label htmlFor="town" className="block text-sm font-medium text-slate-700 mb-2">
                  Massachusetts town
                </label>
                <div className="relative">
                  <input
                    id="town"
                    type="text"
                    value={townQuery}
                    onChange={(e) => {
                      setTownQuery(e.target.value)
                      setTownOpen(true)
                      if (e.target.value === '') setTown('')
                    }}
                    onFocus={() => setTownOpen(true)}
                    onBlur={() => setTimeout(() => setTownOpen(false), 120)}
                    placeholder="Search 351 cities and towns…"
                    autoComplete="off"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base shadow-sm placeholder:text-slate-400 focus:border-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1e40af]/30"
                  />
                  {townOpen && filteredTowns.length > 0 && (
                    <ul
                      role="listbox"
                      className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg"
                    >
                      {filteredTowns.slice(0, 100).map((t) => (
                        <li
                          key={t}
                          role="option"
                          aria-selected={town === t}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            setTown(t)
                            setTownQuery(t)
                            setTownOpen(false)
                          }}
                          className={`cursor-pointer px-4 py-2 text-sm hover:bg-blue-50 ${
                            town === t ? 'bg-blue-50 text-[#1e40af] font-medium' : 'text-slate-700'
                          }`}
                        >
                          {t}
                        </li>
                      ))}
                      {filteredTowns.length > 100 && (
                        <li className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100">
                          Showing first 100 of {filteredTowns.length} — keep typing to refine
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => {
                    const active = category === c
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(active ? '' : c)}
                        className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                          active
                            ? 'border-[#1e40af] bg-[#1e40af] text-white shadow-sm'
                            : 'border-slate-300 bg-white text-slate-700 hover:border-[#1e40af] hover:text-[#1e40af]'
                        }`}
                      >
                        {c}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* sqft + value */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="sqft" className="block text-sm font-medium text-slate-700 mb-2">
                    Square footage <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="sqft"
                    type="number"
                    min={0}
                    value={sqft}
                    onChange={(e) => setSqft(e.target.value)}
                    placeholder="e.g. 400"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base shadow-sm placeholder:text-slate-400 focus:border-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1e40af]/30"
                  />
                </div>
                <div>
                  <label htmlFor="value" className="block text-sm font-medium text-slate-700 mb-2">
                    Estimated project value <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                      id="value"
                      type="number"
                      min={0}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="e.g. 25000"
                      className="w-full rounded-lg border border-slate-300 bg-white pl-7 pr-4 py-3 text-base shadow-sm placeholder:text-slate-400 focus:border-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1e40af]/30"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full inline-flex items-center justify-center rounded-lg bg-[#1e40af] px-6 py-3.5 text-base font-semibold text-white shadow hover:bg-blue-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Analyze My Project
              </button>
            </div>
          </section>
        )}

        {step === 'loading' && (
          <section className="py-12 sm:py-20">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="text-2xl sm:text-3xl font-bold">Analyzing your project…</h2>
              <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-1/3 animate-[progress_1.5s_ease-in-out_infinite] rounded-full bg-[#1e40af]" />
              </div>
              <p className="mt-6 min-h-[1.5rem] text-slate-600 transition-opacity" key={loadingIdx}>
                {loadingMessages[loadingIdx]}
              </p>
            </div>
            <style>{`
              @keyframes progress {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(400%); }
              }
            `}</style>
          </section>
        )}

        {step === 'results' && analysis && (
          <Results
            analysis={analysis}
            town={town}
            checked={checked}
            onToggleStep={toggleChecked}
            openMistakes={openMistakes}
            openTips={openTips}
            onToggleMistake={(n) => toggleInSet(setOpenMistakes, n)}
            onToggleTip={(n) => toggleInSet(setOpenTips, n)}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  )
}

function parseAnalysis(text: string): Analysis | null {
  let cleaned = text.trim()
  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  }
  // Find first { and last } to be defensive
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first === -1 || last === -1) return null
  const candidate = cleaned.slice(first, last + 1)
  try {
    const obj = JSON.parse(candidate)
    if (
      typeof obj !== 'object' ||
      obj === null ||
      !Array.isArray(obj.permits_required) ||
      !Array.isArray(obj.checklist)
    ) {
      return null
    }
    return obj as Analysis
  } catch {
    return null
  }
}

function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

type ResultsProps = {
  analysis: Analysis
  town: string
  checked: Set<number>
  onToggleStep: (n: number) => void
  openMistakes: Set<number>
  openTips: Set<number>
  onToggleMistake: (n: number) => void
  onToggleTip: (n: number) => void
  onReset: () => void
}

function Results({
  analysis,
  town,
  checked,
  onToggleStep,
  openMistakes,
  openTips,
  onToggleMistake,
  onToggleTip,
  onReset,
}: ResultsProps) {
  const totalSteps = analysis.checklist.length
  const completedSteps = analysis.checklist.filter((s) => checked.has(s.step_number)).length
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  return (
    <section className="space-y-8">
      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1e40af]">
              {town}, MA
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Your permit analysis
            </h1>
            <p className="mt-2 text-slate-600">{analysis.project_summary}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat
            label="Permits required"
            value={String(analysis.permits_required.length)}
            accent="text-[#1e40af]"
          />
          <Stat
            label="Estimated fees"
            value={`${formatMoney(analysis.total_estimated_fees?.low ?? 0)} – ${formatMoney(
              analysis.total_estimated_fees?.high ?? 0,
            )}`}
          />
          <Stat label="Estimated timeline" value={analysis.total_estimated_timeline || '—'} />
        </div>

        {analysis.town_specific_notes && (
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <span className="font-semibold">{town} note: </span>
            {analysis.town_specific_notes}
          </div>
        )}
      </div>

      {/* Permits */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Permits required</h2>
        <div className="mt-4 space-y-4">
          {analysis.permits_required.map((p, i) => (
            <article
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{p.name}</h3>
                  <p className="text-sm text-slate-500">Issued by {p.issuing_authority}</p>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium text-slate-900">{p.typical_fee_range}</div>
                  <div className="text-slate-500">{p.typical_timeline}</div>
                </div>
              </div>
              <p className="mt-3 text-slate-600">{p.description}</p>

              {p.required_documents?.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-slate-700">Required documents</h4>
                  <ul className="mt-2 space-y-1.5">
                    {p.required_documents.map((d, di) => (
                      <li key={di} className="flex gap-2 text-sm text-slate-600">
                        <Check className="text-[#059669]" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {p.notes && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <span className="font-semibold">Note: </span>
                  {p.notes}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      {/* Checklist */}
      <div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h2 className="text-xl sm:text-2xl font-bold">Application checklist</h2>
          <span className="text-sm text-slate-500">
            {completedSteps} of {totalSteps} complete
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-[#059669] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <ol className="mt-5 space-y-3">
          {analysis.checklist.map((s) => {
            const isChecked = checked.has(s.step_number)
            return (
              <li
                key={s.step_number}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                  isChecked ? 'border-[#059669]/40 bg-emerald-50/40' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <label className="mt-0.5 flex h-6 w-6 flex-none cursor-pointer items-center justify-center print:hidden">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleStep(s.step_number)}
                      className="h-5 w-5 rounded border-slate-300 text-[#059669] focus:ring-[#059669]"
                    />
                  </label>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-[#1e40af] px-2 text-xs font-bold text-white">
                        {s.step_number}
                      </span>
                      <h3
                        className={`text-base font-semibold ${
                          isChecked ? 'text-slate-500 line-through' : 'text-slate-900'
                        }`}
                      >
                        {s.action}
                      </h3>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-600">{s.details}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>
                        <span className="font-medium text-slate-700">Who: </span>
                        {s.who_does_this}
                      </span>
                      <span>
                        <span className="font-medium text-slate-700">Time: </span>
                        {s.estimated_time}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Common mistakes */}
      {analysis.common_mistakes?.length > 0 && (
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Common mistakes</h2>
          <div className="mt-4 space-y-2">
            {analysis.common_mistakes.map((m, i) => {
              const open = openMistakes.has(i)
              const summary = m.length > 80 ? m.slice(0, 80) + '…' : m
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onToggleMistake(i)}
                  className="w-full text-left rounded-xl border border-red-200 bg-red-50 px-4 py-3 hover:bg-red-100 transition"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-red-600 font-bold">!</span>
                    <p className="flex-1 text-sm text-red-900">{open ? m : summary}</p>
                    <span className="text-xs text-red-600">{open ? '−' : '+'}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Pro tips */}
      {analysis.pro_tips?.length > 0 && (
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Pro tips</h2>
          <div className="mt-4 space-y-2">
            {analysis.pro_tips.map((t, i) => {
              const open = openTips.has(i)
              const summary = t.length > 80 ? t.slice(0, 80) + '…' : t
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onToggleTip(i)}
                  className="w-full text-left rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 hover:bg-emerald-100 transition"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-[#059669] font-bold">★</span>
                    <p className="flex-1 text-sm text-emerald-900">{open ? t : summary}</p>
                    <span className="text-xs text-[#059669]">{open ? '−' : '+'}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 print:hidden">
        <button
          onClick={() => alert('Sign up to save projects (coming soon).')}
          className="inline-flex items-center justify-center rounded-md bg-[#1e40af] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-900 transition"
        >
          Save to Account
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center justify-center rounded-md border border-[#1e40af] px-5 py-2.5 text-sm font-semibold text-[#1e40af] hover:bg-blue-50 transition"
        >
          Export PDF
        </button>
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
        >
          Start New Analysis
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-200 pt-6">
        {analysis.disclaimer ||
          'AI analysis for informational purposes only. Not legal advice. Always verify with your local building department.'}
      </p>
    </section>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${accent ?? 'text-slate-900'}`}>{value}</div>
    </div>
  )
}

function Check({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`mt-0.5 h-4 w-4 flex-none ${className ?? 'text-[#059669]'}`}
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}
