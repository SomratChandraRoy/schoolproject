## This is School Project

### 8x8 JaaS Video Calling

This project uses 8x8 JaaS with a secure backend token endpoint.

#### Architecture

- Frontend call UI: `frontend/medhabangla/src/pages/VideoCall.tsx`
- Frontend route: `/videocall` via `frontend/medhabangla/src/App.tsx`
- Backend token endpoint: `POST /api/accounts/video-call/token/`
- Backend config diagnostics endpoint: `GET /api/accounts/video-call/config/`
- Backend implementation: `backend/accounts/views.py` (`VideoCallTokenView`)
- Backend URL registration: `backend/accounts/urls.py`

#### Required Backend Environment Variables

Set these in `backend/.env` (or deployment env variables):

- `JAAS_DOMAIN=8x8.vc`
- `JAAS_APP_ID=vpaas-magic-cookie-...`

Optional but recommended for production/premium features:

- `JAAS_KID=...`
- `JAAS_PRIVATE_KEY=...` (single line with `\n` line breaks)
- `JAAS_JWT_TTL_SECONDS=3600`
- `JAAS_REQUIRE_AUTH_TOKEN=True`

If `JAAS_REQUIRE_AUTH_TOKEN=True`, server startup is not enough by itself; the token endpoint will reject calls unless `JAAS_KID` and `JAAS_PRIVATE_KEY` are configured.

#### Required Frontend Environment Variables

Set in `frontend/medhabangla/.env` or build-time vars:

- `VITE_API_URL=http://localhost:8000` for local development
- In production behind same nginx origin, use empty value for relative API requests.
- Optional fallback app id: `VITE_JAAS_APP_ID=vpaas-magic-cookie-...`

#### Common Video Call Errors and Fixes

- Error: `Video call service is not configured on server (missing JAAS_APP_ID).`
  - Root cause: backend env is missing `JAAS_APP_ID`.
  - Fix: set `JAAS_APP_ID`, restart backend process/container.

- Error: `JaaS JWT is required but JAAS_KID/JAAS_PRIVATE_KEY are missing.`
  - Root cause: `JAAS_REQUIRE_AUTH_TOKEN=True` but signing credentials are missing.
  - Fix: set both `JAAS_KID` and `JAAS_PRIVATE_KEY` (single-line with `\n`), restart backend.

- Error: `Failed to load 8x8 script` or `8x8 API script loaded but SDK is unavailable.`
  - Root cause: network/CSP/adblock blocking JaaS script URL.
  - Fix: allow `https://8x8.vc` and `https://8x8.vc/<app-id>/external_api.js` in browser/network policy.

- Error: `Failed to verify video call configuration. Please check backend connectivity.`
  - Root cause: frontend cannot reach backend API base URL.
  - Fix: verify `VITE_API_URL`, reverse proxy, and backend health.

#### Production (Docker) Notes

- `docker-compose.prod.yml` now forwards JaaS backend env vars.
- `frontend/medhabangla/Dockerfile.prod` accepts build arg `VITE_API_URL`.
- Example build invocation:
  - `VITE_API_URL=https://your-domain.com JAAS_APP_ID=... JAAS_KID=... JAAS_PRIVATE_KEY=... docker compose -f docker-compose.prod.yml up --build -d`

#### Security Notes

- Never hardcode `JAAS_PRIVATE_KEY` in frontend code.
- Use backend-generated JWT only.
- Keep auth on `/api/accounts/video-call/token/` (already protected by token auth).
