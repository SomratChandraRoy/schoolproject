/**
 * Translator Component
 * English-Bangla translator with offline support
 */

import React, { useState, useCallback, useEffect } from "react";
import clsx from "clsx";
import {
  useTranslator,
  useTranslationHistory,
  useDictionarySearch,
} from "../hooks/useTranslator";
import OfflineTranslatorService from "../services/offlineTranslatorService";

interface DictionaryEntryDisplay {
  id?: number;
  sourceText: string;
  targetText: string;
  meaning?: string;
  wordType?: string;
  exampleEnglish?: string;
  exampleBangla?: string;
  pronunciationBangla?: string;
  context?: string;
  difficulty?: number;
}

export interface TranslatorProps {
  className?: string;
  onTranslate?: (result: any) => void;
}

export const Translator: React.FC<TranslatorProps> = ({
  className,
  onTranslate,
}) => {
  // Translation state
  const {
    translate,
    translating,
    error,
    result,
    isOnline,
    isOfflineMode,
    dictionaryStats,
    downloadOfflineDictionary,
    getPopularWords,
    getDictionarySuggestions,
  } = useTranslator({
    sourceLanguage: "en",
    targetLanguage: "bn",
    autoLoadDictionary: true,
  });

  // History
  const { history, refresh: refreshHistory } = useTranslationHistory("en");

  // Search
  const {
    results: searchResults,
    searching,
    search,
  } = useDictionarySearch("en");

  // Local state
  const [sourceText, setSourceText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState<"en" | "bn">("bn");
  const [sourceLanguage, setSourceLanguage] = useState<"en" | "bn">("en");
  const [activeTab, setActiveTab] = useState<
    "translator" | "dictionary" | "history"
  >("translator");
  const [popularWords, setPopularWords] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [downloadingDict, setDownloadingDict] = useState(false);
  const [showDictModal, setShowDictModal] = useState(false);
  const [selectedDictEntry, setSelectedDictEntry] =
    useState<DictionaryEntryDisplay | null>(null);

  // Load popular words
  useEffect(() => {
    const loadPopular = async () => {
      const words = await getPopularWords(10);
      setPopularWords(words);
    };
    loadPopular();
  }, [getPopularWords]);

  // Handle translation
  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) return;

    const translationResult = await translate(
      sourceText,
      sourceLanguage,
      targetLanguage,
    );

    if (onTranslate) {
      onTranslate(translationResult);
    }
  }, [sourceText, sourceLanguage, targetLanguage, translate, onTranslate]);

  // Handle suggestion input
  const handleSourceTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setSourceText(text);

      // Get suggestions
      if (text.length >= 2) {
        getDictionarySuggestions(text).then(setSuggestions);
      } else {
        setSuggestions([]);
      }
    },
    [getDictionarySuggestions],
  );

  // Download dictionary for offline
  const handleDownloadDictionary = useCallback(async () => {
    setDownloadingDict(true);
    try {
      await downloadOfflineDictionary();
      alert("Offline dictionary downloaded successfully!");
    } catch (err) {
      alert("Failed to download offline dictionary");
    } finally {
      setDownloadingDict(false);
    }
  }, [downloadOfflineDictionary]);

  // Swap languages
  const handleSwapLanguages = useCallback(() => {
    setSourceLanguage(sourceLanguage === "en" ? "bn" : "en");
    setTargetLanguage(targetLanguage === "en" ? "bn" : "en");
  }, [sourceLanguage, targetLanguage]);

  // Copy translation
  const handleCopyTranslation = useCallback(() => {
    if (result) {
      navigator.clipboard.writeText(result.translatedText);
      alert("Copied!");
    }
  }, [result]);

  // Handle enter key
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        handleTranslate();
      }
    },
    [handleTranslate],
  );

  // Apply suggestion
  const handleApplySuggestion = useCallback((suggestion: string) => {
    setSourceText(suggestion);
    setSuggestions([]);
  }, []);

  // Show dictionary entry
  const handleShowDictEntry = useCallback((entry: any) => {
    setSelectedDictEntry(entry);
    setShowDictModal(true);
  }, []);

  // Translate from history
  const handleTranslateFromHistory = useCallback((item: any) => {
    setSourceText(item.sourceText);
    setSourceLanguage(item.sourceLanguage as "en" | "bn");
    setTargetLanguage(item.targetLanguage as "en" | "bn");
  }, []);

  // Translate from popular words
  const handleTranslatePopularWord = useCallback((word: any) => {
    setSourceText(word.sourceText);
  }, []);

  return (
    <div
      className={clsx(
        "translator-container min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
        className,
      )}>
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-slate-700 bg-slate-800/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              📚 English-Bangla Translator
            </h1>
            <div className="flex items-center gap-4">
              <span
                className={clsx(
                  "px-3 py-1 rounded-full text-sm font-semibold",
                  isOnline
                    ? "bg-green-500/20 text-green-300"
                    : "bg-yellow-500/20 text-yellow-300",
                )}>
                {isOnline ? "🟢 Online" : "🟡 Offline"}
              </span>
              {dictionaryStats.totalEntries > 0 && (
                <span className="text-sm text-slate-400">
                  📖 {dictionaryStats.totalEntries.toLocaleString()} words
                  available
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {(["translator", "dictionary", "history"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  "px-4 py-2 rounded-lg font-medium transition-all",
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600",
                )}>
                {tab === "translator" && "🔤 Translator"}
                {tab === "dictionary" && "📕 Dictionary"}
                {tab === "history" && "⏱️ History"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200">
            ⚠️ {error}
          </div>
        )}

        {/* Translator Tab */}
        {activeTab === "translator" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Section - Input */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-lg font-semibold text-slate-200">
                  Source ({sourceLanguage === "en" ? "English" : "Bangla"})
                </label>
                <button
                  onClick={handleSwapLanguages}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-cyan-400 transition-colors"
                  title="Swap languages">
                  ⇄
                </button>
              </div>

              {/* Input TextArea */}
              <textarea
                value={sourceText}
                onChange={handleSourceTextChange}
                onKeyPress={handleKeyPress}
                placeholder={`Enter ${sourceLanguage === "en" ? "English" : "Bangla"} text...`}
                className="w-full h-48 p-4 rounded-lg bg-slate-700 text-slate-100 border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 resize-none focus:outline-none transition-all"
              />

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-700 border border-slate-600">
                  <p className="text-xs font-semibold text-slate-400 mb-2">
                    Suggestions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleApplySuggestion(suggestion)}
                        className="px-3 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-sm transition-colors">
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600 text-sm text-slate-300">
                💡{" "}
                {isOfflineMode
                  ? "📡 Offline mode active - Using local dictionary"
                  : "🌐 Online - Using AI translation"}
              </div>

              {/* Download Dictionary Button */}
              {dictionaryStats.totalEntries === 0 && (
                <button
                  onClick={handleDownloadDictionary}
                  disabled={downloadingDict}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 font-semibold text-white transition-all">
                  {downloadingDict
                    ? "⏳ Downloading..."
                    : "⬇️ Download Offline Dictionary"}
                </button>
              )}
            </div>

            {/* Right Section - Output & Buttons */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-lg font-semibold text-slate-200">
                  Translation ({targetLanguage === "bn" ? "Bangla" : "English"})
                </label>
                {result && (
                  <span
                    className={clsx(
                      "text-xs px-2 py-1 rounded",
                      result.confidence > 0.8
                        ? "bg-green-500/20 text-green-300"
                        : "bg-yellow-500/20 text-yellow-300",
                    )}>
                    Confidence: {Math.round(result.confidence * 100)}%
                  </span>
                )}
              </div>

              {/* Output Box */}
              <div className="w-full h-48 p-4 rounded-lg bg-slate-700 border border-slate-600 overflow-y-auto">
                <p
                  className={clsx(
                    "text-lg",
                    result ? "text-cyan-300" : "text-slate-400",
                  )}>
                  {result
                    ? result.translatedText
                    : "Translation will appear here..."}
                </p>
              </div>

              {/* Dictionary Entry (if available) */}
              {result?.dictionaryEntry && (
                <div
                  className="p-4 rounded-lg bg-slate-700/50 border border-blue-500/50 cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => handleShowDictEntry(result.dictionaryEntry)}>
                  <p className="text-sm text-slate-300">
                    <strong>Word Type:</strong>{" "}
                    {result.dictionaryEntry.wordType || "N/A"}
                  </p>
                  {result.dictionaryEntry.meaning && (
                    <p className="text-sm text-slate-400 mt-1">
                      <strong>Meaning:</strong> {result.dictionaryEntry.meaning}
                    </p>
                  )}
                  <p className="text-xs text-blue-400 mt-2 cursor-pointer hover:underline">
                    👁️ View full dictionary entry
                  </p>
                </div>
              )}

              {/* Alternatives */}
              {result?.alternatives && result.alternatives.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                  <p className="text-xs font-semibold text-slate-400 mb-2">
                    Alternative Translations:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.alternatives.map((alt, idx) => (
                      <button
                        key={idx}
                        className="px-3 py-1 rounded bg-slate-600/50 hover:bg-slate-600 text-slate-300 text-sm transition-colors">
                        {alt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleTranslate}
                  disabled={translating || !sourceText.trim()}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 font-semibold text-white transition-all flex items-center justify-center gap-2">
                  {translating ? <>⏳ Translating...</> : <>🔄 Translate</>}
                </button>
                <button
                  onClick={handleCopyTranslation}
                  disabled={!result}
                  className="w-full py-3 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 font-semibold text-slate-200 transition-all">
                  📋 Copy
                </button>
              </div>

              {/* Clear Button */}
              <button
                onClick={() => {
                  setSourceText("");
                  setSuggestions([]);
                }}
                className="w-full py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm transition-colors">
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Dictionary Tab */}
        {activeTab === "dictionary" && (
          <div className="space-y-6">
            {/* Popular Words */}
            {popularWords.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  🔥 Popular Words
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {popularWords.map((word) => (
                    <div
                      key={word.id}
                      onClick={() => {
                        setSourceText(word.sourceText);
                        setActiveTab("translator");
                      }}
                      className="p-4 rounded-lg bg-slate-700 border border-slate-600 hover:border-blue-500 cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-500/20">
                      <p className="text-lg font-semibold text-cyan-300">
                        {word.sourceText}
                      </p>
                      <p className="text-slate-400 mt-1">→ {word.targetText}</p>
                      {word.meaning && (
                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                          {word.meaning}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
                        {word.wordType} • Used {word.usageCount} times
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="p-6 rounded-lg bg-slate-700/50 border border-slate-600">
              <h3 className="text-lg font-semibold text-slate-100 mb-3">
                📊 Dictionary Stats
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-slate-600/50">
                  <p className="text-3xl font-bold text-cyan-400">
                    {dictionaryStats.totalEntries.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">Words Available</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-600/50">
                  <p className="text-3xl font-bold text-green-400">
                    {history.length}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Translations Done
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-600/50">
                  <p className="text-3xl font-bold text-purple-400">
                    {isOnline ? "🟢" : "🟡"}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">Mode</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              ⏱️ Translation History
            </h2>
            {history.length === 0 ? (
              <div className="text-center p-8 rounded-lg bg-slate-700/50 border border-slate-600">
                <p className="text-slate-400">
                  No translations yet. Start translating to see history!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-slate-700 border border-slate-600 hover:border-blue-500 transition-all cursor-pointer group"
                    onClick={() => handleTranslateFromHistory(item)}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-cyan-300 font-semibold group-hover:text-cyan-200">
                          {item.sourceText}
                        </p>
                        <p className="text-slate-400 text-sm gt-1">
                          → {item.translatedText}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dictionary Modal */}
      {showDictModal && selectedDictEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-md w-full max-h-96 overflow-y-auto shadow-2xl">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-bold text-cyan-300">
                  {selectedDictEntry.sourceText}
                </h3>
                <button
                  onClick={() => setShowDictModal(false)}
                  className="text-slate-400 hover:text-slate-200 text-xl">
                  ✕
                </button>
              </div>

              {selectedDictEntry.targetText && (
                <div>
                  <p className="text-slate-400 text-sm">Translation</p>
                  <p className="text-lg text-slate-200 font-semibold">
                    {selectedDictEntry.targetText}
                  </p>
                </div>
              )}

              {selectedDictEntry.wordType && (
                <div>
                  <p className="text-slate-400 text-sm">Word Type</p>
                  <p className="text-slate-200">{selectedDictEntry.wordType}</p>
                </div>
              )}

              {selectedDictEntry.meaning && (
                <div>
                  <p className="text-slate-400 text-sm">Meaning</p>
                  <p className="text-slate-200">{selectedDictEntry.meaning}</p>
                </div>
              )}

              {selectedDictEntry.exampleEnglish && (
                <div>
                  <p className="text-slate-400 text-sm">Example</p>
                  <p className="text-slate-300 italic">
                    "{selectedDictEntry.exampleEnglish}"
                  </p>
                </div>
              )}

              {selectedDictEntry.pronunciationBangla && (
                <div>
                  <p className="text-slate-400 text-sm">Pronunciation</p>
                  <p className="text-slate-200">
                    {selectedDictEntry.pronunciationBangla}
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowDictModal(false)}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Translator;
