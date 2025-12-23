# Question Type Selection Feature - Documentation

## 🎯 Overview

Users can now select which types of questions they want to answer in their quiz. They can choose from:
- **MCQ (বহুনির্বাচনী)** - Multiple Choice Questions
- **Short Answer (সংক্ষিপ্ত উত্তর)** - Brief written answers
- **Long Answer (বিস্তারিত উত্তর)** - Detailed explanations

Users can select one or multiple question types, and the quiz will only show questions of the selected types.

## ✨ Features

### 1. Question Type Selection UI
- **Three Options:** MCQ, Short Answer, Long Answer
- **Multi-Select:** Users can choose multiple types
- **Visual Design:** Each type has unique icon and color
- **Bengali Support:** Names in both English and Bengali
- **Default Selection:** MCQ is selected by default

### 2. Smart Filtering
- **Frontend Filtering:** Questions filtered by type before display
- **Backend Filtering:** API supports question_types parameter
- **Flexible:** Works with single or multiple types
- **Validation:** Ensures at least one type is selected

### 3. User Experience
- **Clear Labels:** Each type clearly labeled with description
- **Visual Feedback:** Selected types show checkmark
- **Helpful Tip:** Info box explains multi-select capability
- **Smooth Flow:** Integrates seamlessly with existing quiz flow

## 🎨 Visual Design

### Question Type Cards

```
┌─────────────────────────────────────────────────────────┐
│ 📝 Select Question Types                                │
│ Choose one or more question types for your quiz         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │      ✓       │  │      ✍️      │  │      📝      │ │
│  │              │  │              │  │              │ │
│  │     MCQ      │  │ Short Answer │  │ Long Answer  │ │
│  │  বহুনির্বাচনী │  │ সংক্ষিপ্ত উত্তর│  │ বিস্তারিত উত্তর│ │
│  │              │  │              │  │              │ │
│  │   Multiple   │  │    Brief     │  │   Detailed   │ │
│  │   choice     │  │   written    │  │ explanations │ │
│  │  questions   │  │   answers    │  │              │ │
│  │              │  │              │  │              │ │
│  │ ✓ Selected   │  │              │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  💡 Tip: You can select multiple question types to     │
│  practice different formats in one quiz!                │
└─────────────────────────────────────────────────────────┘
```

## 🔄 User Flow

### Complete Quiz Selection Flow

```
1. Select Subjects
   ↓
2. Select Difficulty
   ↓
3. Select Question Types ← NEW!
   - MCQ (default selected)
   - Short Answer
   - Long Answer
   ↓
4. Click "Start Quiz"
   ↓
5. Quiz shows only selected question types
```

### Example Scenarios

#### Scenario 1: MCQ Only
```
User selects: ✓ MCQ
Quiz shows: Only multiple choice questions
```

#### Scenario 2: Written Answers Only
```
User selects: ✓ Short Answer, ✓ Long Answer
Quiz shows: Only short and long answer questions (no MCQ)
```

#### Scenario 3: All Types
```
User selects: ✓ MCQ, ✓ Short Answer, ✓ Long Answer
Quiz shows: Mix of all question types
```

## 🔧 Technical Implementation

### Frontend Changes

#### QuizSelection.tsx

**New State:**
```typescript
const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>(['mcq']);
```

**Question Types Definition:**
```typescript
const questionTypes = [
    { 
        id: 'mcq', 
        name: 'MCQ', 
        bengaliName: 'বহুনির্বাচনী',
        description: 'Multiple choice questions', 
        icon: '✓',
        color: 'bg-blue-100 dark:bg-blue-900/30'
    },
    { 
        id: 'short', 
        name: 'Short Answer', 
        bengaliName: 'সংক্ষিপ্ত উত্তর',
        description: 'Brief written answers', 
        icon: '✍️',
        color: 'bg-green-100 dark:bg-green-900/30'
    },
    { 
        id: 'long', 
        name: 'Long Answer', 
        bengaliName: 'বিস্তারিত উত্তর',
        description: 'Detailed explanations', 
        icon: '📝',
        color: 'bg-purple-100 dark:bg-purple-900/30'
    }
];
```

**Toggle Function:**
```typescript
const toggleQuestionType = (typeId: string) => {
    setSelectedQuestionTypes(prev =>
        prev.includes(typeId)
            ? prev.filter(id => id !== typeId)
            : [...prev, typeId]
    );
};
```

