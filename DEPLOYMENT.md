# MedhaBangla Deployment Guide

## Overview

This guide provides instructions for deploying MedhaBangla to various cloud platforms. The application is designed to be cloud-native with Docker containerization, making it compatible with most modern deployment platforms.

## Prerequisites

Before deploying, ensure you have:
1. A cloud platform account (AWS, Google Cloud, Azure, etc.)
2. Docker and Docker Compose installed locally
3. Domain name (optional but recommended)
4. SSL certificates (can be obtained through Let's Encrypt)

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=0

# Database
DATABASE_URL=postgresql://medhabangla_user:medhabangla_password@db:5432/medhabangla_db

# WorkOS Authentication
WORKOS_API_KEY=your-workos-api-key
WORKOS_CLIENT_ID=your-workos-client-id

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Email Configuration (for production)
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@domain.com
EMAIL_HOST_PASSWORD=REDACTED
DEFAULT_FROM_EMAIL=your-email@domain.com
```

## Platform-Specific Deployment Instructions

### 1. AWS Deployment

#### Option A: AWS ECS (Elastic Container Service)

1. **Create ECR Repositories**
   ```bash
   aws ecr create-repository --repository-name medhabangla/backend
   aws ecr create-repository --repository-name medhabangla/frontend
   ```

2. **Build and Push Docker Images**
   ```bash
   # Authenticate with ECR
   aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account.dkr.ecr.your-region.amazonaws.com
   
   # Build and push backend
   docker build -t medhabangla/backend -f backend/Dockerfile.prod ./backend
   docker tag medhabangla/backend:latest your-account.dkr.ecr.your-region.amazonaws.com/medhabangla/backend:latest
   docker push your-account.dkr.ecr.your-region.amazonaws.com/medhabangla/backend:latest
   
   # Build and push frontend
   docker build -t medhabangla/frontend -f frontend/medhabangla/Dockerfile.prod ./frontend/medhabangla
   docker tag medhabangla/frontend:latest your-account.dkr.ecr.your-region.amazonaws.com/medhabangla/frontend:latest
   docker push your-account.dkr.ecr.your-region.amazonaws.com/medhabangla/frontend:latest
   ```

3. **Create ECS Task Definitions**
   Create task definitions for each service using the AWS Console or CLI.

4. **Set Up RDS for PostgreSQL**
   - Create a PostgreSQL instance in RDS
   - Update the DATABASE_URL in your environment variables

5. **Deploy with ECS Services**
   - Create services for each container
   - Configure load balancers and networking

#### Option B: AWS Elastic Beanstalk

1. **Prepare Application Bundle**
   ```bash
   # Create a zip file with your application
   zip -r medhabangla.zip backend frontend docker-compose.prod.yml nginx.conf
   ```

2. **Deploy to Elastic Beanstalk**
   - Create a new application
   - Upload the zip file
   - Configure environment variables
   - Set up RDS separately for the database

### 2. Google Cloud Platform (GCP) Deployment

#### Option A: Google Kubernetes Engine (GKE)

1. **Set Up GKE Cluster**
   ```bash
   gcloud container clusters create medhabangla-cluster --num-nodes=3 --zone=your-zone
   ```

2. **Build and Push Images to Google Container Registry**
   ```bash
   # Build and push backend
   docker build -t medhabangla/backend -f backend/Dockerfile.prod ./backend
   docker tag medhabangla/backend:latest gcr.io/your-project/medhabangla/backend:latest
   docker push gcr.io/your-project/medhabangla/backend:latest
   
   # Build and push frontend
   docker build -t medhabangla/frontend -f frontend/medhabangla/Dockerfile.prod ./frontend/medhabangla
   docker tag medhabangla/frontend:latest gcr.io/your-project/medhabangla/frontend:latest
   docker push gcr.io/your-project/medhabangla/frontend:latest
   ```

3. **Create Kubernetes Manifests**
   Create YAML files for deployments, services, and ingress.

4. **Deploy to GKE**
   ```bash
   kubectl apply -f kubernetes-manifests/
   ```

#### Option B: Google Cloud Run

1. **Deploy Backend to Cloud Run**
   ```bash
   gcloud run deploy medhabangla-backend \
     --image gcr.io/your-project/medhabangla/backend \
     --platform managed \
     --region your-region \
     --allow-unauthenticated
   ```

2. **Deploy Frontend to Cloud Run**
   ```bash
   gcloud run deploy medhabangla-frontend \
     --image gcr.io/your-project/medhabangla/frontend \
     --platform managed \
     --region your-region \
     --allow-unauthenticated
   ```

3. **Set Up Cloud SQL for PostgreSQL**
   - Create a PostgreSQL instance
   - Update DATABASE_URL accordingly

### 3. Microsoft Azure Deployment

#### Option A: Azure Container Instances (ACI)

1. **Create Azure Container Registry**
   ```bash
   az acr create --resource-group your-resource-group --name medhabanglaRegistry --sku Basic
   ```

2. **Build and Push Images**
   ```bash
   # Login to ACR
   az acr login --name medhabanglaRegistry
   
   # Build and push backend
   docker build -t medhabangla/backend -f backend/Dockerfile.prod ./backend
   docker tag medhabangla/backend:latest medhabanglaregistry.azurecr.io/medhabangla/backend:latest
   docker push medhabanglaregistry.azurecr.io/medhabangla/backend:latest
   
   # Build and push frontend
   docker build -t medhabangla/frontend -f frontend/medhabangla/Dockerfile.prod ./frontend/medhabangla
   docker tag medhabangla/frontend:latest medhabanglaregistry.azurecr.io/medhabangla/frontend:latest
   docker push medhabanglaregistry.azurecr.io/medhabangla/frontend:latest
   ```

3. **Deploy Containers**
   ```bash
   az container create \
     --resource-group your-resource-group \
     --name medhabangla-backend \
     --image medhabanglaregistry.azurecr.io/medhabangla/backend:latest \
     --dns-name-label medhabangla-backend \
     --ports 8000
   ```

#### Option B: Azure Kubernetes Service (AKS)

1. **Create AKS Cluster**
   ```bash
   az aks create --resource-group your-resource-group --name medhabanglaCluster --node-count 3
   ```

2. **Connect to Cluster**
   ```bash
   az aks get-credentials --resource-group your-resource-group --name medhabanglaCluster
   ```

3. **Deploy Application**
   Create Kubernetes manifests and apply them:
   ```bash
   kubectl apply -f kubernetes-manifests/
   ```

### 4. Heroku Deployment

1. **Create Heroku Apps**
   ```bash
   heroku create medhabangla-backend
   heroku create medhabangla-frontend
   ```

2. **Set Up PostgreSQL Add-on**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev -a medhabangla-backend
   ```

3. **Configure Environment Variables**
   ```bash
   heroku config:set SECRET_KEY=your-secret-key -a medhabangla-backend
   heroku config:set WORKOS_API_KEY=your-key -a medhabangla-backend
   heroku config:set GEMINI_API_KEY=your-key -a medhabangla-backend
   ```

4. **Deploy Backend**
   ```bash
   # In backend directory
   git init
   heroku git:remote -a medhabangla-backend
   git add .
   git commit -m "Initial commit"
   git push heroku master
   ```

5. **Deploy Frontend**
   ```bash
   # In frontend/medhabangla directory
   git init
   heroku git:remote -a medhabangla-frontend
   git add .
   git commit -m "Initial commit"
   git push heroku master
   ```

## Domain Configuration

### Setting Up Custom Domain

1. **Purchase Domain** (if needed)
   - Use AWS Route 53, Google Domains, or any registrar

2. **Configure DNS Records**
   - Point A record to your load balancer/IP
   - Set up CNAME records for subdomains if needed

3. **SSL Certificate**
   - Use Let's Encrypt with Certbot
   - Or use platform-provided SSL (AWS ACM, GCP SSL, etc.)

### Example Nginx SSL Configuration

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # Your existing location blocks here
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## Monitoring and Maintenance

### Health Checks

Implement health checks for each service:

1. **Backend Health Check**
   ```
   GET /health/
   ```

2. **Database Health Check**
   ```
   SELECT 1;
   ```

3. **Frontend Health Check**
   ```
   GET /
   ```

### Backup Strategy

1. **Database Backups**
   - Daily automated backups
   - Point-in-time recovery
   - Cross-region replication

2. **Static Asset Backups**
   - Regular snapshots of storage volumes
   - CDN edge cache invalidation

### Scaling

1. **Horizontal Scaling**
   - Load balancer distribution
   - Auto-scaling groups
   - Container orchestration

2. **Vertical Scaling**
   - Instance size upgrades
   - Memory and CPU allocation

## Troubleshooting Common Issues

### Database Connection Issues

1. **Check Network Connectivity**
   ```bash
   telnet your-database-host 5432
   ```

2. **Verify Credentials**
   - Check DATABASE_URL format
   - Confirm username/password

3. **Firewall Rules**
   - Ensure database port is open
   - Check security group settings

### Authentication Problems

1. **WorkOS Configuration**
   - Verify API key and client ID
   - Check redirect URIs
   - Confirm domain whitelisting

2. **Token Issues**
   - Check token expiration
   - Verify signature algorithm

### Performance Issues

1. **Database Optimization**
   - Add indexes on frequently queried fields
   - Optimize slow queries
   - Consider read replicas

2. **Caching**
   - Implement Redis caching
   - Use CDN for static assets
   - Enable browser caching

### SSL/TLS Issues

1. **Certificate Validation**
   - Check certificate expiration
   - Verify certificate chain
   - Confirm domain matches

2. **Mixed Content**
   - Ensure all resources use HTTPS
   - Update API endpoints to HTTPS

## Cost Optimization

### Resource Rightsizing

1. **Container Resources**
   - Monitor CPU/memory usage
   - Adjust container limits
   - Use spot instances where possible

2. **Database Optimization**
   - Right-size database instances
   - Use read replicas for scaling
   - Implement connection pooling

### Storage Optimization

1. **Static Assets**
   - Compress images and files
   - Use appropriate storage tiers
   - Implement lifecycle policies

2. **Database Storage**
   - Regular cleanup of old data
   - Archive infrequently accessed data
   - Optimize table structures

## Security Best Practices

### Network Security

1. **Firewall Configuration**
   - Restrict database access
   - Limit exposed ports
   - Use private networks

2. **Encryption**
   - Enable SSL/TLS everywhere
   - Encrypt data at rest
   - Use secure communication protocols

### Application Security

1. **Input Validation**
   - Sanitize all user inputs
   - Implement CSRF protection
   - Use parameterized queries

2. **Authentication Security**
   - Implement rate limiting
   - Use secure password storage
   - Enable two-factor authentication

## Conclusion

MedhaBangla is designed for flexible deployment across various cloud platforms. The containerized architecture ensures consistency between development and production environments, while the modular design allows for scalable and maintainable deployments.

Choose the deployment option that best fits your infrastructure requirements, budget, and expertise level. Always follow security best practices and implement proper monitoring to ensure a reliable and secure educational platform for Bangladeshi students.