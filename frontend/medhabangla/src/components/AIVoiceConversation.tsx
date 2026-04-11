/**
 * AI Voice Conversation Component
 * Full-featured voice-based learning assistant
 */

import React, { useState, useRef, useEffect } from "react";
import voiceConversationService, {
  VoiceMessage,
  ConversationSummary,
} from "../services/voiceConversationService";

interface AIVoiceConversationProps {
  isFloating?: boolean;
  onClose?: () => void;
}

type Mode = "chat" | "exam" | "quiz" | "doubt-solving";

const AIVoiceConversation: React.FC<AIVoiceConversationProps> = ({
  isFloating = false,
  onClose,
}) => {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [mode, setMode] = useState<Mode>("chat");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showPastConversations, setShowPastConversations] = useState(false);
  const [pastConversations, setPastConversations] = useState<
    ConversationSummary[]
  >([]);
  const [isExpanded, setIsExpanded] = useState(!isFloating);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (showPastConversations) {
      loadPastConversations();
    }
  }, [showPastConversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadPastConversations = async () => {
    const conversations = await voiceConversationService.getPastConversations();
    setPastConversations(conversations);
  };

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      await voiceConversationService.startRecording();
    } catch (error) {
      console.error("Failed to start recording:", error);
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);

      const audioBlob = await voiceConversationService.stopRecording();
      const response =
        await voiceConversationService.sendVoiceMessage(audioBlob);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "user",
          text: "🎤 Voice message sent",
          timestamp: new Date(),
          type: "voice",
        },
        response,
      ]);

      // Auto-play response
      if (response.audioUrl) {
        await voiceConversationService.playAudio(response.audioUrl);
      }
    } catch (error) {
      console.error("Failed to process recording:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendText = async () => {
    if (!textInput.trim()) return;

    try {
      setIsProcessing(true);

      // Add user message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "user",
          text: textInput,
          timestamp: new Date(),
          type: "text",
        },
      ]);

      const response =
        await voiceConversationService.sendTextMessage(textInput);
      setTextInput("");
      setMessages((prev) => [...prev, response]);

      // Auto-play response
      if (response.audioUrl) {
        await voiceConversationService.playAudio(response.audioUrl);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadConversation = async (conversationId: string) => {
    try {
      const messages =
        await voiceConversationService.loadConversation(conversationId);
      setMessages(messages);
      setShowPastConversations(false);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const handleSaveConversation = async () => {
    await voiceConversationService.saveConversationSummary();
    alert("Conversation saved successfully!");
  };

  const handleStartExam = async () => {
    const subject = prompt("Enter subject (e.g., Mathematics, Physics):");
    const topic = prompt("Enter topic (e.g., Algebra, Thermodynamics):");

    if (subject && topic) {
      try {
        await voiceConversationService.startExamMode(subject, topic);
        setMode("exam");
        setMessages([]);
      } catch (error) {
        console.error("Failed to start exam:", error);
      }
    }
  };

  if (isFloating && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-2xl hover:scale-110"
        title="AI Voice Tutor">
        🎤
      </button>
    );
  }

  return (
    <div
      className={`${
        isFloating
          ? "fixed bottom-4 right-4 w-96 h-[32rem] max-h-[90vh]"
          : "w-full max-w-2xl mx-auto"
      } bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎤</span>
          <div>
            <h3 className="font-bold">AI Voice Tutor</h3>
            <p className="text-xs opacity-90">Learn through conversation</p>
          </div>
        </div>
        {isFloating && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-white hover:bg-white/20 rounded p-1">
            ✕
          </button>
        )}
      </div>

      {/* Mode Switch */}
      <div className="flex gap-1 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex-wrap">
        {["chat", "exam", "quiz", "doubt-solving"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m as Mode)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              mode === m
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-300"
            }`}>
            {m === "doubt-solving"
              ? "❓ Doubts"
              : m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Past Conversations Button */}
      <button
        onClick={() => setShowPastConversations(!showPastConversations)}
        className="text-xs mx-4 mt-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
        📚 {showPastConversations ? "Hide" : "View"} Past Conversations
      </button>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {showPastConversations ? (
          <div className="space-y-2">
            {pastConversations.length > 0 ? (
              pastConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleLoadConversation(conv.id)}
                  className="w-full text-left p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded border border-blue-200 dark:border-blue-700 transition-colors">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {conv.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {conv.messageCount} messages
                  </p>
                  {conv.keyTopics.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {conv.keyTopics.slice(0, 3).map((topic, i) => (
                        <span
                          key={i}
                          className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 px-2 py-0.5 rounded">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
                No past conversations found
              </p>
            )}
          </div>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <span className="text-4xl mb-2">🎓</span>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {mode === "exam"
                    ? "Ready for exam prep? Start speaking!"
                    : mode === "quiz"
                      ? "Let's take a quiz! Speak or type your answer."
                      : mode === "doubt-solving"
                        ? "Ask a question and I'll help solve your doubts!"
                        : "Start a voice conversation with me!"}
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none"
                    }`}>
                    <p className="text-sm">{msg.text}</p>
                    {msg.audioUrl && msg.role === "assistant" && (
                      <button
                        onClick={() =>
                          voiceConversationService.playAudio(msg.audioUrl!)
                        }
                        className="text-xs mt-1 opacity-75 hover:opacity-100">
                        🔊 Play
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      {!showPastConversations && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
          {/* Voice Controls */}
          <div className="flex gap-2">
            {isRecording ? (
              <>
                <button
                  onClick={handleStopRecording}
                  disabled={isProcessing}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg py-2 px-3 transition-colors flex items-center justify-center gap-2">
                  <span className="animate-pulse">●</span> Stop Recording
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleStartRecording}
                  disabled={isProcessing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg py-2 px-3 transition-colors">
                  🎤 Start Voice
                </button>
                {mode === "exam" && (
                  <button
                    onClick={handleStartExam}
                    disabled={isProcessing}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium rounded-lg py-2 px-3 transition-colors">
                    📝 Start Exam
                  </button>
                )}
              </>
            )}
          </div>

          {/* Text Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendText()}
              placeholder="Or type a message..."
              disabled={isRecording || isProcessing}
              className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 dark:text-white"
            />
            <button
              onClick={handleSendText}
              disabled={!textInput.trim() || isProcessing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg px-4 py-2 transition-colors">
              Send
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 text-xs">
            <button
              onClick={handleSaveConversation}
              className="flex-1 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-800 dark:text-green-100 px-2 py-1 rounded transition-colors">
              💾 Save
            </button>
            <button
              onClick={() => {
                voiceConversationService.clearHistory();
                setMessages([]);
              }}
              className="flex-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-800 dark:text-red-100 px-2 py-1 rounded transition-colors">
              🗑️ Clear
            </button>
          </div>

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="animate-spin">⏳</div>
              Processing...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIVoiceConversation;
