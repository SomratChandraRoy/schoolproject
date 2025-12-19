# MedhaBangla Quick Start Guide

Welcome to MedhaBangla! This guide will help you get up and running with the project quickly.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Git** - Version control system
- **Docker** - Containerization platform
- **Docker Compose** - Multi-container Docker applications
- **Node.js** (v16+) - JavaScript runtime (for frontend development)
- **Python** (3.11+) - Programming language (for backend development)
- **Code Editor** - VS Code, PyCharm, or your preferred editor

## Quick Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/medhabangla.git
cd medhabangla
```

### 2. Start the Development Environment

```bash
# On Linux/Mac
./start-dev.sh

# On Windows
start-dev.bat
```

Alternatively, you can start manually:

```bash
docker-compose up --build
```

### 3. Access the Application

Once the containers are running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin

Default admin credentials (if using sample data):
- Username: `admin1`
- Password: `adminpass123`

## Project Structure

```
medhabangla/
├── backend/          # Django REST API
├── frontend/         # React frontend
├── docker-compose.yml # Development configuration
└── README.md         # Project documentation
```

## Backend Development

### Running Backend Commands

```bash
# Access Django shell
docker-compose exec backend python manage.py shell

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Run tests
docker-compose exec backend python -m pytest
```

### Backend Directory

```
backend/
├── accounts/     # User management
├── quizzes/      # Quiz system
├── books/        # Digital library
├── games/        # Gamification
├── ai/           # AI integration
└── medhabangla/  # Main Django project
```

## Frontend Development

### Running Frontend Commands

```bash
cd frontend/medhabangla

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Frontend Directory

```
frontend/medhabangla/
├── src/
│   ├── components/  # Reusable components
│   ├── pages/       # Page components
│   ├── App.tsx      # Main app component
│   └── main.tsx     # Entry point
├── public/          # Static assets
└── package.json     # Dependencies
```

## Common Development Tasks

### Adding a New Feature

1. **Create a feature branch**
   ```bash
   git checkout -b feature/new-feature-name
   ```

2. **Backend development**
   - Create new Django app if needed: `python manage.py startapp newapp`
   - Add models, views, serializers
   - Create and run migrations
   - Write tests

3. **Frontend development**
   - Create new components in `src/components/`
   - Add new pages in `src/pages/`
   - Update routing in `src/App.tsx`
   - Write component tests

4. **Test your changes**
   ```bash
   # Backend tests
   docker-compose exec backend python -m pytest
   
   # Frontend tests
   cd frontend/medhabangla && npm test
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "Add new feature: description"
   git push origin feature/new-feature-name
   ```

### Database Changes

1. **Modify models** in your Django app
2. **Create migration**
   ```bash
   docker-compose exec backend python manage.py makemigrations
   ```
3. **Apply migration**
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

### Adding Dependencies

**Backend (Python)**:
```bash
# Add to requirements.txt
echo "new-package==1.0.0" >> backend/requirements.txt

# Rebuild container
docker-compose build backend
```

**Frontend (Node.js)**:
```bash
cd frontend/medhabangla
npm install new-package
```

## Useful Docker Commands

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs frontend

# Stop containers
docker-compose down

# Restart specific service
docker-compose restart backend

# Execute commands in container
docker-compose exec backend bash
docker-compose exec frontend bash
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Django settings
SECRET_KEY=your-secret-key
DEBUG=1

# Database
DATABASE_URL=postgresql://medhabangla_user:medhabangla_password@db:5432/medhabangla_db

# External services
WORKOS_API_KEY=your-workos-key
GEMINI_API_KEY=your-gemini-key
```

## Testing

### Run All Tests

```bash
# Backend
docker-compose exec backend python -m pytest

# Frontend
cd frontend/medhabangla && npm test
```

### Run Specific Tests

```bash
# Backend - specific file
docker-compose exec backend python -m pytest tests/test_accounts.py

# Backend - specific test
docker-compose exec backend python -m pytest tests/test_accounts.py::test_user_creation

# Frontend - specific file
cd frontend/medhabangla && npm test src/components/Navbar.test.tsx
```

## Troubleshooting

### Common Issues

1. **Containers won't start**
   ```bash
   # Check logs
   docker-compose logs
   
   # Rebuild containers
   docker-compose down
   docker-compose up --build
   ```

2. **Database connection errors**
   ```bash
   # Check if database is running
   docker-compose ps
   
   # Reset database
   docker-compose down -v
   docker-compose up
   ```

3. **Frontend not loading**
   ```bash
   # Check frontend logs
   docker-compose logs frontend
   
   # Restart frontend
   docker-compose restart frontend
   ```

4. **Permission denied errors**
   ```bash
   # Fix file permissions
   sudo chown -R $(whoami) .
   ```

### Reset Development Environment

```bash
# Stop and remove containers
docker-compose down -v

# Remove node_modules
rm -rf frontend/medhabangla/node_modules

# Start fresh
docker-compose up --build
```

## Next Steps

1. **Explore the codebase** - Familiarize yourself with the directory structure
2. **Read the documentation** - Check README.md and other documentation files
3. **Run the tests** - Ensure everything is working correctly
4. **Pick an issue** - Look for "good first issue" labels on GitHub
5. **Join the community** - Connect with other contributors

## Need Help?

- Check the [README](README.md) for detailed documentation
- Review the [CONTRIBUTING](CONTRIBUTING.md) guidelines
- Open an issue on GitHub for bugs or feature requests
- Join our community chat (if available)

Happy coding! 🚀