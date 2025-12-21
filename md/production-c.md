# MedhaBangla Production Deployment Guide for AWS and DigitalOcean

## Overview

This guide provides detailed instructions for deploying MedhaBangla to production environments on AWS and DigitalOcean. The application uses Docker containers for consistent deployment across environments.

## Prerequisites

Before deploying, ensure you have:
1. An AWS or DigitalOcean account
2. Docker and Docker Compose installed locally
3. Domain name (recommended)
4. SSL certificates (can be obtained through Let's Encrypt)

## Environment Configuration

Create a `.env.prod` file in the root directory with the following variables:

```env
# Django Settings
SECRET_KEY=your-very-secure-secret-key-here
DEBUG=0

# Database
DATABASE_URL=postgresql://medhabangla_user:medhabangla_password@db:5432/medhabangla_db

# WorkOS Authentication
WORKOS_API_KEY=sk_test_REDACTED
WORKOS_CLIENT_ID=client_REDACTED
WORKOS_REDIRECT_URI=https://yourdomain.com/auth/callback

# Google Gemini API
GEMINI_API_KEY=AIza_REDACTED

# Email Configuration (for production)
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@domain.com
EMAIL_HOST_PASSWORD=REDACTED
DEFAULT_FROM_EMAIL=your-email@domain.com
```

## AWS Deployment

### Option 1: AWS ECS with Fargate

1. **Create ECR Repositories**
   ```bash
   aws ecr create-repository --repository-name medhabangla/backend --region us-east-1
   aws ecr create-repository --repository-name medhabangla/frontend --region us-east-1
   ```

2. **Authenticate with ECR**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
   ```

3. **Build and Push Docker Images**
   ```bash
   # Build and push backend
   docker build -t medhabangla/backend -f backend/Dockerfile.prod ./backend
   docker tag medhabangla/backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/medhabangla/backend:latest
   docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/medhabangla/backend:latest
   
   # Build and push frontend
   docker build -t medhabangla/frontend -f frontend/medhabangla/Dockerfile.prod ./frontend/medhabangla
   docker tag medhabangla/frontend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/medhabangla/frontend:latest
   docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/medhabangla/frontend:latest
   ```

4. **Create ECS Cluster**
   ```bash
   aws ecs create-cluster --cluster-name medhabangla-cluster --region us-east-1
   ```

5. **Set Up RDS for PostgreSQL**
   - Navigate to RDS in AWS Console
   - Create a PostgreSQL database instance
   - Note the endpoint, username, and password
   - Update your DATABASE_URL in the environment configuration

6. **Create Task Definitions**
   Create `backend-task-definition.json`:
   ```json
   {
     "family": "medhabangla-backend",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "512",
     "memory": "1024",
     "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "backend",
         "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/medhabangla/backend:latest",
         "portMappings": [
           {
             "containerPort": 8000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "DATABASE_URL",
             "value": "postgresql://username:password@your-rds-endpoint:5432/medhabangla_db"
           },
           {
             "name": "SECRET_KEY",
             "value": "your-secret-key"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/medhabangla-backend",
             "awslogs-region": "us-east-1",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ]
   }
   ```

7. **Deploy Services**
   ```bash
   aws ecs register-task-definition --cli-input-json file://backend-task-definition.json --region us-east-1
   aws ecs create-service --cluster medhabangla-cluster --service-name medhabangla-backend --task-definition medhabangla-backend --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxxxxx],securityGroups=[sg-xxxxxxxx],assignPublicIp=ENABLED}" --region us-east-1
   ```

### Option 2: AWS Lightsail with Containers

1. **Install AWS CLI and Lightsail plugin**
   ```bash
   pip install awscli
   aws lightsail register-container-image --service-name medhabangla-backend --label latest --region us-east-1
   ```

2. **Create Lightsail Container Service**
   - Navigate to Lightsail in AWS Console
   - Create a container service with scale: 1
   - Deploy containers using the uploaded images

## DigitalOcean Deployment

### Option 1: DigitalOcean App Platform

1. **Create App Specification**
   Create `app.yaml`:
   ```yaml
   name: medhabangla
   region: nyc
   services:
   - name: backend
     github:
       repo: your-username/medhabangla
       branch: main
       deploy_on_push: true
     dockerfile_path: backend/Dockerfile.prod
     envs:
     - key: DATABASE_URL
       value: ${db.DATABASE_URL}
     - key: SECRET_KEY
       value: "your-secret-key"
       type: SECRET
     routes:
     - path: /api
     - path: /admin
     - path: /static
     - path: /media
   - name: frontend
     github:
       repo: your-username/medhabangla
       branch: main
       deploy_on_push: true
     dockerfile_path: frontend/medhabangla/Dockerfile.prod
     routes:
     - path: /
   databases:
   - name: db
     engine: PG
     version: "15"
   ```

2. **Deploy to App Platform**
   - Navigate to App Platform in DigitalOcean Console
   - Create a new app using the specification file
   - Connect to your GitHub repository
   - Deploy the application

### Option 2: DigitalOcean Droplet with Docker

1. **Create Droplet**
   - Create Ubuntu 22.04 LTS droplet
   - Select appropriate size (minimum 2GB RAM recommended)
   - Add SSH keys for secure access

2. **SSH into Droplet**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Install Docker and Docker Compose**
   ```bash
   # Update system
   apt update && apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Docker Compose
   curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   chmod +x /usr/local/bin/docker-compose
   ```

4. **Clone Repository**
   ```bash
   apt install git -y
   git clone https://github.com/your-username/medhabangla.git
   cd medhabangla
   ```

5. **Configure Environment**
   ```bash
   cp .env.example .env.prod
   # Edit .env.prod with your production values
   nano .env.prod
   ```

6. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

7. **Set Up Nginx and SSL (Optional)**
   ```bash
   # Install Nginx
   apt install nginx -y
   
   # Create Nginx configuration
   nano /etc/nginx/sites-available/medhabangla
   
   # Enable site
   ln -s /etc/nginx/sites-available/medhabangla /etc/nginx/sites-enabled/
   rm /etc/nginx/sites-enabled/default
   
   # Test and restart Nginx
   nginx -t
   systemctl restart nginx
   
   # Install Certbot for SSL
   apt install certbot python3-certbot-nginx -y
   
   # Obtain SSL certificate
   certbot --nginx -d yourdomain.com
   ```

## Domain Configuration

### Setting Up Custom Domain

1. **Point Domain to Server IP**
   - Update A record to point to your server IP
   - Update CNAME records for www subdomain if needed

2. **Configure Nginx for Domain**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       
       location /api/ {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

## Monitoring and Maintenance

### Health Checks

1. **Backend Health Check Endpoint**
   ```
   GET /api/health/
   ```

2. **Database Health Check**
   ```bash
   docker exec -it medhabangla_db_1 pg_isready
   ```

### Backup Strategy

1. **Automated Database Backups**
   ```bash
   # Create backup script
   #!/bin/bash
   docker exec medhabangla_db_1 pg_dump -U medhabangla_user medhabangla_db > /backups/medhabangla_$(date +"%Y%m%d").sql
   
   # Schedule with cron
   0 2 * * * /path/to/backup_script.sh
   ```

2. **Static Asset Backups**
   - Use cloud storage (S3, Spaces) for media files
   - Enable versioning for rollback capability

### Scaling

1. **Horizontal Scaling**
   - Increase container replicas in Docker Compose
   - Use load balancers for traffic distribution
   - Implement database read replicas for heavy read workloads

2. **Vertical Scaling**
   - Upgrade droplet/server specifications
   - Allocate more CPU/memory to containers

## Security Best Practices

### Network Security

1. **Firewall Configuration**
   - Restrict database port access (5432) to backend container only
   - Use security groups to limit exposed ports
   - Implement private networks for inter-service communication

2. **Encryption**
   - Enable SSL/TLS for all communications
   - Use encrypted storage for sensitive data
   - Rotate secrets and API keys regularly

### Application Security

1. **Input Validation**
   - Sanitize all user inputs
   - Implement CSRF protection
   - Use parameterized queries to prevent SQL injection

2. **Authentication Security**
   - Implement rate limiting for login attempts
   - Use secure password storage with bcrypt
   - Enable two-factor authentication for admin users

## Troubleshooting Common Issues

### Database Connection Issues

1. **Check Network Connectivity**
   ```bash
   telnet your-database-host 5432
   ```

2. **Verify Credentials**
   - Check DATABASE_URL format
   - Confirm username/password in environment variables

### Authentication Problems

1. **WorkOS Configuration**
   - Verify API key and client ID
   - Check redirect URIs match your domain
   - Confirm domain is whitelisted in WorkOS dashboard

### Performance Issues

1. **Database Optimization**
   - Add indexes on frequently queried fields
   - Optimize slow queries with EXPLAIN ANALYZE
   - Consider read replicas for scaling

2. **Caching**
   - Implement Redis caching for frequent API responses
   - Use CDN for static assets
   - Enable browser caching headers

## Cost Optimization

### Resource Rightsizing

1. **Container Resources**
   - Monitor CPU/memory usage with `docker stats`
   - Adjust container limits in docker-compose.prod.yml
   - Use spot instances where possible (AWS)

2. **Database Optimization**
   - Right-size database instances based on usage
   - Use read replicas only when necessary
   - Implement connection pooling

### Storage Optimization

1. **Static Assets**
   - Compress images and files before upload
   - Use appropriate storage tiers (S3 Standard vs Glacier)
   - Implement lifecycle policies for old files

2. **Database Storage**
   - Regular cleanup of old logs and temporary data
   - Archive infrequently accessed data
   - Optimize table structures and indexing

## Conclusion

This guide provides comprehensive instructions for deploying MedhaBangla to production on AWS and DigitalOcean. The containerized architecture ensures consistency between development and production environments, while the modular design allows for scalable and maintainable deployments.

Choose the deployment option that best fits your infrastructure requirements, budget, and expertise level. Always follow security best practices and implement proper monitoring to ensure a reliable and secure educational platform for Bangladeshi students.