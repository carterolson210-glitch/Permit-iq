import { functionUrl, supabase } from './supabase'
import type { PermitAnalysis } from './types'

export interface AnalyzeInput {
  description: string
  town: string
  category?: string
  square_footage?: number
  project_value?: number
}

export async function analyzeProject(
  input: AnalyzeInput
): Promise<PermitAnalysis> {
  const url = functionUrl('analyze-project')
  if (!url) throw new Error('Supabase is not configured.')

  const { data: session } = await supabase.auth.getSession()
  const token = session.session?.access_token

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
    },
    body: JSON.stringify(input),
  })

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}))
    throw new Error(body?.error ?? 'Analysis failed. Please try again.')
  }
  const json = (await resp.json()) as { analysis: PermitAnalysis }
  return json.analysis
}
