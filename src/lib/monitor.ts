import { supabase, isSupabaseConfigured } from './supabase'

// Lightweight client-side error reporting into the `client_events` table
// (insert-only RLS; read it from the Supabase dashboard / SQL editor).
// Fire-and-forget: reporting must never break the app or spam the table.

const MAX_REPORTS_PER_SESSION = 20
let reported = 0
const seen = new Set<string>()

export function logClientError(source: string, err: unknown): void {
  try {
    if (!isSupabaseConfigured) return
    if (reported >= MAX_REPORTS_PER_SESSION) return

    const message =
      err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err)
    const stack = err instanceof Error ? (err.stack ?? null) : null

    // one report per unique message per session
    const key = `${source}:${message}`
    if (seen.has(key)) return
    seen.add(key)
    reported += 1

    void supabase.auth.getUser().then(({ data }) =>
      supabase
        .from('client_events')
        .insert({
          kind: source.slice(0, 40),
          message: message.slice(0, 2000),
          detail: stack ? { stack: stack.slice(0, 2000) } : null,
          url: (window.location.pathname + window.location.search).slice(0, 500),
          ua: navigator.userAgent.slice(0, 300),
          user_id: data.user?.id ?? null,
        })
        .then(() => undefined)
    )
  } catch {
    // never let telemetry throw
  }
}

let installed = false

/** Global handlers for uncaught errors and unhandled promise rejections. */
export function installErrorReporting(): void {
  if (installed) return
  installed = true
  window.addEventListener('error', (e) => {
    logClientError('window.onerror', e.error ?? e.message)
  })
  window.addEventListener('unhandledrejection', (e) => {
    logClientError('unhandledrejection', e.reason)
  })
}
