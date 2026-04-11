# 🚀 Student Dashboard - Setup & Testing Guide

## ✅ What's Been Implemented

### Frontend Component

- ✅ **StudentDashboard.tsx** - Complete React component at `/src/pages/StudentDashboard.tsx`
  - Add subject form with icon/color picker
  - 3 chart types (Bar, Pie, Radar)
  - KPI cards with metrics
  - Subject management table
  - Responsive design (mobile/tablet/desktop)
  - Dark mode support

### Backend Integration

- ✅ Subject CRUD endpoints already available
  - `GET /api/academics/subjects/` - List subjects
  - `POST /api/academics/subjects/` - Create subject
  - `DELETE /api/academics/subjects/{id}/` - Delete subject
  - `GET /api/academics/subjects/dashboard_stats/` - Get stats for dashboard

### Frontend Updates

- ✅ Added route in `App.tsx`: `/study-dashboard`
- ✅ Updated `Dashboard.tsx` with link to Study Progress
- ✅ Added recharts to `package.json` dependencies

---

## 📋 Requirements

### Backend (Already Available)

```
✅ Django 6.0+
✅ DRF (rest_framework)
✅ User authentication (Token-based)
✅ Subject model with progress tracking
```

### Frontend (Need to Install)

```
Required:
  - React 18+
  - Recharts 2.10+ (Beautiful charts library)
  - Tailwind CSS
  - Axios

Already installed:
  - React Router
  - TypeScript
```

---

## 🔧 Installation Steps

### Step 1: Install Dependencies

```bash
cd frontend/medhabangla
npm install recharts
```

### Step 2: Verify Setup

Check that these files exist:

- ✅ `src/pages/StudentDashboard.tsx` - Component created
- ✅ `src/App.tsx` - Route added
- ✅ `src/pages/Dashboard.tsx` - Link added

### Step 3: Start Development Server

```bash
# Terminal 1: Backend
cd backend
python manage.py runserver

# Terminal 2: Frontend
cd frontend/medhabangla
npm run dev
```

### Step 4: Access the Dashboard

```
http://localhost:5173/study-dashboard
```

---

## 📊 Testing Checklist

### Pre-Test Setup

- [ ] User logged in
- [ ] Backend running on :8000
- [ ] Frontend running on :5173
- [ ] Recharts installed

### Test 1: Empty State

1. Navigate to `/study-dashboard`
2. Should see welcome screen
3. Click "Add Your First Subject" button
4. Form should appear

### Test 2: Add Subject

