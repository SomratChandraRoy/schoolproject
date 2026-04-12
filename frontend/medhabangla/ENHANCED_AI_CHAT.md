# Enhanced AI Chat - ElevenLabs UI Inspired

## Overview
A premium AI chat component inspired by ElevenLabs UI design patterns, featuring mini window, expandable, and fullscreen modes with agent orbs, waveform visualizations, and chat history.

## Key Features

### 1. Multiple View Modes
- **Mini Mode** (320px × 384px): Compact chat window
- **Normal Mode** (384px × 600px): Standard chat experience
- **Fullscreen Mode**: Full-screen immersive chat

### 2. ElevenLabs-Inspired Components

#### Agent Orbs
- **Idle State**: Blue to purple gradient with slow pulse
- **Listening State**: Green to blue gradient with ping animation
- **Talking State**: Purple to pink gradient with bounce animation
- Real-time visual feedback of AI state

#### Waveform Visualization
- 20-bar animated waveform
- Activates during AI processing
- Smooth scrolling animation
- Gradient colors (blue to purple)

### 3. Chat History
- Saves last 20 chat sessions
- Persistent storage (localStorage)
- Quick session switching
- Sidebar with session list
- Shows session title and date

### 4. Glassmorphism Design
- Backdrop blur effects
- Semi-transparent backgrounds
- Gradient borders
- Smooth transitions
- Dark mode support

### 5. Mobile Responsive
- Adapts to all screen sizes
- Touch-friendly controls
- Optimized for mobile devices
- Responsive typography

## Component Structure

### State Management
```typescript
- chatMode: 'mini' | 'normal' | 'fullscreen'
- isOpen: boolean
- messages: Message[]
- agentState: 'idle' | 'listening' | 'talking'
- showHistory: boolean
- chatSessions: ChatSession[]
```

### Message Interface
```typescript
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'code' | 'error' | 'success';
}
```

### Chat Session Interface
```typescript
interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}
```

## Features Breakdown

### 1. View Mode Switching
- Click the expand/collapse button in header
- Cycles through: Mini → Normal → Fullscreen → Mini
- Smooth transitions between modes
- Maintains chat state across mode changes

### 2. Agent Orb States
```css
Idle: Blue-purple gradient, slow pulse (2s)
Listening: Green-blue gradient, ping effect (2s)
Talking: Purple-pink gradient, bounce (2s)
```

### 3. Waveform Animation
- 20 vertical bars
- Random heights when active
- Staggered animation (0.05s delay per bar)
- Gradient coloring
- Smooth transitions

### 4. Chat History Management
- Auto-saves after each conversation
- Stores in localStorage
- Limits to 20 most recent sessions
- Click to load previous conversations
- Shows session preview and date

### 5. Message Types
- **General**: General questions and learning
- **Homework Help**: Homework assistance
- **Exam Prep**: Exam preparation tips
- Visual indicators with emojis

## User Interactions

### Opening Chat
1. Click floating AI button (bottom-right)
2. Chat opens in mini mode
3. Welcome message appears

### Sending Messages
1. Type in input field
2. Press Enter or click send button
3. Agent orb changes to "listening"
4. Waveform activates
5. Agent orb changes to "talking"
6. Response appears
7. Agent orb returns to "idle"

### Switching Modes
1. Click expand/collapse button
2. Chat resizes smoothly
3. Content adjusts to new size

### Viewing History
1. Click history button (clock icon)
2. Sidebar slides in from left
3. Click session to load
4. Chat updates with session messages

### Starting New Chat
1. Click new chat button (plus icon)
2. Current chat auto-saves
3. Fresh chat starts
4. Welcome message appears

## Design Specifications

### Colors
```css
Primary Gradient: from-blue-600 via-purple-600 to-pink-600
Orb Idle: from-blue-400 to-purple-500
Orb Listening: from-green-400 to-blue-500
Orb Talking: from-purple-400 to-pink-500
Waveform: from-blue-500 to-purple-500
Background: white/95 (light), gray-900/95 (dark)
Backdrop: blur-xl
```

### Dimensions
```css
Mini Mode: w-80 h-96 (320px × 384px)
Normal Mode: w-96 h-[600px] (384px × 600px)
Fullscreen: w-screen h-screen
History Sidebar: w-64 (256px)
Agent Orb: w-12 h-12 (48px × 48px)
Floating Button: w-16 h-16 (64px × 64px)
```

### Animations
```css
fadeIn: 0.3s ease-out
pulse-slow: 2s infinite
ping-slow: 2s infinite
bounce-slow: 2s infinite
waveform: 1s infinite
mode-transition: 0.3s ease-in-out
```

