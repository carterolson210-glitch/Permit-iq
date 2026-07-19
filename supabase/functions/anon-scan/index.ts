// Supabase Edge Function: anon-scan
// Zero-friction activation: one full permit analysis BEFORE account
// creation. The analysis runs immediately and is stashed server-side; the
// caller gets back only a claim token + teaser metadata. Creating a free
// account "claims" the stashed report (consuming 1 of the 3 free scans),
// so anonymous traffic converts to an email at peak curiosity without ever
// giving away the full report.
//
// Deploy: `supabase functions deploy anon-scan --no-verify-jwt`
//   (create is unauthenticated by design; claim verifies the JWT manually)
// Secrets: OPENAI_API_KEY, APP_URL + platform-provided SUPABASE_*.
//
// Abuse bounds: no PDF uploads, 2 creates per IP per day, description
// capped, stashed reports expire after 7 days.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const MAX_DESCRIPTION_CHARS = 4000
const CREATES_PER_IP_PER_DAY = 2
const CLAIM_WINDOW_DAYS = 7

// Keep in sync with analyze-project/index.ts.
const OPENAI_MODEL = 'gpt-5.5'

// Keep in sync with analyze-project/index.ts (minus document handling).
const SYSTEM_PROMPT = `You are an expert Massachusetts building permit consultant with 20 years of experience helping contractors and homeowners navigate the Massachusetts building code (780 CMR), local zoning bylaws, and municipal permit processes across all 351 MA cities and towns.

When given a project description and location, provide a complete permit analysis in JSON format with these exact fields:

- project_summary: plain English 1-sentence summary of the project
- permits_required: array of permit objects, each with:
    name: permit name
    issuing_authority: which office issues it
    description: what it covers
    typical_fee_range: estimated cost
    typical_timeline: how long approval takes
    required_documents: array of documents needed
    notes: any important caveats
    source: { title, url } for the official municipal or mass.gov page/document this permit's details are based on, or null — include only URLs you are highly confident are real; null is always better than an invented link
- total_estimated_fees: { low: number, high: number }
- total_estimated_timeline: overall timeline
- checklist: ordered array of action items the applicant must complete, each with:
    step_number
    action
    details
    who_does_this (applicant/contractor/engineer/architect)
    estimated_time
- common_mistakes: array of 3-5 common mistakes people make on this type of permit in MA
- pro_tips: array of 3-5 tips to speed up approval
- town_specific_notes: anything specific to this town's known requirements or quirks
- disclaimer: standard disclaimer text
- confidence: "high" | "medium" | "low" — your honest confidence that the town-specific details (fees, department names, thresholds) are current and correct for this specific town.
- sources: array of { title, url } for the public sources the town-specific details are based on. Include only URLs you are highly confident are real; an empty array is better than an invented link.

Always be specific to Massachusetts law (780 CMR 8th Edition) and note when local bylaws may vary. Never give legal advice — always recommend verifying with the local building department.

Return ONLY valid JSON, no markdown code fences, no preamble.`

