/**
 * Premium AI Chat Component
 * Implements ElevenLabs UI design patterns with all advanced features
 * Features: Mini/Normal/Fullscreen modes, Message components, Conversation container, Orb-like animations
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import clsx from "clsx";

// ============ INTERFACES ============
interface Message {
  id: string;
  text: string;
  from: "user" | "assistant";
  timestamp: Date;
  audioUrl?: string;
  isLoading?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
  messageType: "general" | "homework_help" | "exam_prep" | "voice";
}

type ChatMode = "mini" | "normal" | "fullscreen";
type AgentState = "idle" | "listening" | "talking" | "thinking";

// ============ MINI ORB COMPONENT (ElevenLabs-inspired) ============
interface OrbProps {
  agentState: AgentState;
  size?: "sm" | "lg";
}

const Orb: React.FC<OrbProps> = ({ agentState, size = "lg" }) => {
  const orbSize = size === "sm" ? 40 : 80;
  const pulseColor = {
    idle: "#10b981",
    listening: "#f59e0b",
    talking: "#ef4444",
    thinking: "#3b82f6",
  }[agentState];

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={orbSize}
        height={orbSize}
        viewBox="0 0 80 80"
        className="drop-shadow-lg">
        <defs>
          <radialGradient id="orbGradient" cx="30%" cy="30%">
            <stop offset="0%" stopColor={pulseColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={pulseColor} stopOpacity="0.2" />
          </radialGradient>
          <filter id="orbGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer pulse ring */}
        <circle
          cx="40"
          cy="40"
          r="38"
          fill="none"
          stroke={pulseColor}
          strokeWidth="1"
          opacity="0.3"
          className={clsx(agentState !== "idle" && "animate-pulse")}
        />

        {/* Main orb */}
        <circle
          cx="40"
          cy="40"
          r="35"
          fill="url(#orbGradient)"
          filter="url(#orbGlow)"
          className={clsx(
            agentState === "listening" && "animate-bounce",
            agentState === "talking" && "animate-pulse",
          )}
        />

        {/* Inner light */}
        <circle cx="30" cy="30" r="12" fill={pulseColor} opacity="0.6" />
      </svg>

      {/* State label */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full mt-2 text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
        {agentState === "idle" && "Ready"}
        {agentState === "listening" && "Listening..."}
        {agentState === "talking" && "Speaking..."}
        {agentState === "thinking" && "Thinking..."}
      </div>
    </div>
  );
};

// ============ MESSAGE COMPONENT (ElevenLabs-inspired) ============
interface MessageComponentProps {
  message: Message;
}

