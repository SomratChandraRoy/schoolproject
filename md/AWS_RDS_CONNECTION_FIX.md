# AWS RDS Connection Problem - Complete Solution Guide

## 🎯 Your Questions Answered

### ❓ Question 1: Will switching to SQLite delete my AWS RDS data?
**Answer: NO! Absolutely not!**

**Why your data is safe:**
- SQLite and PostgreSQL (AWS RDS) are **completely separate databases**
- They store data in different places:
  - **SQLite**: Local file on your computer (`backend/db.sqlite3`)
  - **AWS RDS**: Cloud database in AWS (medhabangla-db.c34euac6613f.eu-north-1.rds.amazonaws.com)
- Switching between them is like switching between two different notebooks
- Your AWS RDS data remains untouched in the cloud

**What happens when you switch:**
```
USE_SQLITE=False → Uses AWS RDS (your cloud data)
USE_SQLITE=True  → Uses SQLite (local file, starts empty)
```

### ❓ Question 2: Is SQLite slower than PostgreSQL?
**Answer: It depends on your use case!**

#### Performance Comparison

| Scenario | SQLite | PostgreSQL (AWS RDS) | Winner |
|----------|--------|---------------------|---------|
| **Single user (you testing)** | ⚡ Very Fast | Slower (network delay) | SQLite ✅ |
| **10-100 concurrent users** | Slow | ⚡ Fast | PostgreSQL ✅ |
| **1000+ concurrent users** | ❌ Can't handle | ⚡ Excellent | PostgreSQL ✅ |
| **Read operations** | ⚡ Very Fast | Fast | SQLite ✅ |
| **Write operations (many users)** | Slow (locks) | ⚡ Fast | PostgreSQL ✅ |
| **Development/Testing** | ⚡ Perfect | Overkill | SQLite ✅ |
| **Production** | ❌ Not recommended | ⚡ Perfect | PostgreSQL ✅ |

#### Real Numbers
```
SQLite (local):
- Query time: 1-5ms
- No network delay
- Perfect for development

PostgreSQL (AWS RDS):
- Query time: 10-50ms (includes network)
- Network delay: ~10-30ms
- Better for production with many users
```

**Recommendation:**
- **Development**: Use SQLite (faster, simpler)
- **Production**: Use PostgreSQL (handles many users)

## 🚨 The Real Problem: AWS RDS Connection Exhaustion

### Error Message
```
FATAL: remaining connection slots are reserved for roles with privileges of the "rds_reserved" role
```

### What This Means
Your AWS RDS database has a **maximum number of connections** (usually 20-100 depending on instance size), and **all of them are being used**.

### Why This Happens

#### 1. **Connection Leaks**
```python
# BAD - Connection stays open
def bad_query():
    connection = get_connection()
    result = connection.execute("SELECT * FROM users")
    # Forgot to close connection!
    return result

# GOOD - Connection closes automatically
def good_query():
    with get_connection() as connection:
        result = connection.execute("SELECT * FROM users")
        return result
```

#### 2. **Too Many Processes**
- Multiple backend servers running
- Each server opens connections
- Old servers not shut down properly

#### 3. **Long-lived Connections**
- Connections stay open for 5 minutes (`CONN_MAX_AGE=300`)
- With many requests, connections pile up

#### 4. **No Connection Pooling**
- Each request creates a new connection
- Connections not reused efficiently

## ✅ Solutions

### Solution 1: Close Existing Connections (Immediate Fix)

#### Option A: Restart AWS RDS Instance
```bash
# In AWS Console:
1. Go to RDS Dashboard
2. Select your database: medhabangla-db
3. Actions → Reboot
4. Wait 2-3 minutes
```

#### Option B: Kill Connections via SQL
```bash
# Connect to your database
psql -h medhabangla-db.c34euac6613f.eu-north-1.rds.amazonaws.com -U postgres -d medhabangla

# Check current connections
SELECT pid, usename, application_name, client_addr, state, query_start
FROM pg_stat_activity
WHERE datname = 'medhabangla';

# Kill idle connections (older than 5 minutes)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'medhabangla'
  AND state = 'idle'
  AND query_start < NOW() - INTERVAL '5 minutes';
```

### Solution 2: Optimize Connection Settings (Long-term Fix)

#### Step 1: Update .env File ✅ (Already Done)
```env
# Reduced from 300 to 60 seconds
DB_CONN_MAX_AGE=60
```

This means:
- Connections close after 60 seconds of inactivity
- Reduces connection buildup
- Still fast enough for good performance

#### Step 2: Update Django Settings (Optional - Better Control)

