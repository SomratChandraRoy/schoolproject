# 🚀 START HERE - AWS RDS PostgreSQL Setup

## Welcome! 👋

This guide will help you connect your MedhaBangla project to AWS RDS PostgreSQL and migrate all your questions (Classes 6-12).

---

## 📋 What You Need

- ✅ AWS Free Tier account
- ✅ Your question JSON files (in A.C.Q folder)
- ✅ 30 minutes of time
- ✅ Internet connection

---

## 🎯 What You'll Get

After completing this setup:

- ✅ Cloud PostgreSQL database (AWS RDS)
- ✅ All questions migrated (Classes 6-12)
- ✅ Class-based subject filtering
- ✅ Production-ready infrastructure
- ✅ Scalable database

---

## 🗺️ Setup Path (Choose One)

### Path 1: Quick Setup (Recommended) ⚡
**Time:** 15-20 minutes
**Best for:** Getting started fast

1. Read: **QUICK_START_AWS_RDS.md**
2. Follow: 3 simple steps
3. Run: `setup_aws_rds.bat`
4. Done! ✅

### Path 2: Detailed Setup 📚
**Time:** 30-40 minutes
**Best for:** Understanding everything

1. Read: **AWS_RDS_SETUP_GUIDE.md**
2. Read: **MIGRATION_TO_AWS_RDS.md**
3. Follow: Step-by-step instructions
4. Track: **AWS_SETUP_CHECKLIST.md**
5. Done! ✅

### Path 3: Reference Setup 📖
**Time:** As needed
**Best for:** Troubleshooting and reference

1. Start: **README_AWS_SETUP.md**
2. Reference: As you go
3. Troubleshoot: When needed
4. Done! ✅

---

## 🚀 Quick Start (5 Minutes to First Step)

### Step 1: Create AWS RDS Database (10 min)

1. **Login to AWS Console:** https://aws.amazon.com/console/
2. **Go to RDS** → Click "Create database"
3. **Choose:**
   - Engine: PostgreSQL 15.x
   - Template: Free tier
   - DB identifier: `medhabangla-db`
   - Master username: `postgres`
   - Master password: [YOUR_PASSWORD] ⚠️ Save this!
4. **Important Settings:**
   - Public access: **YES**
   - Initial database name: `medhabangla`
5. **Create** and wait 5-10 minutes
6. **Copy endpoint** from database details

### Step 2: Configure Your Project (2 min)

```bash
cd backend
copy .env.aws.example .env
notepad .env
```

**Fill in:**
```env
DB_PASSWORD=REDACTED
DB_HOST=medhabangla-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com
```

### Step 3: Run Setup (5 min)

```bash
setup_aws_rds.bat
```

**That's it!** 🎉

---

## 📚 Documentation Files

### Quick Reference
| File | Purpose | When to Use |
|------|---------|-------------|
| **QUICK_START_AWS_RDS.md** | Fast setup guide | Getting started |
| **AWS_RDS_SETUP_GUIDE.md** | Detailed AWS setup | Creating database |
| **MIGRATION_TO_AWS_RDS.md** | Migration guide | Migrating project |
| **README_AWS_SETUP.md** | Complete reference | Troubleshooting |
| **AWS_SETUP_CHECKLIST.md** | Progress tracker | Tracking progress |
| **AWS_FILES_SUMMARY.md** | File overview | Understanding files |

---

## 🔧 Key Files You'll Use

### Configuration
- **backend/.env.aws.example** → Copy to `.env` and fill in credentials
- **backend/medhabangla/settings.py** → Already updated for AWS RDS

### Scripts
- **backend/test_aws_connection.py** → Test database connection
- **backend/setup_aws_rds.bat** → Automated setup
- **backend/quizzes/management/commands/migrate_questions_from_json.py** → Migrate questions

### Questions
- **A.C.Q/6.json** → Class 6 questions
- **A.C.Q/7.json** → Class 7 questions
- **A.C.Q/8.json** → Class 8 questions
- **A.C.Q/9.json** → Class 9 questions
- **A.C.Q/10.json** → Class 10 questions
- **A.C.Q/11-12.json** → Classes 11-12 questions

---

## ✅ Success Checklist

Quick checklist to verify everything works:

- [ ] AWS RDS database created
- [ ] Database status: "Available"
- [ ] Security group configured (port 5432)
- [ ] .env file configured with credentials
- [ ] Connection test passed: `python test_aws_connection.py`
- [ ] Migrations applied: `python manage.py migrate`
- [ ] Superuser created: `python manage.py createsuperuser`
- [ ] Questions migrated: `python manage.py migrate_questions_from_json`
- [ ] Server starts: `python manage.py runserver`
- [ ] Admin panel works: http://localhost:8000/admin/
- [ ] Quizzes work correctly

