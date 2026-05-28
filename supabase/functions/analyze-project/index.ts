// Supabase Edge Function: analyze-project
// Calls Anthropic Claude to produce a permit analysis.
// Deploy: `supabase functions deploy analyze-project --no-verify-jwt`
// Set secret: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

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

Always be specific to Massachusetts law (780 CMR 8th Edition) and note when local bylaws may vary. Never give legal advice — always recommend verifying with the local building department.

Return ONLY valid JSON, no markdown code fences, no preamble.`

interface AnalyzeRequest {
  description: string
  town: string
  category?: string
  square_footage?: number
  project_value?: number
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return json({ error: 'Server not configured' }, 500)
    }

    const body = (await req.json()) as AnalyzeRequest
    if (!body?.description || !body?.town) {
      return json({ error: 'description and town are required' }, 400)
    }

    const userMessage = `Project description: ${body.description}
Town: ${body.town}, Massachusetts
${body.category ? `Category: ${body.category}` : ''}
${body.square_footage ? `Square footage: ${body.square_footage}` : ''}
${body.project_value ? `Estimated project value: $${body.project_value}` : ''}

Provide a complete permit analysis as JSON only.`

    const anthropicResponse = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        }),
      }
    )

    if (!anthropicResponse.ok) {
      const text = await anthropicResponse.text()
      console.error('Anthropic error:', text)
      return json({ error: 'AI service error' }, 502)
    }

    const data = await anthropicResponse.json()
    const textBlock = data?.content?.find((c: { type: string }) => c.type === 'text')
    const raw = textBlock?.text ?? ''

    let parsed: unknown
    try {
      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()
      parsed = JSON.parse(cleaned)
    } catch (e) {
      console.error('Failed to parse JSON from model:', raw)
      return json({ error: 'AI returned malformed output' }, 502)
    }

    return json({ analysis: parsed }, 200)
  } catch (err) {
    console.error(err)
    return json({ error: 'Unexpected error' }, 500)
  }
})

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders },
  })
}
