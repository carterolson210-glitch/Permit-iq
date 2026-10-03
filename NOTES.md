# PermitIQ — Audit & Phase Plan

_Written 2026-10-02, Phase 0 (no code changes)._

## Correction to the brief's framing

The brief describes this as "a Next.js website" with "AI: Grok via the xAI
API through an OpenAI-SDK-compatible Next.js route." That's not what's in
this repo. Actual stack:

- **Vite 5 + React 18 + React Router 6 — a client-side SPA**, not Next.js.
  No server, no API routes. Confirmed via `package.json` (`vite`, no `next`
  dependency) and `vite.config.ts`.
- **Backend = Supabase**: Postgres (`supabase/schema.sql`) + 6 Deno **Edge
  Functions** (`supabase/functions/*`) stand in for what a Next.js API layer
  would do. Auth is Supabase Auth.
- **AI provider = OpenAI** (`gpt-5.5`, preview teaser `gpt-5.4-mini`), called
  directly from the edge functions via `fetch`. Not Grok/xAI, and not an
  "OpenAI-SDK-compatible route" — there's no SDK, just raw `fetch` to
  `api.openai.com`. `SETUP.md` shows the provider has been swapped three
  times (Anthropic → OpenAI → xAI → OpenAI) at the user's direction; OpenAI
  is current and funded as of the last entry. I have **not** changed this —
  just documenting ground truth. `src/lib/anthropic.ts` is a leftover
  filename from an earlier provider; it's actually the generic edge-function
  client (not Anthropic-specific) — harmless but worth renaming to
  `src/lib/analyze.ts` someday.

Everything below describes what's **actually in the repo**, not the brief's
assumptions.

## The big surprise: most of this brief is already built

`DECISIONS.md` shows a prior session already executed something very close
to this brief's Phases 1–4 (it literally has sections titled "Phase 1 —
Pricing & Stripe," "Phase 2 — Conversion paywall," "Phase 3 — Trust
infrastructure"). My own memory of this project was stale and didn't reflect
this. Re-doing that work from scratch would be wasteful and risks regressing
something that already works. The phase plan at the bottom reflects **what's
missing**, not a restart.

## Routes (`src/App.tsx`, React Router)

| Path | Auth | Purpose |
|---|---|---|
| `/` | public | Landing (3D/2D scroll hero, pricing cards, FAQ) |
| `/analyze` | public* | Scan flow — anonymous first scan allowed |
| `/pricing` | public | Full pricing/comparison/FAQ page |
| `/checkout` | required | Embedded Stripe checkout |
| `/projects`, `/projects/:id` | required | Saved scans (paid only, gated in-page) |
| `/permits/:slug` | public | SEO town page |
| `/how-we-verify` | public | Trust/methodology page |
| `/login`, `/reset-password` | public | Auth |
| `/privacy`, `/terms` | public | Legal |
| `*` | — | redirects to `/` |

No `/coverage` page — the Massachusetts coverage map (`CoverageMap.tsx`)
exists only as a component embedded inside `/permits/:slug`, not a
standalone page.

## Scan flow & free-scan enforcement

**Already server-enforced, already hard to bypass via localStorage/cookies.**

- Anonymous visitor → `anon-scan` edge function (`action` unset) runs a full
  OpenAI analysis immediately, stashes it in `public.anon_scans` keyed by a
  random `token`, returns only a metadata teaser (permit count, names,
  timeline) — never the full report. Rate-limited to 2 creates/IP/day via a
  SHA-256 IP hash (`anon_scans.ip_hash`), no raw IP stored.
- Signing up/in redeems the token via `anon-scan` (`action: 'claim'`), which
  calls the `reserve_scan` Postgres RPC — this is the actual enforcement
  point, not the client. `reserve_scan` is `security definer`, revoked from
  `anon`/`authenticated`, callable only with the service-role key from inside
  an edge function.
- `reserve_scan(user_id, town, category, ip_hash)` (schema.sql:281): row-locks
  the user, lets paid+unexpired (or in-grace) accounts scan unlimited, caps
  free accounts at 3 lifetime (`free_analyses_used`), and additionally caps
  free scans at 9/IP/24h (`scan_events.ip_hash`) to blunt disposable-account
  farming. Returns `{allowed, event_id, remaining}`.
- `analyze-project` (authenticated path) and `anon-scan` (claim path) both
  call `reserve_scan` → OpenAI → `finish_scan`('succeeded') on success or
  `refund_scan` on any failure, so a failed/timed-out scan never costs the
  user a credit. Also rate-limited to 10 scan attempts/hour/user
  (`analyze-project` only).
