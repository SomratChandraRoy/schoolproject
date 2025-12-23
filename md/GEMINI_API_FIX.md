# Gemini API Not Working - Root Cause & Solutions

## 🔍 ROOT CAUSE IDENTIFIED

### Issue 1: **API Quota Exceeded** ❌

**Error Message**:
```
429 You exceeded your current quota, please check your plan and billing details.
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests
Limit: 20 requests per day
Model: gemini-2.5-flash
Retry in: 29 seconds
```

**What this means**:
- You've used all 20 free requests for today
- Free tier limit: 20 requests/day for gemini-2.5-flash
- Need to wait ~24 hours for quota reset
- Or upgrade to paid plan

### Issue 2: **Deprecated Package** ⚠️

**Warning**:
```
All support for the `google.generativeai` package has ended.
Please switch to the `google.genai` package as soon as possible.
```

**What this means**:
- Current package is deprecated
- Should migrate to new package
- Old package still works but won't get updates

---

## ✅ SOLUTIONS

### Solution 1: Wait for Quota Reset (FREE)

**Time**: 24 hours
**Cost**: Free

**Steps**:
1. Wait until tomorrow (quota resets daily)
2. Check quota status: https://ai.dev/usage?tab=rate-limit
3. Try again after reset

**Pros**: Free, no changes needed
**Cons**: Have to wait

---

### Solution 2: Create New API Key (FREE)

**Time**: 5 minutes
**Cost**: Free

**Steps**:

1. **Go to Google AI Studio**:
   - Visit: https://aistudio.google.com/apikey

2. **Create New API Key**:
   - Click "Create API Key"
   - Select project or create new one
   - Copy the new key

3. **Update .env file**:
   ```bash
   # Open backend/.env
   # Replace old key with new key
   GEMINI_API_KEY=YOUR_NEW_API_KEY_HERE
   ```

4. **Restart backend server**:
   ```bash
   python manage.py runserver
   ```

**Pros**: Quick, free, fresh quota
**Cons**: Still limited to 20/day

---

### Solution 3: Use Different Model (FREE)

**Time**: 2 minutes
**Cost**: Free

Some models have different quotas. Try switching to `gemini-1.5-flash`:

**Steps**:

1. **Update backend/ai/views.py**:
   ```python
   # Find this line (around line 261):
   model = genai.GenerativeModel('gemini-2.5-flash')
   
   # Change to:
   model = genai.GenerativeModel('gemini-1.5-flash')
   ```

2. **Restart backend server**

**Pros**: Different quota pool
**Cons**: Older model, may have different limits

---

### Solution 4: Upgrade to Paid Plan (PAID)

**Time**: 10 minutes
**Cost**: Pay-as-you-go

**Steps**:

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/

2. **Enable Billing**:
   - Set up billing account
   - Enable Gemini API billing

3. **Get higher limits**:
   - 1,500 requests/day (paid tier)
   - Or more with enterprise

**Pros**: Much higher limits, reliable
**Cons**: Costs money

---

### Solution 5: Implement Caching (RECOMMENDED)

**Time**: 30 minutes
**Cost**: Free

Cache generated questions to reduce API calls:

**Implementation**:

1. **Create cache file** `backend/ai/cache.py`:
```python
import json
import hashlib
from django.core.cache import cache

def get_cache_key(subject, class_level, difficulty, question_type):
    """Generate cache key from parameters"""
    data = f"{subject}_{class_level}_{difficulty}_{question_type}"
    return f"ai_question_{hashlib.md5(data.encode()).hexdigest()}"

def get_cached_question(subject, class_level, difficulty, question_type):
    """Get cached question if available"""
    key = get_cache_key(subject, class_level, difficulty, question_type)
    return cache.get(key)

def cache_question(subject, class_level, difficulty, question_type, question_data):
    """Cache generated question for 7 days"""
    key = get_cache_key(subject, class_level, difficulty, question_type)
    cache.set(key, question_data, 60 * 60 * 24 * 7)  # 7 days
```

2. **Update views.py** to use cache:
```python
# Before calling Gemini API:
cached = get_cached_question(subject, class_level, difficulty, question_type)
if cached:
    # Use cached question
    quiz_question = Quiz.objects.create(**cached)
    return Response(...)

# After getting AI response:
cache_question(subject, class_level, difficulty, question_type, question_data)
```

**Pros**: Reduces API calls, faster responses
**Cons**: Same questions may repeat

---

### Solution 6: Use Alternative AI (ADVANCED)

**Time**: 2 hours
**Cost**: Varies

Switch to alternative AI providers:
- OpenAI GPT-4 (paid)
- Anthropic Claude (paid)
- Local LLM (free but needs GPU)

**Not recommended** unless you need it long-term.

---

## 🔧 IMMEDIATE FIX (Choose One)

### Option A: Wait (Easiest)
```bash
# Just wait 24 hours
# Check quota: https://ai.dev/usage?tab=rate-limit
```