function corsHeaders(req: Request): Record<string, string> {
  const appUrl = Deno.env.get('APP_URL')
  const origin = req.headers.get('origin') ?? ''
  const allowed = new Set(
    [appUrl, 'http://localhost:5173', 'http://localhost:4173'].filter(Boolean)
  )
  return {
    'Access-Control-Allow-Origin': allowed.has(origin) ? origin : (appUrl ?? '*'),
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

async function sha256Hex(s: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function parseAnalysis(text: string): Record<string, unknown> | null {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  }
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first === -1 || last === -1) return null
  try {
    const obj = JSON.parse(cleaned.slice(first, last + 1))
    if (
      typeof obj !== 'object' || obj === null ||
      !Array.isArray(obj.permits_required) || !Array.isArray(obj.checklist)
    ) {
      return null
    }
    return obj
  } catch {
    return null
  }
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors)

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!apiKey || !supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: 'Server not configured' }, 500, cors)
  }
  const admin = createClient(supabaseUrl, serviceKey)

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return json({ error: 'Invalid JSON body', code: 'validation' }, 400, cors)
  }

  // ── claim: signed-in user redeems a stashed anonymous report ──
  if (body.action === 'claim') {
    const authed = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('authorization') ?? '' } },
    })
    const {
      data: { user },
    } = await authed.auth.getUser()
    if (!user) return json({ error: 'Not signed in', code: 'auth' }, 401, cors)

    const token = typeof body.token === 'string' ? body.token : ''
    if (!/^[0-9a-f-]{36}$/.test(token)) {
      return json({ error: 'Invalid token', code: 'validation' }, 400, cors)
    }
    const freshCutoff = new Date(
      Date.now() - CLAIM_WINDOW_DAYS * 24 * 3600_000
    ).toISOString()
    const { data: row } = await admin
      .from('anon_scans')
      .select('id, town, category, analysis, claimed_by, created_at')
      .eq('token', token)
      .gte('created_at', freshCutoff)
      .maybeSingle()
    if (!row) {
      return json(
        { error: 'That report has expired — run a fresh scan (it’s free).', code: 'expired' },
        410, cors
      )
    }
    if (row.claimed_by && row.claimed_by !== user.id) {
      return json({ error: 'Report already claimed.', code: 'expired' }, 410, cors)
    }

    if (!row.claimed_by) {
      // First claim consumes one free scan, atomically.
      const { data: reservation, error: reserveError } = await admin.rpc('reserve_scan', {
        p_user_id: user.id,
        p_town: row.town,
        p_category: row.category,
      })
      if (reserveError || !reservation) {
        console.error('reserve_scan failed:', reserveError)
        return json({ error: 'Unexpected error' }, 500, cors)
      }
      if (!reservation.allowed) {
        return json(
          { error: 'You have used all 3 free scans. Upgrade to continue.', code: 'scan_limit' },
          402, cors
        )
      }
      await admin.rpc('finish_scan', { p_event_id: reservation.event_id, p_status: 'succeeded' })
      await admin
        .from('anon_scans')
        .update({ claimed_by: user.id, claimed_at: new Date().toISOString() })
        .eq('id', row.id)
      return json(
        { analysis: row.analysis, town: row.town, scans_remaining: reservation.remaining ?? null },
        200, cors
      )
    }
    // Re-claim by the same user (e.g. refresh): no extra scan consumed.
    return json({ analysis: row.analysis, town: row.town, scans_remaining: null }, 200, cors)
  }

  // ── create: anonymous full analysis, stashed behind a token ──
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const town = typeof body.town === 'string' ? body.town.trim() : ''
  const category = typeof body.category === 'string' ? body.category.trim().slice(0, 60) : ''
  if (description.length < 10 || description.length > MAX_DESCRIPTION_CHARS) {
    return json(
      { error: `Description must be 10–${MAX_DESCRIPTION_CHARS} characters.`, code: 'validation' },
      400, cors
    )
  }
  if (!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(town)) {
    return json({ error: 'Invalid town name.', code: 'validation' }, 400, cors)
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('cf-connecting-ip') ??
    'unknown'
  const ipHash = await sha256Hex(`piq-anon:${ip}`)
  const dayAgo = new Date(Date.now() - 24 * 3600_000).toISOString()
  const { count } = await admin
    .from('anon_scans')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', dayAgo)
  if ((count ?? 0) >= CREATES_PER_IP_PER_DAY) {
    return json(
      {
        error: 'Free anonymous scan already used — create a free account for 3 more scans.',
        code: 'anon_limit',
      },
      429, cors
    )
  }

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_completion_tokens: 16000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content:
              `Project description: ${description}\nTown: ${town}, Massachusetts\n` +
              (category ? `Category: ${category}\n` : '') +
              '\nProvide a complete permit analysis as JSON only.',
          },
        ],
      }),
    })
    if (!resp.ok) {
      console.error('OpenAI error:', resp.status, await resp.text())
      throw new Error('ai_error')
    }
    const data = await resp.json()
    const choice = data?.choices?.[0]
    if (choice?.finish_reason === 'length') throw new Error('ai_error')
    const parsed = parseAnalysis(choice?.message?.content ?? '')
    if (!parsed) throw new Error('ai_error')

    const { data: inserted, error: insertError } = await admin
      .from('anon_scans')
      .insert({ ip_hash: ipHash, town, category: category || null, description, analysis: parsed })
      .select('token')
      .single()
    if (insertError || !inserted) {
      console.error('anon_scans insert failed:', insertError)
      throw new Error('ai_error')
    }

    const permits = parsed.permits_required as unknown[]
    return json(
      {
        token: inserted.token,
        preview: {
          town,
          permit_count: permits.length,
          permit_names: permits
            .slice(0, 5)
            .map((p) => String((p as { name?: unknown })?.name ?? '').slice(0, 60))
            .filter(Boolean),
          commonly_missed_count: Math.min(
            Array.isArray(parsed.common_mistakes) ? parsed.common_mistakes.length : 0,
            3
          ),
          timeline_estimate:
            typeof parsed.total_estimated_timeline === 'string'
              ? parsed.total_estimated_timeline.slice(0, 60)
              : null,
        },
      },
      200, cors
    )
  } catch (err) {
    console.error(err)
    return json(
      { error: 'Analysis failed — please try again.', code: 'ai_error' },
      502, cors
    )
  }
})

function json(payload: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', ...cors },
  })
}
