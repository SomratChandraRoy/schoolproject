# Puter.js Integration Guide (Optional Enhancement)

## Overview

[Puter.js](https://developer.puter.com/tutorials/free-gemini-api) provides **unlimited free Gemini API access** directly from the frontend. This is an **optional enhancement** to complement your existing backend multi-key system.

## 🎯 Use Cases

### ✅ Good For (Frontend Features)

1. **Student AI Chat**
   - Real-time conversations
   - Homework help
   - Study assistance
   - No backend quota usage

2. **Interactive Learning**
   - Instant explanations
   - Concept clarification
   - Practice questions
   - Study tips

3. **Personal Study Assistant**
   - Note summarization
   - Topic exploration
   - Quick Q&A
   - Learning recommendations

### ❌ Not Suitable For (Backend Features)

1. **Bulk Question Generation** (Keep using backend)
2. **Admin/Teacher Tools** (Keep using backend)
3. **Automated Processing** (Keep using backend)
4. **Database Operations** (Keep using backend)

## 🔧 Integration Steps

### Step 1: Add Puter.js to Frontend

**File**: `frontend/medhabangla/public/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MedhaBangla</title>
    
    <!-- Add Puter.js -->
    <script src="https://js.puter.com/v2/"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

### Step 2: Create Puter AI Service

**File**: `frontend/medhabangla/src/services/puterAI.ts`

```typescript
/**
 * Puter.js AI Service
 * Provides unlimited free Gemini API access from frontend
 */

declare global {
  interface Window {
    puter: any;
  }
}

export interface PuterAIOptions {
  model?: string;
  stream?: boolean;
}

export class PuterAIService {
  /**
   * Chat with Gemini using Puter.js
   */
  static async chat(
    message: string,
    options: PuterAIOptions = {}
  ): Promise<string> {
    const {
      model = 'gemini-2.5-flash',
      stream = false
    } = options;

    try {
      if (!window.puter) {
        throw new Error('Puter.js not loaded');
      }

      if (stream) {
        // Streaming response
        const response = await window.puter.ai.chat(message, { model, stream: true });
        let fullText = '';
        
        for await (const part of response) {
          if (part?.text) {
            fullText += part.text;
          }
        }
        
        return fullText;
      } else {
        // Non-streaming response
        const response = await window.puter.ai.chat(message, { model });
        return response.text || response;
      }
    } catch (error) {
      console.error('Puter AI Error:', error);
      throw error;
    }
  }

  /**
   * Chat with streaming callback
   */
  static async chatStream(
    message: string,
    onChunk: (text: string) => void,
    options: PuterAIOptions = {}
  ): Promise<void> {
    const { model = 'gemini-2.5-flash' } = options;

    try {
      if (!window.puter) {
        throw new Error('Puter.js not loaded');
      }

      const response = await window.puter.ai.chat(message, { model, stream: true });
      
      for await (const part of response) {
        if (part?.text) {
          onChunk(part.text);
        }
      }
    } catch (error) {
      console.error('Puter AI Stream Error:', error);
      throw error;
    }
  }

  /**
   * Check if Puter.js is available
   */
  static isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.puter;
  }

  /**
   * Get available models
   */
  static getAvailableModels(): string[] {
    return [
      'gemini-3-flash-preview',
      'gemini-3-pro-preview',
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
    ];
  }
}
```

### Step 3: Create Student AI Chat Component

**File**: `frontend/medhabangla/src/components/StudentAIChat.tsx`

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { PuterAIService } from '../services/puterAI';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const StudentAIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setStreamingText('');

    try {
      // Check if Puter.js is available
      if (!PuterAIService.isAvailable()) {
        throw new Error('Puter.js not loaded. Please refresh the page.');
      }

      // Use streaming for better UX
      await PuterAIService.chatStream(
        input,
        (chunk) => {
          setStreamingText(prev => prev + chunk);
        },
        { model: 'gemini-2.5-flash' }
      );

      // Add AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: streamingText,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setStreamingText('');

    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback to backend if Puter fails
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/ai/chat/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify({
            message: input,
            message_type: 'general'
          })
        });

        if (response.ok) {
          const data = await response.json();
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: data.ai_message,
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
        }
      } catch (backendError) {
        console.error('Backend fallback failed:', backendError);
        alert('Failed to get AI response. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          🤖 AI Study Assistant
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Powered by Puter.js - Unlimited Free Access
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.isUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.text}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-lg p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
              <p className="whitespace-pre-wrap">{streamingText}</p>
              <div className="flex space-x-1 mt-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything about your studies..."
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          💡 This uses unlimited free AI - no quota limits!
        </p>
      </div>
    </div>
  );
};

export default StudentAIChat;
```

### Step 4: Add to Student Dashboard

**File**: `frontend/medhabangla/src/pages/StudentDashboard.tsx`

```typescript
import StudentAIChat from '../components/StudentAIChat';

// Add to your dashboard
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Existing content */}
  
  {/* AI Chat */}
  <div className="lg:col-span-2">
    <StudentAIChat />
  </div>
</div>
```

## 🎨 Features

### 1. Streaming Responses
- Real-time text generation
- Better user experience
- Smooth animations

### 2. Fallback to Backend
- Automatic fallback if Puter fails
- Uses your multi-key backend
- Seamless user experience

### 3. Unlimited Usage
- No quota limits
- No API keys needed
- Free for all students

## 📊 Comparison

### Backend Multi-Key System

**Pros:**
- ✅ Works for all features
- ✅ Server-side processing
- ✅ Database integration
- ✅ 160 requests/day

**Cons:**
- ❌ Limited quota
- ❌ Costs API usage
- ❌ Requires key management

### Puter.js Frontend

**Pros:**
- ✅ Unlimited free access
- ✅ No quota limits
- ✅ No API keys needed
- ✅ Real-time streaming

**Cons:**
- ❌ Frontend only
- ❌ Requires user interaction
- ❌ No database integration
- ❌ Users pay for usage

## 🎯 Recommended Architecture

### Use Backend (Multi-Key) For:
1. ✅ Quiz generation (admin/teacher)
2. ✅ Bulk operations
3. ✅ Automated tasks
4. ✅ Database operations

### Use Puter.js For:
1. ✅ Student chat
2. ✅ Interactive learning
3. ✅ Real-time assistance
4. ✅ Personal study tools

## 🚀 Benefits of Hybrid Approach

1. **Cost Savings**: Student features use Puter (free)
2. **Reliability**: Backend handles critical features
3. **Scalability**: Unlimited student interactions
4. **Flexibility**: Best tool for each use case

## 📝 Summary

### Current Status
✅ **Backend multi-key system**: Fully operational (160 requests/day)

### Optional Enhancement
💡 **Puter.js integration**: Add for unlimited student chat

### Recommendation
- **Keep backend** for quiz generation and admin features
- **Add Puter.js** for student-facing chat features
- **Best of both worlds**: Reliability + unlimited access

---

## 🔗 Resources

- [Puter.js Documentation](https://developer.puter.com/)
- [Free Gemini API Tutorial](https://developer.puter.com/tutorials/free-gemini-api)
- [Puter.js GitHub](https://github.com/HeyPuter/puter)

**Status: Optional Enhancement Available** 🎉
