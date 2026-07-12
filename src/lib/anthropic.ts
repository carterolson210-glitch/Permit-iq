import { functionUrl, supabase } from './supabase'
import type { PermitAnalysis } from './types'

export type AnalyzeErrorCode =
  | 'auth'
  | 'validation'
  | 'rate_limit'
  | 'scan_limit'
  | 'ai_error'
  | 'network'
  | 'timeout'
  | 'unknown'

/** Metadata-only teaser returned with `scan_limit` errors (never full content). */
export interface ScanPreview {
  town: string
  permit_count: number
  commonly_missed_count: number
  permit_names: string[]
  timeline_estimate: string | null
}

export class AnalyzeError extends Error {
  code: AnalyzeErrorCode
  /** Present on scan_limit errors when the server produced a locked preview. */
  preview?: ScanPreview
  constructor(message: string, code: AnalyzeErrorCode, preview?: ScanPreview) {
    super(message)
    this.name = 'AnalyzeError'
    this.code = code
    this.preview = preview
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

  // AI analysis is slow but should never hang forever — cap at 2 minutes.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 120_000)
  let resp: Response
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new AnalyzeError(
        'The scan is taking longer than expected and timed out. Your inputs are still filled in below — please try again.',
        'timeout'
      )
    }
    throw new AnalyzeError(
      navigator.onLine === false
        ? 'You appear to be offline. Check your connection and try again — your inputs are saved below.'
        : 'Could not reach the scan service. Check your connection and try again — your inputs are saved below.',
      'network'
    )
  } finally {
    clearTimeout(timer)
  }

  const body = await resp.json().catch(() => ({}))
  if (!resp.ok) {
    const code = KNOWN_CODES.includes(body?.code) ? (body.code as AnalyzeErrorCode) : 'unknown'
    const preview =
      code === 'scan_limit' && body?.preview && typeof body.preview.permit_count === 'number'
        ? (body.preview as ScanPreview)
        : undefined
    throw new AnalyzeError(body?.error ?? 'Analysis failed. Please try again.', code, preview)
  }
  return {
    analysis: body.analysis as PermitAnalysis,
    scans_remaining: (body.scans_remaining ?? null) as number | null,
  }
}
