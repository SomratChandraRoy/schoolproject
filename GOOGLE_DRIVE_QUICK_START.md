# 🚀 Google Drive Quick Start (5 Minutes)

## Where to Add Your API Keys

### 1. Get Your Credentials

Go to: https://console.cloud.google.com/

1. Create project → Enable Google Drive API
2. Create Service Account → Download JSON key
3. Copy the entire JSON content

---

### 2. Add to .env File

**Location:** `S.P-by-Bipul-Roy/backend/.env`

**Add these lines:**

```env
# Enable Google Drive
USE_GOOGLE_DRIVE=True

# Paste your JSON credentials here (single line, no line breaks)
GOOGLE_DRIVE_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_REDACTED":"..."}

# Optional: Folder ID (leave empty to use root)
GOOGLE_DRIVE_FOLDER_ID=

# Make files public (anyone with link can view)
GOOGLE_DRIVE_PUBLIC_FILES=True
```

---

### 3. Install Dependencies

```bash
cd backend
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

Or install all:

```bash
pip install -r requirements.txt
```

---

### 4. Run Migration

```bash
python manage.py migrate
```

---

### 5. Test It!

```bash
# Start backend
python manage.py runserver

# In another terminal, start frontend
cd frontend/medhabangla
npm run dev
```

Then:
1. Login as member
2. Go to Chat
3. Upload a file
4. Check your Google Drive!

---

## Example .env Configuration

```env
# Your existing config...
DEBUG=True
SECRET_KEY=your-secret-key
DB_NAME=medhabangla
# ... etc

# Add Google Drive config at the end:
USE_GOOGLE_DRIVE=True
GOOGLE_DRIVE_CREDENTIALS_JSON={"type":"service_account","project_id":"medhabangla-chat","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"chat-storage@medhabangla-chat.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_REDACTED":"https://www.googleapis.com/robot/v1/metadata/x509/chat-storage%40medhabangla-chat.iam.gserviceaccount.com"}
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_DRIVE_PUBLIC_FILES=True
```

---

## How to Get Folder ID (Optional)

1. Go to Google Drive
2. Create folder: "MedhaBangla Chat Files"
3. Open the folder
4. Copy ID from URL:
   ```
   https://drive.google.com/drive/folders/1ABC123XYZ456
                                          ↑
                                    This is the ID
   ```
5. Share folder with service account email (from JSON)
6. Add to .env:
   ```env
   GOOGLE_DRIVE_FOLDER_ID=1ABC123XYZ456
   ```

---

## Troubleshooting

### "Google Drive service not initialized"
→ Check `USE_GOOGLE_DRIVE=True` in .env
→ Verify JSON credentials are valid
→ Restart Django server

### "Module not found: google.oauth2"
→ Run: `pip install google-auth google-api-python-client`

### Files not appearing in Drive
→ Check service account email has access
→ Verify API is enabled in Google Cloud Console

---

## Switch Back to Local Storage

If you want to use local storage instead:

```env
USE_GOOGLE_DRIVE=False
```

Files will be saved to `backend/media/chat_files/`

---

## File Locations

| File | Purpose |
|------|---------|
| `backend/.env` | **Add your API keys here** |
| `backend/chat/google_drive.py` | Google Drive service |
| `backend/chat/views.py` | Upload logic |
| `backend/chat/models.py` | Database fields |
| `backend/requirements.txt` | Dependencies |

---

## Quick Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver

# Test in Django shell
python manage.py shell
>>> from chat.google_drive import get_drive_service
>>> drive = get_drive_service()
>>> print(drive.service)  # Should not be None
```

---

## Summary

1. ✅ Get JSON credentials from Google Cloud Console
2. ✅ Add to `backend/.env` file
3. ✅ Set `USE_GOOGLE_DRIVE=True`
4. ✅ Install dependencies
5. ✅ Run migrations
6. ✅ Test file upload

**That's it! Your chat files will now be stored on Google Drive! 🎉**

---

**Need detailed instructions?** See `GOOGLE_DRIVE_SETUP.md`