---

## 🐛 Common Issues

### "Connection timeout"
**Fix:** Check security group allows port 5432
**Test:** `python test_aws_connection.py`

### "Authentication failed"
**Fix:** Verify password in .env file
**Check:** DB_PASSWORD matches AWS RDS password

### "No questions migrated"
**Fix:** Check JSON files in A.C.Q folder
**Try:** `python manage.py migrate_questions_from_json --class 6`

### "Superuser page not accessible"
**Fix:** Set user role to 'admin'
```python
python manage.py shell
>>> from accounts.models import User
>>> user = User.objects.get(username='your_username')
>>> user.role = 'admin'
>>> user.save()
```

---

## 💡 Pro Tips

1. **Use SQLite for local testing:**
   ```env
   USE_SQLITE=True
   ```

2. **Migrate one class at a time:**
   ```bash
   python manage.py migrate_questions_from_json --class 6
   ```

3. **Backup before changes:**
   ```bash
   python manage.py dumpdata quizzes.Quiz > backup.json
   ```

4. **Monitor AWS costs:**
   - AWS Console → Billing Dashboard
   - Set up billing alerts

5. **Stop database when not in use:**
   - AWS Console → RDS → Stop database
   - Saves costs during development

---

## 📞 Need Help?

### Quick Commands

**Test connection:**
```bash
python test_aws_connection.py
```

**Check questions:**
```bash
python manage.py shell
>>> from quizzes.models import Quiz
>>> Quiz.objects.count()
```

**View logs:**
```bash
python manage.py runserver
```

### Documentation

- **Quick issues:** See QUICK_START_AWS_RDS.md
- **Detailed help:** See README_AWS_SETUP.md
- **Migration issues:** See MIGRATION_TO_AWS_RDS.md
- **AWS help:** See AWS_RDS_SETUP_GUIDE.md

---

## 🎯 Your Goal

By the end of this setup, you'll have:

```
✅ AWS RDS PostgreSQL Database
    ↓
✅ Django Connected to AWS RDS
    ↓
✅ All Questions Migrated (Classes 6-12)
    ↓
✅ Class-Based Subject Filtering
    ↓
✅ Production-Ready Application
```

---

## 🚀 Let's Get Started!

### Choose Your Path:

**Want to start fast?**
→ Open **QUICK_START_AWS_RDS.md**

**Want detailed guidance?**
→ Open **AWS_RDS_SETUP_GUIDE.md**

**Want to track progress?**
→ Open **AWS_SETUP_CHECKLIST.md**

**Want complete reference?**
→ Open **README_AWS_SETUP.md**

---

## 📊 What's in Your A.C.Q Folder?

Your question files ready to migrate:

```
A.C.Q/
├── 6.json          → Class 6 (Bangla, English, Math, Science, etc.)
├── 7.json          → Class 7 (Bangla, English, Math, Science, etc.)
├── 8.json          → Class 8 (Bangla, English, Math, Science, etc.)
├── 9.json          → Class 9 (Physics, Chemistry, Biology, Math, etc.)
├── 10.json         → Class 10 (Physics, Chemistry, Biology, Math, etc.)
├── 11-12.json      → Classes 11-12 (All subjects)
└── A.C.S.md        → Subject list reference
```

**Total:** Hundreds of questions across all subjects!

---

## 💰 Cost Information

### AWS Free Tier (12 months):
- ✅ 750 hours/month of db.t3.micro
- ✅ 20 GB storage
- ✅ 20 GB backup
- ✅ **Cost: $0.00** (within limits)

### After Free Tier:
- ~$15-20/month for db.t3.micro
- Can stop database when not in use

### Monitor:
- AWS Console → Billing Dashboard
- Set up billing alerts
- Check usage weekly

---

## 🎉 Ready to Begin?

### Next Step:

1. **Open:** QUICK_START_AWS_RDS.md
2. **Follow:** 3 simple steps
3. **Run:** setup_aws_rds.bat
4. **Enjoy:** Your cloud database!

---

## 📝 Quick Commands Reference

```bash
# Navigate to backend
cd backend

# Test connection
python test_aws_connection.py

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Migrate questions
python manage.py migrate_questions_from_json

# Start server
python manage.py runserver

# Check questions
python manage.py shell
>>> from quizzes.models import Quiz
>>> Quiz.objects.count()
```

---

## 🎊 You've Got This!

Setting up AWS RDS is easier than you think. Follow the guides, use the scripts, and you'll have a production-ready database in no time!

**Good luck!** 🚀

---

**Questions?** Check the documentation files listed above.

**Issues?** See the troubleshooting sections in each guide.

**Success?** Celebrate! 🎉 You've just set up cloud infrastructure!
