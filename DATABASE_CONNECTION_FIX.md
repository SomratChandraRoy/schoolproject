# Database Connection Pool Exhaustion - Fix Guide

## Problem
AWS RDS PostgreSQL database is running out of available connections, causing errors:
```
django.db.utils.OperationalError: connection to server at "medhabangla-db.c34euac6613f.eu-north-1.rds.amazonaws.com" failed
remaining connection slots are reserved for roles with privileges of the 'rds_reserved' role
```

## Root Causes
1. **Too many open connections** from development/testing
2. **No connection pooling** or improper configuration
3. **RDS instance too small** (free tier has limited connections)
4. **Multiple backend instances** running simultaneously
5. **Long-running connections** not being closed properly

## ✅ Fixes Applied

### 1. Enhanced Connection Pooling Configuration
**File**: `backend/medhabangla/settings.py`

Added improved connection pooling settings:
```python
'CONN_MAX_AGE': int(os.getenv('DB_CONN_MAX_AGE', '300')),  # 5 minutes (reduced from 10)
'CONN_HEALTH_CHECKS': True,  # Validate connections before use
'OPTIONS': {
    'keepalives': 1,
    'keepalives_idle': 30,
    'keepalives_interval': 10,
    'keepalives_count': 5,
}
```

**Benefits**:
- Connections are reused for 5 minutes instead of 10
- Health checks prevent using broken connections
- TCP keepalive prevents idle connection timeouts

### 2. Database Connection Management Middleware
**File**: `backend/medhabangla/middleware.py`

Created custom middleware to:
- Close broken connections immediately
- Prevent connection leaks on exceptions
- Log connection issues for debugging

**Added to**: `MIDDLEWARE` in `settings.py`

### 3. Connection Monitoring Command
**File**: `backend/medhabangla/management/commands/check_db_connections.py`

New management command to:
- Show current connection usage
- Display connections by state
- Identify idle connections
- Kill stuck connections (optional)

## 🚀 Immediate Actions

### Step 1: Check Current Connection Status
```bash
cd backend
python manage.py check_db_connections
```

This will show:
- Total connections vs max connections
- Connection usage percentage
- Connections by state (active, idle, etc.)
- Idle connections older than 5 minutes

### Step 2: Kill Idle Connections (if needed)
```bash
python manage.py check_db_connections --kill-idle
```

⚠️ **Use with caution**: This will terminate idle connections

### Step 3: Restart Backend Server
```bash
# Stop all running backend processes
# Then restart:
python manage.py runserver
```

### Step 4: Update Environment Variables (Optional)
Add to `.env` file to customize connection pooling:
```env
# Reduce connection lifetime (default: 300 seconds = 5 minutes)
DB_CONN_MAX_AGE=180

# Or disable connection pooling entirely (not recommended)
DB_CONN_MAX_AGE=0
```

## 📊 Monitoring

### Check Connection Usage Regularly
```bash
# Quick check
python manage.py check_db_connections

# Watch in real-time (Linux/Mac)
watch -n 5 'python manage.py check_db_connections'

# Windows PowerShell
while($true) { python manage.py check_db_connections; Start-Sleep -Seconds 5; Clear-Host }
```

### Warning Thresholds
- **< 50%**: Healthy
- **50-80%**: Monitor closely
- **> 80%**: Take action immediately

## 🔧 Long-Term Solutions

### Option 1: Increase RDS Max Connections
1. Go to AWS RDS Console
2. Select your database instance
3. Modify parameter group
4. Increase `max_connections` parameter
5. Reboot instance

**Default limits by instance type**:
- `db.t3.micro` (free tier): ~87 connections
- `db.t3.small`: ~198 connections
- `db.t3.medium`: ~410 connections

### Option 2: Use PgBouncer (Connection Pooler)
PgBouncer sits between Django and PostgreSQL:
```bash
# Install PgBouncer
sudo apt-get install pgbouncer

# Configure pgbouncer.ini
[databases]
medhabangla = host=medhabangla-db.c34euac6613f.eu-north-1.rds.amazonaws.com port=5432 dbname=medhabangla

[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```

Then update Django to connect to PgBouncer instead of RDS directly.

### Option 3: Upgrade RDS Instance
If on free tier, consider upgrading to a larger instance:
- More connections available
- Better performance
- More memory for connection handling

### Option 4: Use Django Database Connection Pooling Library
```bash
pip install django-db-connection-pool
```

Update `settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'dj_db_conn_pool.backends.postgresql',
        # ... other settings
        'POOL_OPTIONS': {
            'POOL_SIZE': 10,
            'MAX_OVERFLOW': 10,
        }
    }
}
```

