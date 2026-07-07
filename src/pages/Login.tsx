import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { FREE_SCAN_LIMIT } from '../lib/auth'
import { StatusBanner } from '../lib/motion'
import { scaleIn } from '../lib/motionVariants'

type Mode = 'signup' | 'signin' | 'forgot'

const MIN_PASSWORD_LENGTH = 8

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // Only allow same-app paths as the post-login destination.
  const rawNext = searchParams.get('next') ?? '/analyze'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/analyze'
  const sessionExpired = searchParams.get('expired') === '1'

  const [mode, setMode] = useState<Mode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      setError('Auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local.')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (mode === 'forgot') {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (err) setError(err.message)
        else setSuccess('If an account exists for that email, a reset link is on its way.')
      } else if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name.trim() || undefined } },
        })
        if (err) {
          setError(err.message)
        } else if (data.session) {
          // Email confirmation disabled in this Supabase project — signed in directly.
          navigate(next, { replace: true })
        } else {
          setSuccess('Check your email for a confirmation link, then sign in.')
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) setError(err.message)
        else navigate(next, { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }

  const heading =
    mode === 'signup' ? 'Create your account' : mode === 'signin' ? 'Welcome back' : 'Reset your password'
  const subheading =
    mode === 'signup'
      ? `Includes ${FREE_SCAN_LIMIT} free permit scans — no credit card required.`
      : mode === 'signin'
      ? 'Sign in to access your permit projects.'
      : "Enter your account email and we'll send you a reset link."

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="bg-white border-b border-line">
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center">
          <Link to="/" className="text-xl font-bold text-primary">PermitIQ</Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div variants={scaleIn} initial="hidden" animate="show" className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-ink">{heading}</h1>
            <p className="mt-2 text-ink-muted">{subheading}</p>
          </div>

          {sessionExpired && (
            <div className="mb-6">
              <StatusBanner kind="info">
                Your session expired. Please sign in again — any scan that didn't finish was not
                counted against your free scans.
              </StatusBanner>
            </div>
          )}

          {mode !== 'forgot' && (
            <div className="flex rounded-lg border border-line bg-white p-1 mb-6 shadow-card">
              {(['signup', 'signin'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
                    mode === m ? 'bg-primary text-white shadow-sm' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {m === 'signup' ? 'Sign up' : 'Sign in'}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-line p-6 shadow-card space-y-4"
          >
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Full name <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  autoComplete="name"
                  maxLength={120}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === 'signup' ? MIN_PASSWORD_LENGTH : undefined}
                  placeholder={mode === 'signup' ? `At least ${MIN_PASSWORD_LENGTH} characters` : '••••••••'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
              </div>
            )}

            <AnimatePresence>
              {error && <StatusBanner kind="error">{error}</StatusBanner>}
              {success && <StatusBanner kind="success">{success}</StatusBanner>}
            </AnimatePresence>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3.5 text-base font-semibold text-white shadow hover:bg-blue-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Please wait…'
                : mode === 'signup'
                ? 'Create account'
                : mode === 'signin'
                ? 'Sign in'
                : 'Send reset link'}
            </motion.button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="w-full text-center text-sm font-medium text-primary hover:underline"
              >
                ← Back to sign in
              </button>
            )}

            {mode === 'signup' && (
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                By creating an account you agree to our{' '}
                <Link to="/terms" className="underline hover:text-primary">Terms</Link> and{' '}
                <Link to="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            <Link to="/" className="text-primary hover:underline font-medium">
              ← Back to home
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  )
}
