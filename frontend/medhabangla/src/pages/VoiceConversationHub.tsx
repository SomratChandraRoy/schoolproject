import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  type: "text" | "audio";
  audioUrl?: string;
}

interface Session {
  id: string;
  session_id: string;
  mode: "tutor" | "exam" | "quiz" | "general";
  subject: string;
  topic: string;
  messages: Message[];
  summary?: string;
  score?: number;
}

const VoiceConversationHub: React.FC = () => {
  const [mode, setMode] = useState<"tutor" | "exam" | "quiz" | "general">(
    "tutor",
  );
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState("");
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (event.results[event.results.length - 1].isFinal) {
          setInputText(transcript);
          setTimeout(() => handleSendMessage(transcript), 500);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startSession = async () => {
    if (!subject.trim()) {
      alert("Please enter a subject");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/ai/voice-conversation/start/",
        {
          mode,
          subject,
          topic,
        },
        {
          headers: { Authorization: `Token ${token}` },
        },
      );

      const session: Session = {
        id: res.data.id,
        session_id: res.data.session_id,
        mode: res.data.mode,
        subject: res.data.subject,
        topic: res.data.topic,
        messages: [],
      };

      setCurrentSession(session);
      setMessages([
        {
          id: "1",
          text: `Welcome to ${mode === "tutor" ? "AI Tutor Mode" : mode === "exam" ? "Exam Mode" : "Quiz Mode"}! I'm here to help you with ${subject}.`,
          isUser: false,
          timestamp: new Date().toLocaleTimeString(),
          type: "text",
        },
      ]);
    } catch (error: any) {
      alert(
        "Failed to start session: " +
          (error.response?.data?.error || error.message),
      );
    }
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText;
    if (!messageText.trim() || !currentSession) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date().toLocaleTimeString(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsSending(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/ai/voice-conversation/message/",
        {
          session_id: currentSession.session_id,
          message_text: messageText,
          transcript: messageText,
        },
        {
          headers: { Authorization: `Token ${token}` },
        },
      );

      const aiMessage: Message = {
        id: Date.now().toString(),
        text: res.data.message.ai_response || res.data.message.message_text,
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
        type: "text",
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Play response if in voice mode
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(aiMessage.text);
        window.speechSynthesis.speak(utterance);
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
        type: "text",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const endSession = async () => {
    if (!currentSession) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/ai/voice-conversation/end/",
        {
          session_id: currentSession.session_id,
        },
        {
          headers: { Authorization: `Token ${token}` },
        },
      );

      alert("Session ended and summary stored in your account!");
      setCurrentSession(null);
      setMessages([]);
    } catch (error: any) {
      alert("Failed to end session");
    }
  };

  const loadSessionHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/ai/voice-conversation/history/", {
        headers: { Authorization: `Token ${token}` },
      });
      setSessionHistory(res.data);
    } catch (error) {
      console.error("Failed to load history");
    }
  };

  if (!currentSession) {
    return (
      <div className="max-w-4xl mx-auto p-6 min-h-[85vh]">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-12 rounded-3xl shadow-2xl text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            🎙️ AI Voice Conversation Hub
          </h1>
          <p className="text-xl">
            Master any subject with an AI teacher who understands you
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: "👨‍🏫 AI Tutor",
              desc: "Ask doubts, get detailed explanations",
              mode: "tutor",
            },
            {
              title: "📝 Exam Mode",
              desc: "Practice exams with AI feedback",
              mode: "exam",
            },
            {
              title: "🧠 Quiz Mode",
              desc: "Test your knowledge interactively",
              mode: "quiz",
            },
          ].map((item: any) => (
            <div
              key={item.mode}
              onClick={() => setMode(item.mode)}
              className={`p-6 rounded-2xl cursor-pointer transition-all transform hover:scale-105 ${
                mode === item.mode
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-800 border-2 border-gray-200 hover:border-blue-400"
              }`}>
              <div className="text-4xl mb-3">{item.title.split(" ")[0]}</div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-sm opacity-90">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
            Start New Session
          </h2>

          <input
            type="text"
            placeholder="Subject (e.g., Mathematics, Physics, Chemistry, Biology, English)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-4 mb-4 border-2 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
          />

          <input
            type="text"
            placeholder="Topic (optional, e.g., Algebra, Forces, Photosynthesis)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full p-4 mb-6 border-2 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
          />

          <button
            onClick={startSession}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
            🚀 Start{" "}
            {mode === "tutor" ? "Tutor" : mode === "exam" ? "Exam" : "Quiz"}{" "}
            Session
          </button>
        </div>

        {sessionHistory.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              📚 Past Sessions
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {sessionHistory.map((session: any) => (
                <div
                  key={session.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {session.subject} - {session.topic}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {session.conversation_summary?.substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 h-[90vh] flex flex-col">
      <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            {mode === "tutor" ? "👨‍🏫" : mode === "exam" ? "📝" : "🧠"}{" "}
            {currentSession.subject}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Mode: {mode.toUpperCase()}
          </p>
        </div>
        <button
          onClick={endSession}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
          ✓ End Session
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-2xl p-4 rounded-xl ${
                msg.isUser
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none"
              }`}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
              <p className="text-xs opacity-75 mt-2">{msg.timestamp}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <audio ref={audioRef} className="hidden" />

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg flex gap-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type your question or doubt..."
          className="flex-1 p-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
          disabled={isSending}
        />

        <button
          onMouseDown={startListening}
          onMouseUp={() => recognitionRef.current?.stop()}
          className={`px-6 py-3 rounded-xl font-bold transition-all ${
            isListening
              ? "bg-red-600 text-white animate-pulse"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}>
          🎤
        </button>

        <button
          onClick={() => handleSendMessage()}
          disabled={isSending}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
          {isSending ? "⏳" : "📤"} Send
        </button>
      </div>
    </div>
  );
};

export default VoiceConversationHub;
