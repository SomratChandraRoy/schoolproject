# MedhaBangla - Educational Platform

A comprehensive educational platform for Bangladeshi students (Class 6-12) with AI-powered features, quizzes, games, and book reading capabilities.

---

## 🚀 Quick Start

### 1. Start Backend
```bash
cd backend
python manage.py runserver
```

### 2. Start Frontend
```bash
cd frontend/medhabangla
npm run dev
```

### 3. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000

---

## 📚 Documentation

**All documentation is organized in the `md` folder.**

### Quick Links

- **[📖 Start Here](md/START_HERE.md)** - Quick overview and navigation
- **[🚀 Quick Start Guide](md/QUICK_START.md)** - Fast setup instructions
- **[✅ Latest Status](md/FINAL_FIX_SUMMARY.md)** - Current project status
- **[📋 Full Documentation Index](md/INDEX.md)** - Complete documentation list

### Key Documentation

| Topic | File |
|-------|------|
| **Setup** | [md/QUICK_START.md](md/QUICK_START.md) |
| **Authentication** | [md/WORKOS_DASHBOARD_SETUP.md](md/WORKOS_DASHBOARD_SETUP.md) |
| **Troubleshooting** | [md/TROUBLESHOOTING.md](md/TROUBLESHOOTING.md) |
| **API Reference** | [md/API_DOCS.md](md/API_DOCS.md) |
| **Architecture** | [md/ARCHITECTURE.md](md/ARCHITECTURE.md) |
| **Deployment** | [md/DEPLOYMENT.md](md/DEPLOYMENT.md) |

---

## ✅ Current Status

**All authentication issues resolved!** ✅

- ✅ Google OAuth login working
- ✅ User creation/authentication working
- ✅ Duplicate user issues fixed
- ✅ All errors resolved
- ✅ Production ready

**See [md/FINAL_FIX_SUMMARY.md](md/FINAL_FIX_SUMMARY.md) for complete details.**

---

## 🔧 One-Time Setup

### Clean Up Duplicate Users (if needed)
```bash
cd backend
python manage.py cleanup_duplicate_users
```

---

## 🎯 Features

- 🔐 **Google OAuth Authentication** (via WorkOS)
- 📝 **Quizzes** - MCQ, Short, Long questions (Class 6-12)
- 🎮 **Educational Games** - Memory, Math, Logic games
- 📚 **Book Reading** - PDF reader with bookmarks
- 🤖 **AI Integration** - Google Gemini AI assistance
- 📱 **PWA Support** - Offline functionality
- 🌐 **Internationalization** - Bengali & English
- 👥 **Role-Based Access** - Student, Teacher, Admin

---

## 🛠️ Tech Stack

### Backend
- Django 6.0
- Django REST Framework
- WorkOS (Authentication)
- Google Gemini AI
- SQLite (Development) / PostgreSQL (Production)

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Dexie.js (IndexedDB)

---

## 📞 Support

For issues or questions:
1. Check [md/TROUBLESHOOTING.md](md/TROUBLESHOOTING.md)
2. Review [md/FINAL_FIX_SUMMARY.md](md/FINAL_FIX_SUMMARY.md)
3. See [md/INDEX.md](md/INDEX.md) for all documentation

---

## 📄 License

[Add your license here]

---

## 👥 Contributors

[Add contributors here]

---

**For complete documentation, see the [md folder](md/).**
