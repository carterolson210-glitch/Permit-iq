import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AnimatedCheck, scaleIn, StatusBanner } from '../lib/motion'

const MIN_PASSWORD_LENGTH = 8

/**
 * Landing target for the password-recovery email link. Supabase JS picks the
 * recovery token out of the URL and establishes a session automatically; we
 * just wait for it and then let the user set a new password.
 */
export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState<boolean | null>(null) // null = checking
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(false)
      return
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true)
    })
    // Give the client a moment to process the recovery token from the URL.
    const timeout = setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      setReady((r) => r ?? Boolean(data.session))
    }, 1500)
    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) setError(err.message)
    else setDone(true)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="bg-white border-b border-line">
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center">
          <Link to="/" className="text-xl font-bold text-primary">PermitIQ</Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div variants={scaleIn} initial="hidden" animate="show" className="w-full max-w-md">
          {done ? (
            <div className="bg-white rounded-2xl border border-line p-8 shadow-card text-center">
              <AnimatedCheck className="mx-auto h-14 w-14 text-accent" />
              <h1 className="mt-4 text-2xl font-extrabold text-ink">Password updated</h1>
              <p className="mt-2 text-ink-muted">You're signed in and ready to go.</p>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/analyze', { replace: true })}
                className="btn-primary mt-6 w-full"
              >
                Continue to PermitIQ
              </motion.button>
            </div>
          ) : ready === false ? (
            <div className="bg-white rounded-2xl border border-line p-8 shadow-card text-center">
              <h1 className="text-2xl font-extrabold text-ink">Link invalid or expired</h1>
              <p className="mt-2 text-ink-muted">
                Password reset links only work once and expire after a short time.
              </p>
              <Link
                to="/login"
                className="btn-primary mt-6 w-full"
              >
                Request a new link
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-ink">Choose a new password</h1>
                <p className="mt-2 text-ink-muted">
                  You'll stay signed in on this device after updating it.
                </p>
              </div>
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl border border-line p-6 shadow-card space-y-4"
              >
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                    autoComplete="new-password"
                    disabled={ready === null}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition disabled:opacity-60"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                    disabled={ready === null}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition disabled:opacity-60"
                  />
                </div>

                <AnimatePresence>
                  {error && <StatusBanner kind="error">{error}</StatusBanner>}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  disabled={loading || ready === null}
                  className="w-full inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3.5 text-base font-semibold text-white shadow hover:bg-blue-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ready === null ? 'Verifying link…' : loading ? 'Updating…' : 'Update password'}
                </motion.button>
              </form>
            </>
          )}
        </motion.div>
      </main>
    </div>
  )
}