Add to `backend/medhabangla/settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT'),
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000',
            'keepalives': 1,
            'keepalives_idle': 30,
            'keepalives_interval': 10,
            'keepalives_count': 5,
        },
        'CONN_MAX_AGE': 60,  # 60 seconds (reduced from 300)
        'CONN_HEALTH_CHECKS': True,  # Auto-close bad connections
        'ATOMIC_REQUESTS': False,
    }
}
```

### Solution 3: Use Connection Pooling (Advanced)

Install PgBouncer (connection pooler):

```bash
# Install
pip install pgbouncer

# Configure pgbouncer.ini
[databases]
medhabangla = host=medhabangla-db.c34euac6613f.eu-north-1.rds.amazonaws.com port=5432 dbname=medhabangla

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = userlist.txt
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```

Then update .env:
```env
DB_HOST=127.0.0.1
DB_PORT=6432
```

### Solution 4: Upgrade AWS RDS Instance

If you need more connections:

```
Current: db.t3.micro (20 connections)
Upgrade to: db.t3.small (50 connections)
Upgrade to: db.t3.medium (100 connections)
```

## 🎯 Recommended Approach

### For Development (Right Now)
```env
USE_SQLITE=True
```
**Why:**
- Faster for testing
- No connection limits
- No AWS costs during development
- Your AWS data is safe

### For Production (When deploying)
```env
USE_SQLITE=False
DB_CONN_MAX_AGE=60
```
**Why:**
- Handles multiple users
- Persistent data
- Better performance at scale

## 📋 Step-by-Step Fix

### Immediate Fix (Choose One)

#### Option A: Use SQLite for Development
```bash
# 1. Update .env
USE_SQLITE=True

# 2. Run migrations
cd backend
python manage.py migrate

# 3. Create superuser
python manage.py createsuperuser

# 4. Initialize games
python manage.py shell
```

```python
from games.models import Game

games = [
    {'game_type': 'memory_pattern', 'name': 'Memory Pattern', 'description': 'Watch and repeat patterns', 'min_grade': 6, 'max_grade': 12, 'base_points': 100},
    {'game_type': 'ship_find', 'name': 'Ship Find', 'description': 'Find hidden ships', 'min_grade': 6, 'max_grade': 12, 'base_points': 150},
    {'game_type': 'number_hunt', 'name': 'Number Hunt', 'description': 'Click numbers in order', 'min_grade': 6, 'max_grade': 12, 'base_points': 120},
]

for g in games:
    Game.objects.get_or_create(game_type=g['game_type'], defaults=g)
```

#### Option B: Fix AWS RDS Connections
```bash
# 1. .env already updated with DB_CONN_MAX_AGE=60

# 2. Restart backend server
# Stop current server (Ctrl+C)
cd backend
python manage.py runserver

# 3. If still failing, reboot AWS RDS in AWS Console
```

### Long-term Fix

1. **Monitor connections:**
```python
# Add to backend/manage.py or create monitoring script
from django.db import connection

def check_connections():
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT count(*) 
            FROM pg_stat_activity 
            WHERE datname = 'medhabangla'
        """)
        count = cursor.fetchone()[0]
        print(f"Active connections: {count}")
```

2. **Set up alerts:**
- AWS CloudWatch alarm when connections > 80% of max
- Email notification

3. **Regular cleanup:**
```bash
# Cron job to kill idle connections every hour
0 * * * * psql -h your-db -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < NOW() - INTERVAL '10 minutes';"
```

## 🔍 Debugging

### Check Current Connections
```bash
# SSH to your server or run locally
python manage.py shell
```

```python
from django.db import connection

# Check connection status
print(f"Connection: {connection.connection}")
print(f"Vendor: {connection.vendor}")

# Test query
with connection.cursor() as cursor:
    cursor.execute("SELECT version()")
    print(cursor.fetchone())
```

### Check AWS RDS Metrics
1. Go to AWS RDS Console
2. Select your database
3. Click "Monitoring" tab
4. Check "DatabaseConnections" metric

## 📊 Summary

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **SQLite** | Fast, Simple, Free | Single user only | Development |
| **AWS RDS (Fixed)** | Multi-user, Persistent | Costs money, Network delay | Production |
| **PgBouncer** | Efficient pooling | Extra setup | High traffic |

## ✅ Current Status

**What I've done:**
1. ✅ Updated `.env` with `DB_CONN_MAX_AGE=60`
2. ✅ Kept `USE_SQLITE=False` (your AWS data is safe)
3. ✅ Explained all options clearly

**What you should do:**
1. **Restart your backend server** to apply the new connection timeout
2. **Test if it works** - try loading the games page
3. **If still failing** - Switch to SQLite temporarily with `USE_SQLITE=True`

**Your data is 100% safe** - nothing has been deleted! 🎉

---

**Need help?** The connection timeout fix should resolve the issue. If not, switching to SQLite for development is perfectly fine and won't affect your AWS data.
