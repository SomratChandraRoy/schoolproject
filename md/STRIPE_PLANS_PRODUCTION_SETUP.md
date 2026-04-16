# Stripe Plans: Dev + Production Setup

This document covers everything required for the new `/plans` Stripe purchase flow.

## 1. What was implemented

- Backend app: `billing`
- Public plans API: `GET /api/billing/plans/`
- Checkout session API: `POST /api/billing/checkout-session/`
- Checkout verify API: `GET /api/billing/checkout-session-status/?session_id=...`
- Stripe webhook endpoint: `POST /api/billing/webhook/`
- Django admin CRUD for plans:
  - add/edit/delete plans
  - edit name, details, features, price, role mapping
- Automatic role update after successful payment:
  - buying a plan mapped to `pro` changes user role to `pro`
  - buying a plan mapped to `lite` changes user role to `lite`
- Admin system health option:
  - model: `System Health`
  - shows environment, DB type (DigitalOcean/local/docker), DB health, Redis health

## 2. Required backend env vars

Set in `backend/.env` (both local and production):

```env
STRIPE_SECRET_KEY=sk_live_or_sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_live_or_pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=https://bipulroy.me/plans
STRIPE_CANCEL_URL=https://bipulroy.me/plans
```

Notes:
- Do not commit secret keys to git.
- `STRIPE_WEBHOOK_SECRET` must match the webhook endpoint configuration.

## 3. Stripe Dashboard configuration

Create webhook endpoint in Stripe:

- URL: `https://bipulroy.me/api/billing/webhook/`
- Events to send:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `checkout.session.expired`

After creating endpoint, copy **Signing secret** (`whsec_...`) to `STRIPE_WEBHOOK_SECRET`.

## 4. Local development webhook testing

Use Stripe CLI:

```bash
stripe login
stripe listen --forward-to localhost:8000/api/billing/webhook/
```

Stripe CLI prints a webhook signing secret. Put that value in local `backend/.env` as `STRIPE_WEBHOOK_SECRET`.

## 5. Production deployment steps

From server project root:

```bash
git pull

docker compose -f docker-compose.prod.yml down --remove-orphans

docker compose -f docker-compose.prod.yml up -d --build

docker compose -f docker-compose.prod.yml ps

docker compose -f docker-compose.prod.yml logs --tail=200 backend

docker compose -f docker-compose.prod.yml logs --tail=200 nginx
```

Migrations run automatically in `entrypoint.prod.sh`, so billing tables are created on boot.

## 6. Post-deploy verification checklist

1. Open `https://bipulroy.me/plans` and confirm plans load.
2. Start checkout for a test account.
3. Complete payment in Stripe test/live mode as appropriate.
4. Return to `/plans` and confirm success message.
5. Confirm role switched in user profile/admin (`lite` or `pro` based on plan).
6. In Django admin, open `System Health` and confirm DB/Redis health is green.

## 7. If you still need one key

If `STRIPE_WEBHOOK_SECRET` is missing:

1. Open Stripe Dashboard.
2. Go to Developers -> Webhooks.
3. Select endpoint `https://bipulroy.me/api/billing/webhook/`.
4. Click **Reveal** signing secret.
5. Copy `whsec_...` into `backend/.env` as `STRIPE_WEBHOOK_SECRET`.
6. Rebuild backend container.
