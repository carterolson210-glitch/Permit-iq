import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anon) {
  // Don't throw — let the UI surface a friendly state when unset locally.
  console.warn(
    '[PermitIQ] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set. Auth and persistence are disabled.'
  )
}

export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anon ?? 'placeholder'
)

export const isSupabaseConfigured = Boolean(url && anon)

export function functionUrl(name: string): string {
  if (!url) return ''
  return `${url}/functions/v1/${name}`
}
