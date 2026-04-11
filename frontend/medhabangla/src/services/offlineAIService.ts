/**
 * Offline AI Service
 * Provides AI question-answering capability without internet connection
 * Uses local knowledge base stored in IndexedDB
 */

import Dexie, { Table } from "dexie";

// Database schema
export class OfflineAIDB extends Dexie {
  conversations!: Table<OfflineConversation>;
  knowledgeBase!: Table<KnowledgeEntry>;
  models!: Table<ModelMetadata>;

  constructor() {
    super("OfflineAIDB");
    this.version(1).stores({
      conversations: "++id, userId, createdAt",
      knowledgeBase: "++id, question, subject",
      models: "name, version",
    });
  }
}

// Types
export interface OfflineConversation {
  id?: number;
  userId: string;
  subject: string;
  messages: OfflineMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OfflineMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  offline: true;
}

export interface KnowledgeEntry {
  id?: number;
  question: string;
  answer: string;
  subject: string;
  keywords: string[];
  category: string;
  createdAt: Date;
}

export interface ModelMetadata {
  name: string;
  version: string;
  size: number; // in bytes
  downloadedAt: Date;
  modelPath: string; // path or URL
  description: string;
}

// Offline AI Service Class
export class OfflineAIService {
  private db: OfflineAIDB;
  private knowledgeBase: Map<string, KnowledgeEntry[]> = new Map();
  private isInitialized = false;

  // Pre-computed knowledge base (can be extended)
  private defaultKnowledge: KnowledgeEntry[] = [
    {
      question: "What is photosynthesis?",
      answer:
        "Photosynthesis is the process by which plants, algae, and some bacteria convert light energy (usually from sunlight) into chemical energy stored in glucose or other sugars. It occurs mainly in the leaves of plants using chlorophyll. The process involves two main stages: light-dependent reactions and light-independent reactions (Calvin cycle). In light-dependent reactions, light energy is converted into ATP and NADPH. In the Calvin cycle, these energy molecules are used to convert carbon dioxide into glucose. The overall equation is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂",
      subject: "Biology",
      keywords: [
        "photosynthesis",
        "plants",
        "energy",
        "glucose",
        "light",
        "chlorophyll",
      ],
      category: "Biology",
    },
    {
      question: "What is the water cycle?",
      answer:
        "The water cycle, also called the hydrologic cycle, is the continuous movement of water on, above, and below Earth's surface. It consists of several key stages: Evaporation - water from surface water bodies evaporates into water vapor. Transpiration - water from plants releases into the atmosphere. Condensation - water vapor cools and forms clouds. Precipitation - water falls as rain, snow, or sleet. Collection - water gathers in lakes, rivers, and oceans. The cycle is driven by solar energy and gravity, and it is essential for distributing heat and moisture around the planet.",
      subject: "Geography",
      keywords: [
        "water cycle",
        "evaporation",
        "precipitation",
        "condensation",
        "hydrologic",
      ],
      category: "Environmental Science",
    },
    {
      question: "What is the Pythagorean theorem?",
      answer:
        "The Pythagorean theorem is a fundamental relationship in geometry that states: In a right-angled triangle, the square of the hypotenuse (the side opposite the right angle) is equal to the sum of the squares of the other two sides. Mathematically: a² + b² = c², where c is the hypotenuse and a and b are the other two sides. This theorem is named after the ancient Greek mathematician Pythagoras. It has numerous applications in mathematics, physics, engineering, and architecture. For example, if a triangle has sides of 3 and 4 units, the hypotenuse would be 5 units (3² + 4² = 9 + 16 = 25 = 5²).",
      subject: "Mathematics",
      keywords: [
        "Pythagorean theorem",
        "geometry",
        "right triangle",
        "hypotenuse",
        "mathematics",
      ],
      category: "Mathematics",
    },
    {
      question: "What is respiration?",
      answer:
        "Respiration is the biochemical process in living organisms that produces energy in the form of ATP (adenosine triphosphate) by breaking down organic molecules. There are two main types: Aerobic respiration - occurs in the presence of oxygen and produces the maximum amount of energy (approximately 30-32 ATP molecules per glucose molecule). It includes glycolysis, the Krebs cycle (citric acid cycle), and the electron transport chain. Anaerobic respiration - occurs in the absence of oxygen and produces much less energy (only 2 ATP molecules per glucose molecule). It includes glycolysis and fermentation. Aerobic respiration is much more efficient and is the primary method used by most organisms.",
      subject: "Biology",
      keywords: [
        "respiration",
        "ATP",
        "energy",
        "aerobic",
        "anaerobic",
        "glucose",
      ],
      category: "Biology",
    },
    {
      question: "What is the capital of Bangladesh?",
      answer:
        "The capital of Bangladesh is Dhaka. It is the largest city in Bangladesh and serves as the political, economic, and cultural center of the country. Dhaka is located on the Ganges Delta and has a population of over 10 million people, making it one of the largest cities in the world. The city is known for its historical monuments, including the Lalbagh Fort and the National Parliament Building. Dhaka is a major hub for commerce, education, and transportation in Bangladesh.",
      subject: "Geography",
      keywords: ["Bangladesh", "capital", "Dhaka", "city"],
      category: "Geography",
    },
    {
      question: "How do I study effectively?",
      answer:
        "Effective studying involves several key strategies: 1. Active learning - Engage with material actively rather than passively reading. Use techniques like summarizing, questioning, and teaching concepts to others. 2. Spaced repetition - Review material at increasing intervals over time to improve long-term retention. 3. Pomodoro technique - Work in focused 25-minute intervals followed by 5-minute breaks. 4. Change study environment - Studying in different locations can improve memory retention. 5. Create a study schedule - Plan your study time and stick to it. 6. Test yourself - Use practice tests and quizzes to identify weak areas. 7. Get adequate sleep - Sleep is critical for memory consolidation and learning. 8. Stay organized - Keep notes organized and use effective note-taking methods.",
      subject: "Study Skills",
      keywords: [
        "study",
        "learning",
        "effective",
        "techniques",
        "memory",
        "retention",
      ],
      category: "Learning",
    },
  ];

