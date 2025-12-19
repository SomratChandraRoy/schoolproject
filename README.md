# MedhaBangla - Educational Platform for Bangladeshi Students

A comprehensive PWA-enabled educational ecosystem specifically for Bangladeshi students (Class 6-12), with localized AI learning remediation, gamified study loops, and teacher/admin management systems.

## Features

- Smart Quiz System with dynamic difficulty leveling
- AI-powered remedial learning (Gemini API)
- Gamified learning with time-gated access
- Content library with NCTB textbooks
- Role-based access control (Student/Teacher/Admin)
- Progressive Web App with offline capabilities
- WorkOS Google Authentication

## Tech Stack

### Backend
- Django REST Framework (Python)
- PostgreSQL (Production)
- Google Gemini API for AI features
- WorkOS for Google Authentication

### Frontend
- React.js with TypeScript
- Tailwind CSS for styling
- Vite for build tooling
- React Router for navigation
- TanStack Query for data fetching
- Dexie.js for IndexedDB (offline storage)

### Infrastructure
- Docker (Multi-container setup)
- Nginx for reverse proxy and static file serving
- Gunicorn for Django application server

## Project Structure

```
medhabangla/
├── backend/              # Django REST API
│   ├── accounts/         # User management
│   ├── quizzes/          # Quiz system
│   ├── books/            # Digital library
│   ├── games/            # Gamification system
│   ├── ai/               # AI integration
│   ├── medhabangla/      # Main Django project
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile        # Backend Docker configuration
├── frontend/             # React frontend
│   ├── medhabangla/      # Main frontend app
│   │   ├── src/          # Source code
│   │   │   ├── components/ # Reusable components
│   │   │   ├── pages/      # Page components
│   │   │   ├── App.tsx     # Main app component
│   │   │   └── main.tsx    # Entry point
│   │   ├── package.json    # Frontend dependencies
│   │   └── Dockerfile      # Frontend Docker configuration
├── nginx.conf            # Nginx configuration
├── docker-compose.yml    # Development Docker Compose
└── docker-compose.prod.yml # Production Docker Compose
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- Python 3.11+ (for local development)

### Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd medhabangla
   ```

2. Start the development environment:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Database: postgres://medhabangla_user:medhabangla_password@localhost:5432/medhabangla_db

### Local Development Setup

#### Backend (Django)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Start the development server:
   ```bash
   python manage.py runserver
   ```

#### Frontend (React)

1. Navigate to the frontend directory:
   ```bash
   cd frontend/medhabangla
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

For production deployment, use the production Docker Compose file:

```bash
docker-compose -f docker-compose.prod.yml up --build
```

This will start:
- Nginx reverse proxy
- Django backend with Gunicorn
- PostgreSQL database
- React frontend (built and served by Nginx)

## Configuration

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
# Database
DATABASE_URL=postgresql://medhabangla_user:medhabangla_password@db:5432/medhabangla_db

# WorkOS
WORKOS_API_KEY=your_workos_api_key
WORKOS_CLIENT_ID=your_workos_client_id

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Django
SECRET_KEY=your_django_secret_key
DEBUG=0
```

### SSL Configuration

For production SSL setup:
1. Obtain SSL certificates (e.g., using Let's Encrypt)
2. Place certificate files in the `ssl/` directory
3. Uncomment the SSL section in `nginx.conf`
4. Update the Docker Compose file to mount the SSL volume

## Features Overview

### Smart Quiz System
- Hierarchical organization by Class, Subject, and Difficulty
- Dynamic difficulty adjustment using Elo-style leveling
- Multiple question types: MCQ, Short Answer, Long Answer
- Detailed results with accuracy breakdown

### AI Remediation ("Guru" Feature)
- Analysis of incorrect answers
- Personalized explanations in Bangla
- "Check for Understanding" bullet points
- Integration with Google Gemini API

### Gamification Loop ("Mind Zone")
- Points-based access system (20 points minimum)
- 10-minute timed gameplay sessions
- Four educational games:
  - Memory Matrix (pattern recognition)
  - Equation Storm (math solving)
  - Pathfinder (logic/algorithm thinking)
  - Infinite Loop (high-difficulty puzzle)

### Content Library
- NCTB textbooks organized by class
- PDF viewer for reading materials
- Language toggle between English and Bangla
- Story and poetry collections

### PWA & Offline Features
- Installable web application
- Offline notes storage using IndexedDB
- AI-powered note-taking functionality
- Service worker for caching and offline access

### Role-Based Access Control
- Student: Quiz taking, games, AI chat, book reading
- Teacher: CRUD operations for quizzes/questions, dashboard access
- Admin: User management, system analytics, admin panel access

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please open an issue on the GitHub repository.