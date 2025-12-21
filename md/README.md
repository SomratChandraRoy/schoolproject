# MedhaBangla - Educational Platform for Bangladeshi Students

A comprehensive PWA-enabled educational ecosystem specifically for Bangladeshi students (Class 6-12), with localized AI learning remediation, gamified study loops, and teacher/admin management systems.

## 🌟 Features

### 🎓 For Students

#### Smart Quiz System
- Dynamic difficulty leveling with Elo rating system
- Multiple question types: MCQ, Short Answer, Long Answer
- Class-specific questions (Class 6-12)
- Subject-specific quizzes (Physics, Chemistry, Math, Bangla, English, Biology, ICT, General Knowledge)
- Real-time accuracy tracking
- Instant feedback with correct/wrong answers
- Exit quiz anytime and see your accuracy

#### AI-Powered Learning
- **Remedial Learning**: AI analyzes wrong answers and provides detailed explanations in Bangla
- **AI Chat Assistant**: 24/7 AI tutor for homework help, exam prep, and general questions
- **Smart Study Notes**: AI generates summaries, flashcards, and detailed notes from any content
- **Book Summaries**: AI-powered chapter summaries for quick revision
- **Study Pattern Analysis**: Personalized recommendations based on your study habits
- **Syllabus Breakdown**: Detailed chapter breakdowns with learning objectives

#### Gamified Learning
- **4 Educational Games**:
  - Memory Matrix: Improve memory and pattern recognition
  - Equation Storm: Enhance math solving speed
  - Pathfinder: Develop logical thinking
  - Infinite Loop: Challenge your problem-solving skills
- **Point System**: Earn 10 points per correct quiz answer
- **Game Access**: Unlock games after earning 20 points
- **Time-Gated Sessions**: 10-minute game sessions to maintain focus
- **Leaderboards**: Compete with classmates

#### Digital Library
- NCTB textbooks for all classes (6-12)
- Multiple categories: Textbooks, Stories, Poems, Poetry
- Bilingual support: Bangla and English
- PDF viewer with bookmarking
- Reading progress tracking
- AI-powered book summaries

#### Study Tracking
- Track study sessions by subject and duration
- Daily study streaks
- Weekly study time analytics
- Subject-wise breakdown
- Personalized study recommendations

#### Progressive Web App (PWA)
- Install as a mobile/desktop app
- Offline note-taking with AI assistance
- Sync notes when online
- Offline access to saved content
- Fast and responsive

### 👨‍🏫 For Teachers

- **Quiz Management**: Full CRUD operations on quiz questions
- **AI Question Generator**: Generate curriculum-appropriate questions using AI
- **Book Management**: Upload and manage textbooks and reading materials
- **Syllabus Management**: Create and update class syllabuses
- **Student Analytics**: View student performance and progress
- **AI Assistant**: Use AI to create educational content

### 👨‍💼 For Admins

- **User Management**: Full CRUD operations on users
- **Role Management**: Promote/demote users (Student/Teacher/Admin)
- **Admin Dashboard**: System statistics and recent users
- **Content Management**: Manage all quizzes, books, and syllabuses
- **System Monitoring**: Track platform usage and performance

## 🛠 Tech Stack

### Backend
- **Framework**: Django 6.0 + Django REST Framework
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **Authentication**: WorkOS (Google OAuth)
- **AI Integration**: Google Gemini API
- **Server**: Gunicorn (Production)
- **API Documentation**: RESTful API with Token Authentication

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **PWA**: vite-plugin-pwa with service worker
- **Offline Storage**: Dexie.js (IndexedDB)
- **PDF Viewer**: react-pdf
- **State Management**: React Hooks + Context API

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **SSL/TLS**: Let's Encrypt (Certbot)
- **Deployment**: AWS EC2 / Digital Ocean Droplets

## 📁 Project Structure

