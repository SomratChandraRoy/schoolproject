# 🔍 Check Database Status

## Quick Database Check

Run these commands to check if your database is working:

### 1. Check Database Connection

```bash
cd backend
python check_database.py
```

This will show:
- ✅ Database connection status
- 📊 Database type (SQLite/PostgreSQL)
- ✅ Number of users, chat rooms, messages
- ⚠️ Connection pool status (if PostgreSQL)

---

### 2. Manual Check (Django Shell)

```bash
cd backend
python manage.py shell
```

Then run:

```python
# Check database connection
from django.db import connection
connection.ensure_connection()
print("✅ Database connected!")

# Check users
from accounts.models import User
print(f"Total users: {User.objects.count()}")
print(f"Member users: {User.objects.filter(is_member=True).count()}")

# Check chat rooms
from chat.models import ChatRoom, Message
print(f"Chat rooms: {ChatRoom.objects.count()}")
print(f"Messages: {Message.objects.count()}")

# Show recent messages
for msg in Message.objects.all().order_by('-created_at')[:5]:
    print(f"{msg.sender.username}: {msg.content[:50]}")
```

---

### 3. Check Current Database Type

```bash
cd backend
python manage.py shell -c "from django.db import connection; print(f'Database: {connection.settings_dict[\"ENGINE\"]}')"
```

**Output:**
- `sqlite3` = Using SQLite ✅ (Good for dev, no connection issues)
- `postgresql` = Using PostgreSQL ⚠️ (May have connection issues)

---

## Common Issues

### Issue 1: PostgreSQL Connection Error

**Error:**
```
remaining connection slots are reserved for roles with privileges of the "rds_reserved" role
```

**Solution:**
```bash
# Switch to SQLite temporarily
# Edit backend/.env
USE_SQLITE=True

# Run migrations
python manage.py migrate

# Restart server
python manage.py runserver
```

---

### Issue 2: Table Does Not Exist

**Error:**
```
no such table: chat_message
relation "chat_message" does not exist
```

**Solution:**
```bash
cd backend
python manage.py migrate
```

---

### Issue 3: No Member Users

**Error:**
```
You need member access to use chat
```

**Solution:**
1. Login as admin
2. Go to Admin Dashboard
3. Click "Member Management"
4. Toggle "Member Status" for users

---

## Quick Status Check

### Check if Backend is Running

```bash
# Should see Django server output
# If not, start it:
cd backend
python manage.py runserver
```

### Check if Database Has Data

```bash
cd backend
python manage.py shell
```

```python
from accounts.models import User
from chat.models import Message

# Should show numbers, not errors
print(f"Users: {User.objects.count()}")
print(f"Messages: {Message.objects.count()}")
```

---

## Database Status Indicators

### ✅ Working Correctly

```
✅ Database connection: SUCCESS
✅ Total users: 10
✅ Member users: 5
✅ Total chat rooms: 3
✅ Total messages: 25
```

### ⚠️ Connection Issues

```
❌ Database connection: FAILED
Error: remaining connection slots reserved
```

**Fix:** Switch to SQLite or kill idle connections

### ⚠️ No Data

```
✅ Database connection: SUCCESS
✅ Total users: 0
⚠️ No member users found!
```

**Fix:** Create users and enable member status

---

## Automated Check Script

I've created `backend/check_database.py` that checks:

1. ✅ Database connection
2. 📊 Database type
3. ✅ Table existence
4. ✅ User count
5. ✅ Chat room count
6. ✅ Message count
7. ⚠️ Connection pool status

**Run it:**
```bash
cd backend
python check_database.py
```

---

## What to Do Based on Results

### If Database is Working ✅

Your issue is likely:
- Frontend not polling correctly
- Browser console errors
- Network issues

**Next steps:**
1. Check browser console (F12)
2. Check Network tab for API calls
3. Verify both users are logged in

---

### If Database Has Connection Issues ⚠️

**Immediate fix:**
```bash
# Edit backend/.env
USE_SQLITE=True

# Restart
python manage.py migrate
python manage.py runserver
```

**Long-term fix:**
- Reduce polling frequency (already done)
- Kill idle connections
- Upgrade RDS instance

---

### If Database Has No Data ℹ️

**Create test data:**
```bash
cd backend
python manage.py shell
```

```python
from accounts.models import User

# Create test users
user1 = User.objects.create_user(
    username='testuser1',
    email='test1@example.com',
    password='password123',
    first_name='Test',
    last_name='User1',
    is_member=True
)

user2 = User.objects.create_user(
    username='testuser2',
    email='test2@example.com',
    password='password123',
    first_name='Test',
    last_name='User2',
    is_member=True
)

print("✅ Test users created!")
```

---

## Summary

**To check database status:**

1. Run: `python check_database.py`
2. Or use Django shell to query data
3. Check for connection errors
4. Verify users and messages exist

**If issues found:**
- Connection errors → Switch to SQLite
- No data → Create test users
- Table errors → Run migrations

---

**Check Date**: December 25, 2024  
**Status**: Database Check Tools Ready
