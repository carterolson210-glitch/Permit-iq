import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MA_TOWNS } from '../data/towns'
import { analyzeProject, AnalyzeError } from '../lib/anthropic'
import { useAuth } from '../lib/auth'
import { StatusBanner } from '../lib/motion'
import { fadeUp, staggerChildren } from '../lib/motionVariants'
import type { PermitAnalysis } from '../lib/types'
import { ScanCounter } from '../components/ScanCounter'
import ScanAnimation from '../components/ScanAnimation'
import Paywall from '../components/Paywall'
import TrustPanel from '../components/TrustPanel'
import { logClientError } from '../lib/monitor'

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

const MAX_FILE_BYTES = 5 * 1024 * 1024

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(((reader.result as string) ?? '').split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export default function Analyze() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile, profileLoading, isPaid, scansRemaining, refreshProfile, signOut } = useAuth()

  const [step, setStep] = useState<'input' | 'scanning' | 'results'>('input')
  const [description, setDescription] = useState(searchParams.get('project') ?? '')
  const [town, setTown] = useState(searchParams.get('town') ?? '')
  const [townQuery, setTownQuery] = useState(searchParams.get('town') ?? '')
  const [townOpen, setTownOpen] = useState(false)
  const [category, setCategory] = useState<string>('')
  const [sqft, setSqft] = useState('')
  const [value, setValue] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [analysis, setAnalysis] = useState<PermitAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paywall, setPaywall] = useState<string | null>(null)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [openMistakes, setOpenMistakes] = useState<Set<number>>(new Set())
  const [openTips, setOpenTips] = useState<Set<number>>(new Set())
  const formRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const filteredTowns = useMemo(() => {
    const q = townQuery.trim().toLowerCase()
    if (!q) return MA_TOWNS
    return MA_TOWNS.filter((t) => t.toLowerCase().includes(q))
  }, [townQuery])

  const canSubmit = description.trim().length >= 10 && town.length > 0

  // Out of free scans (and not paid): show the upgrade screen instead of the
  // form. Also triggered server-side via the `scan_limit` error code, which
  // covers the race where another tab used the last scan first.
  const outOfScans =
    paywall !== null || (!profileLoading && profile !== null && !isPaid && scansRemaining === 0)

  const acceptFile = (f: File) => {
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Only PDF documents are supported.')
      return
    }
    if (f.size > MAX_FILE_BYTES) {
      setFileError('Document is too large (max 5 MB).')
      return
    }
    setFileError(null)
    setFile(f)
  }

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Please describe your project (at least 10 characters) and choose your Massachusetts town.')
      return
    }
    setError(null)
    setStep('scanning')

    try {
      const document = file
        ? { name: file.name, data_base64: await fileToBase64(file) }
        : undefined
      const result = await analyzeProject({
        description: description.trim(),
        town,
        category: category || undefined,
        square_footage: sqft ? Number(sqft) : undefined,
        project_value: value ? Number(value) : undefined,
        document,
      })
      setAnalysis(result.analysis)
      setChecked(new Set())
      setStep('results')
      void refreshProfile()
    } catch (e) {
      setStep('input')
      if (e instanceof AnalyzeError) {
        if (e.code === 'auth') {
          navigate(`/login?next=${encodeURIComponent('/analyze')}&expired=1`, { replace: true })
          return
        }
        if (e.code === 'scan_limit') {
          setPaywall(
            'That scan could not start because all 3 free scans on your account have been used.'
          )
          void refreshProfile()
          return
        }
        setError(e.message)
        if (e.code === 'unknown' || e.code === 'ai_error') logClientError('scan_failed', e)
      } else {
        setError('Something went wrong. Your scan was not used — please try again.')
        logClientError('scan_failed', e)
      }
      void refreshProfile()
    }
  }

  const handleReset = () => {
    setAnalysis(null)
    setError(null)
    setChecked(new Set())
    setOpenMistakes(new Set())
    setOpenTips(new Set())
    setFile(null)
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
    n: number
  ) => {
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    })
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-bg text-ink print:bg-white">
      {/* NAVBAR (hidden in print) */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-line print:hidden">
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-primary">
            PermitIQ
          </Link>
          <div className="flex items-center gap-3">
            <ScanCounter />
            <button
              onClick={handleSignOut}
              className="text-sm font-medium text-ink-muted hover:text-primary transition"
            >
              Sign out
            </button>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
        {outOfScans ? (
          <Paywall message={paywall ?? undefined} />
        ) : (
          <>
            {step === 'input' && (
              <motion.section
                ref={formRef}
                variants={staggerChildren}
                initial="hidden"
                animate="show"
              >
                <motion.div variants={fadeUp}>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                    Analyze your project
                  </h1>
                  <p className="mt-2 text-ink-muted">
                    Tell us about your project and we'll generate a complete, town-specific
                    permit checklist.
                  </p>
                </motion.div>

                <motion.div
                  variants={fadeUp}
                  className="mt-8 space-y-6 rounded-2xl border border-line bg-white p-6 sm:p-8 shadow-card"
                >
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
                      maxLength={4000}
                      placeholder="e.g. I want to build a 400 sq ft deck attached to my house"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition"
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
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                      />
                      <AnimatePresence>
                        {townOpen && filteredTowns.length > 0 && (
                          <motion.ul
                            role="listbox"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-line bg-white shadow-lg"
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
                                className={`cursor-pointer px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${
                                  town === t ? 'bg-blue-50 text-primary font-medium' : 'text-slate-700'
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
                          </motion.ul>
                        )}
                      </AnimatePresence>
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
                          <motion.button
                            key={c}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCategory(active ? '' : c)}
                            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                              active
                                ? 'border-primary bg-primary text-white shadow-sm'
                                : 'border-slate-300 bg-white text-slate-700 hover:border-primary hover:text-primary'
                            }`}
                          >
                            {c}
                          </motion.button>
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
                        max={2000000}
                        value={sqft}
                        onChange={(e) => setSqft(e.target.value)}
                        placeholder="e.g. 400"
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
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
                          className="w-full rounded-lg border border-slate-300 bg-white pl-7 pr-4 py-3 text-base shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Document upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Permit document <span className="text-slate-400 font-normal">(optional, PDF up to 5 MB)</span>
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) acceptFile(f)
                        e.target.value = ''
                      }}
                    />
                    {file ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-blue-50 px-4 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <FileIcon />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">{file.name}</p>
                            <p className="text-xs text-ink-muted">
                              {(file.size / 1024 / 1024).toFixed(1)} MB — will be analyzed with your project
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          className="text-sm font-medium text-ink-muted hover:text-error transition"
                        >
                          Remove
                        </button>
                      </motion.div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault()
                          setDragOver(true)
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault()
                          setDragOver(false)
                          const f = e.dataTransfer.files?.[0]
                          if (f) acceptFile(f)
                        }}
                        className={`w-full rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${
                          dragOver
                            ? 'border-primary bg-blue-50'
                            : 'border-slate-300 bg-white hover:border-primary/60 hover:bg-blue-50/40'
                        }`}
                      >
                        <span className="block text-sm font-medium text-slate-700">
                          Drop a plot plan, prior permit, or town form here
                        </span>
                        <span className="mt-1 block text-xs text-slate-400">
                          or click to browse — PDF only
                        </span>
                      </button>
                    )}
                    <AnimatePresence>
                      {fileError && <StatusBanner kind="error">{fileError}</StatusBanner>}
                    </AnimatePresence>
                  </div>

                  <AnimatePresence>
                    {error && <StatusBanner kind="error">{error}</StatusBanner>}
                  </AnimatePresence>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="w-full inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3.5 text-base font-semibold text-white shadow hover:bg-blue-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Analyze My Project
                  </motion.button>

                  {!isPaid && scansRemaining !== null && (
                    <p className="text-center text-xs text-ink-muted">
                      This will use 1 of your {scansRemaining} remaining free scan
                      {scansRemaining === 1 ? '' : 's'}. Failed scans are never counted.
                    </p>
                  )}
                </motion.div>
              </motion.section>
            )}

            {step === 'scanning' && <ScanAnimation town={town} documentName={file?.name} />}

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
          </>
        )}
      </main>
    </div>
  )
}