  constructor() {
    this.db = new OfflineAIDB();
  }

  /**
   * Initialize the offline AI service
   * Load knowledge base from database or use defaults
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log("[Offline AI] Initializing...");

      // Load knowledge base from database
      const entries = await this.db.knowledgeBase.toArray();

      if (entries.length === 0) {
        // Initialize with default knowledge base
        console.log("[Offline AI] Loading default knowledge base...");
        await this.db.knowledgeBase.bulkAdd(this.defaultKnowledge);
      }

      // Create searchable index
      await this.buildKnowledgeIndex();

      this.isInitialized = true;
      console.log("[Offline AI] ✅ Initialized successfully");
    } catch (error) {
      console.error("[Offline AI] Initialization error:", error);
      throw error;
    }
  }

  /**
   * Build searchable index from knowledge base
   */
  private async buildKnowledgeIndex(): Promise<void> {
    const entries = await this.db.knowledgeBase.toArray();

    for (const entry of entries) {
      const subject = entry.subject;
      if (!this.knowledgeBase.has(subject)) {
        this.knowledgeBase.set(subject, []);
      }
      this.knowledgeBase.get(subject)!.push(entry);
    }
  }

  /**
   * Extract keywords from user question
   */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3);
  }

  /**
   * Calculate similarity score between two strings (simple approach)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(this.extractKeywords(str1));
    const words2 = new Set(this.extractKeywords(str2));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Find best matching answer to a question
   */
  async findAnswer(question: string): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log("[Offline AI] Searching for answer to:", question);

      const entries = await this.db.knowledgeBase.toArray();

      let bestMatch: { entry: KnowledgeEntry; score: number } | null = null;

      for (const entry of entries) {
        // Check question similarity
        const questionSimilarity = this.calculateSimilarity(
          question,
          entry.question,
        );

        // Check keyword matches
        const questionKeywords = this.extractKeywords(question);
        const keywordMatches = questionKeywords.filter((kw) =>
          entry.keywords.some((ek) => ek.includes(kw) || kw.includes(ek)),
        ).length;
        const keywordScore =
          keywordMatches / Math.max(questionKeywords.length, 1);

        // Combined score
        const score = questionSimilarity * 0.6 + keywordScore * 0.4;

        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { entry, score };
        }
      }

      if (bestMatch && bestMatch.score > 0.2) {
        console.log("[Offline AI] ✅ Found match with score:", bestMatch.score);
        return bestMatch.entry.answer;
      }

      console.log("[Offline AI] No good match found");
      return null;
    } catch (error) {
      console.error("[Offline AI] Search error:", error);
      return null;
    }
  }

  /**
   * Generate a response (with fallback if no match found)
   */
  async generateResponse(question: string): Promise<string> {
    const answer = await this.findAnswer(question);

    if (answer) {
      return answer;
    }

    // Fallback response
    return `I'm an offline AI assistant with limited knowledge. I couldn't find a specific answer to "${question}" in my local database. 

To get help with this question:
1. Check your internet connection to use the online AI
2. Try asking a different question
3. Check the knowledge base in the settings

Topics I know about:
- Biology (photosynthesis, respiration, etc.)
- Mathematics (Pythagorean theorem, etc.)
- Geography (capitals, water cycle, etc.)
- Study tips and learning strategies`;
  }

  /**
   * Add a custom knowledge entry
   */
  async addKnowledgeEntry(
    entry: Omit<KnowledgeEntry, "id" | "createdAt">,
  ): Promise<number> {
    const newEntry: KnowledgeEntry = {
      ...entry,
      createdAt: new Date(),
    };

    const id = await this.db.knowledgeBase.add(newEntry);
    await this.buildKnowledgeIndex();
    return id;
  }

  /**
   * Save a conversation
   */
  async saveConversation(
    userId: string,
    conversation: Omit<OfflineConversation, "id">,
  ): Promise<number> {
    return await this.db.conversations.add({
      ...conversation,
      id: undefined,
    } as OfflineConversation);
  }

  /**
   * Get user conversations
   */
  async getUserConversations(userId: string): Promise<OfflineConversation[]> {
    return await this.db.conversations.where("userId").equals(userId).toArray();
  }

  /**
   * Get download progress for models
   */
  async getModelMetadata(
    modelName: string,
  ): Promise<ModelMetadata | undefined> {
    return await this.db.models.get(modelName);
  }

  /**
   * Store model metadata
   */
  async saveModelMetadata(metadata: ModelMetadata): Promise<void> {
    await this.db.models.put(metadata);
  }

  /**
   * Get all downloaded models
   */
  async getDownloadedModels(): Promise<ModelMetadata[]> {
    return await this.db.models.toArray();
  }

  /**
   * Get offline statistics
   */
  async getStatistics(): Promise<{
    totalConversations: number;
    totalKnowledgeEntries: number;
    downloadedModels: number;
  }> {
    const conversations = await this.db.conversations.toArray();
    const entries = await this.db.knowledgeBase.toArray();
    const models = await this.db.models.toArray();

    return {
      totalConversations: conversations.length,
      totalKnowledgeEntries: entries.length,
      downloadedModels: models.length,
    };
  }
}

// Export singleton instance
export const offlineAIService = new OfflineAIService();

// Export convenience functions
export const initializeOfflineAI = () => offlineAIService.initialize();
export const askOfflineAI = (question: string) =>
  offlineAIService.generateResponse(question);
export const getOfflineStats = () => offlineAIService.getStatistics();
