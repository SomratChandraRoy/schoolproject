# Migration Guide: Local SQLite to AWS RDS PostgreSQL

## Overview
This guide walks you through migrating your MedhaBangla project from local SQLite database to AWS RDS PostgreSQL, including migrating all questions from JSON files.

---

## Prerequisites

✅ AWS RDS PostgreSQL database created (see `AWS_RDS_SETUP_GUIDE.md`)
✅ Database endpoint and credentials available
✅ Security group configured to allow connections
✅ Question JSON files in `A.C.Q/` folder

---

## Step-by-Step Migration Process

### Step 1: Install Required Packages

```bash
cd backend
pip install psycopg2-binary python-dotenv
```

### Step 2: Create Environment File

1. Copy the example file:
```bash
copy .env.aws.example .env
```

2. Edit `.env` with your AWS RDS credentials:
```env
DB_NAME=medhabangla
DB_USER=postgres
DB_PASSWORD=REDACTED
DB_HOST=medhabangla-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432

SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

USE_SQLITE=False
```

### Step 3: Update Django Settings

Update `backend/medhabangla/settings.py`:

```python
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# Database Configuration
if os.getenv('USE_SQLITE', 'False') == 'True':
    # Local SQLite for development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    # AWS RDS PostgreSQL for production
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'medhabangla'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
            'OPTIONS': {
                'connect_timeout': 10,
            },
            'CONN_MAX_AGE': 600,
        }
    }
```

### Step 4: Test Database Connection

```bash
python test_aws_connection.py
```

Expected output:
```
✅ Connection successful!
📊 PostgreSQL Version: PostgreSQL 15.x
💾 Current Database: medhabangla
```

If connection fails, check:
- RDS instance is running
- Security group allows port 5432
- Credentials are correct
- Public access is enabled

### Step 5: Run Django Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

This creates all necessary tables in AWS RDS PostgreSQL.

### Step 6: Create Superuser

```bash
python manage.py createsuperuser
```

Enter username, email, and password when prompted.

### Step 7: Migrate Questions from JSON Files

Now migrate all questions from `A.C.Q/` folder to AWS RDS:

```bash
python manage.py migrate_questions_from_json
```

Options:
- `--clear`: Delete existing questions before migration
- `--class 6`: Migrate only Class 6 questions

Examples:
```bash
# Migrate all classes
python manage.py migrate_questions_from_json

# Clear and migrate all
python manage.py migrate_questions_from_json --clear

# Migrate only Class 10
python manage.py migrate_questions_from_json --class 10
```

Expected output:
```
🚀 Starting question migration from JSON to AWS RDS PostgreSQL...

📖 Processing Class 6 from 6.json...
  ✅ Class 6: 150 created, 0 skipped, 0 errors

📖 Processing Class 7 from 7.json...
  ✅ Class 7: 145 created, 0 skipped, 0 errors

...

📊 Migration Summary:
  ✅ Total questions created: 1000
  ⏭️  Total questions skipped: 0
  ❌ Total errors: 0

🎉 Migration completed successfully!
```

### Step 8: Verify Migration

1. **Check in Django shell:**
```bash
python manage.py shell
```

```python
from quizzes.models import Quiz

# Count total questions
print(f"Total questions: {Quiz.objects.count()}")

# Count by class
for class_level in range(6, 13):
    count = Quiz.objects.filter(class_target=class_level).count()
    print(f"Class {class_level}: {count} questions")

# Count by subject
from django.db.models import Count
subjects = Quiz.objects.values('subject').annotate(count=Count('id'))
for s in subjects:
    print(f"{s['subject']}: {s['count']} questions")
```

2. **Check in Django Admin:**
```bash
python manage.py runserver
```
Visit: http://localhost:8000/admin/
Login with superuser credentials
Navigate to Quizzes section

3. **Check in database directly:**
```bash
python manage.py dbshell
```

```sql
-- Count questions
SELECT COUNT(*) FROM quizzes_quiz;

-- Count by class
SELECT class_target, COUNT(*) 
FROM quizzes_quiz 
GROUP BY class_target 
ORDER BY class_target;

-- Count by subject
SELECT subject, COUNT(*) 
FROM quizzes_quiz 
GROUP BY subject;
```

### Step 9: Update Frontend Configuration

If your frontend needs to know about the database change, update any API endpoints or configuration files.

### Step 10: Test Application

1. Start the backend:
```bash
python manage.py runserver
```

2. Test quiz functionality:
- Login as a student
- Navigate to quizzes page
- Select your class
- Verify subjects appear correctly
- Attempt a quiz
- Check if questions load properly

---

## Rollback Plan

If you need to rollback to SQLite:

1. Update `.env`:
```env
USE_SQLITE=True
```

2. Restart Django server

3. Your local SQLite database will be used again

---

## Data Backup

### Backup AWS RDS Data

```bash
# Export all questions to JSON
python manage.py dumpdata quizzes.Quiz --indent 2 > backup_questions.json

# Export all data
python manage.py dumpdata --indent 2 > backup_all_data.json
```

