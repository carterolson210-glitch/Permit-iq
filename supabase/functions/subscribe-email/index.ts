// Supabase Edge Function: subscribe-email
// Adds an email to the email_subscribers table and triggers the Resend
// welcome sequence (sends Day 0 immediately; later emails should be sent
// by a scheduled function or Resend audience).
// Deploy: `supabase functions deploy subscribe-email --no-verify-jwt`
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders })

  try {
    const { email, source } = await req.json()
    if (!email || typeof email !== 'string') {
      return json({ error: 'email required' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    await supabase
      .from('email_subscribers')
      .upsert(
        { email, source: source ?? 'exit_intent' },
        { onConflict: 'email' }
      )

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'PermitIQ <hello@permitiq.app>',
          to: email,
          subject: 'Your free MA Permit Checklist',
          html: welcomeHtml(),
        }),
      })
    }
    return json({ ok: true }, 200)
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

function welcomeHtml() {
  return `
  <div style="font-family:Inter,system-ui,sans-serif;line-height:1.5;color:#0f172a">
    <h1 style="color:#1e40af">Your free MA Permit Checklist</h1>
    <p>Thanks for grabbing the PermitIQ Massachusetts Permit Checklist.</p>
    <p>Open it here: <a href="https://permitiq.app/checklist.pdf">Download PDF</a></p>
    <p>Need help with a specific project?</p>
    <p><a href="https://permitiq.app/analyze" style="background:#1e40af;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">Analyze my project →</a></p>
  </div>`
}
