/**
 * Custom Hook: useTranslator
 * Provides translation functionality with offline support
 */

import { useState, useCallback, useEffect } from "react";
import OfflineTranslatorService, {
  TranslationResult,
  DictionaryEntry,
} from "../services/offlineTranslatorService";

export interface UseTranslatorOptions {
  sourceLanguage?: "en" | "bn";
  targetLanguage?: "en" | "bn";
  autoLoadDictionary?: boolean;
}

export interface UseTranslatorReturn {
  // Translation state
  translating: boolean;
  error: string | null;
  result: TranslationResult | null;

  // Methods
  translate: (
    text: string,
    source?: "en" | "bn",
    target?: "en" | "bn",
  ) => Promise<TranslationResult>;
  lookupDictionary: (text: string) => Promise<DictionaryEntry | null>;
  getDictionarySuggestions: (text: string) => Promise<string[]>;
  getHistory: (limit?: number) => Promise<any[]>;
  clearHistory: () => Promise<void>;
  downloadOfflineDictionary: () => Promise<void>;

  // Status
  isOnline: boolean;
  isOfflineMode: boolean;
  dictionaryStats: {
    totalEntries: number;
  };

  // Dictionary operations
  searchDictionary: (query: string) => Promise<DictionaryEntry[]>;
  getPopularWords: (limit?: number) => Promise<DictionaryEntry[]>;
}

/**
 * Main translator hook
 */
export function useTranslator(
  options: UseTranslatorOptions = {},
): UseTranslatorReturn {
  const {
    sourceLanguage = "en",
    targetLanguage = "bn",
    autoLoadDictionary = false,
  } = options;

  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dictionaryStats, setDictionaryStats] = useState({ totalEntries: 0 });

  // Declare all callbacks first (before useEffects)
  const updateStats = useCallback(async () => {
    try {
      const stats = await OfflineTranslatorService.getDictionaryStats();
      setDictionaryStats(stats);
    } catch (err) {
      console.error("Error updating stats:", err);
    }
  }, []);

  const translate = useCallback(
    async (
      text: string,
      source: "en" | "bn" = sourceLanguage,
      target: "en" | "bn" = targetLanguage,
    ): Promise<TranslationResult> => {
      try {
        setTranslating(true);
        setError(null);

        const translationResult = await OfflineTranslatorService.translate(
          text,
          source,
          target,
        );

        setResult(translationResult);
        return translationResult;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Translation failed";
        setError(errorMessage);
        throw err;
      } finally {
        setTranslating(false);
      }
    },
    [sourceLanguage, targetLanguage],
  );

  const lookupDictionary = useCallback(
    async (text: string): Promise<DictionaryEntry | null> => {
      try {
        return await OfflineTranslatorService.lookupDictionary(
          text,
          sourceLanguage,
          targetLanguage,
        );
      } catch (err) {
        console.error("Dictionary lookup error:", err);
        return null;
      }
    },
    [sourceLanguage, targetLanguage],
  );

  const getDictionarySuggestions = useCallback(
    async (text: string): Promise<string[]> => {
      try {
        return await OfflineTranslatorService.getDictionarySuggestions(
          text,
          sourceLanguage,
        );
      } catch (err) {
        console.error("Suggestions error:", err);
        return [];
      }
    },
    [sourceLanguage],
  );

  const getHistory = useCallback(
    async (limit: number = 20) => {
      try {
        return await OfflineTranslatorService.getHistory(sourceLanguage, limit);
      } catch (err) {
        console.error("History error:", err);
        return [];
      }
    },
    [sourceLanguage],
  );

  const clearHistory = useCallback(async () => {
    try {
      await OfflineTranslatorService.clearLocalData();
      setResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear history");
    }
  }, []);

  const downloadOfflineDictionary = useCallback(async () => {
    try {
      setTranslating(true);
      setError(null);

      await OfflineTranslatorService.downloadOfflineDictionary(
        sourceLanguage,
        targetLanguage,
      );

      await updateStats();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Download failed";
      setError(errorMessage);
    } finally {
      setTranslating(false);
    }
  }, [sourceLanguage, targetLanguage, updateStats]);

  const searchDictionary = useCallback(
    async (query: string): Promise<DictionaryEntry[]> => {
      try {
        return await OfflineTranslatorService.searchDictionary(
          query,
          sourceLanguage,
        );
      } catch (err) {
        console.error("Search error:", err);
        return [];
      }
    },
    [sourceLanguage],
  );

  const getPopularWords = useCallback(async (limit: number = 20) => {
    try {
      return await OfflineTranslatorService.getPopularWords(limit);
    } catch (err) {
      console.error("Popular words error:", err);
      return [];
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-load dictionary if nearby
  useEffect(() => {
    if (autoLoadDictionary && isOnline) {
      downloadOfflineDictionary();
    }
  }, [autoLoadDictionary, isOnline, downloadOfflineDictionary]);

  // Update dictionary stats on mount
  useEffect(() => {
    updateStats();
  }, [updateStats]);

  return {
    // State
    translating,
    error,
    result,
    isOnline,
    isOfflineMode: OfflineTranslatorService.isOfflineMode(),
    dictionaryStats,

    // Methods
    translate,
    lookupDictionary,
    getDictionarySuggestions,
    getHistory,
    clearHistory,
    downloadOfflineDictionary,
    searchDictionary,
    getPopularWords,
  };
}

/**
 * Hook: useTranslationHistory
 * Easily access translation history
 */
export function useTranslationHistory(sourceLanguage: "en" | "bn" = "en") {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const data = await OfflineTranslatorService.getHistory(sourceLanguage);
        setHistory(data);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [sourceLanguage]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await OfflineTranslatorService.getHistory(sourceLanguage);
      setHistory(data);
    } finally {
      setLoading(false);
    }
  }, [sourceLanguage]);

  const clear = useCallback(async () => {
    await OfflineTranslatorService.clearLocalData();
    setHistory([]);
  }, []);

  return { history, loading, refresh, clear };
}

/**
 * Hook: useDictionarySearch
 * Search dictionary easily
 */
export function useDictionarySearch(sourceLanguage: "en" | "bn" = "en") {
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setSearching(true);
      try {
        const data = await OfflineTranslatorService.searchDictionary(
          query,
          sourceLanguage,
        );
        setResults(data);
      } finally {
        setSearching(false);
      }
    },
    [sourceLanguage],
  );

  return { results, searching, search };
}

export default useTranslator;
