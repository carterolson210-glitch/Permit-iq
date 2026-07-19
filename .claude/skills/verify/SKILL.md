---
name: verify
description: Build, launch, and drive PermitIQ (Vite + React SPA) to verify changes at the browser surface.
---

# Verifying PermitIQ

## Build / launch

- `npm run build` — runs `tsc -b` then vite build (typecheck included).
- `npm run dev` — Vite dev server on http://localhost:5173 (run in background).
- Real Supabase URL + anon key are in `.env.local`, so auth/network paths hit
  the live project `epuxbohyvkjodflikeby`.

## Driving the UI

No Playwright in the repo. Recipe that works: `npm i playwright-core` in the
session scratchpad and launch system Chrome:
`chromium.launch({ channel: 'chrome', headless: true })`.

## Auth-gated routes (/analyze, /checkout)

- Supabase signup requires email confirmation — you cannot mint a real session.
- Client-side gate (`RequireAuth` reads `supabase.auth.getSession()` +
  `onAuthStateChange`) accepts an injected fake session: before page load, set
  localStorage key `sb-epuxbohyvkjodflikeby-auth-token` to a session JSON with
  a fake three-part JWT (`expires_at` far future). Server calls will 401 —
  fine for driving UI states, not for exercising edge functions.

## Gotchas

- Edge functions are deployed but Stripe secrets may be unset — the
  `stripe-checkout` function then returns
  `{"error":"Billing is not configured on the server yet."}` (500).
- `vercel.json` headers (CSP, Permissions-Policy) do NOT apply on the Vite
  dev server — header changes can only be observed on a Vercel deploy.

## Flows worth driving

- `/pricing` → plan buttons → `/checkout?plan=…&billing=…` (signed out:
  bounces to `/login?next=…`).
- `/checkout` billing toggle rewrites the URL and re-creates the session;
  invalid `plan` param bounces to `/pricing`.
