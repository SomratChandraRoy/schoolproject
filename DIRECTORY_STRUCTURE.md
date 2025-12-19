# MedhaBangla Directory Structure

## Root Directory

```
medhabangla/
├── backend/                 # Django backend application
├── frontend/                # React frontend application
├── nginx.conf              # Nginx configuration file
├── docker-compose.yml      # Development Docker Compose configuration
├── docker-compose.prod.yml # Production Docker Compose configuration
├── Dockerfile.nginx       # Nginx Docker configuration
├── README.md              # Project overview and setup instructions
├── SUMMARY.md             # Project summary and features overview
├── API_DOCS.md            # API documentation
├── ARCHITECTURE.md        # System architecture documentation
├── DIRECTORY_STRUCTURE.md  # This file
├── start-dev.sh           # Development startup script (Linux/Mac)
├── start-dev.bat          # Development startup script (Windows)
├── migrate-db.sh          # Database migration script (Linux/Mac)
└── migrate-db.bat         # Database migration script (Windows)
```

## Backend Directory

```
backend/
├── accounts/              # User management application
│   ├── migrations/        # Database migrations
│   ├── __init__.py
│   ├── admin.py          # Admin interface configuration
│   ├── apps.py           # Application configuration
│   ├── models.py         # Data models
│   ├── serializers.py     # Data serialization
│   ├── tests.py          # Unit tests
│   └── views.py          # API views
├── ai/                   # AI integration application
│   ├── migrations/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── serializers.py
│   ├── tests.py
│   └── views.py
├── books/                # Digital library application
│   ├── migrations/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── serializers.py
│   ├── tests.py
│   └── views.py
├── games/                # Gamification application
│   ├── migrations/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── serializers.py
│   ├── tests.py
│   └── views.py
├── medhabangla/          # Main Django project
│   ├── __init__.py
│   ├── asgi.py          # ASGI configuration
│   ├── settings.py      # Django settings
│   ├── urls.py          # URL routing
│   └── wsgi.py          # WSGI configuration
├── quizzes/              # Quiz system application
│   ├── migrations/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── serializers.py
│   ├── tests.py
│   └── views.py
├── manage.py            # Django management script
├── requirements.txt     # Python dependencies
├── populate_data.py     # Sample data population script
├── tests.py            # Backend test suite
├── Dockerfile          # Backend Docker configuration
├── Dockerfile.prod     # Production backend Docker configuration
└── .env.example        # Environment variables example
```

## Frontend Directory

```
frontend/
└── medhabangla/          # React application
    ├── public/           # Public assets
    │   └── index.html    # Main HTML file
    ├── src/              # Source code
    │   ├── components/   # Reusable components
    │   │   ├── AIChat.tsx      # AI chat widget
    │   │   └── Navbar.tsx      # Navigation bar
    │   ├── pages/        # Page components
    │   │   ├── Home.tsx        # Homepage
    │   │   ├── Login.tsx       # Login page
    │   │   ├── Register.tsx    # Registration page
    │   │   ├── Dashboard.tsx   # User dashboard
    │   │   ├── Quiz.tsx        # Quiz interface
    │   │   ├── Books.tsx       # Digital library
    │   │   ├── Games.tsx       # Gamification zone
    │   │   └── Profile.tsx     # User profile
    │   ├── App.css         # Global styles
    │   ├── App.tsx         # Main application component
    │   ├── index.css       # Base styles
    │   ├── main.tsx        # Application entry point
    │   └── sw.ts           # Service worker
    ├── package.json       # Node.js dependencies
    ├── package-lock.json  # Dependency lock file
    ├── tsconfig.json      # TypeScript configuration
    ├── tsconfig.node.json # Node TypeScript configuration
    ├── vite.config.ts     # Vite build configuration
    ├── tailwind.config.js # Tailwind CSS configuration
    ├── postcss.config.js  # PostCSS configuration
    ├── Dockerfile.frontend # Frontend Docker configuration
    ├── Dockerfile.prod    # Production frontend Docker configuration
    ├── install-deps.bat   # Dependency installation script
    └── install-pwa-deps.bat # PWA dependency installation script
```

## Docker Configuration Files

### Development Docker Compose (docker-compose.yml)
```yaml
version: '3.8'
services:
  db:              # PostgreSQL database
  backend:         # Django application
  frontend:        # React development server
volumes:
  postgres_data:   # Database persistence
```

### Production Docker Compose (docker-compose.prod.yml)
```yaml
version: '3.8'
services:
  db:              # PostgreSQL database
  backend:         # Django with Gunicorn
  frontend:        # Built React application
  nginx:           # Nginx reverse proxy
volumes:
  postgres_data:   # Database persistence
  static_volume:   # Static files
  media_volume:    # Media files
  frontend_build:  # Frontend build artifacts
```

## Configuration Files

### Nginx Configuration (nginx.conf)
- Reverse proxy setup
- Static file serving
- SSL configuration
- Rate limiting
- Security headers

### Django Settings (backend/medhabangla/settings.py)
- Database configuration
- Installed applications
- Middleware configuration
- Authentication settings
- Static and media file settings
- Third-party service keys

### Environment Variables (.env)
- Database connection string
- Secret key
- API keys (WorkOS, Gemini)
- Debug settings
- Allowed hosts

## Asset Directories

### Public Assets (frontend/medhabangla/public/)
- favicon.ico
- manifest.json (PWA configuration)
- robots.txt
- Static images and icons

### Source Assets (frontend/medhabangla/src/assets/)
- Component-specific images
- Icons
- Theme files

## Documentation Files

### README.md
- Project overview
- Quick start guide
- Technology stack
- Contributing guidelines

### API_DOCS.md
- Endpoint documentation
- Request/response examples
- Authentication guide
- Error handling

### ARCHITECTURE.md
- System diagrams
- Component descriptions
- Data flow explanations
- Deployment architecture

### SUMMARY.md
- Feature overview
- Technical implementation details
- Future enhancements
- Project conclusion

## Script Files

### Development Scripts
- start-dev.sh/bat: Initialize development environment
- migrate-db.sh/bat: Run database migrations

### Installation Scripts
- install-deps.bat: Install frontend dependencies
- install-pwa-deps.bat: Install PWA dependencies

## Test Files

### Backend Tests
- tests.py in each Django app
- Integration tests for API endpoints
- Unit tests for business logic

### Frontend Tests
- Component tests (future enhancement)
- Integration tests (future enhancement)
- End-to-end tests (future enhancement)

## Build Artifacts

### Docker Images
- Backend image with Django/Gunicorn
- Frontend image with Node.js/Vite
- Nginx image for reverse proxy

### Compiled Assets
- Built React application (in production)
- Minified CSS/JS files
- Optimized images

This directory structure follows best practices for Django/React applications with clear separation of concerns and scalability in mind.