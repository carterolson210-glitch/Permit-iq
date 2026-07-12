import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { VERIFIED_TOWN_COUNT } from '../data/townPermits'

// Real testimonials only — leave empty until genuine ones exist. Each entry
// renders a card; an empty array renders nothing. NEVER add invented quotes.
const TESTIMONIALS: { quote: string; name: string; detail: string }[] = []

// The scans counter only appears once there is real volume behind it.
const COUNTER_THRESHOLD = 100

export function useScanCount(): number | null {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    supabase
      .rpc('scan_stats')
      .then(({ data, error }) => {
        if (cancelled || error || !data) return
        const n = Number((data as { scans_completed?: number }).scans_completed)
        if (Number.isFinite(n)) setCount(n)
      })
    return () => {
      cancelled = true
    }
  }, [])
  return count
}

/**
 * Social proof strip: real DB-driven scan counter (hidden below threshold)
 * plus testimonial cards (hidden until real testimonials exist). Renders
 * nothing at all when there is nothing honest to show.
 */
export default function SocialProof() {
  const scanCount = useScanCount()
  const showCounter = scanCount !== null && scanCount >= COUNTER_THRESHOLD
  const showTestimonials = TESTIMONIALS.length > 0

  if (!showCounter && !showTestimonials) return null

  return (
    <section aria-label="Social proof" className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
      {showCounter && (
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
          <span className="text-2xl font-extrabold normal-case tracking-tight text-slate-900">
            {scanCount!.toLocaleString('en-US')}
          </span>{' '}
          projects scanned across {VERIFIED_TOWN_COUNT}+ Massachusetts towns
        </p>
      )}
      {showTestimonials && (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <blockquote className="text-sm text-slate-700">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-4 text-xs">
                <span className="font-semibold text-slate-900">{t.name}</span>
                <span className="text-slate-500"> — {t.detail}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  )
}
