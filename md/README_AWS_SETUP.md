# MedhaBangla AWS RDS PostgreSQL Setup

Complete guide to set up and migrate your MedhaBangla project to AWS RDS PostgreSQL database.

## 📚 Documentation Files

1. **AWS_RDS_SETUP_GUIDE.md** - Step-by-step guide to create PostgreSQL database on AWS
2. **MIGRATION_TO_AWS_RDS.md** - Complete migration guide from SQLite to PostgreSQL
3. **README_AWS_SETUP.md** - This file (quick start guide)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Create AWS RDS Database

Follow the detailed guide in `AWS_RDS_SETUP_GUIDE.md` or quick steps:

1. Login to AWS Console
2. Go to RDS service
3. Click "Create database"
4. Choose PostgreSQL, Free tier template
5. Set database name: `medhabangla`
6. Set master username: `postgres`
7. Set password (save it!)
8. Enable public access
9. Create database (wait 5-10 minutes)
10. Copy the endpoint URL

### Step 2: Configure Your Project

1. Navigate to backend folder:
```bash
cd backend
```

2. Copy environment template:
```bash
copy .env.aws.example .env
```

3. Edit `.env` file with your AWS credentials:
```env
DB_NAME=medhabangla
DB_USER=postgres
DB_PASSWORD=REDACTED
DB_HOST=medhabangla-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
USE_SQLITE=False
```

### Step 3: Run Setup Script

```bash
setup_aws_rds.bat
```

This script will:
- Install required packages
- Test database connection
- Run migrations
- Create superuser
- Migrate questions from JSON files

### Step 4: Start Your Application

```bash
python manage.py runserver
```

Visit: http://localhost:8000

---

## 📋 Manual Setup (If Script Fails)

### 1. Install Dependencies

```bash
pip install psycopg2-binary python-dotenv
```

### 2. Test Connection

```bash
python test_aws_connection.py
```

### 3. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Create Superuser

```bash
python manage.py createsuperuser
```

### 5. Migrate Questions

```bash
python manage.py migrate_questions_from_json
```

---

## 📊 Your Question Files

Located in `A.C.Q/` folder:

- **6.json** - Class 6 questions
- **7.json** - Class 7 questions
- **8.json** - Class 8 questions
- **9.json** - Class 9 questions
- **10.json** - Class 10 questions
- **11-12.json** - Classes 11-12 questions
- **A.C.S.md** - Subject list for all classes

---

## 🔧 Useful Commands

### Check Database Status

```bash
python test_aws_connection.py
```

### Count Questions

```bash
python manage.py shell
```

```python
from quizzes.models import Quiz
print(f"Total questions: {Quiz.objects.count()}")

# By class
for c in range(6, 13):
    print(f"Class {c}: {Quiz.objects.filter(class_target=c).count()}")
```

### Backup Questions

```bash
python manage.py dumpdata quizzes.Quiz --indent 2 > backup_questions.json
```

### Restore Questions

```bash
python manage.py loaddata backup_questions.json
```

### Clear All Questions

```bash
python manage.py shell
```

```python
from quizzes.models import Quiz
Quiz.objects.all().delete()
```

### Re-migrate Questions

```bash
python manage.py migrate_questions_from_json --clear
```

---

## 🎯 Features After Migration

### For Students
- ✅ See only their class subjects
- ✅ Attempt quizzes for their class
- ✅ View results and explanations
- ✅ Track progress

### For Admins (Superuser Page)
- ✅ User CRUD operations
- ✅ Quiz CRUD operations
- ✅ Book CRUD operations
- ✅ Syllabus CRUD operations
- ✅ Question CRUD operations
- ✅ Statistics dashboard
- ✅ All Django admin features

---

## 🔐 Security Checklist

- [ ] `.env` file added to `.gitignore`
- [ ] Strong password for RDS database
- [ ] Security group configured properly
- [ ] Public access only for development
- [ ] SSL/TLS enabled for production
- [ ] Regular backups enabled
- [ ] Monitoring set up

---

## 💰 AWS Free Tier Limits

- **750 hours/month** of db.t3.micro or db.t4g.micro
- **20 GB** storage
- **20 GB** backup storage
- **Valid for 12 months** from AWS account creation

**Monitor your usage:** AWS Console → Billing Dashboard

---

## 🐛 Troubleshooting

### Connection Timeout

**Problem:** Cannot connect to database

**Solutions:**
1. Check RDS instance is running (AWS Console)
2. Verify security group allows port 5432
3. Check public access is enabled
4. Verify endpoint URL is correct
5. Test with: `python test_aws_connection.py`

