import React, { useState, useRef, useEffect } from 'react';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    type?: 'text' | 'code' | 'error' | 'success';
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    timestamp: Date;
}

type ChatMode = 'mini' | 'normal' | 'fullscreen';
type AgentState = 'idle' | 'listening' | 'talking';

const EnhancedAIChat: React.FC = () => {
    const [chatMode, setChatMode] = useState<ChatMode>('mini');
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messageType, setMessageType] = useState<'general' | 'homework_help' | 'exam_prep'>('general');
    const [agentState, setAgentState] = useState<AgentState>('idle');
    const [showHistory, setShowHistory] = useState(false);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentSessionIndex, setCurrentSessionIndex] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMessage: Message = {
                id: '1',
                text: 'Hello! I\'m your AI Learning Assistant. I can help you with:\n\n📚 Study questions\n✏️ Homework\n📝 Exam preparation\n💡 Understanding any topic\n\nHow can I assist you today?',
                isUser: false,
                timestamp: new Date(),
                type: 'text'
            };
            setMessages([welcomeMessage]);
        }
    }, [isOpen]);

    useEffect(() => {
        // Load chat history from localStorage
        const savedSessions = localStorage.getItem('aiChatSessions');
        if (savedSessions) {
            try {
                const parsed = JSON.parse(savedSessions);
                setChatSessions(parsed.map((s: any) => ({
                    ...s,
                    timestamp: new Date(s.timestamp),
                    messages: s.messages.map((m: any) => ({
                        ...m,
                        timestamp: new Date(m.timestamp)
                    }))
                })));
            } catch (e) {
                console.error('Failed to load chat history', e);
            }
        }
    }, []);

    const saveChatSession = () => {
        if (messages.length <= 1) return;

        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: messages[1]?.text.substring(0, 50) + '...' || 'New Chat',
            messages: [...messages],
            timestamp: new Date()
        };

        const updatedSessions = [newSession, ...chatSessions].slice(0, 20); // Keep last 20 sessions
        setChatSessions(updatedSessions);
        localStorage.setItem('aiChatSessions', JSON.stringify(updatedSessions));
    };

    const loadChatSession = (index: number) => {
        const session = chatSessions[index];
        if (session) {
            setMessages(session.messages);
            setCurrentSessionIndex(index);
            setShowHistory(false);
        }
    };

    const startNewChat = () => {
        if (messages.length > 1) {
            saveChatSession();
        }
        setMessages([]);
        setSessionId(null);
        setCurrentSessionIndex(null);
        setIsOpen(true);
        setShowHistory(false);
    };

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
        setAgentState('listening');

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('Please login to use AI chat');
            }

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

            setAgentState('talking');

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
                text: `Sorry, an error occurred. ${error instanceof Error ? error.message : 'Please try again.'}`,
                isUser: false,
                timestamp: new Date(),
                type: 'error'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setAgentState('idle');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const toggleChatMode = () => {
        if (chatMode === 'mini') setChatMode('normal');
        else if (chatMode === 'normal') setChatMode('fullscreen');
        else setChatMode('mini');
    };

    const getChatDimensions = () => {
        switch (chatMode) {
            case 'mini':
                return 'w-80 h-96';
            case 'normal':
                return 'w-96 h-[600px]';
            case 'fullscreen':
                return 'w-screen h-screen rounded-none';
            default:
                return 'w-96 h-[600px]';
        }
    };

    const getChatPosition = () => {
        if (chatMode === 'fullscreen') {
            return 'fixed inset-0';
        }
        return 'fixed bottom-4 right-4';
    };

    // Agent Orb Component
    const AgentOrb: React.FC<{ state: AgentState }> = ({ state }) => {
        const getOrbColor = () => {
            switch (state) {
                case 'idle':
                    return 'from-blue-400 to-purple-500';
                case 'listening':
                    return 'from-green-400 to-blue-500';
                case 'talking':
                    return 'from-purple-400 to-pink-500';
            }
        };

        const getAnimation = () => {
            switch (state) {
                case 'idle':
                    return 'animate-pulse-slow';
                case 'listening':
                    return 'animate-ping-slow';
                case 'talking':
                    return 'animate-bounce-slow';
            }
        };

        return (
            <div className="relative w-12 h-12 flex items-center justify-center">
                <div className={`absolute inset-0 bg-gradient-to-br ${getOrbColor()} rounded-full blur-md opacity-50 ${getAnimation()}`} />
                <div className={`relative w-10 h-10 bg-gradient-to-br ${getOrbColor()} rounded-full shadow-lg`}>
                    <div className="absolute inset-0 rounded-full bg-white/20" />
                </div>
            </div>
        );
    };

    // Waveform Component
    const Waveform: React.FC<{ isActive: boolean }> = ({ isActive }) => {
        return (
            <div className="flex items-center justify-center space-x-1 h-8">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full transition-all duration-300 ${isActive ? 'animate-waveform' : 'h-2'
                            }`}
                        style={{
                            animationDelay: `${i * 0.05}s`,
                            height: isActive ? `${Math.random() * 24 + 8}px` : '8px'
                        }}
                    />
                ))}
            </div>
        );
    };

    return (
        <>
            {/* Floating chat button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-110 z-50 flex items-center justify-center group"
                    aria-label="Open AI Chat"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse">
                        AI
                    </span>
                </button>
            )}

            {/* Chat window */}
            {isOpen && (
                <div className={`${getChatPosition()} ${getChatDimensions()} bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl flex flex-col z-50 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl overflow-hidden transition-all duration-300`}>
                    {/* Chat header */}
                    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-4 flex justify-between items-center flex-shrink-0">
                        <div className="flex items-center space-x-3 flex-1">
                            <AgentOrb state={agentState} />
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">AI Assistant</h3>
                                <p className="text-xs text-white/80 capitalize">{agentState}</p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title="Chat History"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                            <button
                                onClick={toggleChatMode}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title={`Switch to ${chatMode === 'mini' ? 'normal' : chatMode === 'normal' ? 'fullscreen' : 'mini'} mode`}
                            >
                                {chatMode === 'mini' && (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                )}
                                {chatMode === 'normal' && (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                )}
                                {chatMode === 'fullscreen' && (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </button>
                            <button
                                onClick={startNewChat}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title="New Chat"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setChatMode('mini');
                                }}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Waveform visualization */}
                    {(isLoading || agentState !== 'idle') && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 py-2">
                            <Waveform isActive={isLoading || agentState === 'talking'} />
                        </div>
                    )}

                    {/* History Sidebar */}
                    {showHistory && (
                        <div className="absolute inset-y-0 left-0 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-r border-gray-200 dark:border-gray-700 z-10 overflow-y-auto">
                            <div className="p-4">
                                <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Chat History</h3>
                                <div className="space-y-2">
                                    {chatSessions.map((session, index) => (
                                        <button
                                            key={session.id}
                                            onClick={() => loadChatSession(index)}
                                            className={`w-full text-left p-3 rounded-lg transition-colors ${currentSessionIndex === index
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                                                    : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {session.title}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {session.timestamp.toLocaleDateString()}
                                            </p>
                                        </button>
                                    ))}
                                    {chatSessions.length === 0 && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                            No chat history yet
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Message type selector */}
                    <div className="bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm px-4 py-2 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setMessageType('general')}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${messageType === 'general'
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                📚 General
                            </button>
                            <button
                                onClick={() => setMessageType('homework_help')}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${messageType === 'homework_help'
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                ✏️ Homework
                            </button>
                            <button
                                onClick={() => setMessageType('exam_prep')}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${messageType === 'exam_prep'
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                📝 Exam Prep
                            </button>
                        </div>
                    </div>

                    {/* Messages container */}
                    <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${showHistory ? 'ml-64' : ''}`}>
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                            >
                                <div
                                    className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm backdrop-blur-sm ${message.isUser
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none'
                                            : message.type === 'error'
                                                ? 'bg-red-100/80 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-bl-none border border-red-200 dark:border-red-800'
                                                : message.type === 'success'
                                                    ? 'bg-green-100/80 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-bl-none border border-green-200 dark:border-green-800'
                                                    : 'bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-white rounded-bl-none border border-gray-200/50 dark:border-gray-700/50'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                                    <p
                                        className={`text-xs mt-2 ${message.isUser ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
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
                                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                                    <div className="flex space-x-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                        <div
                                            className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                                            style={{ animationDelay: '0.2s' }}
                                        ></div>
                                        <div
                                            className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                                            style={{ animationDelay: '0.4s' }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input area */}
                    <div className={`border-t border-gray-200/50 dark:border-gray-700/50 p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm flex-shrink-0 ${showHistory ? 'ml-64' : ''}`}>
                        <div className="flex items-end space-x-2">
                            <textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message..."
                                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700/50 dark:text-white resize-none max-h-32 text-sm backdrop-blur-sm"
                                rows={1}
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isLoading}
                                className={`p-3 rounded-xl font-medium transition-all flex-shrink-0 ${!inputValue.trim() || isLoading
                                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                                    }`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                ⚡ Powered by AI
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Shift + Enter for new line
                            </p>
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
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes ping-slow {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        @keyframes waveform {
          0%, 100% {
            height: 8px;
          }
          50% {
            height: 32px;
          }
        }
        .animate-waveform {
          animation: waveform 1s ease-in-out infinite;
        }
      `}</style>
        </>
    );
};

export default EnhancedAIChat;
