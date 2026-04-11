/**
 * Offline Translator Service
 * Uses Dexie for IndexedDB storage to enable offline translation
 */

import Dexie, { Table } from "dexie";
import axios from "axios";

export interface DictionaryEntry {
  id?: number;
  sourceText: string;
  sourceLanguage: "en" | "bn";
  targetText: string;
  targetLanguage: "en" | "bn";
  meaning?: string;
  wordType?: string;
  exampleEnglish?: string;
  exampleBangla?: string;
  pronunciationBangla?: string;
  context?: string;
  difficulty?: number;
  usageCount?: number;
}

export interface TranslationResult {
  translatedText: string;
  sourceText: string;
  sourceLanguage: string;
  targetLanguage: string;
  dictionaryEntry?: DictionaryEntry;
  isOffline: boolean;
  confidence: number;
  alternatives: string[];
}

export interface TranslationHistory {
  id?: number;
  sourceText: string;
  sourceLanguage: string;
  translatedText: string;
  targetLanguage: string;
  contextType: string;
  timestamp: number;
}

// Initialize Dexie database
export class TranslatorDB extends Dexie {
  dictionary!: Table<DictionaryEntry>;
  history!: Table<TranslationHistory>;

  constructor() {
    super("TranslatorDB");
    this.version(1).stores({
      dictionary:
        "++id, [sourceText+sourceLanguage+targetLanguage], sourceText, targetText, wordType, difficulty",
      history: "++id, sourceLanguage, timestamp",
    });
  }
}

const db = new TranslatorDB();

/**
 * Offline Translator Service
 */
export class OfflineTranslatorService {
  private static readonly STORAGE_KEY = "translator_settings";
  private static readonly DICTIONARY_VERSION_KEY = "dictionary_version";
  private static isOnline = navigator.onLine;

  /**
   * Initialize the translator service
   * Loads offline dictionary on app start
   */
  static async initialize(): Promise<void> {
    // Monitor online/offline status
    window.addEventListener("online", () => {
      this.isOnline = true;
      console.log("Translator: Online mode enabled");
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      console.log("Translator: Offline mode enabled");
    });

    // Load offline dictionary if available
    try {
      const dictionaryData = localStorage.getItem("offlineDictionary");
      if (dictionaryData) {
        await this.loadOfflineDictionary(JSON.parse(dictionaryData));
      }
    } catch (error) {
      console.error("Error loading offline dictionary:", error);
    }
  }

  /**
   * Translate text
   */
  static async translate(
    text: string,
    sourceLanguage: "en" | "bn" = "en",
    targetLanguage: "en" | "bn" = "bn",
  ): Promise<TranslationResult> {
    if (!text.trim()) {
      return {
        translatedText: "",
        sourceText: text,
        sourceLanguage,
        targetLanguage,
        isOffline: true,
        confidence: 0,
        alternatives: [],
      };
    }

    try {
      // First, try to find in local dictionary
      const dictionaryResult = await this.lookupDictionary(
        text,
        sourceLanguage,
        targetLanguage,
      );

      if (dictionaryResult) {
        // Save to history
        await this.saveHistory(
          text,
          dictionaryResult.targetText,
          sourceLanguage,
          targetLanguage,
        );

        return {
          translatedText: dictionaryResult.targetText,
          sourceText: text,
          sourceLanguage,
          targetLanguage,
          dictionaryEntry: dictionaryResult,
          isOffline: true,
          confidence: 0.95,
          alternatives: await this.findSimilarTerms(
            text,
            sourceLanguage,
            targetLanguage,
          ),
        };
      }

      // If online, try API
      if (this.isOnline) {
        try {
          const response = await axios.post("/api/translator/translate/", {
            text,
            source_language: sourceLanguage,
            target_language: targetLanguage,
            context_type: "general",
          });

          // Save to history
          await this.saveHistory(
            text,
            response.data.translated_text,
            sourceLanguage,
            targetLanguage,
          );

          return {
            translatedText: response.data.translated_text,
            sourceText: text,
            sourceLanguage,
            targetLanguage,
            dictionaryEntry: response.data.dictionary_entry,
            isOffline: false,
            confidence: response.data.confidence,
            alternatives: response.data.alternatives || [],
          };
        } catch (error) {
          console.error("API translation failed:", error);
        }
      }

      // Fallback: find similar terms from offline dictionary
      const similarTerms = await this.findSimilarTerms(
        text,
        sourceLanguage,
        targetLanguage,
      );
      if (similarTerms.length > 0) {
        const fallbackEntry = await db.dictionary.get({
          sourceText: similarTerms[0] as any,
          sourceLanguage,
          targetLanguage,
        });

        if (fallbackEntry) {
          return {
            translatedText: fallbackEntry.targetText,
            sourceText: text,
            sourceLanguage,
            targetLanguage,
            dictionaryEntry: fallbackEntry,
            isOffline: true,
            confidence: 0.6,
            alternatives: similarTerms.slice(1),
          };
        }
      }

      // Return original text if no translation found
      return {
        translatedText: text,
        sourceText: text,
        sourceLanguage,
        targetLanguage,
        isOffline: true,
        confidence: 0,
        alternatives: [],
      };
    } catch (error) {
      console.error("Translation error:", error);
      return {
        translatedText: text,
        sourceText: text,
        sourceLanguage,
        targetLanguage,
        isOffline: true,
        confidence: 0,
        alternatives: [],
      };
    }
  }

  /**
   * Look up word in dictionary
   */
  static async lookupDictionary(
    text: string,
    sourceLanguage: "en" | "bn",
    targetLanguage: "en" | "bn",
  ): Promise<DictionaryEntry | null> {
    try {
      const entry = await db.dictionary
        .where("[sourceText+sourceLanguage+targetLanguage]")
        .equals([text.toLowerCase(), sourceLanguage, targetLanguage])
        .first();

      return entry || null;
    } catch (error) {
      console.error("Dictionary lookup error:", error);
      return null;
    }
  }

