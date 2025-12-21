# MedhaBangla - Complete Setup Guide

This guide will help you set up the MedhaBangla platform from scratch, whether for development or production.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting API Keys](#getting-api-keys)
3. [Development Setup](#development-setup)
4. [Production Setup](#production-setup)
5. [Common Issues](#common-issues)
6. [Next Steps](#next-steps)

---

## Prerequisites

### Required Software

#### For Development
- **Git**: Version control
  - Windows: Download from [git-scm.com](https://git-scm.com/)
  - Mac: `brew install git`
  - Linux: `sudo apt install git`

- **Docker Desktop**: Container platform
  - Download from [docker.com](https://www.docker.com/products/docker-desktop)
  - Includes Docker and Docker Compose

- **Node.js 18+**: JavaScript runtime (optional for local development)
  - Download from [nodejs.org](https://nodejs.org/)

- **Python 3.11+**: Programming language (optional for local development)
  - Download from [python.org](https://www.python.org/)

#### For Production
- **Server**: AWS EC2 or Digital Ocean Droplet
- **Domain Name**: For SSL certificates
- **SSH Client**: To connect to server

### Required Accounts

1. **WorkOS Account** (for Google OAuth)
   - Sign up at [workos.com](https://workos.com)
   - Free tier available

2. **Google Cloud Account** (for Gemini AI)
   - Sign up at [cloud.google.com](https://cloud.google.com)
   - Free tier available

3. **GitHub Account** (optional, for version control)
   - Sign up at [github.com](https://github.com)

---

## Getting API Keys

### 1. WorkOS Setup (Google OAuth)

#### Step 1: Create WorkOS Account
1. Go to [workos.com](https://workos.com)
2. Click "Sign Up" and create an account
3. Verify your email

#### Step 2: Create a Project
1. Log in to WorkOS Dashboard
2. Click "Create Project"
3. Enter project name: "MedhaBangla"
4. Click "Create"

#### Step 3: Configure Google OAuth
1. In your project, go to "Authentication" → "SSO"
2. Click "Add Connection"
3. Select "Google OAuth"
4. Follow the setup wizard:
   - Create Google OAuth credentials in Google Cloud Console
   - Add authorized redirect URIs:
     - Development: `http://localhost:5173/auth/callback`
     - Production: `https://your-domain.com/auth/callback`
   - Copy Client ID and Client Secret to WorkOS

#### Step 4: Get API Keys
1. Go to "API Keys" in WorkOS Dashboard
2. Copy the following:
   - **API Key**: Starts with `sk_test_...`
   - **Client ID**: Starts with `client_...`
3. Save these for later

### 2. Google Gemini API Setup

#### Step 1: Access Google AI Studio
1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account

#### Step 2: Create API Key
1. Click "Create API Key"
2. Select or create a Google Cloud project
3. Click "Create API Key in existing project"
4. Copy the API key (starts with `AIza...`)
5. Save this for later

---

## Development Setup

### Option 1: Docker Setup (Recommended)

#### Step 1: Clone Repository
```bash
# Clone the repository
git clone <repository-url>
cd medhabangla
```

#### Step 2: Configure Environment Variables

**Backend Configuration:**
```bash
# Create backend environment file
cp backend/.env.example backend/.env

# Edit backend/.env (use any text editor)
nano backend/.env
```

Add your API keys:
```env
# WorkOS Configuration
WORKOS_API_KEY=sk_test_your_api_key_here
WORKOS_CLIENT_ID=client_REDACTED
WORKOS_REDIRECT_URI=http://localhost:5173/auth/callback

# Gemini AI Configuration
GEMINI_API_KEY=AIza_your_api_key_here

# Django Configuration
DEBUG=True
SECRET_KEY=django-insecure-REDACTED
ALLOWED_HOSTS=*
```

**Frontend Configuration:**
```bash
# Create frontend environment file
cp frontend/medhabangla/.env.example frontend/medhabangla/.env

# Edit frontend/medhabangla/.env
nano frontend/medhabangla/.env
```

Add your configuration:
```env
VITE_WORKOS_CLIENT_ID=client_REDACTED
VITE_WORKOS_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_GEMINI_API_KEY=AIza_your_api_key_here
```

#### Step 3: Start Development Environment
```bash
# Start all services
docker-compose up --build

# Wait for services to start (may take 2-3 minutes first time)
```

#### Step 4: Create Superuser
```bash
# In a new terminal, create admin user
docker-compose exec backend python manage.py createsuperuser

# Follow the prompts to create your admin account
```

#### Step 5: Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin

### Option 2: Local Setup (Without Docker)

#### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment (same as Docker setup above)
cp .env.example .env
# Edit .env with your API keys

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

#### Frontend Setup

```bash
# In a new terminal, navigate to frontend
cd frontend/medhabangla

# Install dependencies
npm install

# Configure environment (same as Docker setup above)
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

---

## Production Setup

### Prerequisites
- Server (AWS EC2 or Digital Ocean)
- Domain name
- SSH access to server

### Quick Production Deployment

#### Step 1: Prepare Server
```bash
# Connect to your server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again
exit
ssh user@your-server-ip
```

#### Step 2: Clone and Configure
```bash
# Clone repository
git clone <repository-url>
cd medhabangla

# Create production environment files
cp backend/.env.example backend/.env.production
cp frontend/medhabangla/.env.example frontend/medhabangla/.env.production

# Edit production environment files
nano backend/.env.production
nano frontend/medhabangla/.env.production
```

**Production Environment Variables:**
```env
# backend/.env.production
DEBUG=False
SECRET_KEY=generate-a-strong-secret-key-here
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
DOCKER_ENV=True

WORKOS_API_KEY=sk_test_your_api_key
WORKOS_CLIENT_ID=client_REDACTED
WORKOS_REDIRECT_URI=https://your-domain.com/auth/callback

GEMINI_API_KEY=AIza_your_api_key
```

#### Step 3: Deploy
```bash
# Make deployment script executable
chmod +x scripts/deploy-production.sh

# Run deployment script
./scripts/deploy-production.sh

# Or manually:
docker-compose -f docker-compose.prod.yml up -d --build
```

#### Step 4: Setup SSL
```bash
# Request SSL certificate
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    -d your-domain.com \
    -d www.your-domain.com

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

#### Step 5: Configure Domain DNS
In your domain registrar (GoDaddy, Namecheap, etc.):
```
Type    Name    Value               TTL
A       @       your-server-ip      3600
A       www     your-server-ip      3600
```

---

## Common Issues

### Issue 1: Docker Permission Denied
**Error**: `permission denied while trying to connect to the Docker daemon socket`

**Solution**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again
exit
ssh user@your-server-ip
```

### Issue 2: Port Already in Use
**Error**: `Bind for 0.0.0.0:8000 failed: port is already allocated`

**Solution**:
```bash
# Find process using the port
# Linux/Mac:
sudo lsof -i :8000
# Windows:
netstat -ano | findstr :8000

# Kill the process
# Linux/Mac:
sudo kill -9 <PID>
# Windows:
taskkill /PID <PID> /F

# Or change the port in docker-compose.yml
```

### Issue 3: WorkOS Authentication Failed
**Error**: `Authentication failed: Invalid redirect URI`

**Solution**:
1. Check WorkOS Dashboard → Redirect URIs
2. Ensure the URI matches exactly:
   - Development: `http://localhost:5173/auth/callback`
   - Production: `https://your-domain.com/auth/callback`
3. No trailing slashes
4. Correct protocol (http vs https)

### Issue 4: Gemini API Error
**Error**: `API key not valid`

**Solution**:
1. Verify API key in Google AI Studio
2. Check if API is enabled in Google Cloud Console
3. Ensure no extra spaces in .env file
4. Restart backend service

### Issue 5: Database Migration Error
**Error**: `django.db.utils.OperationalError: no such table`

**Solution**:
```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Or for production
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### Issue 6: Static Files Not Loading
**Error**: 404 errors for CSS/JS files

**Solution**:
```bash
# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Or for production
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

---

## Next Steps

### After Setup

1. **Create Test Data**
   ```bash
   # Access Django shell
   docker-compose exec backend python manage.py shell
   
   # Create sample quizzes, books, etc.
   ```

2. **Configure Admin Panel**
   - Go to http://localhost:8000/admin
   - Login with superuser credentials
   - Add quizzes, books, games

3. **Test Authentication**
   - Go to http://localhost:5173
   - Click "Login with Google"
   - Complete OAuth flow

4. **Test AI Features**
   - Take a quiz
   - Get wrong answers
   - Click "Improve" to see AI remedial learning
   - Try AI chat assistant

5. **Explore Features**
   - Create study sessions
   - Read books
   - Play games (after earning 20 points)
   - Take notes

### For Production

1. **Setup Monitoring**
   - Configure logging
   - Setup error tracking (Sentry)
   - Monitor server resources

2. **Setup Backups**
   - Database backups (daily)
   - Media files backups (weekly)
   - Configuration backups

3. **Security Hardening**
   - Change default passwords
   - Configure firewall
   - Enable fail2ban
   - Regular security updates

4. **Performance Optimization**
   - Enable caching (Redis)
   - Configure CDN
   - Optimize database queries

---

## Getting Help

### Documentation
- **Complete Guide**: See `md/production-by-kiro.md`
- **API Docs**: See `md/API_DOCS.md`
- **Architecture**: See `md/ARCHITECTURE.md`

### Support
- **Email**: support@medhabangla.com
- **Issues**: GitHub Issues
- **Documentation**: Check md/ folder

### Useful Commands

**Development:**
```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Rebuild
docker-compose up --build
```

**Production:**
```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop services
docker-compose -f docker-compose.prod.yml down

# Update and rebuild
git pull && docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Congratulations! 🎉

You've successfully set up MedhaBangla! The platform is now ready to serve students with AI-powered learning.

**Happy Learning! 📚**
