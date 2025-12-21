# Production Deployment Guide for MedhaBangla

This guide outlines the steps to deploy the MedhaBangla educational platform to a production environment (AWS EC2, DigitalOcean Droplet, or any VPS) using Docker, Nginx, and SSL.

## Prerequisites

1.  **VPS**: A Virtual Private Server (Ubuntu 22.04 LTS recommended) with at least 2GB RAM.
2.  **Domain Name**: A valid domain name pointing to your VPS IP address (e.g., `medhabangla.com`, `api.medhabangla.com`).
3.  **Git**: Installed on the VPS.
4.  **Docker & Docker Compose**: Installed on the VPS.

## 1. Server Setup

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Docker & Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install -y docker-compose-plugin
```

## 2. Project Setup

### Clone Repository
```bash
git clone https://github.com/yourusername/medhabangla.git
cd medhabangla
```

### Configure Environment Variables
Create a `.env` file in the root directory based on the following template:

```bash
nano .env
```

**Content for .env:**
```env
# Django Settings
DEBUG=False
DJANGO_SECRET_KEY=your_strong_production_secret_key_here_change_this
ALLOWED_HOSTS=medhabangla.com,www.medhabangla.com,localhost,127.0.0.1

# Database Settings
POSTGRES_DB=medhabangla_db
POSTGRES_USER=medhabangla_user
POSTGRES_PASSWORD=REDACTED
POSTGRES_HOST=db
POSTGRES_PORT=5432

# WorkOS Settings
WORKOS_API_KEY=your_workos_api_key
WORKOS_CLIENT_ID=your_workos_client_id

# Google Gemini AI Settings
GEMINI_API_KEY=your_gemini_api_key

# Docker
DOCKER_ENV=True
```

## 3. Deployment

### Build and Run Containers
Use the production Docker Compose file to build and start the services.

```bash
# Build images
docker compose -f docker-compose.prod.yml build

# Start services in detached mode
docker compose -f docker-compose.prod.yml up -d
```

### Run Migrations and Collect Static Files
```bash
# Run database migrations
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Collect static files (already done in Dockerfile, but good to ensure)
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

# Create superuser
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

## 4. SSL Configuration (HTTPS)

We will use Certbot to obtain free SSL certificates from Let's Encrypt.

### Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Since we are using Dockerized Nginx, the easiest way is to use `certbot` to generate certificates and then mount them into the Nginx container, or use a separate Nginx on the host.

**Option A: Nginx inside Docker (Recommended)**

1.  **Modify `nginx.conf` temporarily to allow Certbot challenge**:
    Ensure port 80 is open. The current configuration is fine.

2.  **Obtain Certificates**:
    Stop the Nginx container temporarily to free up port 80.
    ```bash
    docker compose -f docker-compose.prod.yml stop nginx
    ```
    
    Run standalone Certbot:
    ```bash
    sudo certbot certonly --standalone -d medhabangla.com -d www.medhabangla.com
    ```
    
    This will save certificates in `/etc/letsencrypt/live/medhabangla.com/`.

3.  **Update `docker-compose.prod.yml`**:
    Mount the certificates into the Nginx container.
    
    Edit `docker-compose.prod.yml`:
    ```yaml
    nginx:
      ...
      volumes:
        ...
        - /etc/letsencrypt/live/medhabangla.com/fullchain.pem:/etc/nginx/ssl/cert.pem
        - /etc/letsencrypt/live/medhabangla.com/privkey.pem:/etc/nginx/ssl/key.pem
    ```

4.  **Update `nginx.conf`**:
    Uncomment the SSL section and update paths if necessary.

    ```nginx
    server {
        listen 443 ssl;
        server_name medhabangla.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # ... (include rest of the configuration)
    }
    ```

5.  **Restart Nginx**:
    ```bash
    docker compose -f docker-compose.prod.yml up -d nginx
    ```

## 5. Maintenance

### View Logs
```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Update Application
```bash
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

### Database Backup
```bash
docker compose -f docker-compose.prod.yml exec db pg_dump -U medhabangla_user medhabangla_db > backup.sql
```

## 6. Troubleshooting

-   **502 Bad Gateway**: Usually means the backend container is not ready or crashing. Check logs: `docker compose -f docker-compose.prod.yml logs backend`.
-   **Static Files Not Loading**: Ensure `collectstatic` ran successfully and the `static_volume` is mounted correctly in both backend and nginx containers.
-   **Database Connection Error**: Ensure `POSTGRES_...` variables match in `.env` and `docker-compose.prod.yml`.

## Architecture Overview

-   **Frontend**: React + Vite (Built into static files)
-   **Backend**: Django REST Framework + Gunicorn
-   **Database**: PostgreSQL
-   **Web Server**: Nginx (Reverse Proxy + Static File Serving)
-   **Orchestration**: Docker Compose
