import { supabase, isSupabaseConfigured } from './supabase'

// First-party funnel analytics — fire-and-forget inserts into
// analytics_events (insert-only RLS, same pattern as client_events in
// monitor.ts). No third-party script, no tracking cookies — the only
// client-side storage is a random per-browser id, so no cookie banner is
// needed. Lifecycle-truth events ('upgrade', 'cancel') are written
// server-side by stripe-webhook instead, since Stripe's webhook is the
// only reliable source for "did this subscription actually change."

const ANON_ID_KEY = 'piq_anon_id'

export type AnalyticsEvent =
  | 'landing_view'
  | 'scan_started'
  | 'scan_completed'
  | 'paywall_shown'
  | 'checkout_started'
  | 'checkout_completed'

function getAnonId(): string {
  try {
    let id = localStorage.getItem(ANON_ID_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(ANON_ID_KEY, id)
    }
    return id
  } catch {
    return 'unknown'
  }
}

export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  try {
    if (!isSupabaseConfigured) return
    void supabase.auth.getUser().then(({ data }) =>
      supabase
        .from('analytics_events')
        .insert({
          event,
          anon_id: getAnonId(),
          user_id: data.user?.id ?? null,
          props: props ?? null,
          url: (window.location.pathname + window.location.search).slice(0, 500),
        })
        .then(() => undefined)
    )
  } catch {
    // never let analytics throw
  }
}