function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

type ResultsProps = {
  analysis: PermitAnalysis
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
    <motion.section
      variants={staggerChildren}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header card */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-line bg-white p-6 sm:p-8 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary"
            >
              {town}, MA
            </motion.span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Your permit analysis
            </h1>
            <p className="mt-2 text-ink-muted">{analysis.project_summary}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat
            label="Permits required"
            value={String(analysis.permits_required.length)}
            accent="text-primary"
          />
          <Stat
            label="Estimated fees"
            value={`${formatMoney(analysis.total_estimated_fees?.low ?? 0)} – ${formatMoney(
              analysis.total_estimated_fees?.high ?? 0
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
      </motion.div>

      {/* Sourcing & accuracy */}
      <TrustPanel town={town} analysis={analysis} />

      {/* Permits */}
      <motion.div variants={fadeUp}>
        <h2 className="text-xl sm:text-2xl font-bold">Permits required</h2>
        <motion.div variants={staggerChildren} className="mt-4 space-y-4">
          {analysis.permits_required.map((p, i) => (
            <motion.article
              key={i}
              variants={fadeUp}
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-line bg-white p-6 shadow-card transition-shadow hover:shadow-lift"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-ink">{p.name}</h3>
                  <p className="text-sm text-slate-500">Issued by {p.issuing_authority}</p>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium text-ink">{p.typical_fee_range}</div>
                  <div className="text-slate-500">{p.typical_timeline}</div>
                </div>
              </div>
              <p className="mt-3 text-ink-muted">{p.description}</p>

              {p.required_documents?.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-slate-700">Required documents</h4>
                  <ul className="mt-2 space-y-1.5">
                    {p.required_documents.map((d, di) => (
                      <li key={di} className="flex gap-2 text-sm text-ink-muted">
                        <Check className="text-accent" />
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
            </motion.article>
          ))}
        </motion.div>
      </motion.div>

      {/* Checklist */}
      <motion.div variants={fadeUp}>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h2 className="text-xl sm:text-2xl font-bold">Application checklist</h2>
          <span className="text-sm text-slate-500">
            {completedSteps} of {totalSteps} complete
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <motion.div
            className="h-full rounded-full bg-accent"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        <motion.ol variants={staggerChildren} className="mt-5 space-y-3">
          {analysis.checklist.map((s) => {
            const isChecked = checked.has(s.step_number)
            return (
              <motion.li
                key={s.step_number}
                variants={fadeUp}
                className={`rounded-2xl border bg-white p-5 shadow-card transition-colors ${
                  isChecked ? 'border-accent/40 bg-emerald-50/40' : 'border-line'
                }`}
              >
                <div className="flex items-start gap-4">
                  <label className="mt-0.5 flex h-6 w-6 flex-none cursor-pointer items-center justify-center print:hidden">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleStep(s.step_number)}
                      className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent transition"
                    />
                  </label>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-white">
                        {s.step_number}
                      </span>
                      <h3
                        className={`text-base font-semibold transition-colors ${
                          isChecked ? 'text-slate-500 line-through' : 'text-ink'
                        }`}
                      >
                        {s.action}
                      </h3>
                    </div>
                    <p className="mt-1.5 text-sm text-ink-muted">{s.details}</p>
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
              </motion.li>
            )
          })}
        </motion.ol>
      </motion.div>

      {/* Common mistakes */}
      {analysis.common_mistakes?.length > 0 && (
        <motion.div variants={fadeUp}>
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
        </motion.div>
      )}

      {/* Pro tips */}
      {analysis.pro_tips?.length > 0 && (
        <motion.div variants={fadeUp}>
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
                    <span className="mt-0.5 text-accent font-bold">★</span>
                    <p className="flex-1 text-sm text-emerald-900">{open ? t : summary}</p>
                    <span className="text-xs text-accent">{open ? '−' : '+'}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-3 print:hidden">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => window.print()}
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-900 transition"
        >
          Export PDF
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onReset}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
        >
          Start New Analysis
        </motion.button>
      </motion.div>

      {/* Disclaimer */}
      <motion.p variants={fadeUp} className="text-xs text-slate-500 leading-relaxed border-t border-line pt-6">
        {analysis.disclaimer ||
          'AI analysis for informational purposes only. Not legal advice. Always verify with your local building department.'}
      </motion.p>
    </motion.section>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${accent ?? 'text-ink'}`}>{value}</div>
    </div>
  )
}

function Check({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`mt-0.5 h-4 w-4 flex-none ${className ?? 'text-accent'}`}
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

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 flex-none text-primary" aria-hidden="true">
      <path
        d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
