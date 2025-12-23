# AWS RDS PostgreSQL Setup Checklist

Use this checklist to track your progress setting up AWS RDS for MedhaBangla project.

---

## Phase 1: AWS RDS Database Creation

### 1.1 AWS Account Setup
- [ ] AWS account created/logged in
- [ ] Confirmed region (e.g., us-east-1 or ap-south-1)
- [ ] Free tier eligible

### 1.2 Create RDS Database
- [ ] Navigated to RDS service
- [ ] Clicked "Create database"
- [ ] Selected "Standard create"
- [ ] Chose PostgreSQL 15.x
- [ ] Selected "Free tier" template
- [ ] Set DB identifier: `medhabangla-db`
- [ ] Set master username: `postgres`
- [ ] Set master password: `_______________` ⚠️ Write it down!
- [ ] Chose db.t3.micro instance
- [ ] Set storage to 20 GB
- [ ] Disabled storage autoscaling
- [ ] Enabled public access ✅
- [ ] Created new VPC security group
- [ ] Set initial database name: `medhabangla` ⚠️ Important!
- [ ] Clicked "Create database"
- [ ] Waited for status: "Available" (5-10 minutes)

### 1.3 Get Database Credentials
- [ ] Copied endpoint: `_________________________________`
- [ ] Noted port: `5432`
- [ ] Saved username: `postgres`
- [ ] Saved password: `_______________`
- [ ] Saved database name: `medhabangla`

### 1.4 Configure Security Group
- [ ] Clicked on database → VPC security groups
- [ ] Clicked security group ID
- [ ] Clicked "Edit inbound rules"
- [ ] Added rule: Type=PostgreSQL, Port=5432, Source=0.0.0.0/0
- [ ] Saved rules
- [ ] Verified rule appears in list

---

## Phase 2: Project Configuration

### 2.1 Backend Setup
- [ ] Opened terminal/command prompt
- [ ] Navigated to backend folder: `cd S.P-by-Bipul-Roy/backend`
- [ ] Copied .env template: `copy .env.aws.example .env`
- [ ] Opened .env file in editor

