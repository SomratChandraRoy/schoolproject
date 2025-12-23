# Responsive Design Guide - Visual Reference

## 📱 Screen Size Breakpoints

```
Mobile:    0px - 767px   (< 768px)
Tablet:    768px - 1023px
Laptop:    1024px - 1279px
Desktop:   1280px+
```

## 🎨 Enhanced PDF Viewer Layouts

### Mobile (< 768px)
```
┌─────────────────────────────┐
│ 📚 Book Name    [💬] [✕]   │ ← Compact header
├─────────────────────────────┤
│                             │
│                             │
│      PDF VIEWER             │ ← Full height when chat hidden
│      (Full Width)           │
│                             │
│                             │
├─────────────────────────────┤ ← Border when chat visible
│  🤖 AI Assistant            │
│  ┌─────────────────────┐   │
│  │ Messages            │   │ ← 50% height when visible
│  │                     │   │
│  └─────────────────────┘   │
│  [Input] [Send]            │
└─────────────────────────────┘
```

**Features:**
- Vertical stacked layout
- Chat hidden by default
- Icon-only buttons (📖/💬)
- PDF: 100% height (chat hidden) or 50% (chat visible)
- Chat: 50% height when visible

### Tablet (768px - 1024px)
```
┌──────────────────────────────────────────────┐
│ 📚 Book Name          [Hide Chat] [✕]       │
├──────────────────────────────────────────────┤
│                              │               │
│                              │  🤖 AI        │
│      PDF VIEWER              │  Assistant    │
│      (66% width)             │  ┌─────────┐ │
│                              │  │Messages │ │
│                              │  │         │ │
│                              │  └─────────┘ │
│                              │  [Input][📤]│
└──────────────────────────────┴───────────────┘
         66%                         33%
```

**Features:**
- Side-by-side layout
- PDF: 66% width
- Chat: 33% width
- Full button labels
- All features visible

### Desktop (> 1024px)
```
┌────────────────────────────────────────────────────────┐
│ 📚 Book Name    ✓ AI Ready    [💾] [Hide Chat] [✕]   │
├────────────────────────────────────────────────────────┤
│                                    │                   │
│                                    │  🤖 AI Assistant  │
│                                    │  ┌─────────────┐ │
│      PDF VIEWER                    │  │  Messages   │ │
│      (66% width)                   │  │             │ │
│      Larger pages                  │  │             │ │
│      Better quality                │  │             │ │
│                                    │  └─────────────┘ │
│                                    │  [Input...][📤] │
│                                    │  💡 Tip: Shift+  │
└────────────────────────────────────┴───────────────────┘
              66%                           33%
```

**Features:**
- Optimal layout
- Save button visible
- Keyboard hints shown
- Larger text
- More spacing

---

## 💬 AI Chat Layouts

### Mobile (< 768px)
```
┌─────────────────────────────┐
│ 🤖 AI সহায়ক        [🗑][✕]│ ← Compact header
├─────────────────────────────┤
│ [📚] [✏️] [📝]             │ ← Icon-only categories
├─────────────────────────────┤
│                             │
│  ┌──────────────────────┐  │
│  │ User message      →  │  │
│  └──────────────────────┘  │
│                             │
│  ┌──────────────────────┐  │
│  │ ← AI response        │  │
│  └──────────────────────┘  │
│                             │
├─────────────────────────────┤
│ [Input field...    ] [📤]  │
│ ⚡ Powered by Gemini AI     │
└─────────────────────────────┘
     FULLSCREEN MODE
```

**Features:**
- Fullscreen (inset-0)
- No rounded corners
- Icon-only categories
- Save button hidden
- Compact spacing
- No keyboard hints

### Tablet (768px - 1024px)
```
┌─────────────────────────────────┐
│ 🤖 AI শিক্ষা সহায়ক  [💾][🗑][✕]│
│ সবসময় সাহায্য করতে প্রস্তুত    │
├─────────────────────────────────┤
│ [📚 সাধারণ][✏️ হোমওয়ার্ক][📝]│
├─────────────────────────────────┤
│                                 │
│  ┌────────────────────────┐    │
│  │ User message        →  │    │
│  │ 10:30 AM               │    │
│  └────────────────────────┘    │
│                                 │
│  ┌────────────────────────┐    │
│  │ ← AI response          │    │
│  │ 10:30 AM               │    │
│  └────────────────────────┘    │
│                                 │
├─────────────────────────────────┤
│ [Input field...        ] [📤]  │
│ ⚡ Powered by Gemini AI         │
│ Shift + Enter for new line     │
└─────────────────────────────────┘
    FLOATING WINDOW (max-w-md)
```

**Features:**
- Floating window
- Rounded corners
- Full category labels
- All buttons visible
- Keyboard hints shown
- Comfortable spacing

### Desktop (> 1280px)
```
┌──────────────────────────────────────┐
│ 🤖 AI শিক্ষা সহায়ক    [💾][🗑][✕] │
│ সবসময় সাহায্য করতে প্রস্তুত        │
├──────────────────────────────────────┤
│ [📚 সাধারণ][✏️ হোমওয়ার্ক][📝 পরীক্ষা]│
├──────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────┐   │
│  │ User message              →  │   │
│  │ 10:30 AM                     │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ ← AI response with detailed  │   │
│  │ explanation and examples     │   │
│  │ 10:30 AM                     │   │
│  └──────────────────────────────┘   │
│                                      │
│  [Quick Prompts Grid]                │
│  [🔢 গণিত] [🔬 বিজ্ঞান]           │
│  [📝 টিপস] [📖 গ্রামার]            │
│                                      │
├──────────────────────────────────────┤
│ [Input field...            ] [📤]   │
│ ⚡ Powered by Gemini AI              │
│ Shift + Enter for new line          │
└──────────────────────────────────────┘
    FLOATING WINDOW (max-w-xl)
    
    [Hover tooltip: "AI সহায়ক চ্যাট"]
```

