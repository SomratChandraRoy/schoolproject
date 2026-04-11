/**
 * Offline AI Chat Component
 * Provides offline question-answering interface
 * Uses local models and knowledge base, works without internet
 */

import React, { useState, useEffect, useRef } from "react";
import { offlineAIService, OfflineMessage } from "../services/offlineAIService";
import { modelPrefetcher } from "../services/modelPrefetcher";

interface Message extends OfflineMessage {
  id: string;
}

interface InstallationStatus {
  isInstalled: boolean;
  progressPercent: number;
  missingModels: string[];
}

export const OfflineAIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [installStatus, setInstallStatus] = useState<InstallationStatus>({
    isInstalled: false,
    progressPercent: 0,
    missingModels: [],
  });
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalKnowledgeEntries: 0,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize offline AI on mount
  useEffect(() => {
    const initializeAI = async () => {
      try {
        console.log("[OfflineAIChat] Initializing...");
        await offlineAIService.initialize();

        const status = await modelPrefetcher.getInstallationStatus();
        setInstallStatus({
          isInstalled: status.isInstalled,
          progressPercent: status.installedModels.length === 0 ? 0 : 100,
          missingModels: status.missingModels,
        });

        const aiStats = await offlineAIService.getStatistics();
        setStats(aiStats);

        setInitialized(true);
        console.log("[OfflineAIChat] ✅ Ready for offline AI");
      } catch (error) {
        console.error("[OfflineAIChat] Initialization error:", error);
        setInitialized(true); // Still allow usage even if initialization fails
      }
    };

    initializeAI();
  }, []);

  /**
   * Monitor model downloads
   */
  useEffect(() => {
    const unsubscribe = modelPrefetcher.onProgressUpdate((progress) => {
      console.log(
        `[OfflineAIChat] Downloading ${progress.modelName}: ${progress.percentage}%`,
      );
    });

    return unsubscribe;
  }, []);

  /**
   * Load a welcome message
   */
  const loadWelcomeMessage = () => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome-" + Date.now(),
        role: "assistant",
        content: `👋 Welcome to Offline AI Chat!

I'm an AI assistant that works completely offline. You can ask me questions about:
• 📚 Biology (photosynthesis, respiration, etc.)
• 🔢 Mathematics (geometry, theorems, etc.)
• 🌍 Geography (capitals, climate, etc.)
• 📖 Study tips and learning strategies

Just type your question below and I'll help you!

💡 Note: I have limited knowledge and may not answer complex questions. For more advanced topics, use the online AI when you have internet.`,
        timestamp: new Date(),
        offline: true,
      };
      setMessages([welcomeMessage]);
    }
  };

  useEffect(() => {
    loadWelcomeMessage();
  }, []);

  /**
   * Handle sending a message
   */
  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    try {
      setLoading(true);

      // Add user message
      const userMessage: Message = {
        id: "msg-" + Date.now(),
        role: "user",
        content: input,
        timestamp: new Date(),
        offline: true,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      // Get AI response
      const response = await offlineAIService.generateResponse(input);

      const assistantMessage: Message = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        offline: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("[OfflineAIChat] Error:", error);
      const errorMessage: Message = {
        id: "error-" + Date.now(),
        role: "assistant",
        content:
          "❌ An error occurred while processing your question. Please try again.",
        timestamp: new Date(),
        offline: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle installing models
   */
  const handleInstallModels = async () => {
    try {
      setInstallStatus((prev) => ({ ...prev, progressPercent: 10 }));

      const results = await modelPrefetcher.downloadEssentialModels();

      if (results.failed.length === 0) {
        setInstallStatus({
          isInstalled: true,
          progressPercent: 100,
          missingModels: [],
        });
      }

      // Download optional models in background
      modelPrefetcher.downloadOptionalModels();
    } catch (error) {
      console.error("[OfflineAIChat] Installation error:", error);
    }
  };

  /**
   * Clear chat
   */
  const handleClearChat = () => {
    setMessages([]);
    loadWelcomeMessage();
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🤖</div>
            <div>
              <h1 className="text-2xl font-bold">Offline AI Chat</h1>
              <p className="text-blue-100">
                💾 No internet? No problem! Ask away offline.
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">
              {initialized ? "✅ Ready" : "⏳ Loading..."}
            </div>
            {!installStatus.isInstalled && (
              <div className="text-xs font-semibold mt-1 bg-red-500 px-2 py-1 rounded">
                Models: {installStatus.progressPercent}%
              </div>
            )}
          </div>
        </div>

        {/* Installation Status */}
        {!installStatus.isInstalled && (
          <div className="mt-4 bg-red-500/20 border border-red-300 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">📥 Install AI Models</p>
                <p className="text-sm opacity-90">
                  Download {installStatus.missingModels.length} essential models
                  (~10 MB)
                </p>
              </div>
              <button
                onClick={handleInstallModels}
                className="bg-white text-red-600 px-4 py-2 rounded font-semibold hover:bg-red-50 transition">
                Install Now
              </button>
            </div>
            <div className="mt-2 bg-red-900/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-yellow-400 to-red-500 h-full transition-all duration-300"
                style={{ width: `${installStatus.progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="text-6xl mb-4">💬</div>
              <p>No messages yet. Start asking questions!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none"
                }`}>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask a question (offline)..."
            disabled={loading || !initialized}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !initialized || !input.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold">
            {loading ? "⏳" : "📤"}
          </button>
          <button
            onClick={handleClearChat}
            className="bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
            title="Clear chat">
            🗑️
          </button>
        </div>

        {/* Info Footer */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>
              💾 Knowledge Base: {stats.totalKnowledgeEntries} entries
            </span>
            <span>💬 Chats: {stats.totalConversations}</span>
          </div>
          <button
            onClick={() => setShowInstallGuide(!showInstallGuide)}
            className="text-blue-500 hover:text-blue-600 font-semibold">
            {showInstallGuide ? "▼ Hide" : "▶ Show"} Help
          </button>
        </div>

        {/* Help Section */}
        {showInstallGuide && (
          <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-xs">
            <p className="font-semibold mb-2">📖 How to Use Offline AI:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Ask questions about any topic in my knowledge base</li>
              <li>I'll search for the best matching answer</li>
              <li>All conversations are stored locally in your device</li>
              <li>Works completely offline - no internet needed!</li>
              <li>Install models for better experience and faster responses</li>
            </ul>
            <p className="mt-2 text-blue-600 dark:text-blue-300">
              💡 Tip: For complex questions, use online AI when connected to
              internet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineAIChat;
