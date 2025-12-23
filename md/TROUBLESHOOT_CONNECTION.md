# AWS RDS Connection Timeout - Troubleshooting Guide

## ❌ Current Issue
Connection to AWS RDS is timing out:
```
Error: connection to server at "medhabangla-db.c34euac6613f.eu-north-1.rds.amazonaws.com" 
(13.49.219.255), port 5432 failed: timeout expired
```

---

## 🔧 Solution Steps (Follow in Order)

### Step 1: Check RDS Instance Status

1. **Go to AWS Console:** https://console.aws.amazon.com/
2. **Navigate to RDS:** Services → RDS
3. **Click on "Databases"** in left sidebar
4. **Find your database:** `medhabangla-db`
5. **Check Status:** Should show **"Available"** (green)

**If status is not "Available":**
- Wait if it's "Creating" or "Starting"
- Start it if it's "Stopped"

---

### Step 2: Enable Public Access (CRITICAL)

1. **Click on your database:** `medhabangla-db`
2. **Click "Modify"** button (top right)
3. **Scroll to "Connectivity"** section
4. **Find "Public access"**
5. **Select "Publicly accessible"** ✅
6. **Scroll to bottom**
7. **Click "Continue"**
8. **Select "Apply immediately"**
9. **Click "Modify DB instance"**
10. **Wait 2-3 minutes** for changes to apply

---

### Step 3: Configure Security Group (MOST IMPORTANT)

This is the most common issue!

#### 3.1 Find Your Security Group

1. **In your database details page**
2. **Go to "Connectivity & security" tab**
3. **Find "VPC security groups"** section
4. **Click on the security group link** (e.g., `sg-xxxxxxxxx`)

#### 3.2 Add Inbound Rule

1. **Click "Edit inbound rules"** button
2. **Click "Add rule"** button
3. **Configure the rule:**
   - **Type:** PostgreSQL
   - **Protocol:** TCP (auto-filled)
   - **Port range:** 5432 (auto-filled)
   - **Source:** Custom
   - **CIDR blocks:** `0.0.0.0/0` (for testing - allows all IPs)
   
   ⚠️ **For production, use your specific IP address instead!**

4. **Click "Save rules"**

#### 3.3 Verify the Rule

You should see:
```
Type        Protocol    Port Range    Source
PostgreSQL  TCP         5432          0.0.0.0/0
```

---

### Step 4: Verify Database Endpoint

1. **In database details**
2. **Go to "Connectivity & security" tab**
3. **Copy the "Endpoint"**
4. **Verify it matches your .env file:**

**Your endpoint:** `medhabangla-db.c34euac6613f.eu-north-1.rds.amazonaws.com`

**Your .env should have:**
```env
DB_HOST=medhabangla-db.c34euac6613f.eu-north-1.rds.amazonaws.com
```

✅ This matches! Good.

---

### Step 5: Test Connection Again

After completing steps 1-4, wait 2-3 minutes, then test:

```bash
cd backend
python test_aws_connection.py
```

**Expected output:**
```
✅ Connection successful!
📊 PostgreSQL Version: PostgreSQL 15.x
💾 Current Database: medhabangla
```

---

## 🎯 Quick Checklist

Before testing connection, verify:

- [ ] RDS instance status is "Available"
- [ ] Public access is enabled
- [ ] Security group has inbound rule for port 5432
- [ ] Source is set to 0.0.0.0/0 (or your IP)
- [ ] Endpoint matches .env file
- [ ] Password is correct in .env file
- [ ] Waited 2-3 minutes after making changes

---

## 🔍 Visual Guide for Security Group

### Where to Find Security Group Settings:

```
AWS Console
    ↓
RDS Dashboard
    ↓
Databases
    ↓
medhabangla-db (click)
    ↓
Connectivity & security tab
    ↓
VPC security groups (click the link)
    ↓
Edit inbound rules
    ↓
Add rule:
    Type: PostgreSQL
    Port: 5432
    Source: 0.0.0.0/0
    ↓
Save rules
```

---

## 📸 What You Should See

### Security Group Inbound Rules:

```
┌─────────────┬──────────┬────────────┬─────────────┬─────────────┐
│ Type        │ Protocol │ Port Range │ Source      │ Description │
├─────────────┼──────────┼────────────┼─────────────┼─────────────┤
│ PostgreSQL  │ TCP      │ 5432       │ 0.0.0.0/0   │ Allow all   │
└─────────────┴──────────┴────────────┴─────────────┴─────────────┘
```

---

## 🚨 Common Mistakes

### ❌ Wrong:
- Security group has no inbound rules
- Port is not 5432
- Source is set to specific IP that's not yours
- Public access is disabled
- RDS instance is stopped

### ✅ Correct:
- Security group has PostgreSQL rule
- Port is 5432
- Source is 0.0.0.0/0 (for testing)
- Public access is enabled
- RDS instance is "Available"

---

## 🔐 Security Note

**For Testing/Development:**
- Source: `0.0.0.0/0` is OK

**For Production:**
- Source: Your specific IP address or VPC CIDR
- Example: `203.0.113.0/24` (your office IP range)

**To find your IP:**
- Google: "what is my ip"
- Use that IP with /32 (e.g., `203.0.113.25/32`)

---

## 💡 Alternative: Use AWS CloudShell

If you still can't connect, try from AWS CloudShell:

1. **AWS Console** → Click CloudShell icon (top right)
2. **Install psql:**
   ```bash
   sudo yum install postgresql -y
   ```
3. **Test connection:**
   ```bash
   psql -h medhabangla-db.c34euac6613f.eu-north-1.rds.amazonaws.com \
        -U postgres \
        -d medhabangla
   ```
4. **Enter password when prompted**

If this works, the issue is your local network/firewall.

---

## 🌐 Network Issues

If security group is correct but still can't connect:

### Check Your Local Firewall:
- Windows Firewall might block outbound port 5432
- Antivirus might block connections
- Corporate network might block AWS

### Check Your ISP:
- Some ISPs block port 5432
- Try from mobile hotspot to test

### Check VPN:
- If using VPN, try without it
- Some VPNs block database ports

---

## 📞 Still Not Working?

### Verify Each Setting:

1. **RDS Instance:**
   ```
   Status: Available ✅
   Public access: Yes ✅
   ```

2. **Security Group:**
   ```
   Inbound rule: PostgreSQL, Port 5432, Source 0.0.0.0/0 ✅
   ```

3. **Endpoint:**
   ```
   medhabangla-db.c34euac6613f.eu-north-1.rds.amazonaws.com ✅
   ```

4. **Credentials:**
   ```
   Username: postgres ✅
   Password: $Bipul$Roy$2026$school$project$ ✅
   Database: medhabangla ✅
   ```

---

## 🎯 Next Steps After Connection Works

Once you see "✅ Connection successful!", run:

```bash
# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Migrate questions
python manage.py migrate_questions_from_json

# Start server
python manage.py runserver
```

---

## 📝 Summary

**Most likely issue:** Security group not configured

**Solution:** Add inbound rule for PostgreSQL (port 5432) with source 0.0.0.0/0

**Time to fix:** 2-3 minutes

**After fix:** Wait 2-3 minutes, then test connection

---

## ✅ Success Indicators

When everything is working:

```
✅ RDS instance: Available
✅ Public access: Enabled
✅ Security group: Port 5432 open
✅ Connection test: Successful
✅ Ready to migrate questions!
```

---

**Follow these steps carefully, and your connection will work!** 🚀
