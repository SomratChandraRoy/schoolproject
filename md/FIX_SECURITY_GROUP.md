# 🔧 Quick Fix: AWS RDS Security Group

## ⚡ 2-Minute Fix for Connection Timeout

Your connection is timing out because the **Security Group** is not configured to allow connections on port 5432.

---

## 🎯 Follow These Exact Steps

### Step 1: Go to Your Database (30 seconds)

1. Open: https://console.aws.amazon.com/rds/
2. Click: **"Databases"** (left sidebar)
3. Click: **"medhabangla-db"** (your database name)

---

### Step 2: Find Security Group (30 seconds)

1. Click: **"Connectivity & security"** tab
2. Scroll to: **"Security"** section
3. Look for: **"VPC security groups"**
4. You'll see something like: `sg-0123456789abcdef (default)`
5. **Click on the security group link** (the blue text)

---

### Step 3: Add Inbound Rule (1 minute)

1. Click: **"Edit inbound rules"** button (bottom right)
2. Click: **"Add rule"** button
3. Fill in:
   - **Type:** Select **"PostgreSQL"** from dropdown
   - **Source:** Select **"Anywhere-IPv4"** from dropdown
   - (Port 5432 will auto-fill)
4. Click: **"Save rules"** button (bottom right)

---

## ✅ What You Should See

After saving, you should see this rule:

```
Type        Protocol    Port Range    Source          Description
PostgreSQL  TCP         5432          0.0.0.0/0       -
```

---

## 🔄 Step 4: Test Connection (30 seconds)

Wait 1-2 minutes, then run:

```bash
cd backend
python test_aws_connection.py
```

**Expected result:**
```
✅ Connection successful!
📊 PostgreSQL Version: PostgreSQL 15.x
💾 Current Database: medhabangla
```

---

## 🎉 That's It!

If you see "✅ Connection successful!", you're done!

**Next steps:**
```bash
# Run migrations
python manage.py migrate

# Migrate questions
python manage.py migrate_questions_from_json
```

---

## 🚨 Still Not Working?

### Check These:

1. **RDS Instance Running?**
   - Go to RDS → Databases
   - Status should be **"Available"** (green)

2. **Public Access Enabled?**
   - Click database → Click "Modify"
   - Scroll to "Connectivity"
   - Check "Publicly accessible"
   - Click "Continue" → "Apply immediately" → "Modify DB instance"

3. **Correct Endpoint?**
   - Your endpoint: `medhabangla-db.c34euac6613f.eu-north-1.rds.amazonaws.com`
   - Check it matches your .env file

---

## 📞 Need More Help?

See: **TROUBLESHOOT_CONNECTION.md** for detailed troubleshooting

---

## 🔐 Security Note

**For Testing:** `0.0.0.0/0` (anywhere) is fine

**For Production:** Change to your specific IP address:
1. Google: "what is my ip"
2. Edit security group rule
3. Change source to: `YOUR_IP/32`

---

## ⏱️ Timeline

- **Step 1-3:** 2 minutes
- **Wait:** 1-2 minutes
- **Test:** 30 seconds
- **Total:** ~4 minutes

---

**Fix the security group and you'll be connected!** 🚀