**Validation:**
```typescript
if (selectedQuestionTypes.length === 0) {
    alert('Please select at least one question type');
    return;
}
```

**Pass to Quiz:**
```typescript
navigate('/quiz', {
    state: {
        subjects: selectedSubjects,
        difficulty: selectedDifficulty,
        classLevel: userClass,
        questionTypes: selectedQuestionTypes  // NEW!
    }
});
```

#### Quiz.tsx

**Receive Question Types:**
```typescript
const { subjects, difficulty, classLevel, questionTypes } = location.state || {};
```

**Add to API Query:**
```typescript
if (questionTypes && questionTypes.length > 0) {
    queryParams += `&question_types=${questionTypes.join(',')}`;
}
```

**Frontend Filtering:**
```typescript
if (questionTypes && questionTypes.length > 0) {
    questions = questions.filter((q: any) => 
        questionTypes.includes(q.question_type)
    );
}
```

### Backend Changes

#### quizzes/views.py

**Get Question Types Parameter:**
```python
question_types = self.request.query_params.get('question_types', None)
```

**Filter Queryset:**
```python
if question_types:
    types_list = [t.strip() for t in question_types.split(',')]
    queryset = queryset.filter(question_type__in=types_list)
```

## 📊 API Integration

### API Request

**Endpoint:** `GET /api/quizzes/`

**Query Parameters:**
```
subject=english_1st
class_level=9
question_types=mcq,short
```

**Example:**
```
/api/quizzes/?subject=english_1st&class_level=9&question_types=mcq,short
```

### API Response

**Before Filtering:**
```json
{
  "count": 10,
  "results": [
    {"id": 1, "question_type": "mcq", ...},
    {"id": 2, "question_type": "short", ...},
    {"id": 3, "question_type": "long", ...},
    {"id": 4, "question_type": "mcq", ...}
  ]
}
```

**After Filtering (mcq,short):**
```json
{
  "count": 7,
  "results": [
    {"id": 1, "question_type": "mcq", ...},
    {"id": 2, "question_type": "short", ...},
    {"id": 4, "question_type": "mcq", ...}
  ]
}
```

## 🎯 Question Type Details

### 1. MCQ (Multiple Choice Questions)
- **ID:** `mcq`
- **Icon:** ✓
- **Color:** Blue
- **Format:** 4 options (A, B, C, D)
- **Answer:** Single selection
- **Use Case:** Quick assessment, objective testing

### 2. Short Answer
- **ID:** `short`
- **Icon:** ✍️
- **Color:** Green
- **Format:** Text input (3 rows)
- **Answer:** Brief written response
- **Use Case:** Definitions, brief explanations

### 3. Long Answer
- **ID:** `long`
- **Icon:** 📝
- **Color:** Purple
- **Format:** Text area (6 rows)
- **Answer:** Detailed written response
- **Use Case:** Essays, detailed explanations

## 🎨 UI Components

### Question Type Card

**Structure:**
```tsx
<button className="question-type-card">
  <div className="icon">{type.icon}</div>
  <h3 className="name">{type.name}</h3>
  <p className="bengali-name">{type.bengaliName}</p>
  <p className="description">{type.description}</p>
  {selected && <span className="badge">✓ Selected</span>}
</button>
```

**States:**
- **Default:** Gray border, white background
- **Hover:** Blue border, scale up
- **Selected:** Blue border, blue background, checkmark badge

### Info Box

```tsx
<div className="info-box">
  <div className="icon">💡</div>
  <p>
    <strong>Tip:</strong> You can select multiple question types 
    to practice different formats in one quiz!
  </p>
</div>
```

## 📱 Responsive Design

### Mobile (< 640px)
```css
- Single column layout
- Full width cards
- Stacked vertically
- Touch-friendly spacing
```

### Tablet (640px - 1024px)
```css
- 2 column layout
- Medium card size
- Comfortable spacing
```

### Desktop (> 1024px)
```css
- 3 column layout
- Large card size
- Optimal spacing
```

## 🌙 Dark Mode

All components support dark mode:
- ✅ Question type cards
- ✅ Selected state
- ✅ Info box
- ✅ Icons and text

**Colors:**
- Light mode: Bright colors with light backgrounds
- Dark mode: Muted colors with dark backgrounds

## ✅ Validation

