# MedhaBangla Production Deployment (DigitalOcean + Docker)

This file contains the full production deployment workflow for this project.

## 1. Production Architecture

- `db`: PostgreSQL 15 (persistent volume)
- `redis`: Redis 7 (Channels/WebSocket backend)
- `backend`: Django ASGI app (Daphne)
- `nginx`: reverse proxy + frontend static app + static/media serving
- Frontend is built inside `Dockerfile.nginx` (multi-stage build)

## 2. Files Updated For Production

- `docker-compose.prod.yml`
- `docker-compose.yml`
- `Dockerfile.nginx`
- `nginx.conf`
- `backend/Dockerfile`
- `backend/Dockerfile.prod`
- `backend/entrypoint.prod.sh`
- `backend/medhabangla/settings.py`
- `backend/.env.example`
- `backend/requirements.txt` (generated from pip freeze)
- `.dockerignore`
- `backend/.dockerignore`
- `frontend/medhabangla/.dockerignore`
- `frontend/medhabangla/nginx.conf`

## 3. DigitalOcean Server Prerequisites

Create an Ubuntu droplet and install Docker + Compose plugin.

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

Log out and log in once after adding user to the docker group.

## 4. DNS

Point your domain A record to the droplet IP.

Example:

- `@` -> `YOUR_DROPLET_IP`
- `www` -> `YOUR_DROPLET_IP`

## 5. Prepare Project On Server

```bash
git clone <your-repo-url>
cd schoolproject
```

## 6. Configure Environment Variables

### 6.1 Backend env file

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Set at least these values correctly:

- `DEBUG=False`
- `DJANGO_SECRET_KEY=<strong-random-secret>`
- `ALLOWED_HOSTS=your-domain.com,www.your-domain.com`
- `CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com`
- `CSRF_TRUSTED_ORIGINS=https://your-domain.com,https://www.your-domain.com`
- `DB_PASSWORD=<strong-db-password>`
- all required API keys (`WORKOS`, `GROQ`, `GEMINI`, etc.)

### 6.2 Root compose env file

Create a root `.env` file beside `docker-compose.prod.yml`:

```bash
cat > .env << 'EOF'
POSTGRES_DB=medhabangla_db
POSTGRES_USER=medhabangla_user
POSTGRES_PASSWORD=change_this_postgres_password

ALLOWED_HOSTS=your-domain.com,www.your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
CSRF_TRUSTED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# For same-domain frontend/backend requests, keep empty.
VITE_API_URL=

# Keep False if TLS is terminated by DigitalOcean Load Balancer.
SECURE_SSL_REDIRECT=False
EOF
```

Important: keep database values in `.env` and `backend/.env` consistent.

## 7. First Production Build + Run

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Check status:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx
```

## 8. Automatic First-Time Superuser Creation

The backend startup logic now auto-runs in `backend/entrypoint.prod.sh`:

- Runs `migrate`
- Runs `collectstatic`
- Creates superuser if missing:
  - username: `bipulroy`
  - password: `Bipul10000$`

After first login, change this password immediately:

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py changepassword bipulroy
```

## 9. HTTPS Setup Options

### Option A: DigitalOcean Load Balancer TLS (recommended)

- Terminate SSL at DO Load Balancer.
- Forward traffic to droplet on port 80.
- Keep `SECURE_SSL_REDIRECT=False` unless forwarding `X-Forwarded-Proto=https` correctly.

### Option B: TLS inside Nginx container

Place cert files under `./ssl`:

- `fullchain.pem`
- `privkey.pem`

Then enable HTTPS server block in `nginx.conf` and reload:

```bash
docker compose -f docker-compose.prod.yml up -d --build nginx
```

## 10. Firewall and Ports

Open only necessary ports on droplet firewall:

- `22/tcp` (SSH)
- `80/tcp` (HTTP)
- `443/tcp` (HTTPS)

Do not expose PostgreSQL/Redis publicly.

## 11. Operations Cheat Sheet

Rebuild after code changes:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Restart services:

```bash
docker compose -f docker-compose.prod.yml restart
```

View logs:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

Stop stack:

```bash
docker compose -f docker-compose.prod.yml down
```

Stop and remove volumes (danger: deletes DB data):

```bash
docker compose -f docker-compose.prod.yml down -v
```

## 12. Backup Recommendations

PostgreSQL backup:

```bash
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup.sql
```

Restore:

```bash
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB"
```

## 13. Health Checklist Before Going Live

- `backend/.env` has real secrets and no placeholder values.
- Domain points to droplet.
- `docker compose -f docker-compose.prod.yml ps` shows all services healthy.
- `https://your-domain.com` frontend loads.
- `https://your-domain.com/admin/` works.
- API routes under `/api/` work through Nginx.
- WebSockets under `/ws/` work (chat/voice features).
- Default superuser password has been changed.
