# Decisions log

Running log of non-obvious decisions made while building the revenue engine,
newest last. Flag anything here you want changed.

## Phase 1 — Pricing & Stripe

1. **Plan naming**: the spec's "Pro" tier is stored as plan value `pro`. The
   database previously allowed `homeowner`/`firm`; those stay *valid* (so old
   rows never break) but are no longer sold, and the app gates them as
   pro/contractor respectively. Landing page's old $19/$49/$99 pricing is
   replaced everywhere by Free / Pro $29/$290 / Contractor $79/$790.
2. **Price IDs live only in edge-function secrets** (`STRIPE_PRICE_*`). The
   client sends `{plan, billing}` and the server resolves the price — a
   tampered client can't check out at a wrong price. The former
   `VITE_STRIPE_PRICE_*` client envs are gone.
3. **Checkout identity comes from the JWT**, not the request body (the old
   stub trusted a client-supplied `user_id`/email).
4. **Grace period**: `invoice.payment_failed` (and `past_due`/`unpaid`
   subscription states) set `users.grace_until = now + 7 days` — but never
   *extend* an already-running window on Stripe's repeated retries. Access
   checks (client `isPaid` and the server-side `reserve_scan` RPC) treat an
   unexpired grace as paid. A sticky amber banner links to the Stripe portal.
   Recovery (subscription back to `active`) clears the grace.
5. **Access-until-period-end on cancel** falls out of Stripe's own event
   timing: `cancel_at_period_end` keeps the subscription `active` until the
   period ends, and only then does `customer.subscription.deleted` fire and
   downgrade the row. `plan_expires_at` is stored as period end **+24h
   slack** so access never flickers while a renewal invoice settles.
6. **Team seats (Contractor, up to 5)**: stored as a marketing promise for
   now; seat invitations/enforcement ship with the multi-project dashboard in
   Phase 5. No schema for seats yet.
7. **`subscription_status` mirrors Stripe verbatim** (`active`, `trialing`,
   `past_due`, `unpaid`, `canceled`) rather than inventing our own state
   machine — the source of truth stays in Stripe.

## Phase 2 — Conversion paywall

8. **Locked preview costs real AI tokens**, so it's tightly bounded: metadata
   only (max_tokens 400), max 3 previews per user per day (tracked as
   `preview` rows in `scan_events`, which also count toward the hourly rate
   limit), and any failure degrades to the plain paywall. The preview never
   contains fees/requirements — only counts, permit names, and a timeline
   range.
9. **Refund policy shown on the pricing FAQ is 7 days, no questions asked** —
   invented as a reasonable default; change the copy if you want different
   terms.
10. **Exit-intent once-per-user is per-browser** (localStorage), desktop-only
    via `pointer: fine` + width ≥768px. The checklist PDF is a real generated
    asset at `/ma-permit-mistakes-checklist.pdf` built from the verified town
    data (penalty multipliers etc.). Captured emails land in
    `email_subscribers` with source `exit_intent_pricing`.
11. **Landing keeps its own compact pricing cards** linking into checkout
    directly; `/pricing` is the canonical comparison/FAQ page and the target
    of paywall & banner links.

## Phase 3 — Trust infrastructure

12. **Per-town `verified_at` already existed** as `verifiedAt` on every
    sourced fact in `townPermits.ts` (per-fact, which is stronger than
    per-town); it now also surfaces on /how-we-verify's town table. No new
    data model field was needed.
13. **Per-requirement citations** come from the model (`source` on each
    permit in the report), instructed to return null rather than invent
    URLs. Reports render "general Massachusetts guidance (780 CMR)" when
    there's no confident source — honesty over decoration.
14. **Testimonials ship as an empty array** (`SocialProof.tsx`) — the section
    renders nothing until you paste real quotes in. Scans counter reads real
    DB counts via a `scan_stats()` SQL function (aggregate only, anon-safe)
    and stays hidden below 100.