- **Conclusion: this already satisfies Phase 1's "enforce 3-free-scan limit
  server-side, not bypassable via localStorage" requirement.** Nothing to
  build here. The only gap: the per-IP cap hashes IP only, no device
  fingerprint — multiple accounts behind the same IP are capped at 9 free
  scans/day combined, which the brief's "IP/device fingerprint" phrasing
  anticipated as a stronger measure, but what's here is a reasonable,
  already-shipped tradeoff. Not treating this as broken.

## Stripe — checkout, webhooks, portal

**Also already built**, including several things the brief asks for as new
work:

- `stripe-checkout`: embedded Checkout (`ui_mode: embedded`,
  `redirect_on_completion: never`), identity from the JWT (not client body),
  price ID resolved **server-side** from `STRIPE_PRICE_{PLAN}_{BILLING}`
  secrets — client can't tamper with price. Reuses existing Stripe customer
  if present.
- `stripe-webhook` handles `checkout.session.completed`,
  `customer.subscription.updated`, `customer.subscription.deleted`,
  `invoice.payment_failed` — all four the brief asks for. Signature
  verification is manual HMAC-SHA256 over `t.payload` with a 300s replay
  window (no Stripe SDK dependency, since Deno edge — correct approach,
  verified against Stripe's documented scheme). Idempotency: handlers are
  `UPDATE ... WHERE stripe_customer_id = X`, naturally idempotent on replay;
  grace-period start explicitly avoids re-extending an already-running
  window on repeated `payment_failed` retries.
- **7-day grace period** on failed payment (`users.grace_until`), surfaced by
  `GraceBanner.tsx` (sticky amber banner → Stripe portal). `reserve_scan` and
  client `isPaid` both treat unexpired grace as paid.
- `stripe-portal`: Stripe-hosted customer portal (manage/cancel/update card)
  — Phase 1's "add the Stripe customer portal" is done.
- **Annual billing already exists** for both Pro and Contractor
  (`STRIPE_PRICE_*_ANNUAL` secrets, `annualSavingsLabel()` = 2 months free,
  `BillingToggle` component) — Phase 1's "add an annual plan" is done.
- Entitlements (`plan`, `subscription_status`, `grace_until`,
  `plan_expires_at`) live only in `public.users`, written only by the
  webhook (service role) or by `reserve_scan`'s own RPC — never by client
  writes. `isPaid`/`tier` in `src/lib/auth.tsx` are pure derivations of that
  server state. This matches "entitlements come from the database, synced
  by webhooks" exactly.

**What Stripe setup still needs manually** (can't be done from code):
creating live-mode products/prices, a live webhook endpoint, and swapping
the six `STRIPE_*` secrets from test to live values — see `SETUP.md`. Also
Supabase free tier auto-pauses after ~1 week idle; may need restoring via
the Management API before any of this works live.

## Paywall & conversion (Phase 2 of the brief)

Also already built:

- Paywall triggers exactly at "value moment": free scan #4 attempt runs a
  **separate, cheap** metadata-only OpenAI call (`gpt-5.4-mini`, 400 output
  tokens) and returns a locked preview (permit count, names blurred, teaser
  timeline) instead of a dead end (`analyze-project/index.ts:313-393`,
  rendered by `Paywall.tsx` and `Analyze.tsx`'s `AnonLockedPreview`).
  Rate-limited to 3 previews/user/day so it can't be used to farm free AI
  calls.
- `/pricing` is a real Free/Pro/Contractor comparison page with FAQ +
  `FAQPage` JSON-LD + annual/monthly toggle.
- Exit-intent email capture already exists (`ExitIntentModal.tsx`, pricing
  page only, desktop + `pointer:fine` + ≥768px, once per browser via
  localStorage) and already gives a real lead magnet — a generated PDF at
  `/ma-permit-mistakes-checklist.pdf` — storing emails in
  `email_subscribers` with `source: 'exit_intent_pricing'`.
- **Gap vs. the brief**: Contractor tier has **no real differentiator from
  Pro today.** `plans.ts` lists "Multi-project dashboard," "5 team seats,"
  and "Client-shareable branded reports" for Contractor, but all three are
  labeled "(coming soon)" in the UI, and `/projects` is gated on `isPaid`
  generically — a Pro subscriber gets the exact same saved-projects page as
  a Contractor subscriber. Paying $79 gets you nothing $29 doesn't today.
  This is the single biggest conversion-integrity problem I'd prioritize.

## Trust & citations (Phase 4 of the brief)

Also already built, close to spec:

- 30 of 351 towns hand-verified (`src/data/townPermits.ts`,
  `VERIFIED_TOWN_COUNT`), each fact carrying its own `sourceUrl` +
  `verifiedAt` (per-fact, stronger than per-town). `/permits/:slug` renders
  them with live source links and verification dates.
  `/how-we-verify` explains the methodology.
- AI-researched (unverified-town) results are honestly labeled: `TrustPanel`
  shows a confidence badge, "AI-researched — verify before filing" when no
  hand-verified profile exists, and the model is instructed to return `null`
  sources rather than invent URLs (both edge functions' system prompts).
- **Gap**: no "report an error" link anywhere (grepped — doesn't exist).
  Brief asks for this explicitly on results.
- **Gap**: the import format for adding more towns fast is just... hand-
  editing the `TOWN_PROFILES` TS array. Works, but there's no documented
  schema/script for a faster add — low priority, not blocking revenue.

## SEO town pages (Phase 5 of the brief) — partially built

- `/permits/:slug` exists and resolves **any of the 351 MA towns**
  (`MA_TOWNS` in `src/data/towns.ts`), not just the 30 verified ones —
  unverified towns get an honest "we haven't verified this yet" message
  but still render a full page.
- Per-page `<title>`/`<meta description>` set dynamically (`setMeta()`), and
  the verified-town flavor is fairly rich (department contact, sources,
  penalty info, internal links to other verified towns, inline coverage
  map).
- **Real gaps**: no `sitemap.xml`, no `robots.txt`, no canonical `<link>`
  tags, no per-town JSON-LD (only `/pricing`'s FAQPage schema exists — no
  `HowTo`/`FAQPage` on town pages). No `noindex` handling — **this
  contradicts the brief's explicit instruction** to keep thin AI-only pages
  out of the index; right now all 351 town pages are fully indexable
  regardless of verification status. No standalone coverage-map page (only
  the embedded component). This is genuinely unstarted work and is the
  clearest high-leverage gap for organic growth.

## Retention (Phase 6 of the brief) — partially built

- Saved projects: real, working, RLS-protected (`projects`,
  `checklist_items`, `documents`, `activity_log` tables all exist with
  owner-only policies), gated on `isPaid`. `Analyze.tsx` auto-saves every
  completed scan for paid users; `/projects` and `/projects/:id` render
  history (`ProjectDetail` reuses `Analyze.tsx`'s `Results` component —
  good reuse, not a gap).
- `checklist_items`/`documents`/`activity_log` tables exist in schema but
  **nothing in the app writes to them** — `Results` tracks checklist
  progress in local React state (`checked` Set), never persisted to
  `checklist_items`. So "checklist progress" doesn't actually survive a
  reload today even though the DB table is there. Worth closing — it's a
  small gap (wire the existing checkbox toggle to an upsert) with real
  retention value.
- Referrals: schema + webhook-side conversion tracking exist
  (`referrals` table, marked `converted: true` on
  `checkout.session.completed`), but I found no UI anywhere that generates
  or shows a referral link/code to the user. `users.referral_code` is
  generated on signup and then never surfaced. Half-built.
- Welcome email: exists, but only on the **exit-intent/subscribe-email**
  path (`subscribe-email` edge function), not on actual account signup —
  there's no "Day 0" email when someone creates a real PermitIQ account,
  only when they grab the lead-magnet PDF. `users.welcomed_at` column
  exists in schema but nothing sets it — dead column.
- **Bug found in passing**: `subscribe-email`'s welcome email links to
  `https://permitiq.app/checklist.pdf`, which is wrong on two counts — the
  real asset is `/ma-permit-mistakes-checklist.pdf`, and `permitiq.app`
  isn't a domain that's actually been set up (live URLs are the two Vercel
  `.vercel.app` domains per `SETUP.md`). This email currently sends a dead
  link. Will fix in the retention phase.
- **Missing entirely**: payment-failed email (grace period has an in-app
  banner only, no email — a user who doesn't log in during the 7-day grace
  window gets no warning), re-engagement email, and shareable branded
  contractor report links (public token URL) — all marked "coming soon" in
  the UI and genuinely not started.

## Funnel analytics (Phase 1 ask) — not started

Confirmed via grep: no PostHog/Plausible/GA, no `landing_view` /
`scan_started` / `paywall_shown` / `checkout_started` / etc. anywhere.
`src/lib/monitor.ts` only does **error** reporting (uncaught exceptions →
`client_events` table), not funnel/product events. This is real, unstarted
work — and my stack-decisions memory says "no analytics for now, no cookie
banner" was an explicit earlier decision. Adding funnel analytics now is a
direct ask of this brief, so I'll proceed, but I'll pick an approach that
doesn't need a cookie banner (first-party events into Supabase, reusing the
existing `client_events`-style insert-only table pattern, rather than
pulling in a third-party script) unless told otherwise.

## Data model (`supabase/schema.sql`)

`users` (mirrors `auth.users`, billing/plan fields), `projects`,
`checklist_items`, `documents`, `activity_log`, `email_subscribers`,
`referrals`, `scan_events` (rate-limiting + audit trail), `anon_scans`
(pre-signup stash), `client_errors` + `client_events` (telemetry),
`scan_stats()` (public aggregate RPC for the homepage counter). RLS is on
everywhere; owner-only policies via `auth.uid()`; the free-scan RPCs are
`security definer` and explicitly revoked from `anon`/`authenticated`. File
is written to be fully idempotent (`create ... if not exists`,
`drop policy if exists` before every `create policy`) — confirmed this
pattern is followed throughout, so re-running the whole file after edits is
safe, per `SETUP.md`'s own note.

## What's broken or half-built (summary)

1. Contractor tier has zero real differentiation from Pro (all three promised
   perks are "coming soon").
2. No SEO infra: no sitemap, robots.txt, per-town JSON-LD, canonical tags, or
   noindex for unverified towns (currently all 351 are indexable) — biggest
   gap for organic growth.
3. No funnel analytics at all.
4. No shareable/branded public report links.
5. Checklist progress isn't persisted (table exists, nothing writes to it).
6. Referral codes are generated but never surfaced to users.
7. No "report an error" link on results.
8. Dead/wrong welcome-email link (`permitiq.app/checklist.pdf`); no email on
   payment failure or for re-engagement; `welcomed_at` column unused.
9. Two pre-existing ESLint errors (`react-refresh/only-export-components` in
   `SocialProof.tsx` and `home3d/Hero3D.tsx`) — not build-breaking, but lint
   isn't currently green. Will fix as a small part of Phase 1 so every phase
   from here on starts from an actually-green baseline.
10. `src/lib/anthropic.ts` is a misleading leftover name from a past provider
    swap (it's provider-agnostic now, calls OpenAI via edge functions) —
    cosmetic, low priority.
11. Homepage 3D hero chunk is 1.03 MB / 299 KB gzipped (lazy-loaded, not LCP,
    but worth a manualChunks pass eventually per my own earlier notes).

## Env vars required

Frontend (`.env.local` + Vercel project env), all already documented in
`.env.example`/`SETUP.md`:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`.

Server-only (Supabase Edge Function secrets, never in Vite env):
`OPENAI_API_KEY`, `APP_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_ANNUAL`,
`STRIPE_PRICE_CONTRACTOR_MONTHLY`, `STRIPE_PRICE_CONTRACTOR_ANNUAL`,
`RESEND_API_KEY` (optional — emails silently skip without it),
`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_URL` (platform-provided). No new env
vars needed for anything in this audit; new ones will be added here and to
`.env.example` if a later phase needs them (e.g. an analytics write key, if
I end up needing one — current plan avoids that).

## Revised phase plan

Given how much of the original brief is already live, re-running Phases
1–4 from scratch would be wasted work and risks regressing a working Stripe
integration. Adjusted plan, same numbering as the brief where it still
applies:

- **Phase 1 (trimmed)**: fix the 2 pre-existing lint errors so the repo
  starts green; otherwise Phase 1 is complete — verify, don't rebuild.
  Add funnel analytics events (the one real unfinished piece of Phase 1).
- **Phase 2 (trimmed)**: give Contractor a real, enforced differentiator
  (multi-project dashboard framing + a first cut of shareable branded report
  links, moving that off "coming soon"). Paywall/pricing copy already
  converts-first; skip rebuilding it.
- **Phase 3**: skip. Already rebuilt (3D scroll homepage with real hero,
  5-second clarity, lazy 3D, `prefers-reduced-motion` respected) — confirmed
  in my own prior-session notes and the current git log.
- **Phase 4 (trimmed)**: add the "report an error" link; everything else
  (citations, verified-town data, disclaimers) already meets spec.
- **Phase 5 (full)**: build as specified — this is the biggest real gap.
  Sitemap, robots.txt, per-town JSON-LD, noindex + email-capture for
  unverified towns, standalone coverage-map page.
- **Phase 6 (full)**: build as specified, prioritizing: wire checklist
  persistence (cheap, high retention value), fix the dead welcome-email
  link, add payment-failed + re-engagement emails, surface referral codes,
  ship shareable branded report links (ties into Phase 2's Contractor gap).

I'll keep going in this order and commit after each phase per the original
instructions.
