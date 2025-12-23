# Quick Start: AWS RDS PostgreSQL Setup

## 🎯 Goal
Connect your MedhaBangla project to AWS RDS PostgreSQL and migrate all questions from JSON files (Classes 6-12).

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Create AWS RDS Database (10 minutes)

Follow `AWS_RDS_SETUP_GUIDE.md` or quick steps:

1. **AWS Console** → **RDS** → **Create database**
2. **Engine:** PostgreSQL 15.x
3. **Template:** Free tier
4. **Settings:**
   - DB identifier: `medhabangla-db`
   - Master username: `postgres`
   - Master password: `[YOUR_PASSWORD]` ⚠️ Save this!
5. **Instance:** db.t3.micro (Free tier)
6. **Storage:** 20 GB
7. **Connectivity:**
   - Public access: **YES**
   - VPC security group: Create new
8. **Additional config:**
   - Initial database name: `medhabangla` ⚠️ Important!
9. **Create database** (wait 5-10 minutes)
10. **Copy endpoint:** `medhabangla-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com`

### Step 2: Configure Security Group

1. Click on your database → **VPC security groups**
2. **Edit inbound rules** → **Add rule**
3. **Type:** PostgreSQL, **Port:** 5432, **Source:** 0.0.0.0/0 (for testing)
4. **Save rules**

### Step 3: Configure Your Project

```bash
cd backend

# Copy environment template
copy .env.aws.example .env

# Edit .env with your credentials
notepad .env
```

**Update .env file:**
```env
DB_NAME=medhabangla
DB_USER=postgres
DB_PASSWORD=REDACTED
DB_HOST=medhabangla-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
USE_SQLITE=False
```

---

## 🚀 Run Migration

### Option 1: Automated Setup (Recommended)

```bash
cd backend
setup_aws_rds.bat
```

This will:
- ✅ Install dependencies
- ✅ Test connection
- ✅ Run migrations
- ✅ Create superuser
- ✅ Migrate questions

### Option 2: Manual Setup

```bash
cd backend

# Install dependencies
pip install psycopg2-binary python-dotenv

# Test connection
python test_aws_connection.py

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Migrate questions
python manage.py migrate_questions_from_json
```

---

## ✅ Verify Setup

### 1. Check Connection
```bash
python test_aws_connection.py
```

Expected output:
```
✅ Connection successful!
📊 PostgreSQL Version: PostgreSQL 15.x
💾 Current Database: medhabangla
```

### 2. Check Questions
```bash
python manage.py shell
```

```python
from quizzes.models import Quiz

# Total questions
print(f"Total: {Quiz.objects.count()}")

# By class
for c in range(6, 13):
    count = Quiz.objects.filter(class_target=c).count()
    print(f"Class {c}: {count} questions")
```

### 3. Start Server
```bash
python manage.py runserver
```

Visit:
- **Admin:** http://localhost:8000/admin/
- **Superuser:** http://localhost:8000/superuser/
- **App:** http://localhost:8000/

---

## 📁 Your Question Files

Located in `A.C.Q/` folder:

| File | Classes | Subjects |
|------|---------|----------|
| 6.json | Class 6 | Bangla, English, Math, Science, etc. |
| 7.json | Class 7 | Bangla, English, Math, Science, etc. |
| 8.json | Class 8 | Bangla, English, Math, Science, etc. |
| 9.json | Class 9 | Physics, Chemistry, Biology, Math, etc. |
| 10.json | Class 10 | Physics, Chemistry, Biology, Math, etc. |
| 11-12.json | Classes 11-12 | Physics, Chemistry, Biology, Higher Math, etc. |

---

## 🔧 Useful Commands

### Migrate Specific Class
```bash
python manage.py migrate_questions_from_json --class 6
```

### Clear and Re-migrate
```bash
python manage.py migrate_questions_from_json --clear
```

### Migrate Specific Subject
```bash
python manage.py migrate_questions_from_json --subject Physics
```

### Backup Questions
```bash
python manage.py dumpdata quizzes.Quiz --indent 2 > backup.json
```

### Restore Questions
```bash
python manage.py loaddata backup.json
```

---

## 🐛 Troubleshooting

### Connection Failed

**Check:**
1. RDS instance is running (AWS Console)
2. Security group allows port 5432
3. Public access enabled
4. Correct endpoint in .env
5. Correct password in .env

**Test:**
```bash
python test_aws_connection.py
```

### Migration Errors

**Check:**
1. JSON files exist in A.C.Q folder
2. Database connection works
3. Migrations applied: `python manage.py migrate`

**Try:**
```bash
# Migrate one class at a time
python manage.py migrate_questions_from_json --class 6
```

### Questions Not Showing

**Check:**
1. Questions in database:
   ```bash
   python manage.py shell
   >>> from quizzes.models import Quiz
   >>> Quiz.objects.count()
   ```
2. User's class matches question class_target
3. Subject names match

---

## 💰 AWS Free Tier

- **750 hours/month** of db.t3.micro
- **20 GB** storage
- **20 GB** backup
- **Valid for 12 months**

**Monitor:** AWS Console → Billing Dashboard

---

## 🔐 Security

### Important:
- ✅ Add `.env` to `.gitignore`
- ✅ Never commit credentials
- ✅ Use strong passwords
- ✅ Restrict security group in production
- ✅ Enable SSL/TLS for production

### .gitignore
```
.env
*.env
.env.*
!.env.example
```

---

## 📚 Documentation

- **AWS_RDS_SETUP_GUIDE.md** - Detailed AWS setup
- **MIGRATION_TO_AWS_RDS.md** - Complete migration guide
- **README_AWS_SETUP.md** - Comprehensive documentation

---

## 🎉 Success Checklist

- [ ] AWS RDS database created
- [ ] Security group configured
- [ ] .env file configured
- [ ] Connection test passed
- [ ] Migrations applied
- [ ] Superuser created
- [ ] Questions migrated
- [ ] Server starts successfully
- [ ] Admin panel accessible
- [ ] Quizzes work correctly

---

## 📞 Need Help?

### Check Logs
```bash
# Django logs
python manage.py runserver

# Database connection
python test_aws_connection.py

# Question count
python manage.py shell
>>> from quizzes.models import Quiz
>>> Quiz.objects.count()
```

### Common Issues

**"Connection timeout"**
→ Check security group allows port 5432

**"Authentication failed"**
→ Verify password in .env file

**"No questions migrated"**
→ Check JSON files in A.C.Q folder

**"Superuser page not accessible"**
→ Check user role is 'admin'

---

## 🚀 Next Steps

After successful setup:

1. ✅ Test all quiz functionality
2. ✅ Verify class-based subject filtering
3. ✅ Test superuser page features
4. ✅ Configure production settings
5. ✅ Set up monitoring
6. ✅ Create backup strategy

---

## 💡 Tips

- **Development:** Use `USE_SQLITE=True` for local testing
- **Production:** Use `USE_SQLITE=False` for AWS RDS
- **Backup:** Regular backups with `dumpdata`
- **Monitor:** Check AWS costs weekly
- **Security:** Restrict security group to specific IPs

---

## 🎊 You're Ready!

Your MedhaBangla project is now connected to AWS RDS PostgreSQL with all questions migrated!

**What you have:**
- ✅ Cloud database (AWS RDS)
- ✅ All questions (Classes 6-12)
- ✅ Class-based subject filtering
- ✅ Admin dashboard
- ✅ Superuser page
- ✅ Production-ready setup

**Start building!** 🚀