### 2.2 Update .env File
- [ ] Set `DB_NAME=medhabangla`
- [ ] Set `DB_USER=postgres`
- [ ] Set `DB_PASSWORD=REDACTED
- [ ] Set `DB_HOST=` (your RDS endpoint)
- [ ] Set `DB_PORT=5432`
- [ ] Set `USE_SQLITE=False`
- [ ] Set `DEBUG=True` (for development)
- [ ] Set `ALLOWED_HOSTS=localhost,127.0.0.1`
- [ ] Saved .env file

### 2.3 Verify .gitignore
- [ ] Opened .gitignore file
- [ ] Confirmed `.env` is listed
- [ ] Confirmed `*.env` is listed (except .env.example)
- [ ] Saved .gitignore

---

## Phase 3: Database Connection

### 3.1 Install Dependencies
- [ ] Activated virtual environment (if using)
- [ ] Ran: `pip install psycopg2-binary python-dotenv`
- [ ] Verified installation successful

### 3.2 Test Connection
- [ ] Ran: `python test_aws_connection.py`
- [ ] Saw: "✅ Connection successful!"
- [ ] Saw PostgreSQL version displayed
- [ ] Saw database name: medhabangla

**If connection failed:**
- [ ] Checked RDS instance is running
- [ ] Verified security group rules
- [ ] Confirmed public access enabled
- [ ] Double-checked credentials in .env
- [ ] Retested connection

---

## Phase 4: Django Setup

### 4.1 Run Migrations
- [ ] Ran: `python manage.py makemigrations`
- [ ] Saw: "No changes detected" or migrations created
- [ ] Ran: `python manage.py migrate`
- [ ] Saw: "Applying migrations..." with checkmarks
- [ ] Verified all migrations applied successfully

### 4.2 Create Superuser
- [ ] Ran: `python manage.py createsuperuser`
- [ ] Entered username: `_______________`
- [ ] Entered email: `_______________`
- [ ] Entered password: `_______________`
- [ ] Confirmed password
- [ ] Saw: "Superuser created successfully"

### 4.3 Verify Database Tables
- [ ] Ran: `python test_aws_connection.py`
- [ ] Saw list of tables created
- [ ] Confirmed tables include: quizzes_quiz, accounts_user, etc.

---

## Phase 5: Question Migration

### 5.1 Verify Question Files
- [ ] Checked A.C.Q folder exists
- [ ] Confirmed 6.json exists
- [ ] Confirmed 7.json exists
- [ ] Confirmed 8.json exists
- [ ] Confirmed 9.json exists
- [ ] Confirmed 10.json exists
- [ ] Confirmed 11-12.json exists
- [ ] Confirmed A.C.S.md exists

### 5.2 Run Migration Command
- [ ] Ran: `python manage.py migrate_questions_from_json`
- [ ] Saw: "🚀 Starting question migration..."
- [ ] Saw progress for each class
- [ ] Saw: "📊 Migration Summary"
- [ ] Noted total questions created: `_______`
- [ ] Saw: "🎉 Migration completed successfully!"

**If migration failed:**
- [ ] Checked JSON files are valid
- [ ] Verified database connection
- [ ] Tried migrating one class: `python manage.py migrate_questions_from_json --class 6`
- [ ] Reviewed error messages
- [ ] Fixed issues and retried

### 5.3 Verify Questions
- [ ] Ran: `python manage.py shell`
- [ ] Ran: `from quizzes.models import Quiz`
- [ ] Ran: `Quiz.objects.count()`
- [ ] Saw total question count: `_______`
- [ ] Checked questions by class:
  - [ ] Class 6: `_______` questions
  - [ ] Class 7: `_______` questions
  - [ ] Class 8: `_______` questions
  - [ ] Class 9: `_______` questions
  - [ ] Class 10: `_______` questions
  - [ ] Class 11: `_______` questions
  - [ ] Class 12: `_______` questions

---

## Phase 6: Testing

### 6.1 Start Server
- [ ] Ran: `python manage.py runserver`
- [ ] Saw: "Starting development server at http://127.0.0.1:8000/"
- [ ] No errors in console

### 6.2 Test Admin Panel
- [ ] Opened browser: http://localhost:8000/admin/
- [ ] Logged in with superuser credentials
- [ ] Saw Django admin dashboard
- [ ] Clicked "Quizzes" → "Quizs"
- [ ] Saw list of questions
- [ ] Verified questions from different classes
- [ ] Verified questions from different subjects

### 6.3 Test Superuser Page
- [ ] Opened: http://localhost:8000/superuser/
- [ ] Logged in as admin user
- [ ] Saw superuser dashboard
- [ ] Checked Statistics section
- [ ] Checked Users section
- [ ] Checked Quizzes section
- [ ] Checked Subjects section
- [ ] Checked Books section
- [ ] Verified CRUD operations work

### 6.4 Test Quiz Functionality
- [ ] Logged in as student user
- [ ] Navigated to quizzes page
- [ ] Saw only subjects for student's class
- [ ] Selected a subject
- [ ] Started a quiz
- [ ] Answered questions
- [ ] Submitted quiz
- [ ] Saw results
- [ ] Verified correct/incorrect answers

---

## Phase 7: Production Readiness

### 7.1 Security
- [ ] Confirmed .env not in git
- [ ] Changed DEBUG to False for production
- [ ] Updated ALLOWED_HOSTS for production domain
- [ ] Restricted security group to specific IPs
- [ ] Enabled SSL/TLS for database connection
- [ ] Enabled deletion protection on RDS

### 7.2 Backup
- [ ] Created backup: `python manage.py dumpdata quizzes.Quiz --indent 2 > backup.json`
- [ ] Verified backup file created
- [ ] Stored backup in safe location
- [ ] Enabled automated RDS backups (7 days)
- [ ] Tested restore process

### 7.3 Monitoring
- [ ] Set up AWS CloudWatch alarms
- [ ] Configured billing alerts
- [ ] Set up cost monitoring
- [ ] Enabled RDS performance insights (optional)
- [ ] Documented monitoring procedures

---

## Phase 8: Documentation

### 8.1 Project Documentation
- [ ] Read AWS_RDS_SETUP_GUIDE.md
- [ ] Read MIGRATION_TO_AWS_RDS.md
- [ ] Read README_AWS_SETUP.md
- [ ] Read QUICK_START_AWS_RDS.md
- [ ] Bookmarked important sections

### 8.2 Team Documentation
- [ ] Documented database credentials (securely)
- [ ] Created runbook for common tasks
- [ ] Documented backup/restore procedures
- [ ] Documented troubleshooting steps
- [ ] Shared knowledge with team

---

## Final Verification

### All Systems Go!
- [ ] AWS RDS database running
- [ ] Database connection working
- [ ] All migrations applied
- [ ] Superuser created
- [ ] Questions migrated successfully
- [ ] Admin panel accessible
- [ ] Superuser page working
- [ ] Quiz functionality tested
- [ ] Class-based filtering working
- [ ] Backups configured
- [ ] Security measures in place
- [ ] Documentation complete

---

## Success Metrics

**Database:**
- Total questions: `_______`
- Classes covered: 6-12 ✅
- Subjects covered: `_______`
- Database size: `_______ MB`

**Performance:**
- Connection time: `_______ ms`
- Query response time: `_______ ms`
- Page load time: `_______ seconds`

**Cost:**
- Monthly estimate: `$_______ USD`
- Free tier eligible: ✅
- Monitoring enabled: ✅

---

## Next Steps

After completing this checklist:

1. **Deploy to Production**
   - [ ] Choose hosting platform
   - [ ] Configure environment variables
   - [ ] Set up CI/CD pipeline
   - [ ] Deploy application

2. **Optimize Performance**
   - [ ] Add database indexes
   - [ ] Enable query caching
   - [ ] Optimize slow queries
   - [ ] Monitor performance metrics

3. **Enhance Features**
   - [ ] Add more question types
   - [ ] Implement adaptive learning
   - [ ] Add analytics dashboard
   - [ ] Improve user experience

4. **Maintain System**
   - [ ] Regular backups
   - [ ] Monitor costs
   - [ ] Update dependencies
   - [ ] Review security

---

## Troubleshooting Reference

### Connection Issues
**Problem:** Cannot connect to database
**Solution:** Check security group, verify credentials, ensure public access

### Migration Issues
**Problem:** Questions not migrating
**Solution:** Verify JSON files, check database connection, try one class at a time

### Performance Issues
**Problem:** Slow queries
**Solution:** Add indexes, enable connection pooling, optimize queries

### Cost Issues
**Problem:** Exceeding free tier
**Solution:** Monitor usage, stop database when not needed, optimize storage

---

## Support Resources

- **AWS RDS Docs:** https://docs.aws.amazon.com/rds/
- **Django Docs:** https://docs.djangoproject.com/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Project Docs:** See README_AWS_SETUP.md

---

## Completion

**Date Completed:** _______________
**Completed By:** _______________
**Total Time:** _______________
**Notes:** 
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## 🎉 Congratulations!

You've successfully set up AWS RDS PostgreSQL for your MedhaBangla project!

**What you've accomplished:**
✅ Cloud database infrastructure
✅ All questions migrated (Classes 6-12)
✅ Production-ready setup
✅ Secure configuration
✅ Backup strategy
✅ Monitoring in place

**You're ready to scale!** 🚀