## API Integration

### Endpoints Used
```
POST /api/ai/chat/start/ - Create new session
POST /api/ai/chat/message/ - Send message
```

### Request Format
```json
{
  "session_id": "string",
  "message": "string",
  "message_type": "general" | "homework_help" | "exam_prep"
}
```

### Response Format
```json
{
  "ai_message": {
    "message": "string"
  }
}
```

## Local Storage

### Chat Sessions
```javascript
Key: 'aiChatSessions'
Format: JSON array of ChatSession objects
Max: 20 sessions
```

### Data Structure
```json
[
  {
    "id": "timestamp",
    "title": "First 50 chars of first message...",
    "messages": [...],
    "timestamp": "ISO date string"
  }
]
```

## Browser Support
- ✅ Chrome/Edge 90+ (full support)
- ✅ Firefox 88+ (full support)
- ✅ Safari 14+ (full support with -webkit-)
- ✅ Mobile Safari iOS 14+
- ✅ Mobile Chrome Android 10+

## Performance

### Optimizations
- Memoized dimensions calculation
- Conditional rendering
- Efficient state updates
- Debounced textarea resize
- Lazy loading of history

### Bundle Size
- Component: ~25KB (uncompressed)
- No external dependencies
- Inline CSS animations
- Minimal re-renders

## Accessibility

### WCAG 2.1 Compliance
- ✅ Keyboard navigation
- ✅ ARIA labels
- ✅ Focus indicators
- ✅ Color contrast ratios
- ✅ Screen reader support

### Keyboard Shortcuts
- `Enter`: Send message
- `Shift + Enter`: New line
- `Tab`: Navigate controls
- `Escape`: Close chat (can be added)

## Mobile Responsiveness

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: 1024px+

### Mobile Optimizations
- Touch-friendly buttons
- Optimized font sizes
- Simplified controls
- Swipe gestures (future)

## Customization

### Changing Colors
```tsx
// In EnhancedAIChat.tsx
// Header gradient
className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"

// Orb colors
const getOrbColor = () => {
  // Modify gradient colors here
}
```

### Changing Dimensions
```tsx
const getChatDimensions = () => {
  switch (chatMode) {
    case 'mini':
      return 'w-80 h-96'; // Modify here
    case 'normal':
      return 'w-96 h-[600px]'; // Modify here
    // ...
  }
}
```

### Changing Animations
```css
/* In inline styles */
@keyframes pulse-slow {
  /* Modify animation here */
}
```

## Usage Example

### Basic Implementation
```tsx
import EnhancedAIChat from './components/EnhancedAIChat';

function App() {
  return (
    <div>
      {/* Your app content */}
      <EnhancedAIChat />
    </div>
  );
}
```

### With Custom Props (Future)
```tsx
<EnhancedAIChat
  defaultMode="normal"
  enableHistory={true}
  maxSessions={20}
  theme="dark"
/>
```

## Testing

### Test Scenarios
1. **Open/Close**: Click button, verify open/close
2. **Mode Switching**: Cycle through all modes
3. **Send Message**: Type and send message
4. **Agent States**: Verify orb changes states
5. **Waveform**: Check animation during loading
6. **History**: Save and load sessions
7. **New Chat**: Start new conversation
8. **Responsive**: Test on different screen sizes
9. **Dark Mode**: Toggle theme
10. **Persistence**: Reload page, check history

### Expected Behavior
- Smooth animations at 60fps
- No console errors
- Proper state management
- Persistent history
- Responsive layout

## Troubleshooting

### Chat doesn't open
- Check if component is rendered
- Verify z-index values
- Check for JavaScript errors

### History not saving
- Check localStorage availability
- Verify JSON serialization
- Check browser storage limits

### Animations choppy
- Check GPU acceleration
- Reduce animation complexity
- Test on different devices

### API errors
- Verify token in localStorage
- Check API endpoints
- Review network requests

## Future Enhancements

### Short Term
- [ ] Voice input integration
- [ ] Code syntax highlighting
- [ ] File attachments
- [ ] Emoji picker

### Long Term
- [ ] Multi-language support
- [ ] Custom themes
- [ ] Export conversations
- [ ] Search in history
- [ ] Conversation tags
- [ ] AI voice responses
- [ ] Screen sharing
- [ ] Collaborative chat

## Credits
- Design inspired by ElevenLabs UI
- Agent orbs concept from ElevenLabs
- Waveform visualization from audio apps
- Glassmorphism from modern web trends
- Built with React + TypeScript + Tailwind CSS