### Option B: New API Key (Fastest)
```bash
# 1. Get new key: https://aistudio.google.com/apikey
# 2. Update backend/.env:
GEMINI_API_KEY=YOUR_NEW_KEY

# 3. Restart server:
python manage.py runserver
```

### Option C: Switch Model (Quick)
```bash
# Edit backend/ai/views.py
# Change: gemini-2.5-flash
# To: gemini-1.5-flash
# Restart server
```

---

## 📊 QUOTA INFORMATION

### Free Tier Limits:
- **gemini-2.5-flash**: 20 requests/day
- **gemini-1.5-flash**: 15 requests/minute, 1,500/day
- **gemini-1.5-pro**: 2 requests/minute, 50/day

### Paid Tier Limits:
- **Much higher**: 1,000+ requests/minute
- **Pay-as-you-go**: ~$0.001 per request
- **Enterprise**: Custom limits

### Check Your Usage:
- Visit: https://ai.dev/usage?tab=rate-limit
- See current usage and limits
- Monitor quota consumption

---

## 🧪 TEST API STATUS

Run this command to check API status:

```bash
cd backend
python test_gemini_api.py
```

**Expected Output (Working)**:
```
✓ API Key found
✓ Gemini configured successfully
✓ Model created successfully
✓ API Response received
✓ Gemini API is working correctly!
```

**Expected Output (Quota Exceeded)**:
```
❌ ERROR: 429 You exceeded your current quota
Retry in: XX seconds
```

---

## 💡 BEST PRACTICES

### To Avoid Quota Issues:

1. **Implement Caching**: Cache generated questions
2. **Rate Limiting**: Add delays between requests (already done: 500ms)
3. **Batch Generation**: Generate multiple at once (already done)
4. **Monitor Usage**: Check quota regularly
5. **Upgrade Plan**: If using heavily, upgrade to paid

### For Development:

1. **Use Test Data**: Mock AI responses during development
2. **Limit Testing**: Don't test AI generation repeatedly
3. **Cache Results**: Save generated questions for reuse
4. **Monitor Quota**: Check usage before testing

### For Production:

1. **Paid Plan**: Use paid tier for reliability
2. **Error Handling**: Graceful fallback when quota exceeded
3. **User Feedback**: Show clear error messages
4. **Alternative**: Have backup AI provider

---

## 🔄 MIGRATION TO NEW PACKAGE (Optional)

The current package is deprecated. Here's how to migrate:

### Step 1: Install New Package
```bash
pip uninstall google-generativeai
pip install google-genai
```

### Step 2: Update Imports
```python
# Old:
import google.generativeai as genai

# New:
from google import genai
```

### Step 3: Update Code
```python
# Old:
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

# New:
client = genai.Client(api_key=settings.GEMINI_API_KEY)
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=prompt
)
```

**Note**: This is optional. Old package still works.

---

## 📞 SUPPORT RESOURCES

### Official Documentation:
- Gemini API Docs: https://ai.google.dev/gemini-api/docs
- Rate Limits: https://ai.google.dev/gemini-api/docs/rate-limits
- Pricing: https://ai.google.dev/pricing

### Check Status:
- Usage Dashboard: https://ai.dev/usage
- API Status: https://status.cloud.google.com/

### Get Help:
- Google AI Forum: https://discuss.ai.google.dev/
- Stack Overflow: Tag `google-gemini`

---

## ✅ RECOMMENDED ACTION PLAN

### For Immediate Use:

1. **Create new API key** (5 minutes)
2. **Update .env file**
3. **Restart server**
4. **Test with 1-2 questions**

### For Long-Term:

1. **Implement caching** (reduces API calls)
2. **Monitor usage** (check quota daily)
3. **Consider paid plan** (if using heavily)
4. **Add error handling** (better user experience)

---

## 🎯 CURRENT STATUS

**Issue**: ❌ Quota exceeded (20/20 requests used)
**Impact**: Cannot generate new questions until quota resets
**Timeline**: Resets in ~24 hours
**Workaround**: Create new API key or wait

**Recommended**: Create new API key (fastest solution)

---

## 📝 QUICK FIX CHECKLIST

- [ ] Understand the issue (quota exceeded)
- [ ] Choose solution (new API key recommended)
- [ ] Get new API key from https://aistudio.google.com/apikey
- [ ] Update backend/.env with new key
- [ ] Restart backend server
- [ ] Test with `python test_gemini_api.py`
- [ ] Try generating 1 question
- [ ] Verify it works
- [ ] Implement caching (optional but recommended)
- [ ] Monitor usage going forward

---

## 🎉 AFTER FIX

Once fixed, you should be able to:
- ✅ Generate questions with AI
- ✅ Use bulk generation (1-10 questions)
- ✅ See beautiful loading animation
- ✅ Create questions for all subjects/classes

**Status**: Ready to fix! Choose a solution above and follow the steps.