### Authentication Failed

**Problem:** Password authentication failed

**Solutions:**
1. Check password in `.env` file
2. Verify username is correct
3. Reset password in AWS Console
4. Check for special characters in password

### Questions Not Migrating

**Problem:** Migration script fails

**Solutions:**
1. Check JSON files exist in `A.C.Q/` folder
2. Verify JSON format is valid
3. Check database connection
4. Review error messages
5. Try migrating one class: `python manage.py migrate_questions_from_json --class 6`

### Superuser Page Not Working

**Problem:** Cannot access /superuser page

**Solutions:**
1. Check if user is admin: `python manage.py shell`
   ```python
   from accounts.models import User
   user = User.objects.get(username='your_username')
   user.role = 'admin'
   user.save()
   ```
2. Verify URL routing in `urls.py`
3. Check authentication middleware
4. Review browser console for errors

---

## 📞 Support

### Documentation
- AWS RDS: https://docs.aws.amazon.com/rds/
- Django: https://docs.djangoproject.com/
- PostgreSQL: https://www.postgresql.org/docs/

### Common Issues
- Check `MIGRATION_TO_AWS_RDS.md` for detailed troubleshooting
- Review Django logs: `python manage.py runserver`
- Check AWS CloudWatch logs

---

## 🎉 Success Indicators

After successful setup, you should see:

1. ✅ Database connection test passes
2. ✅ All migrations applied
3. ✅ Questions migrated (check count)
4. ✅ Superuser can login
5. ✅ Admin panel accessible
6. ✅ Superuser page accessible
7. ✅ Students see their class subjects
8. ✅ Quizzes load correctly

---

## 📝 Project Structure

```
S.P-by-Bipul-Roy/
├── A.C.Q/                          # Question JSON files
│   ├── 6.json
│   ├── 7.json
│   ├── 8.json
│   ├── 9.json
│   ├── 10.json
│   ├── 11-12.json
│   └── A.C.S.md                    # Subject list
├── backend/
│   ├── .env                        # Your AWS credentials (DO NOT COMMIT)
│   ├── .env.aws.example            # Template
│   ├── test_aws_connection.py      # Connection test script
│   ├── setup_aws_rds.bat           # Automated setup script
│   ├── manage.py
│   ├── medhabangla/
│   │   ├── settings.py             # Update with AWS config
│   │   └── settings_aws.py         # AWS-specific settings
│   └── quizzes/
│       └── management/
│           └── commands/
│               └── migrate_questions_from_json.py
├── AWS_RDS_SETUP_GUIDE.md          # AWS setup guide
├── MIGRATION_TO_AWS_RDS.md         # Migration guide
└── README_AWS_SETUP.md             # This file
```

---

## 🔄 Switching Between SQLite and PostgreSQL

### Use PostgreSQL (AWS RDS)
```env
USE_SQLITE=False
```

### Use SQLite (Local)
```env
USE_SQLITE=True
```

Restart Django server after changing.

---

## 📈 Next Steps

After successful migration:

1. **Test thoroughly:**
   - All quiz functionality
   - User authentication
   - Admin operations
   - Superuser page features

2. **Configure production:**
   - Set `DEBUG=False`
   - Configure allowed hosts
   - Set up SSL/TLS
   - Enable security features

3. **Deploy:**
   - Choose hosting platform
   - Configure environment variables
   - Set up CI/CD pipeline
   - Monitor performance

4. **Maintain:**
   - Regular backups
   - Monitor AWS costs
   - Update dependencies
   - Review security

---

## ✅ Final Checklist

Before going to production:

- [ ] AWS RDS database created and running
- [ ] Database connection tested
- [ ] All migrations applied
- [ ] Questions migrated successfully
- [ ] Superuser created and tested
- [ ] Admin panel accessible
- [ ] Superuser page working
- [ ] Quiz functionality tested
- [ ] Subject filtering by class working
- [ ] User authentication working
- [ ] Data backup created
- [ ] `.env` in `.gitignore`
- [ ] Security group configured
- [ ] Monitoring set up
- [ ] Documentation reviewed

---

## 🎊 Congratulations!

You've successfully set up AWS RDS PostgreSQL for your MedhaBangla project! Your application is now running on a scalable, production-ready database infrastructure.

**Key Achievements:**
- ✅ Cloud database infrastructure
- ✅ All questions migrated
- ✅ Class-based subject filtering
- ✅ Admin dashboard functional
- ✅ Ready for production deployment

**Remember:**
- Monitor AWS costs regularly
- Keep credentials secure
- Backup data regularly
- Test before deploying to production

Good luck with your project! 🚀
