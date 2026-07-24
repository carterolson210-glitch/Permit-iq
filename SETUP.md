# PermitIQ Setup

Credentials and configuration needed to run the full product. Anything
missing is stubbed behind these env vars — the app degrades gracefully
(billing buttons explain "not configured yet") until they're set.

## Frontend (`.env.local`, and Vercel project env)

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (set) |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable key (set) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...` for test mode) — mounts the embedded checkout form on `/checkout` (set in `.env.local`; also add to Vercel project env) |

No other Stripe values live in the frontend — plan→price mapping is server-side.

## Embedded checkout (no off-site redirect)

Payment happens on our own `/checkout` page: `stripe-checkout` creates an
**embedded** Checkout Session (`ui_mode: embedded`, `redirect_on_completion:
never`) and returns its `client_secret`; the page mounts it with
`<EmbeddedCheckout />` and shows the success state in-app via `onComplete`.
After changing the function, redeploy it:
`supabase functions deploy stripe-checkout` (JWT verification stays ON).
The client expects `{ clientSecret }` — an older deployed function that
returns `{ url }` will make `/checkout` show "Checkout is not available".

## Supabase edge function secrets

Set via Dashboard → Edge Functions → Secrets, or:

```sh
curl -X POST "https://api.supabase.com/v1/projects/epuxbohyvkjodflikeby/secrets" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"name":"STRIPE_SECRET_KEY","value":"sk_live_..."}]'
```

| Secret | Used by | Status |
|---|---|---|
| `APP_URL` | all functions (CORS + redirect URLs) | ✅ set (`https://permit-iq-rho.vercel.app`) |
| `OPENAI_API_KEY` | analyze-project, anon-scan (all AI scans; model `gpt-5.5`, preview `gpt-5.4-mini`) | ✅ **live and funded 2026-07-24** — full scan, anon-scan, claim, and locked-preview paths all verified end-to-end with real output |
| `XAI_API_KEY` / `ANTHROPIC_API_KEY` | (unused since the 2026-07-24 switch back to OpenAI) | leftover placeholders, safe to delete |

2026-07-24: while testing, found `public.anon_scans` (and the
`client_events_insert` policy) had never actually been applied to the live
database, even though both were in `schema.sql` — the anon-scan zero-friction
flow had likely never worked in production. Fixed the one non-idempotent
statement in schema.sql (missing `drop policy if exists` before
`client_events_insert`) and re-ran the full file via the Supabase Management
API's `/database/query` endpoint, then `NOTIFY pgrst, 'reload schema'` to
bust PostgREST's cache. **schema.sql is written to be fully idempotent
(`create ... if not exists` / `drop policy if exists` + `create policy`) —
if you add new tables/policies, keep that pattern and re-run the whole file
after any edit; it's always safe to do so.**
| `STRIPE_SECRET_KEY` | stripe-checkout, stripe-portal | ✅ set 2026-07-18 (**test mode** — swap for `sk_live_...` at launch) |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook | ✅ set 2026-07-18 (endpoint `we_1TumQKJtN2Ze3hKSsQh5ujy7`, test mode) |
| `STRIPE_PRICE_PRO_MONTHLY` | checkout + webhook | ✅ `price_1TumQ8JtN2Ze3hKSSbzGIMW5` ($29/mo, test) |
| `STRIPE_PRICE_PRO_ANNUAL` | checkout + webhook | ✅ `price_1TumQ8JtN2Ze3hKSvdG68dW9` ($290/yr, test) |
| `STRIPE_PRICE_CONTRACTOR_MONTHLY` | checkout + webhook | ✅ `price_1TumQ9JtN2Ze3hKSbB7oibVD` ($79/mo, test) |
| `STRIPE_PRICE_CONTRACTOR_ANNUAL` | checkout + webhook | ✅ `price_1TumQ9JtN2Ze3hKSCsJnDSGb` ($790/yr, test) |

Full test-mode flow verified 2026-07-18 on permit-iq-rho.vercel.app and
permit-iq-1gzx.vercel.app: embedded form → 4242 card payment → in-page
success → webhook set plan=pro/active → cancel → webhook downgraded to free.
Going live = create live-mode products/prices + webhook endpoint, swap the
sk/pk keys and the six secrets — no code changes.
| `RESEND_API_KEY` | stripe-webhook, subscribe-email (transactional email) | ❌ optional — emails silently skipped without it |

## Stripe setup (one-time, ~10 minutes)

1. In the Stripe Dashboard create two **products**:
   - **PermitIQ Pro** — recurring prices $29/month and $290/year
   - **PermitIQ Contractor** — recurring prices $79/month and $790/year
2. Copy the four `price_...` IDs into the secrets above.
3. Create a **webhook endpoint** pointing to
   `https://epuxbohyvkjodflikeby.supabase.co/functions/v1/stripe-webhook`
   with events: `checkout.session.completed`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.payment_failed`. Copy its signing secret (`whsec_...`) into
   `STRIPE_WEBHOOK_SECRET`.
4. Enable the **Customer Portal** (Settings → Billing → Customer portal) and
   allow plan switches between the four prices + cancellation.

### Test mode

There is no separate app flag — mode follows the keys. To test end-to-end
locally:

1. Put **test-mode** values (`sk_test_...`, test `price_...` IDs, test
   `whsec_...`) into the same secrets.
2. Forward webhooks to the deployed function:
   `stripe listen --forward-to https://epuxbohyvkjodflikeby.supabase.co/functions/v1/stripe-webhook`
   (use the CLI's printed `whsec_...` as `STRIPE_WEBHOOK_SECRET` while testing).
3. Pay with card `4242 4242 4242 4242`. To exercise the grace period, use
   card `4000 0000 0000 0341` (attaches but fails to pay) and trigger
   `invoice.payment_failed` via `stripe trigger invoice.payment_failed`.
4. Swap live values back when done.

## Database

`supabase/schema.sql` is idempotent — re-run it in the SQL editor (or via the
management API) after pulling changes. It contains the billing columns and
the grace-period-aware `reserve_scan`.

## Deploying edge functions

```sh
SUPABASE_ACCESS_TOKEN=... npx supabase functions deploy <name> \
  --project-ref epuxbohyvkjodflikeby --use-api
```

`stripe-webhook` must be deployed with `--no-verify-jwt` (Stripe can't send a
Supabase JWT; authenticity is enforced by signature verification instead).