```
medhabangla/
├── backend/                    # Django REST API
│   ├── accounts/              # User management & authentication
│   │   ├── models.py          # User, StudySession, Note models
│   │   ├── views.py           # Auth, profile, study tracking views
│   │   ├── serializers.py     # User serializers
│   │   ├── permissions.py     # Role-based permissions
│   │   └── urls.py            # Account endpoints
│   ├── quizzes/               # Quiz system
│   │   ├── models.py          # Quiz, QuizAttempt, Analytics models
│   │   ├── views.py           # Quiz CRUD, attempt, analytics views
│   │   └── urls.py            # Quiz endpoints
│   ├── books/                 # Digital library
│   │   ├── models.py          # Book, Bookmark, Syllabus models
│   │   ├── views.py           # Book management views
│   │   └── urls.py            # Book endpoints
│   ├── games/                 # Gamification system
│   │   ├── models.py          # Game, GameSession, Leaderboard models
│   │   ├── views.py           # Game logic and leaderboard views
│   │   └── urls.py            # Game endpoints
│   ├── ai/                    # AI integration
│   │   ├── models.py          # AI chat, notes, remedial models
│   │   ├── views.py           # AI endpoints
│   │   ├── ai_helper.py       # Centralized AI helper class
│   │   └── urls.py            # AI endpoints
│   ├── medhabangla/           # Main Django project
│   │   ├── settings.py        # Django settings
│   │   ├── urls.py            # Main URL configuration
│   │   └── wsgi.py            # WSGI application
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile             # Development Dockerfile
│   ├── Dockerfile.prod        # Production Dockerfile
│   └── manage.py              # Django management script
├── frontend/                  # React frontend
│   └── medhabangla/
│       ├── src/
│       │   ├── components/    # Reusable components
│       │   │   ├── Navbar.tsx
│       │   │   ├── AIChat.tsx
│       │   │   ├── PDFViewer.tsx
│       │   │   ├── ProtectedRoute.tsx
│       │   │   └── QuestionGenerator.tsx
│       │   ├── pages/         # Page components (18 pages)
│       │   │   ├── Home.tsx
│       │   │   ├── Login.tsx
│       │   │   ├── Register.tsx
│       │   │   ├── AuthCallback.tsx
│       │   │   ├── Dashboard.tsx
│       │   │   ├── Quiz.tsx
│       │   │   ├── QuizSelection.tsx
│       │   │   ├── Books.tsx
│       │   │   ├── Games.tsx
│       │   │   ├── Leaderboard.tsx
│       │   │   ├── Profile.tsx
│       │   │   ├── Notes.tsx
│       │   │   ├── AdminDashboard.tsx
│       │   │   ├── QuizManagement.tsx
│       │   │   ├── Syllabus.tsx
│       │   │   ├── StudyTimer.tsx
│       │   │   └── StudyStats.tsx
│       │   ├── contexts/      # React contexts
│       │   │   └── DarkModeContext.tsx
│       │   ├── hooks/         # Custom hooks
│       │   ├── App.tsx        # Main app component
│       │   └── main.tsx       # Entry point
│       ├── public/            # Static assets
│       ├── package.json       # Frontend dependencies
│       ├── vite.config.ts     # Vite configuration
│       ├── tailwind.config.js # Tailwind configuration
│       ├── Dockerfile.frontend # Development Dockerfile
│       └── Dockerfile.prod    # Production Dockerfile
├── md/                        # Documentation
│   ├── README.md              # This file
│   ├── API_DOCS.md            # API documentation
│   ├── ARCHITECTURE.md        # Architecture overview
│   ├── DEPLOYMENT.md          # Deployment guide
│   ├── production-by-kiro.md  # Complete production deployment guide
│   ├── QUICK_START.md         # Quick start guide
│   ├── TESTING.md             # Testing guide
│   └── ROADMAP.md             # Future roadmap
├── nginx.conf                 # Nginx configuration (development)
├── nginx.prod.conf            # Nginx configuration (production)
├── docker-compose.yml         # Development Docker Compose
├── docker-compose.prod.yml    # Production Docker Compose
└── README.md                  # Project overview

```

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose (v2.0+)
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- Git

### Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd medhabangla
   ```

2. **Configure environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your API keys
   
   # Frontend
   cp frontend/medhabangla/.env.example frontend/medhabangla/.env
   # Edit frontend/medhabangla/.env with your API keys
   ```

