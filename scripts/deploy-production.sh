#!/bin/bash

# MedhaBangla Production Deployment Script
# This script automates the production deployment process

set -e  # Exit on error

echo "========================================="
echo "MedhaBangla Production Deployment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${NC}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_success "Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
print_success "Docker Compose is installed"

# Check if .env files exist
if [ ! -f "backend/.env.production" ]; then
    print_error "backend/.env.production not found"
    print_info "Please create backend/.env.production with your configuration"
    exit 1
fi
print_success "Backend environment file found"

if [ ! -f "frontend/medhabangla/.env.production" ]; then
    print_error "frontend/medhabangla/.env.production not found"
    print_info "Please create frontend/medhabangla/.env.production with your configuration"
    exit 1
fi
print_success "Frontend environment file found"

# Ask for confirmation
echo ""
print_warning "This will deploy MedhaBangla to production."
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Deployment cancelled"
    exit 0
fi

# Stop existing containers
print_info "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true
print_success "Existing containers stopped"

# Pull latest changes (optional)
read -p "Do you want to pull latest changes from git? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Pulling latest changes..."
    git pull origin main
    print_success "Latest changes pulled"
fi

# Build and start containers
print_info "Building and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
print_info "Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_success "Services are running"
else
    print_error "Services failed to start"
    print_info "Check logs with: docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi

# Run migrations
print_info "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
print_success "Migrations completed"

# Collect static files
print_info "Collecting static files..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput
print_success "Static files collected"

# Check if superuser exists
print_info "Checking for superuser..."
read -p "Do you want to create a superuser? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
fi

# Setup SSL (if not already done)
if [ ! -d "certbot/conf/live" ]; then
    print_warning "SSL certificates not found"
    read -p "Do you want to setup SSL with Let's Encrypt? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your domain name: " DOMAIN
        read -p "Enter your email: " EMAIL
        
        print_info "Requesting SSL certificate..."
        docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email $EMAIL \
            --agree-tos \
            --no-eff-email \
            -d $DOMAIN \
            -d www.$DOMAIN
        
        if [ $? -eq 0 ]; then
            print_success "SSL certificate obtained"
            print_info "Restarting nginx..."
            docker-compose -f docker-compose.prod.yml restart nginx
        else
            print_error "Failed to obtain SSL certificate"
        fi
    fi
fi

# Show service status
echo ""
print_info "Service Status:"
docker-compose -f docker-compose.prod.yml ps

# Show logs
echo ""
print_info "Recent logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20

echo ""
print_success "========================================="
print_success "Deployment completed successfully!"
print_success "========================================="
echo ""
print_info "Access your application at:"
print_info "  - Frontend: https://your-domain.com"
print_info "  - Admin: https://your-domain.com/admin"
echo ""
print_info "Useful commands:"
print_info "  - View logs: docker-compose -f docker-compose.prod.yml logs -f"
print_info "  - Restart services: docker-compose -f docker-compose.prod.yml restart"
print_info "  - Stop services: docker-compose -f docker-compose.prod.yml down"
print_info "  - Update: git pull && docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
