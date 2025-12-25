# 🔧 Google Drive API Setup Guide

## Complete Step-by-Step Instructions

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `MedhaBangla Chat Storage`
4. Click **"Create"**
5. Wait for project creation (takes ~30 seconds)

---

### Step 2: Enable Google Drive API

1. In Google Cloud Console, select your project
2. Go to **"APIs & Services"** → **"Library"**
3. Search for **"Google Drive API"**
4. Click on it and click **"Enable"**
5. Wait for API to be enabled

---

### Step 3: Create Service Account

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"Service Account"**
3. Fill in details:
   - **Service account name**: `chat-file-storage`
   - **Service account ID**: (auto-generated)
   - **Description**: `Service account for chat file uploads`
4. Click **"Create and Continue"**
5. **Grant this service account access to project**:
   - Select role: **"Editor"** (or **"Storage Admin"** for more security)
6. Click **"Continue"** → **"Done"**

---

### Step 4: Create Service Account Key (JSON)

1. In **"Credentials"** page, find your service account
2. Click on the service account email
3. Go to **"Keys"** tab
4. Click **"Add Key"** → **"Create new key"**
5. Select **"JSON"** format
6. Click **"Create"**
7. **JSON file will download automatically** - Keep it safe!

---

### Step 5: Add Credentials to Your Project

#### Option A: Single Line JSON (Recommended for .env)

1. Open the downloaded JSON file
2. Copy the entire content
3. Minify it (remove all line breaks and extra spaces)
4. Paste into `.env` file:

```env
GOOGLE_DRIVE_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_REDACTED":"..."}
```

#### Option B: Use JSON File Directly (Alternative)

1. Save the JSON file as `google-drive-credentials.json`
2. Place it in `backend/` folder
3. Update `backend/chat/google_drive.py` to read from file:

```python
# In _initialize_service method, replace:
credentials_json = settings.GOOGLE_DRIVE_CREDENTIALS_JSON

# With:
import json
with open('google-drive-credentials.json', 'r') as f:
    credentials_json = json.load(f)
```

---

### Step 6: Configure .env File

Open `backend/.env` and update:

```env
# Enable Google Drive
USE_GOOGLE_DRIVE=True

# Add your credentials (single line JSON)
GOOGLE_DRIVE_CREDENTIALS_JSON={"type":"service_account",...}

# Optional: Create a folder in Google Drive and paste its ID here
GOOGLE_DRIVE_FOLDER_ID=

# Make files publicly accessible (anyone with link can view)
GOOGLE_DRIVE_PUBLIC_FILES=True
```

---

### Step 7: (Optional) Create Dedicated Folder in Google Drive

