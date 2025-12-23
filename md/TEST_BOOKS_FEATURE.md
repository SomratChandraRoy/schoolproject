# Test Books Feature - Step by Step Guide

## 🧪 Complete Testing Guide

---

## Prerequisites

1. ✅ Backend server running: `cd backend && python manage.py runserver`
2. ✅ Frontend server running: `cd frontend/medhabangla && npm start`
3. ✅ Admin user exists with `is_admin = True`
4. ✅ At least one student user exists

---

## Test 1: Admin Adds Books

### Step 1.1: Login as Admin
1. Go to `http://localhost:3000/login`
2. Login with admin credentials
3. ✅ Should redirect to dashboard

### Step 1.2: Access Superuser Dashboard
1. Go to `http://localhost:3000/superuser`
2. ✅ Should see superuser dashboard
3. Click on "Books" tab
4. ✅ Should see books table (may be empty)

### Step 1.3: Create Book for Class 6
1. Click "Create Book" button
2. Fill in the form:
   ```
   Title: Mathematics Class 6
   Author: Dr. Ahmed
   Class Level: 6
   Category: textbook
   Language: Bangla
   Description: Complete mathematics textbook for Class 6
   PDF File: [Select a PDF file]
   Cover Image: [Optional - Select an image]
   ```
3. Click "Create Book"
4. ✅ Book should appear in the table
5. ✅ Should see PDF badge if file uploaded

### Step 1.4: Create Book for Class 7
1. Click "Create Book" button
2. Fill in the form:
   ```
   Title: English Stories Class 7
   Author: John Smith
   Class Level: 7
   Category: story
   Language: English
   Description: Collection of interesting stories
   PDF File: [Select a PDF file]
   ```
3. Click "Create Book"
4. ✅ Book should appear in the table

### Step 1.5: Create Books for Multiple Classes
Repeat the process to create books for:
- Class 8 (Physics textbook)
- Class 9 (Chemistry textbook)
- Class 10 (Biology textbook)
- Class 11 (Advanced Math)
- Class 12 (Literature)

**Expected Result:** At least 7 books in the database

---

## Test 2: Student Views Books

### Step 2.1: Logout and Login as Student
1. Logout from admin account
2. Login as student (Class 9 student recommended)
3. ✅ Should redirect to dashboard

### Step 2.2: Navigate to Books Page
1. Click "Books" in the navbar
2. ✅ Should see "Digital Library" page
3. ✅ Should see loading spinner briefly
4. ✅ Should see all books in a grid

### Step 2.3: Verify Book Display
Check each book card has:
- ✅ Book title
- ✅ Author name
- ✅ Class badge (top-right corner)
- ✅ Description (truncated)
- ✅ Category tag (blue badge)
- ✅ Language tag (green badge)
- ✅ "Read Now" button (if PDF available)
- ✅ Cover image OR fallback design with book icon

