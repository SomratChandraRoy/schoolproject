# ✅ Duplicate UserPerformance Fix - Complete

## Issue
```
UserPerformance.MultipleObjectsReturned: get() returned more than one UserPerformance -- it returned 3!
```

When submitting quiz attempts, the system crashed because multiple `UserPerformance` records existed for the same user+subject combination.

---

## Root Cause

The `UserPerformance` model was missing a **unique constraint** on `user + subject`, allowing duplicate records to be created.

---

## Solution Implemented

### 1. Added Unique Constraint ✅
**File**: `backend/quizzes/models.py`

```python
class UserPerformance(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.CharField(max_length=50)
    # ... other fields ...
    
    class Meta:
        unique_together = ['user', 'subject']  # ← Added this
        ordering = ['-last_updated']
```

### 2. Fixed View to Handle Existing Duplicates ✅
**File**: `backend/quizzes/views.py`

```python
try:
    performance, created = UserPerformance.objects.get_or_create(...)
except UserPerformance.MultipleObjectsReturned:
    # If duplicates exist, use the most recent one and delete others
    performances = UserPerformance.objects.filter(
        user=user, subject=quiz.subject
    ).order_by('-last_updated')
    
    performance = performances.first()
    
    # Delete duplicates
    duplicate_ids = [p.id for p in performances[1:]]
    UserPerformance.objects.filter(id__in=duplicate_ids).delete()
```

### 3. Created Cleanup Command ✅
**File**: `backend/quizzes/management/commands/cleanup_duplicates.py`

```bash
python manage.py cleanup_duplicates
```

**Results**:
```
Found 4 duplicate groups
✓ Cleaned user_id=3, subject=bangla_1st: kept ID 21, deleted 5 duplicates
✓ Cleaned user_id=2, subject=bangladesh_global: kept ID 9, deleted 5 duplicates
✓ Cleaned user_id=2, subject=bangla_1st: kept ID 3, deleted 2 duplicates
✓ Cleaned user_id=2, subject=science: kept ID 15, deleted 5 duplicates

Total records deleted: 17
✅ Cleanup complete!
```

### 4. Applied Migration ✅
```bash
python manage.py makemigrations
python manage.py migrate
```

**Migration**: `quizzes/0008_alter_userperformance_options_and_more.py`

---

## Testing

### Before Fix ❌
```
POST /api/quizzes/attempt/
→ 500 Internal Server Error
→ UserPerformance.MultipleObjectsReturned
```

### After Fix ✅
```
POST /api/quizzes/attempt/
→ 200 OK
→ Performance tracked correctly
→ No duplicates created
```

---

## Files Modified

1. ✅ `backend/quizzes/models.py` - Added unique constraint
2. ✅ `backend/quizzes/views.py` - Added duplicate handling
3. ✅ `backend/quizzes/management/commands/cleanup_duplicates.py` - New cleanup command

---

## Migration Applied

- ✅ `quizzes/0008_alter_userperformance_options_and_more.py`

---

## How to Prevent Future Duplicates

The unique constraint ensures that:
- Only ONE `UserPerformance` record per user+subject
- Database enforces this at the schema level
- `get_or_create()` will work correctly
- No more `MultipleObjectsReturned` errors

---

## If You See This Error Again

1. **Run cleanup command**:
   ```bash
   python manage.py cleanup_duplicates
   ```

2. **Check if migration applied**:
   ```bash
   python manage.py showmigrations quizzes
   ```
   
   Should show:
   ```
   [X] 0008_alter_userperformance_options_and_more
   ```

3. **Verify unique constraint**:
   ```python
   from quizzes.models import UserPerformance
   print(UserPerformance._meta.unique_together)
   # Should show: (('user', 'subject'),)
   ```

---

## Status: ✅ FIXED

The duplicate issue is completely resolved:
- ✅ Existing duplicates cleaned (17 records deleted)
- ✅ Unique constraint added
- ✅ View handles edge cases
- ✅ Migration applied
- ✅ Quiz attempts work correctly

**Date**: December 24, 2025
**Version**: 1.0.1
