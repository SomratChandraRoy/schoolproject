/**
 * Offline AI Chat Page
 * Main page for accessing offline AI capabilities
 * Handles PWA installation and model management
 */

import React, { useState, useEffect } from "react";
import OfflineAIChat from "../components/OfflineAIChat";
import {
  modelPrefetcher,
  getInstallationStatus,
} from "../services/modelPrefetcher";

export interface InstallationStatus {
  isInstalled: boolean;
  installedModels: string[];
  missingModels: string[];
  cacheSize: number;
  totalSize: number;
}

export const OfflineAIPage: React.FC = () => {
  const [status, setStatus] = useState<InstallationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Load installation status
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const installStatus = await getInstallationStatus();
        setStatus(installStatus);
      } catch (error) {
        console.error("[OfflineAIPage] Error loading status:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, []);

  /**
   * Handle clear cache
   */
  const handleClearCache = async () => {
    if (
      window.confirm(
        "Are you sure you want to clear the cache? This will remove all downloaded models.",
      )
    ) {
      try {
        const success = await modelPrefetcher.clearCache();
        if (success) {
          alert("✅ Cache cleared successfully");
          window.location.reload();
        }
      } catch (error) {
        console.error("[OfflineAIPage] Error clearing cache:", error);
        alert("❌ Error clearing cache");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Chat Component */}
      {!showSettings && <OfflineAIChat />}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">⚙️ Offline AI Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-2xl hover:opacity-75 transition">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Installation Status */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">
                  📥 Installation Status
                </h3>
                {loading ? (
                  <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                ) : status ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Status:</span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          status.isInstalled
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                        }`}>
                        {status.isInstalled ? "✅ Installed" : "⏳ Incomplete"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Installed Models:</span>
                      <span className="font-semibold">
                        {status.installedModels.length}
                      </span>
                    </div>

                    {status.missingModels.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Missing Models:</span>
                        <span className="font-semibold text-red-600">
                          {status.missingModels.length}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span>Cache Size:</span>
                      <span className="font-semibold">
                        {status.cacheSize} MB
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Total Model Size:</span>
                      <span className="font-semibold">
                        {status.totalSize} MB
                      </span>
                    </div>

                    {/* Installed Models List */}
                    {status.installedModels.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                        <p className="font-semibold mb-2">✅ Downloaded:</p>
                        <ul className="space-y-1 text-sm">
                          {status.installedModels.map((model) => (
                            <li
                              key={model}
                              className="text-gray-700 dark:text-gray-300">
                              • {model}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missing Models List */}
                    {status.missingModels.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                        <p className="font-semibold mb-2 text-red-600">
                          ⏳ Missing:
                        </p>
                        <ul className="space-y-1 text-sm">
                          {status.missingModels.map((model) => (
                            <li
                              key={model}
                              className="text-gray-700 dark:text-gray-300">
                              • {model}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-red-600">Error loading status</p>
                )}
              </div>

              {/* Available Models */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">
                  📚 Available Models
                </h3>
                <div className="space-y-2 text-sm">
                  {modelPrefetcher.getAvailableModels().map((model) => (
                    <div
                      key={model.name}
                      className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{model.name}</p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">
                          {model.description} • {model.size} MB
                        </p>
                      </div>
                      {model.optional && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded">
                          Optional
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleClearCache}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                  🗑️ Clear Cache
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                  Back to Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Settings Button */}
      {!showSettings && (
        <button
          onClick={() => setShowSettings(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all"
          title="Settings">
          ⚙️
        </button>
      )}
    </div>
  );
};

export default OfflineAIPage;