### Step 2.4: Check Header Information
At the top of the page, verify:
- ✅ "📚 Digital Library" title
- ✅ Description text
- ✅ "Your Class: X" (shows student's class)
- ✅ "Total Books Available: X" (shows total count)

---

## Test 3: Test Filtering System

### Step 3.1: Test Search
1. Type "Math" in the search box
2. ✅ Should show only books with "Math" in title or author
3. Clear search
4. ✅ Should show all books again

### Step 3.2: Test Category Filter
1. Select "Textbooks" from Category dropdown
2. ✅ Should show only textbooks
3. Select "Stories" from Category dropdown
4. ✅ Should show only stories
5. Select "All Categories"
6. ✅ Should show all books

### Step 3.3: Test Language Filter
1. Select "English" from Language dropdown
2. ✅ Should show only English books
3. Select "বাংলা" from Language dropdown
4. ✅ Should show only Bangla books
5. Select "All Languages"
6. ✅ Should show all books

### Step 3.4: Test Class Filter
1. Select "Class 6" from Class Level dropdown
2. ✅ Should show only Class 6 books
3. Select "Class 9" from Class Level dropdown
4. ✅ Should show only Class 9 books
5. Select "All Classes"
6. ✅ Should show all books

### Step 3.5: Test Combined Filters
1. Select Category: "Textbooks"
2. Select Language: "Bangla"
3. Select Class: "Class 6"
4. ✅ Should show only Bangla textbooks for Class 6
5. ✅ Results count should update

### Step 3.6: Test Quick Filter Button
1. Click "📚 Show My Class Books" button
2. ✅ Should filter to show only student's class books
3. ✅ Class dropdown should update to student's class

### Step 3.7: Test Reset Filters Button
1. Set multiple filters (category, language, class, search)
2. Click "🔄 Reset Filters" button
3. ✅ All filters should reset to "all"
4. ✅ Search box should clear
5. ✅ Should show all books

---

## Test 4: Test PDF Viewer

### Step 4.1: Open PDF Viewer
1. Find a book with "Read Now" button
2. Click "Read Now" button
3. ✅ PDF viewer modal should open
4. ✅ PDF should load and display
5. ✅ Should see PDF content

### Step 4.2: Close PDF Viewer
1. Click close button (X) in PDF viewer
2. ✅ Should return to books library
3. ✅ Should see books grid again

### Step 4.3: Test Multiple Books
1. Open different books one by one
2. ✅ Each should open in PDF viewer
3. ✅ Correct PDF should load for each book

---

## Test 5: Test Empty States

### Step 5.1: Test No Results State
1. Type "ZZZZZ" in search box (something that won't match)
2. ✅ Should see "No books found" message
3. ✅ Should see "Try adjusting your search or filter criteria"
4. ✅ Should see "Clear Filters" button
5. Click "Clear Filters"
6. ✅ Should show all books again

### Step 5.2: Test No Books State (Optional)
1. As admin, delete all books
2. As student, go to Books page
3. ✅ Should see "No books found" message
4. ✅ Should see "No books have been added yet"

---

## Test 6: Test Responsive Design

### Step 6.1: Desktop View (1920px)
1. Open browser at full width
2. ✅ Should see 4 columns of books
3. ✅ Filters should be in one row
4. ✅ All elements visible

### Step 6.2: Tablet View (768px)
1. Resize browser to ~768px width
2. ✅ Should see 2-3 columns of books
3. ✅ Filters should adjust
4. ✅ All elements still accessible

### Step 6.3: Mobile View (375px)
1. Resize browser to ~375px width
2. ✅ Should see 1 column of books
3. ✅ Filters should stack vertically
4. ✅ Buttons should be full width
5. ✅ All content readable

---

## Test 7: Test Dark Mode

### Step 7.1: Switch to Dark Mode
1. Enable dark mode (if available in your app)
2. ✅ Background should be dark
3. ✅ Text should be light
4. ✅ Cards should have dark background
5. ✅ Badges should have dark variants
6. ✅ All text should be readable

### Step 7.2: Switch Back to Light Mode
1. Disable dark mode
2. ✅ Should return to light theme
3. ✅ All elements should look correct

---

## Test 8: Test Performance

### Step 8.1: Page Load Time
1. Refresh the Books page
2. ✅ Should load within 2 seconds
3. ✅ Loading spinner should show briefly
4. ✅ Books should appear smoothly

### Step 8.2: Filter Response Time
1. Change filters rapidly
2. ✅ Results should update instantly
3. ✅ No lag or delay
4. ✅ Smooth transitions

### Step 8.3: Search Response Time
1. Type in search box
2. ✅ Results should filter in real-time
3. ✅ No delay between typing and filtering

---

## Test 9: Test Error Handling

### Step 9.1: Test Network Error
1. Stop the backend server
2. Refresh the Books page
3. ✅ Should see error message
4. ✅ Should see "Try Again" button
5. Start backend server
6. Click "Try Again"
7. ✅ Books should load

### Step 9.2: Test Authentication Error
1. Clear localStorage (delete token)
2. Refresh the Books page
3. ✅ Should redirect to login page

---

## Test 10: Test Book Information

### Step 10.1: Verify Book Details
For each book, verify:
- ✅ Title is correct
- ✅ Author is correct
- ✅ Class level is correct
- ✅ Category is correct
- ✅ Language is correct
- ✅ Description is shown
- ✅ PDF link works (if available)
- ✅ Cover image shows (if available)

### Step 10.2: Verify Results Count
1. Check "Showing X of Y books" text
2. ✅ X should match filtered results
3. ✅ Y should match total books
4. Apply filters
5. ✅ Count should update correctly

---

## Test 11: Test Info Section

### Step 11.1: Verify Info Box
Scroll to bottom of page:
- ✅ Should see blue info box
- ✅ Should see "About Digital Library" heading
- ✅ Should see feature list:
  - Access NCTB textbooks
  - Available in English and Bangla
  - Books for all classes (6-12)
  - Read online with PDF viewer
  - Bookmark progress

---

## Test 12: Test Multiple Users

### Step 12.1: Test Class 6 Student
1. Login as Class 6 student
2. Go to Books page
3. Click "Show My Class Books"
4. ✅ Should show only Class 6 books

### Step 12.2: Test Class 10 Student
1. Login as Class 10 student
2. Go to Books page
3. Click "Show My Class Books"
4. ✅ Should show only Class 10 books

### Step 12.3: Test Teacher Account
1. Login as teacher
2. Go to Books page
3. ✅ Should see all books
4. ✅ Can filter by any class

---

## 📊 Test Results Summary

### Critical Tests (Must Pass)
- [ ] Books load from API
- [ ] All filters work correctly
- [ ] PDF viewer opens and displays PDFs
- [ ] Responsive design works
- [ ] Error handling works

### Important Tests (Should Pass)
- [ ] Search works in real-time
- [ ] Quick filters work
- [ ] Empty states display correctly
- [ ] Dark mode works
- [ ] Performance is good

### Nice-to-Have Tests (Optional)
- [ ] Animations are smooth
- [ ] Info section displays
- [ ] Multiple users work correctly

---

## 🐛 Common Issues and Solutions

### Issue: Books not loading
**Check:**
1. Backend server is running
2. Frontend can reach backend
3. User is authenticated
4. Books exist in database

### Issue: PDF not opening
**Check:**
1. PDF file exists in media folder
2. MEDIA_URL is configured
3. PDF viewer component works
4. Browser allows PDF display

### Issue: Filters not working
**Check:**
1. JavaScript console for errors
2. React state is updating
3. Filter logic is correct

### Issue: Images not loading
**Check:**
1. Image files exist in media folder
2. MEDIA_URL is configured
3. Image URLs are correct
4. Browser can load images

---

## ✅ Final Verification

After completing all tests:

1. ✅ Admin can add books for all classes (6-12)
2. ✅ Students can view all books
3. ✅ Filtering system works perfectly
4. ✅ PDF viewer works
5. ✅ Responsive design works
6. ✅ Dark mode works
7. ✅ Error handling works
8. ✅ Performance is good
9. ✅ No console errors
10. ✅ All features working as expected

---

## 🎉 Testing Complete!

If all tests pass, the Books feature is:
- ✅ Fully functional
- ✅ Ready for production
- ✅ User-friendly
- ✅ Well-tested

**Status:** READY FOR USE
