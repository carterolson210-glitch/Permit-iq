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