  /**
   * Get dictionary suggestions for autocomplete
   */
  static async getDictionarySuggestions(
    text: string,
    language: "en" | "bn" = "en",
    limit: number = 10,
  ): Promise<string[]> {
    try {
      const suggestions = await db.dictionary
        .where(language === "en" ? "sourceText" : "targetText")
        .startsWith(text.toLowerCase())
        .limit(limit)
        .toArray();

      return suggestions.map((s) =>
        language === "en" ? s.sourceText : s.targetText,
      );
    } catch (error) {
      console.error("Suggestions error:", error);
      return [];
    }
  }

  /**
   * Find similar terms
   */
  static async findSimilarTerms(
    text: string,
    sourceLanguage: "en" | "bn",
    targetLanguage: "en" | "bn",
    limit: number = 5,
  ): Promise<string[]> {
    try {
      const entries = await db.dictionary
        .where("sourceLanguage")
        .equals(sourceLanguage)
        .and((entry) =>
          entry.sourceText.toLowerCase().includes(text.toLowerCase()),
        )
        .and((entry) => entry.targetLanguage === targetLanguage)
        .limit(limit)
        .toArray();

      return entries.map((e) => e.targetText);
    } catch (error) {
      console.error("Find similar terms error:", error);
      return [];
    }
  }

  /**
   * Save translation to history
   */
  static async saveHistory(
    sourceText: string,
    translatedText: string,
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<void> {
    try {
      await db.history.add({
        sourceText,
        sourceLanguage,
        translatedText,
        targetLanguage,
        contextType: "general",
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error saving history:", error);
    }
  }

  /**
   * Get translation history
   */
  static async getHistory(
    sourceLanguage?: string,
    limit: number = 20,
  ): Promise<TranslationHistory[]> {
    try {
      let query = db.history.orderBy("timestamp").reverse();

      if (sourceLanguage) {
        query = query.filter((h) => h.sourceLanguage === sourceLanguage);
      }

      return query.limit(limit).toArray();
    } catch (error) {
      console.error("Error getting history:", error);
      return [];
    }
  }

  /**
   * Load offline dictionary from API response
   */
  static async loadOfflineDictionary(data: any): Promise<void> {
    try {
      if (!data.dictionary || data.dictionary.length === 0) {
        return;
      }

      // Convert compact format to full format
      const entries: DictionaryEntry[] = data.dictionary.map((entry: any) => ({
        sourceText: entry.s,
        sourceLanguage: data.source_language,
        targetText: entry.t,
        targetLanguage: data.target_language,
        meaning: entry.m,
        wordType: entry.w,
        exampleEnglish: entry.e,
        difficulty: 1,
      }));

      // Clear existing and add new
      await db.dictionary.clear();
      await db.dictionary.bulkAdd(entries);

      console.log(
        `Loaded ${entries.length} dictionary entries for offline use`,
      );
    } catch (error) {
      console.error("Error loading offline dictionary:", error);
    }
  }

  /**
   * Download dictionary for offline use
   */
  static async downloadOfflineDictionary(
    sourceLanguage: "en" | "bn" = "en",
    targetLanguage: "en" | "bn" = "bn",
  ): Promise<void> {
    try {
      console.log("Downloading offline dictionary...");

      const response = await axios.post("/api/translator/export-dictionary/", {
        source_language: sourceLanguage,
        target_language: targetLanguage,
      });

      // Save to local storage
      localStorage.setItem("offlineDictionary", JSON.stringify(response.data));

      // Load into Dexie
      await this.loadOfflineDictionary(response.data);

      console.log("Offline dictionary downloaded and ready");
    } catch (error) {
      console.error("Error downloading offline dictionary:", error);
      throw error;
    }
  }

  /**
   * Clear all locally stored data
   */
  static async clearLocalData(): Promise<void> {
    try {
      await db.history.clear();
      localStorage.removeItem("offlineDictionary");
      console.log("Local translator data cleared");
    } catch (error) {
      console.error("Error clearing local data:", error);
    }
  }

  /**
   * Get offline status
   */
  static isOfflineMode(): boolean {
    return !this.isOnline;
  }

  /**
   * Get dictionary statistics
   */
  static async getDictionaryStats(): Promise<{
    totalEntries: number;
    sourceLanguage: string;
    targetLanguage: string;
  }> {
    try {
      const count = await db.dictionary.count();
      return {
        totalEntries: count,
        sourceLanguage: "en",
        targetLanguage: "bn",
      };
    } catch (error) {
      console.error("Error getting stats:", error);
      return {
        totalEntries: 0,
        sourceLanguage: "en",
        targetLanguage: "bn",
      };
    }
  }

  /**
   * Search dictionary
   */
  static async searchDictionary(
    query: string,
    language: "en" | "bn" = "en",
  ): Promise<DictionaryEntry[]> {
    try {
      const field = language === "en" ? "sourceText" : "targetText";
      const results = await db.dictionary
        .where(field)
        .startsWithIgnoreCase(query)
        .limit(20)
        .toArray();

      return results;
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  }

  /**
   * Get popular words
   */
  static async getPopularWords(limit: number = 20): Promise<DictionaryEntry[]> {
    try {
      return await db.dictionary
        .orderBy("usageCount")
        .reverse()
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error("Error getting popular words:", error);
      return [];
    }
  }
}

// Initialize on load
if (typeof window !== "undefined") {
  OfflineTranslatorService.initialize().catch((error) => {
    console.error("Failed to initialize translator service:", error);
  });
}

export default OfflineTranslatorService;
