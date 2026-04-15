# Local Run Guide (Docker)

This guide explains how to run the full project locally on any PC using Docker.

## 1. Prerequisites

Install these first:

1. Docker Desktop (Windows/macOS) or Docker Engine + Docker Compose plugin (Linux)
2. Git

Verify installation:

```bash
docker --version
docker compose version
```

## 2. Get The Project

Clone and open the project root (the folder that contains `docker-compose.yml`).

Windows PowerShell:

```powershell
git clone <YOUR_REPO_URL> schoolproject
cd schoolproject
```

macOS/Linux:

```bash
git clone <YOUR_REPO_URL> schoolproject
cd schoolproject
```

## 3. Create Local Environment Files

Create these files from examples:

- `.env` from `.env.dev.example`
- `backend/.env` from `backend/.env.example`
- `frontend/medhabangla/.env` from `frontend/medhabangla/.env.example`

Windows PowerShell:

```powershell
Copy-Item .env.dev.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/medhabangla/.env.example frontend/medhabangla/.env
```

macOS/Linux:

```bash
cp .env.dev.example .env
cp backend/.env.example backend/.env
cp frontend/medhabangla/.env.example frontend/medhabangla/.env
```

## 4. Minimum Local Env Values

### Root `.env`

Use values like:

```env
POSTGRES_DB=medhabangla_db
POSTGRES_USER=medhabangla_user
POSTGRES_PASSWORD=medhabangla_password
VITE_API_URL=http://localhost:8000
```

### `backend/.env`

For local Docker development, set at least:

```env
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
FRONTEND_URL=http://localhost:5173
CORS_ALLOW_ALL_ORIGINS=True
DOCKER_ENV=True
USE_SQLITE=False
DB_HOST=db
DB_PORT=5432
DB_NAME=medhabangla_db
DB_USER=medhabangla_user
DB_PASSWORD=medhabangla_password
REDIS_URL=redis://redis:6379/0
```

If you use Google/WorkOS login locally:

```env
WORKOS_REDIRECT_URI=http://localhost:5173/auth/callback
```

### `frontend/medhabangla/.env`

```env
VITE_API_URL=http://localhost:8000
```

## 5. Start Full Local Stack

From the project root:

```bash
docker compose up -d --build
```

Check containers:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f backend frontend db redis
```

## 6. Open The App

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Django Admin: http://localhost:8000/admin/

## 7. Default Admin User

In development, the backend entrypoint auto-creates a superuser if it does not exist:

- Username: `bipulroy`
- Password: `Bipul10000$`

After login, change the password.

## 8. Daily Development Commands

Start services:

```bash
docker compose up -d
```

Stop services:

```bash
docker compose down
```

Rebuild after Dockerfile/dependency changes:

```bash
docker compose up -d --build
```

Restart one service:

```bash
docker compose restart backend
docker compose restart frontend
```

Run backend shell:

```bash
docker compose exec backend python manage.py shell
```

Run migrations manually (if needed):

```bash
docker compose exec backend python manage.py migrate
```

## 9. Full Reset (Fresh Local State)

This removes containers, networks, and database volume:

```bash
docker compose down -v --remove-orphans
docker compose up -d --build
```

## 10. Common Issues

### Docker is not running

Start Docker Desktop (or Docker daemon) and run again.

### Port already in use

Default ports used:

- 5173 (frontend)
- 8000 (backend)
- 5432 (postgres)
- 6379 (redis)

Stop conflicting apps or change mappings in `docker-compose.yml`.

### Frontend cannot reach backend

Confirm:

- `VITE_API_URL=http://localhost:8000` in root `.env` and frontend `.env`
- Backend container is up: `docker compose ps`

### OAuth callback/login problems

Check redirect URI values in env:

- Frontend callback: `http://localhost:5173/auth/callback`
- Backend `WORKOS_REDIRECT_URI` should match local callback flow

### Stale local state

Use full reset:

```bash
docker compose down -v --remove-orphans
docker compose up -d --build
```

## 11. Quick Health Check

```bash
docker compose ps
```

Then open:

- http://localhost:5173
- http://localhost:8000/admin/

If both load, local setup is successful.
