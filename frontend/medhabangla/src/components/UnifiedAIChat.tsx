/**
 * Unified AI Chat Component
 * Combines all AI features with text and voice support
 * Features: Mini/Normal/Fullscreen modes, history, voice, text, mobile responsive
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import clsx from "clsx";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: "text" | "voice" | "code" | "error" | "success";
  audioUrl?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
  mode?: "general" | "homework_help" | "exam_prep" | "voice";
}

type ChatMode = "mini" | "normal" | "fullscreen";
type AgentState = "idle" | "listening" | "talking" | "processing";

const UnifiedAIChat: React.FC = () => {
  // State management
  const [chatMode, setChatMode] = useState<ChatMode>("mini");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [showHistory, setShowHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<
    "general" | "homework_help" | "exam_prep" | "voice"
  >("general");
  const [isMobile, setIsMobile] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load chat history
  useEffect(() => {
    const saved = localStorage.getItem("unifiedAIChatSessions");
    if (saved) {
      try {
        const sessions = JSON.parse(saved).map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }));
        setChatSessions(sessions);
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    }
  }, []);

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize chat
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        text: "আমাদের উন্নত AI শিক্ষা সহায়ক স্বাগতম! আমি আপনাকে সাহায্য করতে পারি:\n\n📚 পড়াশোনার প্রশ্ন\n✏️ হোমওয়ার্ক সমাধান\n📝 পরীক্ষার প্রস্তুতি\n🎤 ভয়েস কথোপকথন\n💡 যেকোনো বিষয় বোঝা\n\nকীভাবে শুরু করব?",
        isUser: false,
        timestamp: new Date(),
        type: "text",
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Save chat session
  const saveChatSession = useCallback(() => {
    if (messages.length <= 1) return;

    const newSession: ChatSession = {
      id: currentSessionId || Date.now().toString(),
      title:
        messages.find((m) => m.isUser)?.text?.substring(0, 30) ||
        "Chat Session",
      messages,
      timestamp: new Date(),
      mode: messageType,
    };

    const updated = currentSessionId
      ? chatSessions.map((s) => (s.id === currentSessionId ? newSession : s))
      : [...chatSessions, newSession];

    setChatSessions(updated);
    setCurrentSessionId(newSession.id);
    localStorage.setItem("unifiedAIChatSessions", JSON.stringify(updated));
  }, [messages, currentSessionId, chatSessions, messageType]);

  // Handle text message
  const handleSendText = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setAgentState("processing");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Please login first");
      }

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

      if (!response.ok) throw new Error("API Request failed");

      const data = await response.json();
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: data.response || data.message || "Response received",
        isUser: false,
        timestamp: new Date(),
        type: data.code ? "code" : "text",
      };

      setMessages((prev) => [...prev, aiMessage]);
      setAgentState("idle");
      saveChatSession();
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: `Error: ${error instanceof Error ? error.message : "Failed to send message"}`,
        isUser: false,
        timestamp: new Date(),
        type: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
      setAgentState("idle");
    } finally {
      setIsLoading(false);
    }
  };

  // Voice handling - Record audio
  const handleVoiceStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.addEventListener("dataavailable", (event) => {
        audioChunksRef.current.push(event.data);
      });

      mediaRecorder.addEventListener("stop", async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/mp3",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        const voiceMessage: Message = {
          id: Date.now().toString(),
          text: "[Voice message recorded]",
          isUser: true,
          timestamp: new Date(),
          type: "voice",
          audioUrl,
        };

        setMessages((prev) => [...prev, voiceMessage]);
        setAgentState("processing");

        // Send voice to AI
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob);
          formData.append("message_type", messageType);

          const token = localStorage.getItem("token");
          const response = await fetch("/api/ai/voice/", {
            method: "POST",
            headers: {
              Authorization: `Token ${token}`,
            },
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            const aiMessage: Message = {
              id: Date.now().toString(),
              text: data.response || "Voice message processed",
              isUser: false,
              timestamp: new Date(),
              type: data.audioUrl ? "voice" : "text",
              audioUrl: data.audioUrl,
            };
            setMessages((prev) => [...prev, aiMessage]);
            saveChatSession();
          }
        } catch (error) {
          console.error("Voice processing error:", error);
        } finally {
          setAgentState("idle");
          stream.getTracks().forEach((track) => track.stop());
        }
      });

      mediaRecorder.start();
      setIsVoiceActive(true);
      setAgentState("listening");
      setMessageType("voice");
    } catch (error) {
      console.error("Microphone access denied:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Microphone access denied. Please enable microphone in settings.",
        isUser: false,
        timestamp: new Date(),
        type: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleVoiceStop = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsVoiceActive(false);
      setAgentState("talking");
    }
  };

  // Drag handling for mini mode
  const handleDragStart = (e: React.MouseEvent) => {
    if (chatMode !== "mini") return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Load session
  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setMessageType(session.mode || "general");
    setShowHistory(false);
  };

  // Clear current chat
  const clearChat = () => {
    if (confirm("Clear current chat?")) {
      setMessages([]);
      setCurrentSessionId(null);
    }
  };

  // Render message
  const renderMessage = (msg: Message) => (
    <div
      key={msg.id}
      className={clsx(
        "flex mb-4",
        msg.isUser ? "justify-end" : "justify-start",
      )}>
      <div
        className={clsx(
          "max-w-[80%] px-4 py-2 rounded-lg break-words",
          msg.isUser
            ? "bg-blue-500 text-white rounded-br-none"
            : msg.type === "error"
              ? "bg-red-100 text-red-800 rounded-bl-none"
              : msg.type === "code"
                ? "bg-gray-900 text-green-400 font-mono text-sm rounded-bl-none"
                : "bg-gray-200 text-gray-900 rounded-bl-none",
        )}>
        <p className="whitespace-pre-wrap text-sm md:text-base">{msg.text}</p>
        {msg.audioUrl && (
          <audio
            controls
            className="mt-2 w-full"
            src={msg.audioUrl}
            style={{ maxWidth: "100%" }}
          />
        )}
        <span className="text-xs opacity-70 mt-1 block">
          {msg.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );

  // Mini window mode
  if (chatMode === "mini" && isOpen) {
    return (
      <div
        ref={chatContainerRef}
        className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-xl shadow-2xl flex flex-col z-[9999] border border-gray-200"
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
        }}>
        {/* Header */}
        <div
          ref={dragRef}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-t-xl flex justify-between items-center cursor-move hover:shadow-md transition">
          <div className="flex items-center gap-2">
            <div
              className={clsx(
                "w-3 h-3 rounded-full",
                agentState === "idle"
                  ? "bg-green-400"
                  : agentState === "listening"
                    ? "bg-yellow-400 animate-pulse"
                    : agentState === "talking"
                      ? "bg-red-400"
                      : "bg-blue-400",
              )}
            />
            <span className="font-semibold text-sm">AI Assistant</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setChatMode("normal")}
              className="p-1 hover:bg-white/20 rounded"
              title="Expand">
              ⛶
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-1 hover:bg-white/20 rounded"
              title="History">
              📋
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded"
              title="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 bg-gradient-to-b from-blue-50 to-white">
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setMessageType("general")}
              className={clsx(
                "text-xs px-2 py-1 rounded",
                messageType === "general"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700",
              )}>
              General
            </button>
            <button
              onClick={() => setMessageType("homework_help")}
              className={clsx(
                "text-xs px-2 py-1 rounded",
                messageType === "homework_help"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700",
              )}>
              Homework
            </button>
            <button
              onClick={() => setMessageType("exam_prep")}
              className={clsx(
                "text-xs px-2 py-1 rounded",
                messageType === "exam_prep"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700",
              )}>
              Exam
            </button>
          </div>
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendText();
                }
              }}
              placeholder="Type message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
            <button
              onClick={handleSendText}
              disabled={isLoading}
              className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 transition">
              {isLoading ? "..." : "→"}
            </button>
          </div>
          <button
            onClick={
              messageType === "voice"
                ? isVoiceActive
                  ? handleVoiceStop
                  : handleVoiceStart
                : undefined
            }
            className={clsx(
              "w-full mt-2 px-3 py-1 text-xs rounded transition",
              isVoiceActive
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white hover:bg-green-600",
            )}>
            {isVoiceActive ? "🎤 Stop" : "🎤 Voice"}
          </button>
        </div>
      </div>
    );
  }

  // Normal/Fullscreen mode
  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={clsx(
            "fixed bottom-4 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition z-[9998] flex items-center justify-center text-2xl",
            isMobile ? "bottom-20" : "",
          )}
          title="Open AI Chat">
          💬
        </button>
      )}

      {/* Main Chat Window */}
      {isOpen && (
        <div
          className={clsx(
            "fixed bg-white shadow-2xl z-[9999] flex flex-col",
            chatMode === "fullscreen"
              ? "inset-0 rounded-none"
              : "bottom-0 right-0 w-full md:w-96 h-screen md:h-[600px] md:bottom-4 md:right-4 rounded-lg md:rounded-xl",
          )}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 md:px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  "w-4 h-4 rounded-full",
                  agentState === "idle"
                    ? "bg-green-400"
                    : agentState === "listening"
                      ? "bg-yellow-400 animate-pulse"
                      : agentState === "talking"
                        ? "bg-red-400"
                        : "bg-blue-400",
                )}
              />
              <h2 className="text-lg md:text-xl font-bold">
                SOPAN AI Assistant
              </h2>
            </div>
            <div className="flex gap-2">
              {chatMode !== "fullscreen" && (
                <button
                  onClick={() => setChatMode("fullscreen")}
                  className="p-2 hover:bg-white/20 rounded transition"
                  title="Fullscreen">
                  ⛶
                </button>
              )}
              {chatMode === "fullscreen" && (
                <button
                  onClick={() => setChatMode("normal")}
                  className="p-2 hover:bg-white/20 rounded transition"
                  title="Normal">
                  ⛶
                </button>
              )}
              {chatMode !== "mini" && (
                <button
                  onClick={() => setChatMode("mini")}
                  className="p-2 hover:bg-white/20 rounded transition"
                  title="Minimize">
                  _
                </button>
              )}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 hover:bg-white/20 rounded transition"
                title="History">
                📋
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setChatMode("mini");
                  saveChatSession();
                }}
                className="p-2 hover:bg-white/20 rounded transition"
                title="Close">
                ✕
              </button>
            </div>
          </div>

          {/* History Sidebar */}
          {showHistory && (
            <div className="w-full md:w-64 bg-gray-100 border-r border-gray-300 overflow-y-auto p-4">
              <h3 className="font-bold mb-3">Chat History</h3>
              <button
                onClick={clearChat}
                className="w-full bg-red-500 text-white px-3 py-2 rounded text-sm mb-3 hover:bg-red-600 transition">
                Clear Chat
              </button>
              {chatSessions.length === 0 ? (
                <p className="text-gray-500 text-sm">No history</p>
              ) : (
                <div className="space-y-2">
                  {chatSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => loadSession(session)}
                      className={clsx(
                        "w-full text-left px-3 py-2 rounded text-sm transition",
                        currentSessionId === session.id
                          ? "bg-blue-500 text-white"
                          : "bg-white hover:bg-gray-50 border border-gray-200",
                      )}>
                      <p className="font-semibold truncate">{session.title}</p>
                      <p className="text-xs opacity-70">
                        {session.timestamp.toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-b from-blue-50 to-white">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Type Selector */}
            <div className="px-4 md:px-6 py-2 border-t border-gray-200 flex flex-wrap gap-2 bg-white">
              <button
                onClick={() => setMessageType("general")}
                className={clsx(
                  "text-xs md:text-sm px-3 py-1 rounded transition",
                  messageType === "general"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300",
                )}>
                📚 General
              </button>
              <button
                onClick={() => setMessageType("homework_help")}
                className={clsx(
                  "text-xs md:text-sm px-3 py-1 rounded transition",
                  messageType === "homework_help"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300",
                )}>
                ✏️ Homework
              </button>
              <button
                onClick={() => setMessageType("exam_prep")}
                className={clsx(
                  "text-xs md:text-sm px-3 py-1 rounded transition",
                  messageType === "exam_prep"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300",
                )}>
                📝 Exam
              </button>
              <button
                onClick={() => setMessageType("voice")}
                className={clsx(
                  "text-xs md:text-sm px-3 py-1 rounded transition",
                  messageType === "voice"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300",
                )}>
                🎤 Voice
              </button>
            </div>

            {/* Input Area */}
            <div className="px-4 md:px-6 py-4 border-t border-gray-200 bg-white">
              {messageType === "voice" ? (
                <button
                  onClick={isVoiceActive ? handleVoiceStop : handleVoiceStart}
                  className={clsx(
                    "w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2",
                    isVoiceActive
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-green-500 hover:bg-green-600 text-white",
                  )}>
                  <span className="text-xl">🎤</span>
                  {isVoiceActive ? "Stop Recording" : "Start Recording"}
                </button>
              ) : (
                <div className="flex gap-2">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendText();
                      }
                    }}
                    placeholder="Type your message... (Shift+Enter for new line)"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    rows={3}
                  />
                  <button
                    onClick={handleSendText}
                    disabled={isLoading}
                    className="bg-blue-500 text-white px-4 md:px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition font-semibold">
                    {isLoading ? "..." : "Send"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UnifiedAIChat;
