# PermitIQ Setup

Credentials and configuration needed to run the full product. Anything
missing is stubbed behind these env vars — the app degrades gracefully
(billing buttons explain "not configured yet") until they're set.

## Frontend (`.env.local`, and Vercel project env)

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (set) |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable key (set) |

No Stripe values live in the frontend — plan→price mapping is server-side.

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
| `ANTHROPIC_API_KEY` | analyze-project | ⚠️ placeholder — scans fail gracefully until a real key from console.anthropic.com is set |
| `STRIPE_SECRET_KEY` | stripe-checkout, stripe-portal | ❌ needed |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook | ❌ needed (from the webhook endpoint you create below) |
| `STRIPE_PRICE_PRO_MONTHLY` | checkout + webhook | ❌ needed |
| `STRIPE_PRICE_PRO_ANNUAL` | checkout + webhook | ❌ needed |
| `STRIPE_PRICE_CONTRACTOR_MONTHLY` | checkout + webhook | ❌ needed |
| `STRIPE_PRICE_CONTRACTOR_ANNUAL` | checkout + webhook | ❌ needed |
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