3. **Start the development environment**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin

5. **Create a superuser**
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

### Local Development Setup

#### Backend (Django)

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run development server**
   ```bash
   python manage.py runserver
   ```

#### Frontend (React)

1. **Navigate to frontend directory**
   ```bash
   cd frontend/medhabangla
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

## 🔑 API Keys Setup

### WorkOS (Google OAuth)

1. Sign up at [WorkOS](https://workos.com)
2. Create a new project
3. Configure Google OAuth provider
4. Add redirect URIs:
   - Development: `http://localhost:5173/auth/callback`
   - Production: `https://your-domain.com/auth/callback`
5. Copy API Key and Client ID to `.env` files

### Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key to `.env` files

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/accounts/workos-auth/          # Google OAuth callback
POST /api/accounts/register/             # Manual registration (optional)
GET  /api/accounts/profile/              # Get user profile
PUT  /api/accounts/profile/              # Update user profile
PATCH /api/accounts/profile/update/      # Update class level & subjects
```

### Quiz Endpoints

```
GET  /api/quizzes/                       # List quizzes (filtered by class)
POST /api/quizzes/                       # Create quiz (teachers/admins)
GET  /api/quizzes/{id}/                  # Get quiz details
PUT  /api/quizzes/{id}/                  # Update quiz (teachers/admins)
DELETE /api/quizzes/{id}/                # Delete quiz (teachers/admins)
POST /api/quizzes/attempt/               # Submit quiz answer
POST /api/quizzes/submit-results/        # Submit quiz results
GET  /api/quizzes/analytics/             # Get user analytics
```

### AI Endpoints

```
POST /api/ai/chat/start/                 # Start AI chat session
POST /api/ai/chat/message/               # Send message to AI
GET  /api/ai/chat/history/{session_id}/  # Get chat history
POST /api/ai/remedial/                   # Get remedial explanation
POST /api/ai/remedial/improved/          # Enhanced remedial learning
POST /api/ai/notes/generate/             # Generate AI study notes
POST /api/ai/book/summary/               # Generate book summary
POST /api/ai/syllabus/breakdown/         # Generate syllabus breakdown
POST /api/ai/game/hint/                  # Get game hint
GET  /api/ai/study/analyze/              # Analyze study pattern
POST /api/ai/generate-question/          # Generate quiz question (teachers)
```

### Game Endpoints

```
GET  /api/games/                         # List available games
POST /api/games/start/                   # Start game session
POST /api/games/end/                     # End game session
GET  /api/games/leaderboard/{game_id}/   # Get game leaderboard
```

### Book Endpoints

```
GET  /api/books/books/                   # List books
POST /api/books/books/                   # Upload book (teachers/admins)
GET  /api/books/books/{id}/              # Get book details
POST /api/books/bookmarks/               # Save bookmark
GET  /api/books/syllabus/                # Get syllabus
```

For complete API documentation, see [API_DOCS.md](./API_DOCS.md)

## 🚢 Production Deployment

For complete production deployment guide with AWS and Digital Ocean, see [production-by-kiro.md](./production-by-kiro.md)

### Quick Production Deployment

1. **Configure production environment**
   ```bash
   # Update backend/.env.production
   # Update frontend/medhabangla/.env.production
   # Update nginx.prod.conf with your domain
   ```

2. **Build and deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

3. **Setup SSL**
   ```bash
   docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
       --webroot --webroot-path=/var/www/certbot \
       --email your-email@example.com \
       --agree-tos -d your-domain.com -d www.your-domain.com
   ```

4. **Restart services**
   ```bash
   docker-compose -f docker-compose.prod.yml restart
   ```

## 🧪 Testing

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests (if configured)
cd frontend/medhabangla
npm test
```

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- NCTB (National Curriculum and Textbook Board) for curriculum guidelines
- WorkOS for authentication services
- Google for Gemini AI API
- All contributors and testers

## 📞 Support

For support, email support@medhabangla.com or join our Discord community.

## 🗺 Roadmap

See [ROADMAP.md](./ROADMAP.md) for future plans and features.

---

**Made with ❤️ for Bangladeshi Students**
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