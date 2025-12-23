# Quick Test Guide - Books & Syllabus File Upload

## 🚀 Quick Start

### Step 1: Verify Backend is Running
```bash
cd backend
python manage.py runserver
```

### Step 2: Verify Frontend is Running
```bash
cd frontend/medhabangla
npm start
```

### Step 3: Login as Admin
1. Go to `http://localhost:3000/login`
2. Login with admin credentials:
   - Username: `admin`
   - Password: (your admin password)

### Step 4: Access Superuser Dashboard
1. Go to `http://localhost:3000/superuser`
2. You should see the dashboard with tabs

---

## 📚 Test Books Feature

### Test 1: Create Book with Files
1. Click on "Books" tab
2. Click "Create Book" button
3. Fill in the form:
   ```
   Title: Physics Class 10
   Author: Dr. Ahmed
   Class Level: 10
   Category: textbook
   Language: Bangla
   Description: Complete physics textbook
   PDF File: [Select a PDF file]
   Cover Image: [Select an image file]
   ```
4. Click "Create Book"
5. ✅ Book should appear in the table with PDF and Cover badges

### Test 2: Create Book without Cover
1. Click "Create Book" button
2. Fill in the form (only PDF, no cover image)
3. Click "Create Book"
4. ✅ Book should appear with only PDF badge

### Test 3: Update Book
1. Click "Edit" button on any book
2. Change the title or description
3. Optionally upload new files
4. Click "Update Book"
5. ✅ Book should be updated

### Test 4: View Book Files
1. In the books table, click on "📄 PDF" badge
2. ✅ PDF should open in new tab
3. Click on "🖼️ Cover" badge
4. ✅ Image should open in new tab

### Test 5: Delete Book
1. Click "Delete" button on any book
2. Confirm deletion
3. ✅ Book should be removed from table

---

## 📖 Test Syllabus Feature

### Test 1: Create Syllabus with Files
1. Click on "Syllabus" tab
2. Click "Create Syllabus" button
3. Fill in the form:
   ```
   Class Level: 10
   Subject: Physics
   Chapter Title: Motion and Forces
   Chapter Number: 1
   Page Range: 1-25
   Estimated Hours: 5.0
   Description: Introduction to motion
   Syllabus PDF: [Select a PDF file]
   Syllabus Image: [Select an image file]
   ```
4. Click "Create Chapter"
5. ✅ Syllabus should appear in the table with PDF and Image badges

### Test 2: Create Syllabus without Files
1. Click "Create Syllabus" button
2. Fill in the form (no files)
3. Click "Create Chapter"
4. ✅ Syllabus should appear without file badges

### Test 3: Update Syllabus
1. Click "Edit" button on any syllabus
2. Change the chapter title or description
3. Optionally upload new files
4. Click "Update Chapter"
5. ✅ Syllabus should be updated

### Test 4: View Syllabus Files
1. In the syllabus table, click on "📄 PDF" badge
2. ✅ PDF should open in new tab
3. Click on "🖼️ Image" badge
4. ✅ Image should open in new tab

### Test 5: Delete Syllabus
1. Click "Delete" button on any syllabus
2. Confirm deletion
3. ✅ Syllabus should be removed from table

---

## 🔍 Test Search & Filter

### Books
1. Use the search bar to search by title or author
2. ✅ Results should filter in real-time

### Syllabus
1. Use the search bar to search by chapter title
2. ✅ Results should filter in real-time

---

## 🧪 Backend Test

Run the automated test script:
```bash
cd backend
python test_book_crud.py
```

Expected output:
```
============================================================
TESTING BOOKS CRUD
============================================================
✅ Admin user: admin
✅ Created book: Test Physics Book (ID: 1)
✅ Updated book description
✅ Deleted book ID: 1
✅ All book tests passed!

============================================================
TESTING SYLLABUS CRUD
============================================================
✅ Created syllabus: Motion and Forces (ID: 2)
✅ Updated syllabus description
✅ Deleted syllabus ID: 2
✅ All syllabus tests passed!

============================================================
TESTING API ENDPOINTS
============================================================
✅ API endpoint tests passed!

============================================================
🎉 ALL TESTS PASSED!
============================================================
```

---

## 📁 Sample Test Files

You can use any PDF or image files for testing. Here are some suggestions:

### For Books
- **PDF**: Any textbook PDF, sample document, or create a simple PDF
- **Cover**: Any book cover image (JPG, PNG)

### For Syllabus
- **PDF**: Syllabus document, chapter outline
- **Image**: Scanned syllabus page, chapter diagram

---

## ✅ Expected Results

After all tests, you should have:

1. ✅ Multiple books in the Books tab
2. ✅ Multiple syllabus entries in the Syllabus tab
3. ✅ File badges visible in the table
4. ✅ Files downloadable by clicking badges
5. ✅ Search and filter working
6. ✅ CRUD operations working smoothly

---

## 🐛 Troubleshooting

### Issue: "PDF file is required"
- **Solution**: Make sure to select a PDF file when creating a new book

### Issue: Files not uploading
- **Solution**: Check browser console for errors
- **Solution**: Verify backend is running and MEDIA_ROOT is configured

### Issue: Files not displaying
- **Solution**: Check if files were actually uploaded to `backend/media/` directory
- **Solution**: Verify MEDIA_URL is configured correctly

### Issue: 403 Forbidden
- **Solution**: Make sure you're logged in as admin user
- **Solution**: Check if user has `is_admin = True`

### Issue: 500 Server Error
- **Solution**: Check backend console for error details
- **Solution**: Verify database migrations are applied

---

## 📞 Support

If you encounter any issues:

1. Check browser console (F12)
2. Check backend terminal for errors
3. Verify all migrations are applied
4. Verify admin user exists and has permissions
5. Check the documentation: `BOOKS_SYLLABUS_FILE_UPLOAD.md`

---

## 🎉 Success Criteria

All features working if:
- ✅ Can create books with PDF and cover image
- ✅ Can create syllabus with PDF and image
- ✅ Can update records with new files
- ✅ Can view/download files from table
- ✅ Can delete records
- ✅ Search and filter work correctly
- ✅ Backend tests pass
- ✅ No console errors