**Features:**
- Largest window size
- Spacious layout
- All features visible
- Hover tooltip on button
- Quick prompts visible
- Best experience

---

## 🎯 Floating Button States

### Mobile
```
┌────┐
│ 💬 │ 56x56px
│ AI │
└────┘
```

### Desktop
```
┌────┐  ┌──────────────────┐
│ 💬 │  │ AI সহায়ক চ্যাট │ ← Hover tooltip
│ AI │  └──────────────────┘
└────┘
64x64px
```

---

## 📏 Responsive Sizing Reference

### Text Sizes
```css
/* Mobile → Desktop */
text-xs sm:text-sm     /* 12px → 14px */
text-sm sm:text-base   /* 14px → 16px */
text-sm sm:text-lg     /* 14px → 18px */
text-base sm:text-lg   /* 16px → 18px */
```

### Icon Sizes
```css
/* Mobile → Desktop */
w-4 h-4 sm:w-5 sm:h-5  /* 16px → 20px */
w-5 h-5 sm:w-6 sm:h-6  /* 20px → 24px */
w-6 h-6 sm:w-8 sm:h-8  /* 24px → 32px */
```

### Padding/Spacing
```css
/* Mobile → Desktop */
p-2 sm:p-3             /* 8px → 12px */
p-3 sm:p-4             /* 12px → 16px */
space-x-1 sm:space-x-2 /* 4px → 8px */
space-x-2 sm:space-x-3 /* 8px → 12px */
```

### Max Widths
```css
/* Mobile → Tablet → Desktop */
max-w-[90%] sm:max-w-[85%]  /* Message bubbles */
max-w-md lg:max-w-lg xl:max-w-xl  /* Chat window */
```

---

## 🎨 Color Schemes

### Light Mode
```
Background:     white, gray-50
Text:           gray-900, gray-700
Borders:        gray-200, gray-300
Primary:        blue-600, purple-600
Success:        green-600
Error:          red-600
```

### Dark Mode
```
Background:     gray-800, gray-900
Text:           white, gray-300
Borders:        gray-700, gray-600
Primary:        blue-600, purple-600
Success:        green-600
Error:          red-600
```

---

## 🔄 State Transitions

### Chat Opening
```
Mobile:   Slide up from bottom (fullscreen)
Desktop:  Fade in + scale from button position
```

### Layout Changes
```
Resize:   Smooth transition (300ms)
Toggle:   Width/height transition (300ms)
```

### Message Animations
```
New message:  Fade in + slide up (300ms)
Loading:      Bounce animation (dots)
```

---

## ✅ Responsive Checklist

### Mobile Testing
- [ ] Fullscreen chat works
- [ ] PDF viewer fills screen
- [ ] Touch targets are 44x44px minimum
- [ ] No horizontal scroll
- [ ] Keyboard doesn't overlap input
- [ ] Icon-only buttons are clear
- [ ] Text is readable (minimum 14px)

### Tablet Testing
- [ ] Side-by-side layout works
- [ ] 66/33 split is balanced
- [ ] All features accessible
- [ ] Touch and mouse work
- [ ] Text is comfortable to read

### Desktop Testing
- [ ] Hover effects work
- [ ] Tooltips appear
- [ ] All features visible
- [ ] Keyboard shortcuts work
- [ ] Layout is spacious

---

## 🎯 Best Practices Applied

### 1. Mobile-First
- Start with mobile design
- Add features for larger screens
- Progressive enhancement

### 2. Touch-Friendly
- Minimum 44x44px touch targets
- Adequate spacing (8px minimum)
- Easy-to-tap buttons

### 3. Performance
- Memoized calculations
- Conditional rendering
- Efficient re-renders

### 4. Accessibility
- Proper ARIA labels
- Keyboard navigation
- Screen reader support
- High contrast

### 5. User Experience
- Intuitive layouts
- Clear visual hierarchy
- Smooth transitions
- Helpful feedback

---

## 📊 Performance Metrics

### Target Metrics
```
Initial Load:     < 2 seconds
Layout Shift:     < 0.1 CLS
Interaction:      < 100ms
Animation:        60 FPS
Memory:           < 100MB
```

### Optimization Techniques
- useMemo for expensive calculations
- Conditional rendering
- Lazy loading
- Event listener cleanup
- Efficient state updates

---

## 🎉 Result

Both components now provide excellent responsive experiences:

**Enhanced PDF Viewer:**
- ✅ Mobile: Vertical layout, fullscreen capable
- ✅ Tablet: Side-by-side, balanced
- ✅ Desktop: Optimal sizing, all features

**AI Chat:**
- ✅ Mobile: Fullscreen, touch-optimized
- ✅ Tablet: Floating window, accessible
- ✅ Desktop: Enhanced with hover effects

**Status:** ✅ PRODUCTION-READY
