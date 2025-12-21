# MedhaBangla - Production Deployment Guide

## Complete AWS & Digital Ocean Deployment Guide

This comprehensive guide covers deploying the MedhaBangla educational platform to production on AWS or Digital Ocean with Docker, Nginx, PostgreSQL, and SSL certificates.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [AWS Deployment](#aws-deployment)
4. [Digital Ocean Deployment](#digital-ocean-deployment)
5. [Database Setup](#database-setup)
6. [Environment Configuration](#environment-configuration)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup Strategy](#backup-strategy)
10. [Scaling Considerations](#scaling-considerations)

---

## Prerequisites

### Required Tools
- Docker & Docker Compose (v2.0+)
- Git
- SSH client
- Domain name (for SSL)

### Required Accounts
- AWS Account OR Digital Ocean Account
- WorkOS Account (for Google OAuth)
- Google Cloud Account (for Gemini API)
- Domain registrar access

### Required Knowledge
- Basic Linux command line
- Docker fundamentals
- Basic networking concepts

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (Optional)                  │
│                    SSL Termination                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                       │
│                    (Port 80/443)                             │
└────────┬───────────────────────────────────┬────────────────┘
         │                                   │
         ▼                                   ▼
┌────────────────────┐            ┌────────────────────┐
│  Django Backend    │            │  React Frontend    │
│  (Gunicorn)        │            │  (Static Files)    │
│  Port 8000         │            │                    │
└────────┬───────────┘            └────────────────────┘
         │
         ▼
┌────────────────────┐
│  PostgreSQL DB     │
│  Port 5432         │
└────────────────────┘
```

---

## AWS Deployment

### Step 1: Launch EC2 Instance

#### 1.1 Create EC2 Instance

```bash
# Login to AWS Console
# Navigate to EC2 Dashboard
# Click "Launch Instance"

# Instance Configuration:
- Name: medhabangla-production
- AMI: Ubuntu Server 22.04 LTS
- Instance Type: t3.medium (2 vCPU, 4 GB RAM) - Minimum
- Instance Type: t3.large (2 vCPU, 8 GB RAM) - Recommended
- Key Pair: Create new or use existing
- Network Settings:
  - VPC: Default or custom
  - Auto-assign Public IP: Enable
  - Security Group: Create new
```

#### 1.2 Configure Security Group

```bash
# Inbound Rules:
Type            Protocol    Port Range    Source
SSH             TCP         22            Your IP/0.0.0.0/0
HTTP            TCP         80            0.0.0.0/0
HTTPS           TCP         443           0.0.0.0/0
Custom TCP      TCP         8000          0.0.0.0/0 (for testing)
PostgreSQL      TCP         5432          Security Group ID (internal only)

# Outbound Rules:
All traffic     All         All           0.0.0.0/0
```

#### 1.3 Connect to EC2 Instance

```bash
# Download your .pem key file
chmod 400 your-key.pem

# Connect via SSH
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip

# Update system
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Docker on EC2

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Logout and login again for group changes
exit
# SSH back in
```

### Step 3: Setup Application on EC2

```bash
# Clone repository
cd /home/ubuntu
git clone https://github.com/your-username/medhabangla.git
cd medhabangla

# Create production environment file
nano backend/.env.production
```

```env
# backend/.env.production
DEBUG=False
SECRET_KEY=your-super-secret-production-key-change-this-immediately
ALLOWED_HOSTS=your-domain.com,www.your-domain.com,your-ec2-ip
DOCKER_ENV=True

# Database
DATABASE_URL=postgresql://medhabangla_user:strong_password_here@db:5432/medhabangla_db

# WorkOS
WORKOS_API_KEY=sk_test_your_workos_api_key
WORKOS_CLIENT_ID=client_REDACTED
WORKOS_REDIRECT_URI=https://your-domain.com/auth/callback

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

```bash
# Create frontend environment file
nano frontend/medhabangla/.env.production
```

```env
# frontend/medhabangla/.env.production
VITE_API_URL=https://your-domain.com/api
VITE_WORKOS_CLIENT_ID=client_REDACTED
VITE_WORKOS_REDIRECT_URI=https://your-domain.com/auth/callback
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Step 4: Configure Production Docker Compose

```bash
# Edit docker-compose.prod.yml
nano docker-compose.prod.yml
```

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: medhabangla_db
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    environment:
      POSTGRES_DB: medhabangla_db
      POSTGRES_USER: medhabangla_user
      POSTGRES_PASSWORD: strong_password_here
    networks:
      - medhabangla_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U medhabangla_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: medhabangla_backend
    command: >
      sh -c "python manage.py collectstatic --noinput &&
             python manage.py migrate &&
             gunicorn medhabangla.wsgi:application --bind 0.0.0.0:8000 --workers 4 --timeout 120"
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    env_file:
      - ./backend/.env.production
    networks:
      - medhabangla_network
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/admin/"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend/medhabangla
      dockerfile: Dockerfile.prod
    container_name: medhabangla_frontend
    volumes:
      - frontend_build:/app/dist
    networks:
      - medhabangla_network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: medhabangla_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - static_volume:/var/www/static:ro
      - media_volume:/var/www/media:ro
      - frontend_build:/var/www/frontend:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    networks:
      - medhabangla_network
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

  certbot:
    image: certbot/certbot
    container_name: medhabangla_certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    networks:
      - medhabangla_network

volumes:
  postgres_data:
  static_volume:
  media_volume:
  frontend_build:

networks:
  medhabangla_network:
    driver: bridge
```

### Step 5: Create Production Nginx Configuration

```bash
nano nginx.prod.conf
```

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

    # Upstream backends
    upstream backend {
        server backend:8000;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;

        # Certbot challenge
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        # Redirect all HTTP to HTTPS
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL certificates
        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Max upload size
        client_REDACTED 100M;

        # API endpoints
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_redirect off;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # Admin panel
        location /admin/ {
            limit_req zone=auth_limit burst=5 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files
        location /static/ {
            alias /var/www/static/;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # Media files
        location /media/ {
            alias /var/www/media/;
            expires 7d;
            add_header Cache-Control "public";
        }

        # Frontend
        location / {
            root /var/www/frontend;
            try_files $uri $uri/ /index.html;
            expires 1h;
            add_header Cache-Control "public";
        }
    }
}
```

### Step 6: Create Production Dockerfiles

```bash
# Backend Production Dockerfile
nano backend/Dockerfile.prod
```

```dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    python3-dev \
    musl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Create necessary directories
RUN mkdir -p /app/staticfiles /app/media

# Collect static files
RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

CMD ["gunicorn", "medhabangla.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
```

```bash
# Frontend Production Dockerfile
nano frontend/medhabangla/Dockerfile.prod
```

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration (optional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Step 7: Setup SSL with Let's Encrypt

```bash
# Create directories for certbot
mkdir -p certbot/conf certbot/www

# Initial certificate request (do this before starting nginx with SSL)
# First, start nginx without SSL
docker-compose -f docker-compose.prod.yml up -d nginx

# Request certificate
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d your-domain.com \
    -d www.your-domain.com

# Stop nginx
docker-compose -f docker-compose.prod.yml down

# Update nginx.prod.conf with SSL configuration (already done above)
# Start all services
docker-compose -f docker-compose.prod.yml up -d
```

### Step 8: Deploy Application

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Create superuser
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

### Step 9: Configure Domain DNS

```bash
# In your domain registrar (GoDaddy, Namecheap, etc.)
# Add A records:

Type    Name    Value               TTL
A       @       your-ec2-public-ip  3600
A       www     your-ec2-public-ip  3600
```

---

## Digital Ocean Deployment

### Step 1: Create Droplet

```bash
# Login to Digital Ocean
# Click "Create" → "Droplets"

# Droplet Configuration:
- Image: Ubuntu 22.04 LTS
- Plan: Basic
- CPU Options: Regular (2 GB RAM / 1 vCPU) - Minimum
- CPU Options: Regular (4 GB RAM / 2 vCPU) - Recommended
- Datacenter: Choose closest to your users
- Authentication: SSH Key (recommended) or Password
- Hostname: medhabangla-production
```

### Step 2: Initial Server Setup

```bash
# Connect to droplet
ssh root@your-droplet-ip

# Create new user
adduser medhabangla
usermod -aG sudo medhabangla

# Switch to new user
su - medhabangla

# Update system
sudo apt update && sudo apt upgrade -y
```

### Step 3: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login
exit
ssh medhabangla@your-droplet-ip
```

### Step 4: Configure Firewall

```bash
# Enable UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Check status
sudo ufw status
```

### Step 5: Deploy Application

Follow the same steps as AWS deployment from Step 3 onwards:
- Clone repository
- Configure environment files
- Setup Docker Compose
- Configure Nginx
- Setup SSL
- Deploy

---

## Database Setup

### PostgreSQL Configuration

```bash
# Access PostgreSQL container
docker-compose -f docker-compose.prod.yml exec db psql -U medhabangla_user -d medhabangla_db

# Create backup user
CREATE USER backup_user WITH PASSWORD 'backup_password';
GRANT CONNECT ON DATABASE medhabangla_db TO backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;

# Exit
\q
```

### Database Migrations

```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Create initial data
docker-compose -f docker-compose.prod.yml exec backend python manage.py loaddata initial_data.json

# Create superuser
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

---

## Environment Configuration

### Production Environment Variables

```bash
# Generate secure SECRET_KEY
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Update backend/.env.production with generated key
```

### WorkOS Configuration

```bash
# Login to WorkOS Dashboard
# Navigate to your project
# Update Redirect URIs:
- https://your-domain.com/auth/callback
- https://www.your-domain.com/auth/callback

# Copy API Key and Client ID to .env.production
```

### Gemini API Configuration

```bash
# Login to Google Cloud Console
# Enable Generative AI API
# Create API Key
# Add to .env.production
```

---

## SSL/TLS Configuration

### Auto-renewal Setup

```bash
# Certbot auto-renewal is handled by the certbot container
# Test renewal
docker-compose -f docker-compose.prod.yml run --rm certbot renew --dry-run

# Manual renewal if needed
docker-compose -f docker-compose.prod.yml run --rm certbot renew
docker-compose -f docker-compose.prod.yml restart nginx
```

---

## Monitoring & Logging

### Setup Logging

```bash
# Create log directory
mkdir -p /home/ubuntu/medhabangla/logs

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f db
```

### Setup Monitoring (Optional)

```bash
# Install monitoring tools
# Option 1: Prometheus + Grafana
# Option 2: DataDog
# Option 3: New Relic
```

---

## Backup Strategy

### Database Backup Script

```bash
# Create backup script
nano /home/ubuntu/backup-db.sh
```

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="medhabangla_backup_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker-compose -f /home/ubuntu/medhabangla/docker-compose.prod.yml exec -T db \
    pg_dump -U medhabangla_user medhabangla_db > $BACKUP_DIR/$BACKUP_FILE

# Compress backup
gzip $BACKUP_DIR/$BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

```bash
# Make executable
chmod +x /home/ubuntu/backup-db.sh

# Setup cron job for daily backups
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /home/ubuntu/backup-db.sh >> /home/ubuntu/backup.log 2>&1
```

### Media Files Backup

```bash
# Backup media files
tar -czf media_backup_$(date +%Y%m%d).tar.gz /home/ubuntu/medhabangla/media/

# Upload to S3 (optional)
aws s3 cp media_backup_$(date +%Y%m%d).tar.gz s3://your-bucket/backups/
```

---

## Scaling Considerations

### Horizontal Scaling

```yaml
# docker-compose.prod.yml - Add multiple backend instances
services:
  backend1:
    # ... backend configuration
  backend2:
    # ... backend configuration
  
  nginx:
    # Update upstream in nginx.conf
    # upstream backend {
    #     server backend1:8000;
    #     server backend2:8000;
    # }
```

### Database Scaling

```bash
# Option 1: Managed Database (AWS RDS, Digital Ocean Managed Database)
# Option 2: Read Replicas
# Option 3: Connection Pooling (PgBouncer)
```

### CDN Integration

```bash
# Use CloudFlare, AWS CloudFront, or Digital Ocean Spaces
# Configure for static and media files
```

---

## Maintenance Commands

```bash
# Restart services
docker-compose -f docker-compose.prod.yml restart

# Update application
cd /home/ubuntu/medhabangla
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build

# View resource usage
docker stats

# Clean up unused images
docker system prune -a

# Database shell
docker-compose -f docker-compose.prod.yml exec db psql -U medhabangla_user -d medhabangla_db

# Django shell
docker-compose -f docker-compose.prod.yml exec backend python manage.py shell

# Collect static files
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

---

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   ```bash
   # Check backend logs
   docker-compose -f docker-compose.prod.yml logs backend
   
   # Restart backend
   docker-compose -f docker-compose.prod.yml restart backend
   ```

2. **Database Connection Error**
   ```bash
   # Check database status
   docker-compose -f docker-compose.prod.yml ps db
   
   # Check database logs
   docker-compose -f docker-compose.prod.yml logs db
   ```

3. **SSL Certificate Issues**
   ```bash
   # Renew certificate
   docker-compose -f docker-compose.prod.yml run --rm certbot renew
   docker-compose -f docker-compose.prod.yml restart nginx
   ```

4. **Out of Memory**
   ```bash
   # Check memory usage
   free -h
   
   # Increase swap space
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong SECRET_KEY
- [ ] Enable firewall (UFW)
- [ ] Setup SSL/TLS certificates
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Regular security updates
- [ ] Setup automated backups
- [ ] Monitor logs regularly
- [ ] Use environment variables for secrets
- [ ] Disable DEBUG in production
- [ ] Configure allowed hosts properly
- [ ] Setup fail2ban (optional)
- [ ] Enable database encryption (optional)

---

## Performance Optimization

### Backend Optimization

```python
# settings.py additions
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://redis:6379/1',
    }
}

# Database connection pooling
DATABASES = {
    'default': {
        # ... existing config
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'connect_timeout': 10,
        }
    }
}
```

### Frontend Optimization

```bash
# Already configured in vite.config.ts
# - Code splitting
# - Tree shaking
# - Minification
# - Gzip compression
```

---

## Cost Estimation

### AWS Costs (Monthly)
- EC2 t3.medium: ~$30
- EBS Storage (30GB): ~$3
- Data Transfer: ~$10
- **Total: ~$43/month**

### Digital Ocean Costs (Monthly)
- Droplet (4GB RAM): $24
- Managed Database (optional): $15
- Spaces (optional): $5
- **Total: ~$24-44/month**

---

## Support & Resources

- Django Documentation: https://docs.djangoproject.com/
- Docker Documentation: https://docs.docker.com/
- Nginx Documentation: https://nginx.org/en/docs/
- WorkOS Documentation: https://workos.com/docs
- Let's Encrypt: https://letsencrypt.org/docs/

---

## Conclusion

This guide provides a complete production deployment setup for the MedhaBangla platform. Follow each step carefully and customize configurations based on your specific requirements.

For questions or issues, refer to the troubleshooting section or consult the official documentation of each technology used.

**Happy Deploying! 🚀**
