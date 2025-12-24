# How to Ban Users - Visual Guide 🚫

## Where to Find Ban Feature

### Step 1: Navigate to Superuser Dashboard
1. Login as admin user
2. Go to `/superuser` page
3. You'll see tabs at the top

### Step 2: Click Users Tab
Look for the tab navigation and click:
```
📊 Statistics | 👥 Users | 📝 Quizzes | 📚 Subjects | 📖 Books | 📋 Syllabus
                  ↑
              Click here!
```

### Step 3: Find the User
You'll see a table with columns:
```
| User | Role | Status | Points | Joined | Actions |
```

The **Actions** column (rightmost) has the ban buttons!

## What You'll See

### For Active Users (Not Banned)
In the Actions column, you'll see **3 buttons**:
```
[👤 Role]  [🚫 Ban]
```

- **👤 Role** - Change user role (Student/Teacher/Admin)
- **🚫 Ban** - Ban the user

### For Banned Users
In the Actions column, you'll see:
```
[👤 Role]  [✅ Unban]
```

- **👤 Role** - Change user role
- **✅ Unban** - Remove ban from user

## How to Ban a User

### Method 1: Using Ban Button (Recommended)
1. Find the user in the list
2. Look at the **Actions** column (far right)
3. Click the **🚫 Ban** button
4. A modal will pop up
5. Enter ban reason (e.g., "Violation of terms")
6. Click "Ban User"
7. Done! User is banned

### Visual Example:
```
┌─────────────────────────────────────────────────────────────┐
│ User: John Doe                                              │
│ Email: john@example.com                                     │
│ Role: [Student]                                             │
│ Status: [✅ Active]                                         │
│ Actions: [👤 Role] [🚫 Ban] ← Click this!                  │
└─────────────────────────────────────────────────────────────┘
```

### Ban Modal:
```
┌──────────────────────────────────┐
│ Ban User: john                   │
│                                  │
│ Ban Reason:                      │
│ ┌──────────────────────────────┐ │
│ │ Enter reason here...         │ │
│ │                              │ │
│ │                              │ │
│ └──────────────────────────────┘ │
│                                  │
│  [Cancel]  [Ban User]            │
└──────────────────────────────────┘
```

## How to Unban a User

1. Find the banned user (row has red background)
2. Look at the **Actions** column
3. Click the **✅ Unban** button
4. Confirm the action
5. Done! User is unbanned

### Visual Example:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 BANNED USER (Red Background)                            │
│ User: Jane Doe                                              │
│ Email: jane@example.com                                     │
│ Role: [Student]                                             │
│ Status: [🚫 Banned] - Violation of terms                   │
│ Actions: [👤 Role] [✅ Unban] ← Click this!                │
└─────────────────────────────────────────────────────────────┘
```

## Important Notes

### ⚠️ Don't Confuse with Edit Button
The old SuperuserDashboard had an "Edit" button that opens a form with:
- Username
- Email
- Class level
- Roles (Student, Teacher, Admin)

**This is NOT where you ban users!**

The ban feature is in the **separate Ban button** (🚫) in the Actions column.

### 🎯 Quick Reference

| Button | Icon | Purpose | Location |
|--------|------|---------|----------|
| Role | 👤 | Change user role | Actions column |
| Ban | 🚫 | Ban active user | Actions column |
| Unban | ✅ | Unban banned user | Actions column |

### 🔍 Search & Filter

Can't find the user? Use the tools at the top:

**Search Box:**
```
┌────────────────────────────────────┐
│ 🔍 Search users...                 │
└────────────────────────────────────┘
```
Type: name, email, or username

**Filter Dropdown:**
```
┌──────────────────┐
│ All Users    ▼   │
├──────────────────┤
│ All Users        │
│ Students         │
│ Teachers         │
│ Admins           │
└──────────────────┘
```

## Permissions

### What You Can Do (as Admin):
- ✅ Ban students
- ✅ Ban teachers
- ✅ Ban other admins (if you're superuser)
- ✅ Unban anyone
- ✅ Change roles

### What You Cannot Do:
- ❌ Ban yourself
- ❌ Modify yourself

### If You're a Teacher (not Admin):
- ✅ Ban students only
- ❌ Cannot ban teachers
- ❌ Cannot ban admins
- ❌ Cannot see admin actions

## Troubleshooting

### "I don't see the Users tab"
**Solution**: Make sure you're logged in as admin (`is_admin=True`)

### "I don't see the Ban button"
**Possible reasons**:
1. You're looking at the wrong user (yourself)
2. You're a teacher trying to ban another teacher/admin
3. The page hasn't loaded yet (refresh)

### "The Ban button doesn't work"
**Check**:
1. Browser console for errors (F12)
2. Network tab to see if API call is made
3. Backend server is running
4. You have admin permissions

### "I see 'No actions' instead of buttons"
**Reason**: You cannot modify this user because:
- It's yourself, OR
- You're a teacher and the user is a teacher/admin

## Visual Layout

Here's what the full Users tab looks like:

```
┌────────────────────────────────────────────────────────────────┐
│ 👥 Users Management                                            │
│                                                                │
│ ┌──────────────────────────┐  ┌──────────────┐               │
│ │ 🔍 Search users...       │  │ All Users ▼  │               │
│ └──────────────────────────┘  └──────────────┘               │
│                                                                │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ User          │ Role    │ Status  │ Points │ Actions      ││
│ ├────────────────────────────────────────────────────────────┤│
│ │ John Doe      │ Student │ Active  │ 100    │ 👤 🚫       ││
│ │ jane@ex.com   │         │         │        │              ││
│ ├────────────────────────────────────────────────────────────┤│
│ │ Jane Smith    │ Teacher │ Active  │ 250    │ 👤 🚫       ││
│ │ jane@ex.com   │         │         │        │              ││
│ ├────────────────────────────────────────────────────────────┤│
│ │ Bob Wilson    │ Student │ BANNED  │ 50     │ 👤 ✅       ││
│ │ bob@ex.com    │         │ Spam    │        │              ││
│ └────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

## Button Appearance

The buttons now have **text labels** for clarity:

### Before (Icon only):
```
👤  🚫
```

### After (Icon + Text):
```
[👤 Role]  [🚫 Ban]
```

Much easier to see and understand!

## Summary

**To ban a user:**
1. Go to `/superuser`
2. Click "👥 Users" tab
3. Find the user
4. Click **🚫 Ban** button in Actions column
5. Enter reason
6. Confirm

**To unban a user:**
1. Find banned user (red background)
2. Click **✅ Unban** button
3. Confirm

That's it! The ban feature is in the Actions column, not in the edit form.