### Restore from Backup

```bash
# Restore questions
python manage.py loaddata backup_questions.json

# Restore all data
python manage.py loaddata backup_all_data.json
```

---

## Troubleshooting

### Connection Timeout
**Problem:** Database connection times out

**Solutions:**
1. Check security group inbound rules
2. Verify RDS instance is publicly accessible
3. Check VPC and subnet configuration
4. Increase `connect_timeout` in settings

### Authentication Failed
**Problem:** Password authentication failed

**Solutions:**
1. Verify password in `.env` file
2. Check username is correct
3. Reset RDS master password in AWS Console
4. Ensure no special characters causing issues

### Migration Errors
**Problem:** Django migrations fail

**Solutions:**
1. Check if database exists: `SELECT current_database();`
2. Verify user has CREATE TABLE permissions
3. Check PostgreSQL version compatibility
4. Review migration files for issues

### Questions Not Appearing
**Problem:** Questions migrated but not showing in app

**Solutions:**
1. Verify questions in database: `SELECT COUNT(*) FROM quizzes_quiz;`
2. Check class_target values match user's class
3. Verify subject names are correct
4. Check API endpoints are returning data
5. Review frontend filtering logic

### Performance Issues
**Problem:** Slow query performance

**Solutions:**
1. Add database indexes:
```python
class Meta:
    indexes = [
        models.Index(fields=['class_target', 'subject']),
        models.Index(fields=['difficulty']),
    ]
```

2. Enable connection pooling (already configured)
3. Use `select_related()` and `prefetch_related()`
4. Monitor RDS performance metrics in AWS Console

---

## Post-Migration Checklist

- [ ] Database connection tested successfully
- [ ] All migrations applied
- [ ] Superuser created
- [ ] Questions migrated from JSON files
- [ ] Question count verified in database
- [ ] Django admin accessible
- [ ] Quiz functionality tested
- [ ] All subjects appear correctly
- [ ] Questions load properly in frontend
- [ ] User authentication works
- [ ] Data backup created
- [ ] `.env` file added to `.gitignore`
- [ ] Documentation updated

---

## Monitoring and Maintenance

### Monitor AWS RDS

1. **CloudWatch Metrics:**
   - CPU Utilization
   - Database Connections
   - Free Storage Space
   - Read/Write IOPS

2. **Set up Alarms:**
   - High CPU usage (>80%)
   - Low storage space (<2GB)
   - Connection count approaching limit

3. **Regular Backups:**
   - Automated backups enabled (7 days retention)
   - Manual snapshots before major changes

### Database Maintenance

```bash
# Regular tasks
python manage.py clearsessions  # Clear expired sessions
python manage.py check --deploy  # Check deployment settings

# Monitor database size
python manage.py dbshell
SELECT pg_size_pretty(pg_database_size('medhabangla'));
```

---

## Cost Optimization

### Stay Within Free Tier

- Use db.t3.micro or db.t4g.micro instance
- Keep storage under 20GB
- Monitor monthly usage in AWS Billing Dashboard
- Stop database when not in use (development only)

### Stop Database (Development)

```bash
# AWS CLI
aws rds stop-db-instance --db-instance-identifier medhabangla-db

# Or use AWS Console
```

**Note:** Database automatically starts after 7 days

---

## Security Best Practices

1. **Never commit credentials:**
   - Add `.env` to `.gitignore`
   - Use environment variables
   - Rotate passwords regularly

2. **Restrict access:**
   - Limit security group to specific IPs
   - Use VPN for production access
   - Enable SSL/TLS connections

3. **Regular updates:**
   - Enable auto minor version upgrades
   - Review security patches
   - Update Django and dependencies

4. **Audit logs:**
   - Enable PostgreSQL logs
   - Monitor failed login attempts
   - Review query logs periodically

---

## Next Steps

After successful migration:

1. ✅ Configure production settings
2. ✅ Set up CI/CD pipeline
3. ✅ Configure domain and SSL
4. ✅ Set up monitoring and alerts
5. ✅ Create backup strategy
6. ✅ Document API endpoints
7. ✅ Train team on new setup

---

## Support Resources

- **AWS RDS:** https://docs.aws.amazon.com/rds/
- **Django PostgreSQL:** https://docs.djangoproject.com/en/stable/ref/databases/#postgresql-notes
- **psycopg2:** https://www.psycopg.org/docs/
- **AWS Free Tier:** https://aws.amazon.com/free/

---

## Summary

You've successfully migrated from SQLite to AWS RDS PostgreSQL! Your questions are now stored in a scalable, production-ready database that can handle multiple concurrent users and provide better performance.

**Key Benefits:**
- ✅ Scalable database infrastructure
- ✅ Automatic backups
- ✅ Better performance for concurrent users
- ✅ Production-ready setup
- ✅ Easy to monitor and maintain

**Remember:**
- Monitor AWS costs regularly
- Keep credentials secure
- Backup data regularly
- Test thoroughly before production deployment
