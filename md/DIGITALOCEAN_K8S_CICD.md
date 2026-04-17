# DigitalOcean Kubernetes CI/CD (Main Branch Auto-Deploy)

This setup deploys the full stack (frontend nginx + Django backend sidecar, PostgreSQL, Redis) to DigitalOcean Kubernetes (DOKS) automatically whenever you push to `main`.

## What Was Added

- Kubernetes manifests in `k8s/`
- Kustomize entrypoint: `k8s/kustomization.yaml`
- GitHub CI workflow: `.github/workflows/ci.yml`
- GitHub CD workflow: `.github/workflows/cd-doks.yml`
- Sentry failure notifier script: `.github/scripts/notify_sentry_failure.py`
- Backend + frontend Sentry runtime integration

## Behavior

- Push to `main`:
  - Builds backend and nginx/frontend Docker images
  - Pushes both to DigitalOcean Container Registry (DOCR)
  - Applies Kubernetes manifests
  - Updates deployment images to current commit SHA
  - Waits for rollout completion
  - Sends workflow failure event to Sentry (if configured)

## 1) Prerequisites (One-Time)

1. Create a DOKS cluster.
2. Create a DOCR registry.
3. Install an ingress controller in the cluster (for example, ingress-nginx).
4. Install cert-manager (if you want automatic Let's Encrypt TLS from `k8s/ingress.yaml`).
5. Point DNS records:
   - `bipulroy.me` -> ingress/load-balancer IP
   - `www.bipulroy.me` -> ingress/load-balancer IP

## 2) GitHub Repository Secrets (Required)

Add these GitHub Actions secrets:

- `DIGITALOCEAN_ACCESS_TOKEN`: DO API token with registry + kubernetes access
- `DOCR_REGISTRY_NAME`: DOCR name only (example: `my-registry`)
- `DOKS_CLUSTER_NAME`: Kubernetes cluster name
- `BACKEND_ENV_FILE`: entire backend env file content (multi-line, from backend production `.env`)

Recommended frontend build-time secrets:

- `VITE_API_URL` (often empty for same-origin production)
- `VITE_SENTRY_DSN`
- `VITE_SENTRY_ENVIRONMENT` (example: `production`)
- `VITE_SENTRY_TRACES_SAMPLE_RATE` (example: `0.1`)

Sentry notification and release metadata secrets:

- `SENTRY_DSN` (for CI/CD failure notifications)
- `SENTRY_AUTH_TOKEN` (optional, for Sentry release tracking)
- `SENTRY_ORG` (optional)
- `SENTRY_PROJECT` (optional)

## 3) Backend Env Notes

`BACKEND_ENV_FILE` should include at least:

- Django core: `DJANGO_SECRET_KEY`, `DEBUG=False`
- Admin bootstrap (optional, recommended disabled): `AUTO_CREATE_SUPERUSER=False`
- Database: `DB_NAME`, `DB_USER`, `DB_PASSWORD` (and optionally `DB_HOST`, `DB_PORT`)
- Redis: `REDIS_URL`
- Hosts/origins: `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`
- Sentry: `SENTRY_DSN`

Tip: start from `backend/.env.example` and paste the full finalized content into `BACKEND_ENV_FILE`.

Ready-to-paste production template (with placeholders) is available at `md/BACKEND_ENV_FILE_PROD_TEMPLATE.env`.

## 3.1) Google Drive PDF Storage (Current Project)

For this project, books/chat file storage reads these backend env values:

- `USE_GOOGLE_DRIVE=True`
- `GOOGLE_DRIVE_CREDENTIALS_JSON=<one-line service account JSON>`
- `GOOGLE_DRIVE_FOLDER_ID=<folder id>`
- `GOOGLE_DRIVE_BOOKS_FOLDER_ID=<folder id>`
- `GOOGLE_DRIVE_PUBLIC_FILES=True`

Important format rules (very important for Kubernetes secret sync):

- Keep `GOOGLE_DRIVE_CREDENTIALS_JSON` on one line.
- Do not wrap the entire JSON value in single quotes.
- Keep private key line breaks escaped as `\n` in the JSON value.

Google Cloud setup links:

- Service accounts: https://console.cloud.google.com/iam-admin/serviceaccounts
- Create/download key JSON: https://cloud.google.com/iam/docs/keys-create-delete

Google Drive setup links:

- Drive folders: https://drive.google.com/drive/my-drive
- Share the target folder(s) with the service account email as `Editor`.

Security note:

- If a private key was shared in chat or committed accidentally, rotate it immediately and replace with a new key.

## 4) Deploy Flow

- Any push to `main` triggers deployment automatically.
- Manual deploy is available via `workflow_dispatch` on `.github/workflows/cd-doks.yml`.

## 5) Files to Customize

Before first production run, review and adjust:

- `k8s/backend-configmap.yaml`
- `k8s/ingress.yaml`
- `k8s/postgres.yaml` storage size/resources
- `k8s/redis.yaml` storage size/resources
- `k8s/web.yaml` resources/replicas

## 6) Sentry Coverage

- Backend runtime errors -> Sentry (`backend/medhabangla/settings.py`)
- Frontend runtime errors -> Sentry (`frontend/medhabangla/src/main.tsx`)
- CI/CD workflow failures -> Sentry (`.github/scripts/notify_sentry_failure.py`)

## 7) Recommended Next Improvements

- Move PostgreSQL/Redis to DigitalOcean Managed services for higher durability.
- Store media on DigitalOcean Spaces instead of a single pod PVC.
- Add database backups and restore runbook.
- Add smoke-test curl checks to CD after rollout.

## 8) What To Do Next (Execution Order)

1. Add all required GitHub secrets (DigitalOcean, backend env, frontend Sentry env).
2. Ensure cluster dependencies are installed:
  - ingress-nginx controller
  - cert-manager + `letsencrypt-prod` ClusterIssuer
3. Push one small commit to `main` to trigger CD.
4. Watch workflow run in GitHub Actions and confirm rollout success.
5. Validate production endpoints:
  - site home page
  - admin login
  - one API endpoint (for example `/api/chat/unread-count/` as authenticated user)
6. Validate Sentry:
  - trigger a controlled frontend error
  - trigger a controlled backend error
  - confirm events arrive in Sentry project(s)
7. Validate Google Drive:
  - upload one PDF book/chat file
  - confirm file appears in configured Drive folder
  - confirm app can open/download it