1. Enter subject name: "Mathematics"
2. Click icon: "📕"
3. Click color: Blue (#3B82F6)
4. Click "Add Subject" button
5. Should return to empty state or show new subject

### Test 3: Add Multiple Subjects

1. Add at least 5 subjects:
   - Mathematics (📕 Blue)
   - Physics (📗 Green)
   - Chemistry (🟡 Amber)
   - Biology (📙 Red)
   - English (📘 Purple)

2. Should see:
   - KPI cards updated
   - Subject table populated
   - Chart data showing

### Test 4: Charts Functionality

1. **Bar Chart (📊)**
   - Shows bars for each subject
   - Labels visible
   - Tooltip on hover

2. **Pie Chart (🥧)**
   - Shows pie slices with colors
   - Labels with percentages
   - Matches subject colors

3. **Radar Chart (⭐)**
   - Shows spider web pattern
   - All subjects plotted
   - Grid visible

4. **Chart Switching**
   - Click button to switch charts
   - All three types work smoothly
   - No console errors

### Test 5: Subject Deletion

1. Click "🗑️ Delete" on any subject
2. Should ask for confirmation
3. Click "Confirm"
4. Subject should disappear
5. KPI cards should update

### Test 6: Responsive Design

1. **Desktop** (> 1024px)
   - 4 KPI cards in one row
   - Charts side-by-side
   - Full table visible

2. **Tablet** (768px - 1024px)
   - 2 KPI cards per row
   - Charts stacked
   - Responsive table

3. **Mobile** (< 768px)
   - 1 KPI card per row
   - Charts full width
   - Simplified table

### Test 7: Dark Mode

1. Toggle dark mode (if available)
2. All text should be readable
3. Charts should show properly
4. Buttons should be visible

### Test 8: API Integration

1. Open browser DevTools
2. Monitor Network tab
3. Add subject → Check POST request
4. View stats → Check GET dashboard_stats request
5. Delete subject → Check DELETE request
6. All requests should return 200/201/204

### Test 9: Error Handling

1. Try adding subject with empty name
   - Should disable button
   - Should show validation

2. Try adding subject without internet
   - Should show error message
   - User can contact support

3. Try navigating without login
   - Should redirect to login

### Test 10: Performance

1. Add 20+ subjects
2. Charts should still render smoothly
3. No lag or jank
4. Dashboard should load in < 2 seconds

---

## 🐛 Debugging Tips

### If Charts Don't Show

```javascript
// Check in browser console
1. Open DevTools (F12)
2. Check Network tab for recharts errors
3. Check Console tab for JavaScript errors
4. Verify recharts import is correct
```

### If Data Doesn't Load

```javascript
// Check API calls
1. Open DevTools → Network tab
2. Look for /api/academics/subjects/dashboard_stats/
3. It should return 200 status
4. Response should have chart_data array
```

### If Subjects Don't Save

```javascript
// Check backend
1. Ensure token is in localStorage
2. Verify user is authenticated
3. Check Django logs for errors
4. Check database has Subject records
```

### Console Commands to Test

```javascript
// Test in browser console:

// Check if user logged in
localStorage.getItem("token");

// Check user data
localStorage.getItem("user");

// Manually test API
fetch("/api/academics/subjects/dashboard_stats/", {
  headers: {
    Authorization: "Token " + localStorage.getItem("token"),
  },
})
  .then((r) => r.json())
  .then((data) => console.log(data));
```

---

## 📱 Test Data

### Sample Subject Data

```json
[
  {
    "id": 1,
    "name": "Mathematics",
    "icon": "📕",
    "color_code": "#3B82F6",
    "progress_percentage": 85
  },
  {
    "id": 2,
    "name": "Physics",
    "icon": "📗",
    "color_code": "#10B981",
    "progress_percentage": 72
  },
  {
    "id": 3,
    "name": "Chemistry",
    "icon": "🟡",
    "color_code": "#F59E0B",
    "progress_percentage": 61
  }
]
```

### Expected Dashboard Stats Response

```json
{
  "overall_progress": 73,
  "total_subjects": 3,
  "total_topics": 60,
  "completed_topics": 44,
  "chart_data": [
    {
      "id": 1,
      "name": "Mathematics",
      "progress": 85,
      "color_code": "#3B82F6",
      "total": 20,
      "completed": 17
    }
  ]
}
```

---

## ✅ Quality Assurance Checklist

### Functionality

- [ ] Can add subjects
- [ ] Can delete subjects
- [ ] Charts render correctly
- [ ] KPI cards update
- [ ] Progress percentages calculate
- [ ] Form validation works

### UI/UX

- [ ] Responsive design works
- [ ] Dark mode supported
- [ ] Icons display correctly
- [ ] Colors are visible
- [ ] Buttons are clickable
- [ ] Modal closes properly

### Performance

- [ ] Dashboard loads < 2s
- [ ] Charts render smoothly
- [ ] No console errors
- [ ] Mobile optimized
- [ ] Images don't cause lag

### Accessibility

- [ ] Keyboard navigation works
- [ ] Color contrast sufficient
- [ ] Labels are descriptive
- [ ] Mobile touch targets adequate
- [ ] Screen reader friendly

### Security

- [ ] Token authentication required
- [ ] User data isolated
- [ ] CSRF protection active
- [ ] Inputs validated
- [ ] No sensitive data in console

---

## 🚀 Deployment Checklist

### Before Going Live

- [ ] All tests pass
- [ ] No console errors
- [ ] Performance optimized
- [ ] Documentation complete
- [ ] Backup created
- [ ] Staging environment tested

### Production Deployment

```bash
# Production build
cd frontend/medhabangla
npm run build

# Verify build
npm run preview

# Deploy to server
# (Your deployment process)
```

### Post-Deployment

- [ ] Test in production environment
- [ ] Monitor error logs
- [ ] Check analytics
- [ ] Gather user feedback
- [ ] Plan next iteration

---

## 📊 Expected Behavior

### First Time User

1. Sees welcome screen
2. Clicks "Add Your First Subject"
3. Adds subject successfully
4. Sees dashboard with 1 subject
5. Adds more subjects
6. Views different charts
7. Manages subjects

### Returning User

1. Logs in
2. Visits dashboard
3. Sees all their subjects
4. Can see progress charts
5. Can update subjects
6. Can view analytics

### Edge Cases

1. Empty dashboard → Shows welcome message
2. Single subject → Charts still work
3. Many subjects (20+) → Still responsive
4. No topics → Shows 0% progress
5. All topics completed → Shows 100%

---

## 🔗 API Reference

### GET Dashboard Stats

```
Endpoint: GET /api/academics/subjects/dashboard_stats/
Auth: Required (Token)
Response: 200 OK

Returns: {
  overall_progress: number,
  total_subjects: number,
  total_topics: number,
  completed_topics: number,
  chart_data: Array<{
    id: number,
    name: string,
    progress: number,
    color_code: string,
    total: number,
    completed: number
  }>
}
```

### POST Create Subject

```
Endpoint: POST /api/academics/subjects/
Auth: Required (Token)
Body: {
  name: string (required),
  color_code: string (optional, default #3B82F6),
  icon: string (optional, default 📚)
}

Response: 201 Created
Returns: Created subject object
```

### DELETE Subject

```
Endpoint: DELETE /api/academics/subjects/{id}/
Auth: Required (Token)
Response: 204 No Content
```

---

## 📞 Support & Troubleshooting

### Getting Help

1. Check files are correctly placed
2. Verify npm install ran successfully
3. Check browser console for errors
4. Look at network requests
5. Check Django backend logs

### Common Errors

| Error                | Cause                  | Solution                   |
| -------------------- | ---------------------- | -------------------------- |
| "Recharts not found" | Not installed          | `npm install recharts`     |
| "No subjects"        | API not returning data | Check authentication token |
| Charts blank         | Data format wrong      | Verify API response        |
| Permission denied    | Not authenticated      | Login again                |

---

## 🎉 Success Indicators

✅ **Feature is working correctly when:**

1. Dashboard loads without errors
2. Can add subjects successfully
3. Charts display with data
4. KPI cards show correct values
5. Can delete subjects
6. Charts update when subjects change
7. Responsive on all devices
8. No console errors

---

## 📝 Notes

- This feature integrates with existing Subject/Topic models
- Progress calculation is based on topic completion status
- All data is user-specific (isolated)
- Charts are interactive (hover for details)
- Mobile-first responsive design
- Fully dark mode compatible

---

**Document Version**: 1.0
**Created**: April 11, 2026
**Status**: ✅ Ready for Testing
