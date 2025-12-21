# MedhaBangla - Quick Reference Card

Quick reference for common tasks and commands.

---

## 🚀 Quick Start

### Development
```bash
# Start everything
docker-compose up --build

# Access
Frontend: http://localhost:5173
Backend: http://localhost:8000
Admin: http://localhost:8000/admin
```

### Production
```bash
# Deploy
./scripts/deploy-production.sh

# Or manually
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 📝 Common Commands

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Restart service
docker-compose restart [service_name]

# Rebuild
docker-compose up --build

# Execute command in container
docker-compose exec [service_name] [command]

# Remove all containers and volumes
docker-compose down -v
```

### Django Commands

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Django shell
docker-compose exec backend python manage.py shell

# Create app
docker-compose exec backend python manage.py startapp [app_name]

# Make migrations
docker-compose exec backend python manage.py makemigrations

# Run tests
docker-compose exec backend python manage.py test
```

### Database Commands

```bash
# Access PostgreSQL
docker-compose exec db psql -U medhabangla_user -d medhabangla_db

# Backup database
docker-compose exec db pg_dump -U medhabangla_user medhabangla_db > backup.sql

# Restore database
docker-compose exec -T db psql -U medhabangla_user medhabangla_db < backup.sql

# List databases
docker-compose exec db psql -U medhabangla_user -c "\l"

# List tables
docker-compose exec db psql -U medhabangla_user -d medhabangla_db -c "\dt"
```

### Frontend Commands

```bash
# Install dependencies
cd frontend/medhabangla && npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 🔑 Environment Variables

### Backend (.env)
```env
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=*
DOCKER_ENV=True

WORKOS_API_KEY=sk_test_...
WORKOS_CLIENT_ID=client_...
WORKOS_REDIRECT_URI=http://localhost:5173/auth/callback

GEMINI_API_KEY=AIza...
```

### Frontend (.env)
```env
VITE_WORKOS_CLIENT_ID=client_...
VITE_WORKOS_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_GEMINI_API_KEY=AIza...
```

---

## 📡 API Endpoints

### Authentication
```
POST /api/accounts/workos-auth/          # OAuth callback
GET  /api/accounts/profile/              # Get profile
PUT  /api/accounts/profile/              # Update profile
GET  /api/accounts/dashboard/            # User dashboard
```

### Quizzes
```
GET  /api/quizzes/                       # List quizzes
POST /api/quizzes/                       # Create quiz
POST /api/quizzes/attempt/               # Submit answer
GET  /api/quizzes/analytics/             # Get analytics
```

### AI Features
```
POST /api/ai/chat/start/                 # Start chat
POST /api/ai/chat/message/               # Send message
POST /api/ai/remedial/                   # Get explanation
POST /api/ai/notes/generate/             # Generate notes
POST /api/ai/book/summary/               # Book summary
POST /api/ai/game/hint/                  # Game hint
GET  /api/ai/study/analyze/              # Study analysis
```

### Games
```
GET  /api/games/                         # List games
POST /api/games/start/                   # Start game
POST /api/games/end/                     # End game
GET  /api/games/leaderboard/{id}/        # Leaderboard
```

### Books
```
GET  /api/books/books/                   # List books
POST /api/books/books/                   # Upload book
POST /api/books/bookmarks/               # Save bookmark
GET  /api/books/syllabus/                # Get syllabus
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process
sudo lsof -i :8000  # Linux/Mac
netstat -ano | findstr :8000  # Windows

# Kill process
sudo kill -9 <PID>  # Linux/Mac
taskkill /PID <PID> /F  # Windows
```

### Permission Denied (Docker)
```bash
sudo usermod -aG docker $USER
# Logout and login again
```

### Database Connection Error
```bash
# Check if database is running
docker-compose ps db

# Restart database
docker-compose restart db

# Check logs
docker-compose logs db
```

### Static Files Not Loading
```bash
docker-compose exec backend python manage.py collectstatic --noinput
docker-compose restart nginx
```

### Migration Errors
```bash
# Reset migrations (CAUTION: Development only!)
docker-compose exec backend python manage.py migrate --fake [app_name] zero
docker-compose exec backend python manage.py migrate [app_name]
```

---

## 🔒 Security Checklist

- [ ] Change SECRET_KEY in production
- [ ] Set DEBUG=False in production
- [ ] Configure ALLOWED_HOSTS properly
- [ ] Use strong database passwords
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Regular security updates
- [ ] Setup automated backups
- [ ] Monitor logs regularly

---

## 📊 Monitoring

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f nginx
docker-compose logs -f db

# Last N lines
docker-compose logs --tail=100 backend
```

### Resource Usage
```bash
# Container stats
docker stats

# Disk usage
docker system df

# Clean up
docker system prune -a
```

### Health Checks
```bash
# Check service status
docker-compose ps

# Test backend
curl http://localhost:8000/admin/

# Test frontend
curl http://localhost:5173/
```

---

## 🔄 Update & Maintenance

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run migrations
docker-compose exec backend python manage.py migrate

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput
```

### Backup
```bash
# Database backup
docker-compose exec db pg_dump -U medhabangla_user medhabangla_db > backup_$(date +%Y%m%d).sql

# Media files backup
tar -czf media_backup_$(date +%Y%m%d).tar.gz backend/media/
```

### Restore
```bash
# Database restore
docker-compose exec -T db psql -U medhabangla_user medhabangla_db < backup.sql

# Media files restore
tar -xzf media_backup.tar.gz
```

---

## 🎨 Development Tips

### Hot Reload
- Frontend: Automatic with Vite
- Backend: Automatic with Django dev server

### Debug Mode
```python
# In Django views
import pdb; pdb.set_trace()

# Or use logging
import logging
logger = logging.getLogger(__name__)
logger.debug("Debug message")
```

### Test API with curl
```bash
# Get token
TOKEN="your-token-here"

# Make authenticated request
curl -H "Authorization: Token $TOKEN" http://localhost:8000/api/accounts/profile/

# POST request
curl -X POST -H "Authorization: Token $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"key":"value"}' \
     http://localhost:8000/api/endpoint/
```

---

## 📚 Useful Links

- **Documentation**: `md/` folder
- **Production Guide**: `md/production-by-kiro.md`
- **Setup Guide**: `SETUP_GUIDE.md`
- **API Docs**: `md/API_DOCS.md`
- **Architecture**: `md/ARCHITECTURE.md`

---

## 🆘 Getting Help

1. Check logs: `docker-compose logs -f`
2. Check documentation in `md/` folder
3. Check `SETUP_GUIDE.md` for common issues
4. Check `md/production-by-kiro.md` for deployment issues

---

## 📞 Support

- Email: support@medhabangla.com
- Issues: GitHub Issues
- Documentation: See `md/` folder

---

**Quick Reference v1.0 - MedhaBangla Platform**
