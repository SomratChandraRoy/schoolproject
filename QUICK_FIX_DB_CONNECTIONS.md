# Quick Fix: Database Connection Pool Exhaustion

## 🚨 Immediate Actions (Do This Now!)

### Step 1: Check Connection Status
```bash
cd backend
python fix_db_connections.py
```

This will:
- Show current connection usage
- Identify idle connections
- Offer to kill idle connections automatically

### Step 2: Restart Backend Server
```bash
# Stop all running backend processes
# Windows: Press Ctrl+C in terminal, or close all Python processes
# Linux/Mac: pkill -f "manage.py runserver"

# Then restart
python manage.py runserver
```

### Step 3: Verify Fix
```bash
python manage.py check_db_connections
```

Should show connection usage < 50%

## 🔧 What Was Fixed

### 1. Enhanced Connection Pooling
- Reduced connection lifetime from 10 minutes to 5 minutes
- Added connection health checks
- Added TCP keepalive settings

### 2. Connection Management Middleware
- Automatically closes broken connections
- Prevents connection leaks on errors
- Logs connection issues

### 3. Monitoring Tools
- `python manage.py check_db_connections` - Check status
- `python fix_db_connections.py` - Quick diagnostic tool

## 📊 Monitor Connection Usage

### Quick Check
```bash
python manage.py check_db_connections
```

### Kill Idle Connections (if needed)
```bash
python manage.py check_db_connections --kill-idle
```

## ⚙️ Configuration Options

### Reduce Connection Lifetime (if still having issues)
Add to `.env`:
```env
DB_CONN_MAX_AGE=180  # 3 minutes instead of 5
```

### Disable Connection Pooling (temporary fix)
Add to `.env`:
```env
DB_CONN_MAX_AGE=0  # Connections close immediately after each request
```

### Use SQLite for Local Development
Add to `.env`:
```env
USE_SQLITE=True
```

## 🎯 Expected Results

After fixes:
- ✅ Backend starts without errors
- ✅ Connection usage stays below 50%
- ✅ Chat system works normally
- ✅ No connection errors in logs

## 🐛 If Issues Persist

### Check for Multiple Backend Processes
```bash
# Windows
tasklist | findstr python

# Linux/Mac
ps aux | grep manage.py
```

Kill all Python processes and restart once.

### Check RDS Status
1. Go to AWS RDS Console
2. Check if database is available
3. Check security groups allow connections
4. Review RDS logs for errors

### Increase RDS Max Connections
1. AWS RDS Console → Parameter Groups
2. Edit `max_connections` parameter
3. Increase value (e.g., from 87 to 200)
4. Reboot RDS instance

## 📚 Full Documentation

See `DATABASE_CONNECTION_FIX.md` for:
- Detailed explanation of fixes
- Long-term solutions
- Best practices
- Troubleshooting guide

## 🆘 Emergency Commands

```bash
# Check status
python manage.py check_db_connections

# Kill idle connections
python manage.py check_db_connections --kill-idle

# Quick diagnostic
python fix_db_connections.py

# Restart backend
# Stop all processes, then:
python manage.py runserver

# Use SQLite temporarily
# Add to .env: USE_SQLITE=True
```

---

**Status**: ✅ Fixes Applied
**Next**: Monitor for 24 hours
**Support**: See DATABASE_CONNECTION_FIX.md