### Frontend Validation

1. **At least one type selected:**
```typescript
if (selectedQuestionTypes.length === 0) {
    alert('Please select at least one question type');
    return;
}
```

2. **At least one subject selected:**
```typescript
if (selectedSubjects.length === 0) {
    alert('Please select at least one subject');
    return;
}
```

### Backend Validation

1. **Valid question types:**
```python
valid_types = ['mcq', 'short', 'long']
types_list = [t for t in types_list if t in valid_types]
```

2. **Questions exist:**
```python
if queryset.count() == 0:
    return Response({'error': 'No questions found'})
```

## 🧪 Testing

### Test Cases

#### Test 1: Select MCQ Only
```
1. Select subject
2. Select MCQ only
3. Start quiz
✅ Expected: Only MCQ questions appear
```

#### Test 2: Select Short + Long
```
1. Select subject
2. Select Short Answer and Long Answer
3. Start quiz
✅ Expected: Only short and long answer questions appear
```

#### Test 3: Select All Types
```
1. Select subject
2. Select all three types
3. Start quiz
✅ Expected: Mix of all question types
```

#### Test 4: No Type Selected
```
1. Select subject
2. Deselect all types
3. Click Start Quiz
✅ Expected: Alert "Please select at least one question type"
```

#### Test 5: Multiple Subjects + Multiple Types
```
1. Select multiple subjects
2. Select multiple types
3. Start quiz
✅ Expected: Questions from all selected subjects and types
```

## 📊 Benefits

### For Students
1. **Focused Practice:** Practice specific question formats
2. **Exam Preparation:** Prepare for specific exam formats
3. **Skill Building:** Build skills in different answer formats
4. **Flexibility:** Choose based on time and preference
5. **Confidence:** Master one format before moving to others

### For Teachers
1. **Targeted Assessment:** Assess specific skills
2. **Format Training:** Train students in exam formats
3. **Differentiation:** Different formats for different learners
4. **Progress Tracking:** Track performance by question type
5. **Curriculum Alignment:** Align with exam requirements

## 🔮 Future Enhancements

### Planned
- [ ] Save preferred question types
- [ ] Question type statistics
- [ ] Performance by question type
- [ ] Recommended question types based on performance
- [ ] Custom mix ratios (e.g., 70% MCQ, 30% Short)

### Possible
- [ ] True/False questions
- [ ] Fill in the blanks
- [ ] Matching questions
- [ ] Diagram-based questions
- [ ] Audio/video questions
- [ ] Code questions (for programming)

## 📚 Files Changed

### Modified Files

1. **QuizSelection.tsx**
   - Added `selectedQuestionTypes` state
   - Added `questionTypes` definition
   - Added `toggleQuestionType` function
   - Added question type selection UI
   - Added validation
   - Pass question types to Quiz component

2. **Quiz.tsx**
   - Receive `questionTypes` from location state
   - Add to API query parameters
   - Filter questions by type on frontend
   - Log question types for debugging

3. **quizzes/views.py**
   - Added `question_types` parameter handling
   - Filter queryset by question types
   - Support comma-separated types

## ✅ Success Criteria

All features working:

- [x] Question type selection UI appears
- [x] Users can select multiple types
- [x] Default MCQ is selected
- [x] Visual feedback on selection
- [x] Validation prevents empty selection
- [x] Question types passed to quiz
- [x] API filters by question types
- [x] Frontend filters questions
- [x] Only selected types appear in quiz
- [x] Dark mode works
- [x] Responsive design
- [x] No console errors

## 🎉 Conclusion

The Question Type Selection feature provides students with:
- ✨ Flexible quiz customization
- 🎯 Focused practice options
- 📝 Multiple answer formats
- 🎨 Beautiful, intuitive UI
- 📱 Responsive design
- 🌙 Dark mode support
- 🇧🇩 Bengali language support

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Date:** December 22, 2025

---

## 🆘 Quick Help

### Issue: No questions appear
**Fix:** Check if questions exist for selected types in database

### Issue: All types appear despite selection
**Fix:** Check frontend filtering logic in Quiz.tsx

### Issue: Validation not working
**Fix:** Check `selectedQuestionTypes.length` validation

### Issue: API not filtering
**Fix:** Check backend `question_types` parameter handling

---

**Question Type Selection - Customize Your Quiz Experience! 📝**
