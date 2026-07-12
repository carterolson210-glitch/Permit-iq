import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const SHOWN_KEY = 'piq_exit_modal_shown'
const CHECKLIST_URL = '/ma-permit-mistakes-checklist.pdf'

/**
 * Desktop-only exit-intent email capture, armed on the pricing page.
 * Fires once per user (localStorage), offers the free MA Permit Mistakes
 * Checklist PDF, and stores the email with a source tag for drip campaigns.
 */
export default function ExitIntentModal() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const closeRef = useRef<HTMLButtonElement | null>(null)

  const shouldArm = useCallback(() => {
    if (typeof window === 'undefined') return false
    if (localStorage.getItem(SHOWN_KEY)) return false
    // Desktop only: exit intent is meaningless on touch devices.
    if (!window.matchMedia('(pointer: fine)').matches) return false
    if (window.innerWidth < 768) return false
    return true
  }, [])

  useEffect(() => {
    if (!shouldArm()) return
    const onMouseOut = (e: MouseEvent) => {
      // Cursor left through the top of the viewport → heading for the tab bar.
      if (e.relatedTarget === null && e.clientY <= 0) {
        if (!localStorage.getItem(SHOWN_KEY)) {
          localStorage.setItem(SHOWN_KEY, new Date().toISOString())
          setOpen(true)
        }
      }
    }
    document.addEventListener('mouseout', onMouseOut)
    return () => document.removeEventListener('mouseout', onMouseOut)
  }, [shouldArm])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setState('error')
      return
    }
    setState('saving')
    try {
      if (isSupabaseConfigured) {
        // Unique-violation (already subscribed) is fine — still give the PDF.
        await supabase
          .from('email_subscribers')
          .insert({ email: trimmed, source: 'exit_intent_pricing' })
      }
      setState('done')
    } catch {
      setState('done')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          onClick={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-modal-title"
            initial={{ scale: 0.95, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 8 }}
            className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="exit-modal-title" className="text-xl font-bold text-ink">
                Before you go — grab the free checklist
              </h2>
              <button
                ref={closeRef}
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded p-1 text-ink-muted hover:bg-slate-100 hover:text-ink"
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            {state === 'done' ? (
              <div className="mt-4">
                <p className="text-sm text-ink-muted">
                  It&apos;s yours — download the checklist below. We&apos;ll occasionally send
                  Massachusetts permitting tips (unsubscribe anytime).
                </p>
                <a
                  href={CHECKLIST_URL}
                  download
                  className="btn-primary mt-5 inline-flex w-full justify-center"
                >
                  Download the checklist (PDF)
                </a>
              </div>
            ) : (
              <>
                <p className="mt-3 text-sm text-ink-muted">
                  <strong className="text-ink">The Massachusetts Permit Mistakes Checklist</strong>{' '}
                  — the 10 errors that most often get applications rejected or trigger
                  double/triple fees, and how to avoid each one. Free, no account needed.
                </p>
                <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
                  <label htmlFor="exit-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="exit-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (state === 'error') setState('idle')
                    }}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {state === 'error' && (
                    <p className="text-xs text-red-600" role="alert">
                      Please enter a valid email address.
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={state === 'saving'}
                    className="btn-primary w-full disabled:opacity-60"
                  >
                    {state === 'saving' ? 'Sending…' : 'Email me the checklist'}
                  </button>
                </form>
                <p className="mt-3 text-center text-xs text-slate-400">
                  No spam. Unsubscribe with one click.
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
