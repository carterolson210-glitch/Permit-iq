// Supabase Edge Function: re-engagement-email
// Scheduled job, NOT called from the client: emails free-tier users who
// started a scan but went quiet before using all 3 free scans, nudging
// them back. Needs an external trigger on a schedule — e.g. a pg_cron job
// (select cron.schedule(...) calling this via pg_net) or a GitHub Actions /
// Vercel Cron hitting this URL with the CRON_SECRET bearer token. Not
// publicly callable: it reads emails and sends mail, gated by CRON_SECRET.
//
// Deploy: `supabase functions deploy re-engagement-email --no-verify-jwt`
// Secrets: CRON_SECRET, RESEND_API_KEY, APP_URL, plus platform-provided
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const INACTIVE_DAYS = 14
const RESEND_COOLDOWN_DAYS = 30
const BATCH_LIMIT = 200

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const cronSecret = Deno.env.get('CRON_SECRET')
  const auth = req.headers.get('authorization') ?? ''
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const resendKey = Deno.env.get('RESEND_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const appUrl = Deno.env.get('APP_URL') ?? 'https://permit-iq-rho.vercel.app'
  if (!resendKey || !supabaseUrl || !serviceKey) {
    return new Response('Server not configured', { status: 500 })
  }
  const admin = createClient(supabaseUrl, serviceKey)

  const inactiveCutoff = new Date(Date.now() - INACTIVE_DAYS * 24 * 3600_000).toISOString()
  const cooldownCutoff = new Date(Date.now() - RESEND_COOLDOWN_DAYS * 24 * 3600_000).toISOString()

  // Free users who've used 1-2 of their 3 scans (zero scans is better
  // served by a "you have free scans waiting" welcome nudge, not a
  // re-engagement one; all 3 used means they've already seen the paywall),
  // signed up a while ago, and haven't had this email in the cooldown window.
  const { data: candidates, error } = await admin
    .from('users')
    .select('id, email, free_analyses_used, created_at')
    .eq('plan', 'free')
    .gt('free_analyses_used', 0)
    .lt('free_analyses_used', 3)
    .lt('created_at', inactiveCutoff)
    .or(`last_reengagement_sent_at.is.null,last_reengagement_sent_at.lt.${cooldownCutoff}`)
    .limit(BATCH_LIMIT)

  if (error) {
    console.error('candidate query failed:', error)
    return new Response('Query failed', { status: 500 })
  }

  let sent = 0
  for (const user of candidates ?? []) {
    // Not expressible as a single filter above (no matching row within
    // the window) — check per-candidate and skip anyone still active.
    const { count } = await admin
      .from('scan_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', inactiveCutoff)
    if ((count ?? 0) > 0) continue
    if (!user.email) continue

    const remaining = 3 - (user.free_analyses_used ?? 0)
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'PermitIQ <hello@permitiq.app>',
          to: user.email,
          subject: `You still have ${remaining} free permit scan${remaining === 1 ? '' : 's'} on PermitIQ`,
          html: `<p>You started checking permit requirements on PermitIQ but haven't finished.</p>
<p>You still have <strong>${remaining} free scan${remaining === 1 ? '' : 's'}</strong> waiting — pick up where you left off.</p>
<p><a href="${appUrl}/analyze" style="background:#1e40af;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">Finish my permit check →</a></p>`,
        }),
      })
      await admin
        .from('users')
        .update({ last_reengagement_sent_at: new Date().toISOString() })
        .eq('id', user.id)
      sent++
    } catch (err) {
      console.error('send failed for', user.id, err)
    }
  }

  return new Response(JSON.stringify({ sent, candidates: candidates?.length ?? 0 }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
})
