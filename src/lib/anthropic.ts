import { functionUrl, supabase } from './supabase'
import type { PermitAnalysis } from './types'

export type AnalyzeErrorCode =
  | 'auth'
  | 'validation'
  | 'rate_limit'
  | 'scan_limit'
  | 'ai_error'
  | 'unknown'

export class AnalyzeError extends Error {
  code: AnalyzeErrorCode
  constructor(message: string, code: AnalyzeErrorCode) {
    super(message)
    this.name = 'AnalyzeError'
    this.code = code
  }
}

export interface AnalyzeInput {
  description: string
  town: string
  category?: string
  square_footage?: number
  project_value?: number
  document?: {
    name: string
    data_base64: string
  }
}

export interface AnalyzeResult {
  analysis: PermitAnalysis
  /** Free scans left after this one; null for unlimited (paid) plans. */
  scans_remaining: number | null
}

const KNOWN_CODES: readonly AnalyzeErrorCode[] = [
  'auth',
  'validation',
  'rate_limit',
  'scan_limit',
  'ai_error',
]

export async function analyzeProject(input: AnalyzeInput): Promise<AnalyzeResult> {
  const url = functionUrl('analyze-project')
  if (!url) throw new AnalyzeError('Supabase is not configured.', 'unknown')

  const { data: session } = await supabase.auth.getSession()
  const token = session.session?.access_token
  if (!token) throw new AnalyzeError('Your session has expired. Please sign in again.', 'auth')

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
    },
    body: JSON.stringify(input),
  })

  const body = await resp.json().catch(() => ({}))
  if (!resp.ok) {
    const code = KNOWN_CODES.includes(body?.code) ? (body.code as AnalyzeErrorCode) : 'unknown'
    throw new AnalyzeError(body?.error ?? 'Analysis failed. Please try again.', code)
  }
  return {
    analysis: body.analysis as PermitAnalysis,
    scans_remaining: (body.scans_remaining ?? null) as number | null,
  }
}
