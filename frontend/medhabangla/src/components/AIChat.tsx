import React, { useState, useRef, useEffect, useMemo } from 'react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'code' | 'error' | 'success';
}

const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'general' | 'homework_help' | 'exam_prep'>('general');
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect mobile/tablet screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message when chat opens
      const welcomeMessage: Message = {
        id: '1',
        text: 'নমস্কার! আমি আপনার AI শিক্ষা সহায়ক। আমি আপনাকে সাহায্য করতে পারি:\n\n📚 পড়াশোনার প্রশ্নে\n✏️ হোমওয়ার্কে\n📝 পরীক্ষার প্রস্তুতিতে\n💡 যেকোনো বিষয় বুঝতে\n\nকিভাবে সাহায্য করতে পারি?',
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([welcomeMessage]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputValue;
    setInputValue('');
    setIsLoading(true);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Please login to use AI chat');
      }

      // Create session if not exists
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const sessionResponse = await fetch('/api/ai/chat/start/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          }
        });

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          currentSessionId = sessionData.session_id;
          setSessionId(currentSessionId);
        } else {
          throw new Error('Failed to create chat session');
        }
      }

      // Call backend API to get AI response
      const response = await fetch('/api/ai/chat/message/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          session_id: currentSessionId,
          message: currentMessage,
          message_type: messageType
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiText = data.ai_message?.message || data.ai_message || 'No response received';

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: aiText,
          isUser: false,
          timestamp: new Date(),
          type: 'text'
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response from AI');
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `দুঃখিত, একটি সমস্যা হয়েছে। ${error instanceof Error ? error.message : 'অনুগ্রহ করে আবার চেষ্টা করুন।'}`,
        isUser: false,
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (window.confirm('আপনি কি চ্যাট ইতিহাস মুছে ফেলতে চান?')) {
      setMessages([]);
      setSessionId(null);
      setIsOpen(false);
    }
  };

  const saveConversationToNotes = async () => {
    if (messages.length <= 1) {
      const infoMessage: Message = {
        id: Date.now().toString(),
        text: 'কথোপকথন সংরক্ষণ করার জন্য কিছু বার্তা প্রয়োজন।',
        isUser: false,
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, infoMessage]);
      return;
    }

    try {
      let noteContent = '# AI Chat Conversation\n\n';
      noteContent += `Date: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}\n\n---\n\n`;

      messages.forEach(message => {
        const role = message.isUser ? '👤 You' : '🤖 AI Assistant';
        const timestamp = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        noteContent += `**${role}** _(${timestamp})_\n\n${message.text}\n\n---\n\n`;
      });

      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/notes/save/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          title: `AI Chat - ${new Date().toLocaleDateString()}`,
          content: noteContent
        })
      });

      if (response.ok) {
        const successMessage: Message = {
          id: Date.now().toString(),
          text: '✅ কথোপকথন আপনার নোটে সংরক্ষিত হয়েছে!',
          isUser: false,
          timestamp: new Date(),
          type: 'success'
        };
        setMessages(prev => [...prev, successMessage]);
      } else {
        throw new Error('Failed to save conversation');
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: '❌ কথোপকথন সংরক্ষণ করতে ব্যর্থ হয়েছে।',
        isUser: false,
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const quickPrompts = useMemo(() => [
    { text: 'গণিত সমস্যা সমাধান', icon: '🔢', type: 'homework_help' as const },
    { text: 'বিজ্ঞান ব্যাখ্যা', icon: '🔬', type: 'general' as const },
    { text: 'পরীক্ষার টিপস', icon: '📝', type: 'exam_prep' as const },
    { text: 'ইংরেজি গ্রামার', icon: '📖', type: 'homework_help' as const }
  ], []);

  const handleQuickPrompt = (prompt: string, type: 'general' | 'homework_help' | 'exam_prep') => {
    setMessageType(type);
    setInputValue(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Responsive chat dimensions - memoized
  const chatDimensions = useMemo(() => {
    if (isMobile) {
      return {
        container: 'fixed inset-0 w-full h-full rounded-none',
        maxWidth: 'w-full',
        height: 'h-full',
        button: 'bottom-4 right-4 w-14 h-14',
        buttonIcon: 'w-6 h-6',
      };
    }
    return {
      container: 'fixed bottom-4 sm:bottom-6 right-4 sm:right-6 rounded-2xl',
      maxWidth: 'w-full max-w-md lg:max-w-lg xl:max-w-xl',
      height: 'h-[85vh] sm:h-[600px] lg:h-[650px]',
      button: 'bottom-4 sm:bottom-6 right-4 sm:right-6 w-14 h-14 sm:w-16 sm:h-16',
      buttonIcon: 'w-6 h-6 sm:w-8 sm:h-8',
    };
  }, [isMobile]);

  return (
    <>
      {/* Floating chat button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${chatDimensions.button} bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-110 z-50 flex items-center justify-center group`}
          aria-label="Open AI Chat"
        >
          <svg className={chatDimensions.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold animate-pulse">
            AI
          </span>
          {!isMobile && (
            <span className="absolute right-full mr-3 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
              AI সহায়ক চ্যাট
            </span>
          )}
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className={`${chatDimensions.container} ${chatDimensions.maxWidth} ${chatDimensions.height} bg-white dark:bg-gray-800 shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700 overflow-hidden`}>
          {/* Chat header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sm:p-4 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white"></span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm sm:text-lg truncate">AI শিক্ষা সহায়ক</h3>
                <p className="text-xs text-white/80 hidden sm:block">সবসময় সাহায্য করতে প্রস্তুত</p>
              </div>
            </div>
            <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
              {!isMobile && (
                <button
                  onClick={saveConversationToNotes}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Save to notes"
                  title="নোটে সংরক্ষণ করুন"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </button>
              )}
              <button
                onClick={clearChat}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Clear chat"
                title="চ্যাট মুছুন"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Message type selector */}
          <div className="bg-gray-50 dark:bg-gray-900 px-3 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setMessageType('general')}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${messageType === 'general'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
              >
                {isMobile ? '📚' : '📚 সাধারণ'}
              </button>
              <button
                onClick={() => setMessageType('homework_help')}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${messageType === 'homework_help'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
              >
                {isMobile ? '✏️' : '✏️ হোমওয়ার্ক'}
              </button>
              <button
                onClick={() => setMessageType('exam_prep')}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${messageType === 'exam_prep'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
              >
                {isMobile ? '📝' : '📝 পরীক্ষা'}
              </button>
            </div>
          </div>

          {/* Messages container */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 && (
              <div className="text-center py-6 sm:py-8">
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🤖</div>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 px-4">
                  আমাকে কিছু জিজ্ঞাসা করুন...
                </p>
                <div className="grid grid-cols-2 gap-2 px-2">
                  {quickPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickPrompt(prompt.text, prompt.type)}
                      className="p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left"
                    >
                      <div className="text-xl sm:text-2xl mb-1">{prompt.icon}</div>
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {prompt.text}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[85%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm ${message.isUser
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none'
                    : message.type === 'error'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-bl-none'
                      : message.type === 'success'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-bl-none'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-700'
                    }`}
                >
                  <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">{message.text}</p>
                  <p
                    className={`text-xs mt-1 sm:mt-2 ${message.isUser
                      ? 'text-white/70'
                      : 'text-gray-500 dark:text-gray-400'
                      }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl rounded-bl-none shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-white dark:bg-gray-800 flex-shrink-0">
            <div className="flex items-end space-x-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Auto-resize
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={handleKeyDown}
                placeholder="আপনার প্রশ্ন লিখুন..."
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none max-h-32 text-sm sm:text-base"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className={`p-2 sm:p-3 rounded-xl font-medium transition-all flex-shrink-0 ${!inputValue.trim() || isLoading
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                  }`}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ⚡ Powered by Ollama AI (with Gemini fallback)
              </p>
              {!isMobile && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Shift + Enter for new line
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default AIChat;
