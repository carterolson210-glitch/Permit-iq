import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { openBillingPortal } from '../lib/stripe'

/**
 * Shown while a failed subscription payment is inside its 7-day grace
 * window. Access continues; the banner routes to the Stripe portal to fix
 * the card before the downgrade.
 */
export default function GraceBanner() {
  const { inGrace, profile } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!inGrace || !profile?.grace_until) return null

  const daysLeft = Math.max(
    1,
    Math.ceil((new Date(profile.grace_until).getTime() - Date.now()) / 86_400_000)
  )

  const handleFix = async () => {
    setBusy(true)
    setError(null)
    try {
      await openBillingPortal()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open the billing portal.')
      setBusy(false)
    }
  }

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-900"
    >
      Your last payment didn&apos;t go through. Your plan stays active for{' '}
      <strong>
        {daysLeft} more {daysLeft === 1 ? 'day' : 'days'}
      </strong>{' '}
      while we retry —{' '}
      <button
        onClick={handleFix}
        disabled={busy}
        className="font-semibold underline hover:text-amber-700 disabled:opacity-60"
      >
        {busy ? 'Opening…' : 'update your payment method'}
      </button>
      {error && <span className="ml-2 text-red-700">{error}</span>}
    </div>
  )
}
