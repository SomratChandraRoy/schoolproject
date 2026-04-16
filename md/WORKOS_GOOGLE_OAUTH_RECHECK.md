# WorkOS + Google OAuth Re-check (bipulroy.me)

Use this checklist to validate Google sign-in end-to-end for production and local.

## 1) Root causes that were fixed

There were two production-breaking causes:

1. `SECURE_SSL_REDIRECT=True` while nginx was serving HTTP-only (TLS block disabled).

- Result: auth API calls were redirected to `https://...` but HTTPS endpoint was not actually served.
- Browser symptom: `Failed to fetch`.

2. Frontend auth flow fallback to localhost (`http://localhost:8000`) in production builds.

- Result: browser attempted local machine API instead of your server.
- Browser symptom: `Failed to fetch`.

Code/config now ensures:

- nginx serves real HTTPS for `bipulroy.me` and redirects HTTP -> HTTPS
- frontend auth uses same-origin API in production and ignores localhost values on non-local hosts

## 2) Production values to verify on server

Check these on droplet:

- `backend/.env`
  - `WORKOS_API_KEY` = your active key
  - `WORKOS_CLIENT_ID` = your active client id
  - `WORKOS_REDIRECT_URI=https://bipulroy.me/auth/callback`

- `.env`
  - `VITE_API_URL=` (empty for same-origin through nginx) OR `VITE_API_URL=https://bipulroy.me`
  - `SECURE_SSL_REDIRECT=True` only when nginx HTTPS is enabled

- `nginx.conf`
  - must include active `server` block for `listen 443 ssl http2;`
  - must include `ssl_certificate` and `ssl_certificate_key`

## 3) WorkOS dashboard setup (required)

Dashboard URL: https://dashboard.workos.com/

### A. Redirect URIs (AuthKit)

Add these in your WorkOS environment redirect URIs:

- `https://bipulroy.me/auth/callback` (primary)
- `https://www.bipulroy.me/auth/callback` (recommended)
- `http://localhost:5173/auth/callback` (local dev)

### B. CORS Origins (AuthKit)

Add:

- `https://bipulroy.me`
- `https://www.bipulroy.me`
- `http://localhost:5173` (dev)

### C. Google social connection in WorkOS

In WorkOS Google connection:

- Status must be enabled
- Use the Google OAuth Client ID and Client Secret from Google Cloud
- Copy the WorkOS-provided Google callback URL from this page
  - this is the URL you must place in Google Cloud Authorized Redirect URIs

## 4) Google Cloud Console setup (required)

Console URL: https://console.cloud.google.com/

Open: APIs & Services > Credentials > OAuth 2.0 Client IDs > your web client

### A. Authorized redirect URIs

Add exactly the callback URI shown in WorkOS Google connection settings.

- Example placeholder: `<WORKOS_GOOGLE_CALLBACK_FROM_WORKOS_DASHBOARD>`

Important:

- Do NOT put `https://bipulroy.me/auth/callback` here when using WorkOS social login.
- Google redirects back to WorkOS first, then WorkOS redirects to your app callback.

### B. Authorized JavaScript origins

Usually not needed for WorkOS-managed server-side exchange.
If Google requires one, use:

- `https://api.workos.com`

### C. OAuth consent screen

Verify:

- Publishing status (Testing or In production as expected)
- Your domain/app details are correct
- Test users are added if app is in Testing mode

## 5) App callback route that must exist

Frontend route must exist and is currently used:

- `/auth/callback`

## 6) Quick production checks

Run:

```bash
curl -s https://bipulroy.me/api/accounts/workos-auth-url/
```

Expected response includes:

- `authorization_url`
- `redirect_uri=https://bipulroy.me/auth/callback`

## 7) If settings are changed

Redeploy frontend + backend stack:

```bash
cd ~/schoolproject
docker compose -f docker-compose.prod.yml up -d --build nginx backend
```

Then re-test login from:

- `https://bipulroy.me/login`
- `https://www.bipulroy.me/login`
