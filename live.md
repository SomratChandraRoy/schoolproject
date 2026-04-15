# MedhaBangla Live Runbook (Development + Production)

This document is the complete runbook for local Docker development and live deployment on a DigitalOcean Ubuntu droplet for:

- domain: bipulroy.me
- app: MedhaBangla (Django + React + PostgreSQL + Redis + Nginx)

## 1. Architecture Overview

### Development stack (docker-compose.yml)

- db: PostgreSQL 15
- redis: Redis 7
- backend: Django development server via entrypoint.dev.sh
- frontend: Vite dev server on port 3000

### Production stack (docker-compose.prod.yml)

- db: PostgreSQL 15 with persistent volume
- redis: Redis 7 with appendonly persistence
- backend: Django ASGI app via Daphne + entrypoint.prod.sh
- nginx: reverse proxy + static/media + frontend dist

## 2. Important Startup Behavior

Both dev and prod now auto-bootstrap the admin account on first start:

- username: bipulroy
- password: Bipul10000$

Implemented in:

- backend/entrypoint.dev.sh
- backend/entrypoint.prod.sh

Change password immediately after first login.

## 3. Environment Files You Need

### Root env templates

- .env.dev.example
- .env.prod.example

### Backend env template

- backend/.env.example

### Frontend env template

- frontend/medhabangla/.env.example

## 4. Local Development with Docker

Run from project root.

### Step 1: Prepare env files

```bash
cp .env.dev.example .env
cp backend/.env.example backend/.env
cp frontend/medhabangla/.env.example frontend/medhabangla/.env
```

If you already configured env files, keep your existing values.

### Step 2: Build and start dev stack

```bash
docker compose down --remove-orphans
docker compose up -d --build
```

### Step 3: Verify containers

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

### Step 4: Verify URLs

- frontend: http://localhost:3000
- backend api/admin: http://localhost:8000/admin/login/

Quick command checks:

```bash
curl -I http://localhost:3000
curl -I http://localhost:8000/admin/login/
```

### Dev helper commands

```bash
docker compose restart
docker compose down
docker compose down -v
docker compose up -d --build backend
docker compose up -d --build frontend
```

## 5. Production Deployment on DigitalOcean (bipulroy.me)

## 5.1 Create droplet

- Ubuntu 22.04 or 24.04 LTS
- minimum 2 vCPU / 4 GB RAM recommended
- attach SSH key

## 5.2 Install Docker and Compose plugin

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Logout/login once after adding docker group.

## 5.3 DNS for bipulroy.me

Set A records:

- @ -> your droplet public IP
- www -> your droplet public IP

## 5.4 Clone project

```bash
git clone <your-repo-url>
cd schoolproject
```

## 5.5 Configure production env

### Root file

```bash
cp .env.prod.example .env
nano .env
```

### Backend file

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Set strong real values for:

- DJANGO_SECRET_KEY
- DB_PASSWORD
- all API keys in backend/.env

Confirm these are correct:

- ALLOWED_HOSTS=bipulroy.me,www.bipulroy.me
- CORS_ALLOWED_ORIGINS=https://bipulroy.me,https://www.bipulroy.me
- CSRF_TRUSTED_ORIGINS=https://bipulroy.me,https://www.bipulroy.me

## 5.6 Build and start production stack

```bash
docker compose -f docker-compose.prod.yml down --remove-orphans
docker compose -f docker-compose.prod.yml up -d --build
```

Verify:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx
```

## 5.7 HTTPS options

### Option A (recommended): DigitalOcean Load Balancer TLS

- Create DO load balancer in front of droplet
- Use managed certificate for bipulroy.me and www.bipulroy.me
- Forward HTTPS -> droplet HTTP 80
- keep SECURE_SSL_REDIRECT=False unless X-Forwarded-Proto is handled exactly

### Option B: TLS cert files mounted to nginx container

Place cert files into project ssl directory:

- ssl/fullchain.pem
- ssl/privkey.pem

Then uncomment the HTTPS server block in nginx.conf and redeploy nginx.

```bash
docker compose -f docker-compose.prod.yml up -d --build nginx
```

## 5.8 Firewall ports

Open only:

- 22/tcp
- 80/tcp
- 443/tcp

Do not expose 5432 and 6379 publicly.

## 6. Files You Edit for Live Production

1. .env
2. backend/.env
3. nginx.conf (only if enabling in-container TLS block)

Core deployment files already production-ready:

- docker-compose.prod.yml
- Dockerfile.nginx
- backend/Dockerfile.prod
- backend/entrypoint.prod.sh
- backend/medhabangla/settings.py

## 7. Safe Update Procedure (Production)

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail 200 backend
docker compose -f docker-compose.prod.yml logs --tail 200 nginx
```

## 8. Backup and Restore

### Backup PostgreSQL

```bash
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup.sql
```

### Restore PostgreSQL

```bash
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB"
```

## 9. Go-Live Checklist

- Domain bipulroy.me and www resolve to target endpoint
- Production env files contain no placeholder secrets
- docker compose prod services are healthy
- https://bipulroy.me opens frontend
- https://bipulroy.me/admin/ opens admin login
- API calls under /api work through nginx
- WebSocket routes under /ws work
- Admin password changed after first login

## 10. Troubleshooting

### Check all logs

```bash
docker compose logs -f
docker compose -f docker-compose.prod.yml logs -f
```

### Rebuild only one service

```bash
docker compose -f docker-compose.prod.yml up -d --build backend
docker compose -f docker-compose.prod.yml up -d --build nginx
```

### Full clean restart (danger: removes volumes)

```bash
docker compose down -v
docker compose -f docker-compose.prod.yml down -v
```
