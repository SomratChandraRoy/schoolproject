# MedhaBangla Live Runbook (Development + Production)

This document is the complete runbook for local Docker development and live deployment on a DigitalOcean Ubuntu droplet for:

- domain: bipulroy.me
- app: MedhaBangla (Django + React + PostgreSQL + Redis + Nginx)

## 1. Architecture Overview

### Development stack (docker-compose.yml)

- db: PostgreSQL 15
- redis: Redis 7
- backend: Django development server via entrypoint.dev.sh
- frontend: Vite dev server on port 5173

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

- frontend: http://localhost:5173
- backend api/admin: http://localhost:8000/admin/login/

Quick command checks:

```bash
curl -I http://localhost:5173
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

### 5.5.1 Use DigitalOcean Managed PostgreSQL

If you already have a DigitalOcean Managed PostgreSQL cluster, set these values in root `.env`:

```env
DB_HOST=db-postgresql-nyc3-12345-do-user-1234567-0.l.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=defaultdb
DB_USER=doadmin
DB_PASSWORD=your_digitalocean_db_password
DB_SSLMODE=require
DB_SSLROOTCERT=
DB_CONNECT_TIMEOUT=10
```

Also set matching values in `backend/.env`:

```env
DB_HOST=db-postgresql-nyc3-12345-do-user-1234567-0.l.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=defaultdb
DB_USER=doadmin
DB_PASSWORD=your_digitalocean_db_password
DB_SSLMODE=require
DB_SSLROOTCERT=
DB_CONNECT_TIMEOUT=10
```

Notes:

- `DB_SSLMODE=require` is recommended for DigitalOcean managed databases.
- Keep `DOCKER_ENV=True` for container runtime behavior.
- You can keep the local `db` service in compose; backend will connect to `DB_HOST` from env.

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

### Option B: In-container Nginx HTTPS with Let's Encrypt

This option runs HTTPS directly in your Docker Nginx service for bipulroy.me.

#### Step 1: Install certbot on droplet

```bash
sudo apt-get update
sudo apt-get install -y certbot
```

#### Step 2: Stop nginx temporarily (port 80 must be free)

```bash
cd ~/schoolproject
docker compose -f docker-compose.prod.yml stop nginx
```

#### Step 3: Issue certificates for bipulroy.me and www

```bash
sudo certbot certonly --standalone \
  -d bipulroy.me -d www.bipulroy.me \
  --agree-tos --non-interactive \
  -m your-email@example.com
```

#### Step 4: Copy cert files into project ssl folder

```bash
cd ~/schoolproject
mkdir -p ssl
sudo cp /etc/letsencrypt/live/bipulroy.me/fullchain.pem ./ssl/fullchain.pem
sudo cp /etc/letsencrypt/live/bipulroy.me/privkey.pem ./ssl/privkey.pem
sudo chmod 644 ./ssl/fullchain.pem
sudo chmod 600 ./ssl/privkey.pem
```

#### Step 5: Switch to HTTPS nginx configuration

```bash
cd ~/schoolproject
cp nginx.https.conf.example nginx.conf
```

#### Step 6: Enable secure redirect in env files

In `.env` set:

```env
SECURE_SSL_REDIRECT=True
```

In `backend/.env` set:

```env
SECURE_SSL_REDIRECT=True
```

#### Step 7: Restart production services

```bash
cd ~/schoolproject
docker compose -f docker-compose.prod.yml up -d --build nginx backend
```

#### Step 8: Validate HTTPS

```bash
curl -I https://bipulroy.me
curl -I https://www.bipulroy.me
```

#### Step 9: Auto-renew certificates and redeploy cert files

Create deploy hook:

```bash
sudo tee /etc/letsencrypt/renewal-hooks/deploy/bipulroy-me-docker.sh > /dev/null <<'EOF'
#!/bin/sh
set -eu
PROJECT_DIR="/home/$SUDO_USER/schoolproject"
cp /etc/letsencrypt/live/bipulroy.me/fullchain.pem "$PROJECT_DIR/ssl/fullchain.pem"
cp /etc/letsencrypt/live/bipulroy.me/privkey.pem "$PROJECT_DIR/ssl/privkey.pem"
chmod 644 "$PROJECT_DIR/ssl/fullchain.pem"
chmod 600 "$PROJECT_DIR/ssl/privkey.pem"
cd "$PROJECT_DIR"
docker compose -f docker-compose.prod.yml restart nginx
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/bipulroy-me-docker.sh
```

Test renewal process:

```bash
sudo certbot renew --dry-run
```

Place cert files into project ssl directory:

- ssl/fullchain.pem
- ssl/privkey.pem

Use HTTPS template config in this project:

- nginx.https.conf.example

Then redeploy nginx.

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