const MessageComponent: React.FC<MessageComponentProps> = ({ message }) => {
  const isUser = message.from === "user";

  return (
    <div
      className={clsx(
        "flex gap-3 animate-fadeIn",
        isUser ? "flex-row-reverse" : "flex-row",
      )}>
      {/* Avatar */}
      <div
        className={clsx(
          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0",
          isUser
            ? "bg-gradient-to-br from-blue-500 to-purple-600"
            : "bg-gradient-to-br from-green-500 to-emerald-600",
        )}>
        {isUser ? "👤" : "🤖"}
      </div>

      {/* Content */}
      <div
        className={clsx(
          "flex flex-col gap-1",
          isUser ? "items-end" : "items-start",
        )}>
        <div
          className={clsx(
            "px-4 py-2 rounded-2xl max-w-xs lg:max-w-md break-words",
            isUser
              ? "bg-blue-600 text-white rounded-br-none"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none",
          )}>
          {message.isLoading ? (
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
            </div>
          ) : (
            <p className="text-sm">{message.text}</p>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        {/* Audio player if voice message */}
        {message.audioUrl && (
          <audio src={message.audioUrl} controls className="h-6 mt-1" />
        )}
      </div>
    </div>
  );
};

// ============ CONVERSATION COMPONENT (ElevenLabs-inspired) ============
interface ConversationProps {
  messages: Message[];
  isLoading: boolean;
}

const Conversation: React.FC<ConversationProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-hide">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Start a Conversation
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ask me anything about your studies
          </p>
        </div>
      ) : (
        <>
          {messages.map((msg) => (
            <MessageComponent key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <MessageComponent
              message={{
                id: "loading",
                text: "...",
                from: "assistant",
                timestamp: new Date(),
                isLoading: true,
              }}
            />
          )}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

// ============ MAIN PREMIUM AI CHAT COMPONENT ============
const PremiumAIChat: React.FC = () => {
  // State management
  const [chatMode, setChatMode] = useState<ChatMode>("mini");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<
    "general" | "homework_help" | "exam_prep" | "voice"
  >("general");
  const [showHistory, setShowHistory] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load chat sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("premiumAIChatSessions");
    if (saved) {
      try {
        setChatSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load sessions:", e);
      }
    }
  }, []);

  // Load welcoming message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        text: "আমাদের AI শিক্ষা সহায়ক স্বাগতম! 📚 আমি আপনাকে সাহায্য করতে পারি:\n\n✏️ হোমওয়ার্ক সমাধান\n📝 পরীক্ষার প্রস্তুতি\n💡 যেকোনো বিষয় বোঝা\n🎤 ভয়েস কথোপকথন",
        from: "assistant",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 100) + "px";
    }
  };

  // Save chat session
  const saveChatSession = useCallback(() => {
    if (messages.length <= 1) return;

    const newSession: ChatSession = {
      id: currentSessionId || Date.now().toString(),
      title:
        messages.find((m) => m.from === "user")?.text?.substring(0, 30) ||
        "Chat",
      messages,
      timestamp: new Date(),
      messageType,
    };

    const updated = currentSessionId
      ? chatSessions.map((s) => (s.id === currentSessionId ? newSession : s))
      : [...chatSessions, newSession];

    setChatSessions(updated);
    setCurrentSessionId(newSession.id);
    localStorage.setItem("premiumAIChatSessions", JSON.stringify(updated));
  }, [messages, currentSessionId, chatSessions, messageType]);

  // Send text message
  const handleSendText = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      from: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setAgentState("thinking");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login first");

      const response = await fetch("/api/ai/chat/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.text,
          message_type: messageType,
        }),
      });

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || data.message || "Response received",
        from: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setAgentState("idle");
      saveChatSession();
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${error instanceof Error ? error.message : "Failed to send"}`,
        from: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setAgentState("idle");
    } finally {
      setIsLoading(false);
    }
  };

  // Load session
  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setMessageType(session.messageType);
    setShowHistory(false);
  };

  // Clear chat
  const clearChat = () => {
    if (confirm("Clear this chat?")) {
      setMessages([]);
      setCurrentSessionId(null);
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent) => {
    if (chatMode !== "mini") return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || chatMode !== "mini") return;
    setDragOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Window dimensions
  const miniDimensions = {
    width: isMobile ? "calc(100vw - 32px)" : "380px",
    height: isMobile ? "auto" : "384px",
  };

  const normalDimensions = {
    width: isMobile ? "100%" : "500px",
    height: isMobile ? "h-screen" : "h-[600px]",
  };

  const fullscreenDimensions = "fixed inset-0";

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-110 z-40 flex items-center justify-center group"
          aria-label="Open AI Chat">
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <svg
            className="w-8 h-8 text-white"
            fill="currentColor"
            viewBox="0 0 24 24">
            <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="absolute right-full mr-3 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            AI Chat
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatWindowRef}
          className={clsx(
            "bg-white dark:bg-gray-800 shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 z-40 rounded-2xl",
            chatMode === "mini" &&
              `fixed ${miniDimensions.width} ${miniDimensions.height}`,
            chatMode === "normal" &&
              `fixed bottom-6 right-6 w-full ${normalDimensions.height} md:w-${normalDimensions.width}`,
            chatMode === "fullscreen" && fullscreenDimensions,
          )}
          style={
            chatMode === "mini"
              ? {
                  transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
                  cursor: isDragging ? "grabbing" : "grab",
                }
              : undefined
          }
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}>
          {/* Header */}
          <div
            onMouseDown={handleDragStart}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between flex-shrink-0 cursor-grab active:cursor-grabbing rounded-t-2xl">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Orb
                agentState={agentState}
                size={chatMode === "mini" ? "sm" : "lg"}
              />
              <div>
                <h3 className="font-bold text-sm md:text-base truncate">
                  AI শিক্ষা সহায়ক
                </h3>
                <p className="text-xs opacity-80">
                  সর্বদা সাহায্যের জন্য প্রস্তুত
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex gap-1 flex-shrink-0">
              {chatMode !== "fullscreen" && (
                <button
                  onClick={() =>
                    setChatMode(chatMode === "mini" ? "normal" : "fullscreen")
                  }
                  className="p-2 hover:bg-white/20 rounded transition"
                  title="Expand">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24">
                    <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2s-2-.69-2-2c0-2.61 2.91-5 5-5 .41 0 .82.05 1.21.14.4-.9.9-1.74 1.5-2.45-.64-.11-1.31-.19-2-. 19M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                  </svg>
                </button>
              )}
              {chatMode === "fullscreen" && (
                <button
                  onClick={() => setChatMode("normal")}
                  className="p-2 hover:bg-white/20 rounded transition"
                  title="Minimize">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24">
                    <path d="M5 19h14V5H5v14zm3-5h8v2H8v-2z" />
                  </svg>
                </button>
              )}
              <button
                onClick={clearChat}
                className="p-2 hover:bg-white/20 rounded transition"
                title="Clear">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M9 3v2H5v2h14V5h-4V3H9m2 4H7v12h10V7zm2 2v8h2V9h-2z" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded transition"
                title="Close">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Message Type Selector */}
          {!showHistory && (
            <div className="flex gap-2 p-3 border-b border-gray-200 dark:border-gray-700 flex-wrap bg-gray-50 dark:bg-gray-700/50">
              {(["general", "homework_help", "exam_prep"] as const).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => setMessageType(type)}
                    className={clsx(
                      "px-3 py-1 rounded-full text-xs font-medium transition",
                      messageType === type
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300",
                    )}>
                    {type === "general" && "📚 General"}
                    {type === "homework_help" && "✏️ Homework"}
                    {type === "exam_prep" && "📝 Exam"}
                  </button>
                ),
              )}
            </div>
          )}

          {/* Main Content Area */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="font-bold mb-4">Chat History</h3>
              <div className="space-y-2">
                {chatSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => loadSession(session)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <p className="font-medium text-sm truncate">
                      {session.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.timestamp.toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <Conversation messages={messages} isLoading={isLoading} />
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0 bg-gray-50 dark:bg-gray-700/50">
            {messageType === "voice" ? (
              <button className="w-full py-3 rounded-lg font-semibold bg-green-500 hover:bg-green-600 text-white transition flex items-center justify-center gap-2">
                <span className="text-xl">🎤</span>
                Start Recording
              </button>
            ) : (
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleTextareaChange}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendText();
                    }
                  }}
                  placeholder="Type your question..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-10 max-h-24"
                />
                <button
                  onClick={handleSendText}
                  disabled={isLoading || !inputValue.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition flex-shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24">
                    <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.40,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16151496 C3.34915502,0.9 2.40734225,0.8429026 1.77946707,1.4170592 C0.994623095,2.05340659 0.837654326,3.0959909 1.15159189,3.88148778 L3.03521743,10.3224808 C3.03521743,10.4795782 3.19218622,10.6366755 3.50612381,10.6366755 L16.6915026,11.4221624 C16.6915026,11.4221624 17.1624089,11.4221624 17.1624089,11.9934545 C17.1624089,12.5647465 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
                  </svg>
                </button>
              </div>
            )}

            {/* History button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full mt-2 px-3 py-2 text-xs rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-300 transition">
              {showHistory ? "Back to Chat" : "📋 History"}
            </button>
          </div>
        </div>
      )}

      {/* Styles */}
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
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </>
  );
};

export default PremiumAIChat;