## 🐛 Troubleshooting

### Issue: Still getting connection errors after restart
**Solution**:
1. Check if multiple backend processes are running:
   ```bash
   # Linux/Mac
   ps aux | grep manage.py
   
   # Windows
   tasklist | findstr python
   ```
2. Kill all Python processes
3. Restart backend once

### Issue: Connections not being released
**Solution**:
1. Set `DB_CONN_MAX_AGE=0` in `.env` (disables pooling)
2. Restart backend
3. Monitor with `check_db_connections`
4. If fixed, gradually increase `DB_CONN_MAX_AGE`

### Issue: High idle connection count
**Solution**:
1. Run: `python manage.py check_db_connections --kill-idle`
2. Check for long-running queries in your code
3. Ensure all database queries use context managers or close connections

### Issue: Connection limit reached during testing
**Solution**:
1. Use SQLite for local testing:
   ```env
   USE_SQLITE=True
   ```
2. Or use Django's test database (automatically cleaned up)

## 📝 Best Practices

### 1. Development Environment
- Use SQLite for local development when possible
- Set `DB_CONN_MAX_AGE=60` (1 minute) for dev
- Restart backend frequently during development

### 2. Production Environment
- Use PgBouncer or similar connection pooler
- Set `DB_CONN_MAX_AGE=300` (5 minutes)
- Monitor connection usage with alerts
- Use read replicas for read-heavy operations

### 3. Code Practices
```python
# ✅ Good: Use context managers
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("SELECT * FROM table")
    # Connection automatically closed

# ✅ Good: Use Django ORM (handles connections)
User.objects.filter(is_member=True)

# ❌ Bad: Manual connection without closing
cursor = connection.cursor()
cursor.execute("SELECT * FROM table")
# Connection never closed!
```

### 4. API Endpoints
- Close connections in exception handlers
- Use database transactions properly
- Avoid long-running queries in API endpoints

## 🔍 Diagnostic Queries

### Check connections from Django shell
```python
python manage.py shell

from django.db import connection
with connection.cursor() as cursor:
    # Total connections
    cursor.execute("SELECT count(*) FROM pg_stat_activity WHERE datname = 'medhabangla';")
    print(f"Total: {cursor.fetchone()[0]}")
    
    # By state
    cursor.execute("SELECT state, count(*) FROM pg_stat_activity WHERE datname = 'medhabangla' GROUP BY state;")
    for row in cursor.fetchall():
        print(f"{row[0]}: {row[1]}")
```

### Check from PostgreSQL directly
```sql
-- Connect to RDS
psql -h medhabangla-db.c34euac6613f.eu-north-1.rds.amazonaws.com -U postgres -d medhabangla

-- Show all connections
SELECT * FROM pg_stat_activity WHERE datname = 'medhabangla';

-- Kill specific connection
SELECT pg_terminate_backend(12345);  -- Replace with actual PID

-- Kill all idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'medhabangla'
AND state = 'idle'
AND state_change < NOW() - INTERVAL '5 minutes';
```

## 📈 Monitoring Setup

### CloudWatch Alarms (AWS)
1. Go to CloudWatch Console
2. Create alarm for `DatabaseConnections` metric
3. Set threshold to 80% of max_connections
4. Configure SNS notification

### Application Monitoring
Add to your Django app:
```python
# In views.py or middleware
from django.db import connection

def log_db_connections():
    with connection.cursor() as cursor:
        cursor.execute("SELECT count(*) FROM pg_stat_activity WHERE datname = %s", [settings.DATABASES['default']['NAME']])
        count = cursor.fetchone()[0]
        logger.info(f"Active DB connections: {count}")
```

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Check status | `python manage.py check_db_connections` |
| Kill idle | `python manage.py check_db_connections --kill-idle` |
| Restart backend | Stop all processes, then `python manage.py runserver` |
| Use SQLite | Add `USE_SQLITE=True` to `.env` |
| Disable pooling | Add `DB_CONN_MAX_AGE=0` to `.env` |

## ✅ Verification

After applying fixes:
1. ✅ Backend starts without connection errors
2. ✅ Connection usage stays below 50%
3. ✅ No idle connections accumulating
4. ✅ API endpoints respond normally
5. ✅ Chat system works without errors

## 📞 Support

If issues persist:
1. Check AWS RDS status in console
2. Review RDS logs for errors
3. Verify security group allows connections
4. Check if RDS is in maintenance window
5. Consider upgrading RDS instance

---

**Last Updated**: December 25, 2025
**Status**: ✅ Fixes Applied
**Next Review**: Monitor for 24 hours