1. Go to [Google Drive](https://drive.google.com/)
2. Create a new folder: **"MedhaBangla Chat Files"**
3. Right-click folder → **"Share"**
4. Add your service account email (from JSON: `client_email`)
5. Give it **"Editor"** permission
6. Click **"Share"**
7. Copy the folder ID from URL:
   - URL: `https://drive.google.com/drive/folders/1ABC123XYZ`
   - Folder ID: `1ABC123XYZ`
8. Add to `.env`:

```env
GOOGLE_DRIVE_FOLDER_ID=1ABC123XYZ
```

---

### Step 8: Install Dependencies

```bash
cd backend
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

Or install all requirements:

```bash
pip install -r requirements.txt
```

---

### Step 9: Create Database Migration

```bash
cd backend
python manage.py makemigrations chat
python manage.py migrate
```

This adds the Google Drive fields to the Message model:
- `drive_file_id`
- `drive_view_link`
- `drive_download_link`

---

### Step 10: Test the Integration

1. Start backend:
```bash
python manage.py runserver
```

2. Start frontend:
```bash
cd frontend/medhabangla
npm run dev
```

3. Login as member user
4. Go to Chat page
5. Click 📎 to upload a file
6. Check Google Drive - file should appear!

---

## Configuration Options

### .env Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `USE_GOOGLE_DRIVE` | Enable/disable Google Drive | `True` or `False` |
| `GOOGLE_DRIVE_CREDENTIALS_JSON` | Service account credentials | `{"type":"service_account",...}` |
| `GOOGLE_DRIVE_FOLDER_ID` | Folder ID for uploads | `1ABC123XYZ` (optional) |
| `GOOGLE_DRIVE_PUBLIC_FILES` | Make files public | `True` or `False` |

---

## How It Works

### File Upload Flow with Google Drive

```
1. User selects file in chat
2. Frontend sends file to /api/chat/upload-file/
3. Backend checks USE_GOOGLE_DRIVE setting
4. If True:
   - Upload to Google Drive
   - Get shareable link
   - Save link in database
5. If False:
   - Save to local media folder
   - Generate local URL
6. Return message with file URL
7. Frontend displays file in chat
```

---

## File Access

### Public Files (GOOGLE_DRIVE_PUBLIC_FILES=True)
- Anyone with the link can view
- No Google account required
- Best for chat files

### Private Files (GOOGLE_DRIVE_PUBLIC_FILES=False)
- Only service account can access
- Requires authentication
- More secure but complex

---

## Troubleshooting

### Error: "Google Drive service not initialized"

**Solution:**
1. Check `USE_GOOGLE_DRIVE=True` in `.env`
2. Verify credentials JSON is valid
3. Check for syntax errors in JSON
4. Restart Django server

### Error: "Insufficient permissions"

**Solution:**
1. Check service account has "Editor" role
2. If using folder, share folder with service account email
3. Verify API is enabled in Google Cloud Console

### Error: "Invalid credentials"

**Solution:**
1. Re-download JSON key from Google Cloud Console
2. Make sure JSON is properly formatted (no line breaks in .env)
3. Check for special characters in private key

### Files not appearing in Google Drive

**Solution:**
1. Check if folder ID is correct
2. Verify service account has access to folder
3. Check Google Cloud Console quota limits
4. Look for errors in Django logs

---

## Security Best Practices

### 1. Keep Credentials Secret
- ✅ Add `.env` to `.gitignore`
- ✅ Never commit credentials to Git
- ✅ Use environment variables in production
- ❌ Don't share JSON key file

### 2. Limit Permissions
- Use "Storage Admin" role instead of "Editor"
- Create dedicated folder for chat files
- Don't use personal Google account

### 3. Monitor Usage
- Check Google Cloud Console for API usage
- Set up billing alerts
- Monitor storage quota

---

## Cost Estimation

### Google Drive API Pricing

**Free Tier:**
- 15 GB storage per Google account
- Unlimited API requests (with rate limits)

**Paid (Google Workspace):**
- $6/user/month: 30 GB storage
- $12/user/month: 2 TB storage
- $18/user/month: 5 TB storage

**For Chat Files:**
- Average image: 2-5 MB
- Average video: 10-50 MB
- 1000 images ≈ 3 GB
- 100 videos ≈ 3 GB

**Recommendation:** Start with free tier, upgrade if needed.

---

## Alternative: AWS S3 Storage

If you prefer AWS S3 instead of Google Drive:

1. Install: `pip install boto3 django-storages`
2. Configure in `settings.py`:

```python
INSTALLED_APPS += ['storages']

AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', 'us-east-1')

DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
```

---

## Quick Reference

### Get Service Account Email
```bash
# From JSON file:
cat google-drive-credentials.json | grep client_email
```

### Get Folder ID from URL
```
URL: https://drive.google.com/drive/folders/1ABC123XYZ
Folder ID: 1ABC123XYZ
```

### Test Credentials
```python
# In Django shell:
python manage.py shell

from chat.google_drive import get_drive_service
drive = get_drive_service()
print(drive.service)  # Should not be None
```

---

## Support

If you need help:

1. Check Django logs: `python manage.py runserver` (look for errors)
2. Check Google Cloud Console logs
3. Verify all steps completed
4. Test with small file first (< 1MB)

---

## Summary Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Google Drive API
- [ ] Created service account
- [ ] Downloaded JSON key file
- [ ] Added credentials to `.env`
- [ ] Set `USE_GOOGLE_DRIVE=True`
- [ ] Installed Python packages
- [ ] Ran database migrations
- [ ] Tested file upload
- [ ] Files appear in Google Drive

**Once all checked, you're ready to go! 🚀**

---

**Setup Date**: December 25, 2024  
**Status**: Ready for Configuration
