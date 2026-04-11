/**
 * AI Voice Conversation Service
 * Handles voice recording, speech-to-text, text-to-speech, and conversation management
 */

interface VoiceMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  audioUrl?: string;
  timestamp: Date;
  type: "voice" | "text";
}

interface ConversationSummary {
  id: string;
  title: string;
  summary: string;
  keyTopics: string[];
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

class AIVoiceConversationService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private conversationHistory: VoiceMessage[] = [];
  private conversationId: string | null = null;
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("token");
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
      console.log("[Voice] Recording started");
    } catch (error) {
      console.error("[Voice] Error accessing microphone:", error);
      throw new Error("Microphone access denied");
    }
  }

  /**
   * Stop recording and get audio blob
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("No recording in progress"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/wav" });
        this.audioChunks = [];
        resolve(audioBlob);
        console.log("[Voice] Recording stopped");
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Convert audio blob to Base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Send voice message to AI backend
   */
  async sendVoiceMessage(audioBlob: Blob): Promise<VoiceMessage> {
    try {
      if (!this.token) throw new Error("Not authenticated");

      const audioBase64 = await this.blobToBase64(audioBlob);

      const response = await fetch("/api/ai/voice-conversation/", {
        method: "POST",
        headers: {
          Authorization: `Token ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_data: audioBase64,
          conversation_id: this.conversationId,
          mode: "teaching", // or "exam", "doubt-solving"
        }),
      });

      if (!response.ok) throw new Error("Failed to process voice message");

      const data = await response.json();

      const assistantMessage: VoiceMessage = {
        id: data.id,
        role: "assistant",
        text: data.transcript,
        audioUrl: data.audio_url,
        timestamp: new Date(data.timestamp),
        type: "voice",
      };

      // Store conversation ID for future messages
      if (!this.conversationId && data.conversation_id) {
        this.conversationId = data.conversation_id;
      }

      this.conversationHistory.push(assistantMessage);
      return assistantMessage;
    } catch (error) {
      console.error("[Voice] Error sending message:", error);
      throw error;
    }
  }

  /**
   * Send text message to AI (for typing instead of voice)
   */
  async sendTextMessage(text: string): Promise<VoiceMessage> {
    try {
      if (!this.token) throw new Error("Not authenticated");

      const response = await fetch("/api/ai/voice-conversation/", {
        method: "POST",
        headers: {
          Authorization: `Token ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          conversation_id: this.conversationId,
          mode: "teaching",
        }),
      });

      if (!response.ok) throw new Error("Failed to process message");

      const data = await response.json();

      const assistantMessage: VoiceMessage = {
        id: data.id,
        role: "assistant",
        text: data.response_text,
        audioUrl: data.audio_url,
        timestamp: new Date(data.timestamp),
        type: "voice",
      };

      if (!this.conversationId && data.conversation_id) {
        this.conversationId = data.conversation_id;
      }

      this.conversationHistory.push(assistantMessage);
      return assistantMessage;
    } catch (error) {
      console.error("[Voice] Error sending text:", error);
      throw error;
    }
  }

  /**
   * Play audio response
   */
  async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Failed to play audio"));
      audio.play().catch(reject);
    });
  }

  /**
   * Get past conversations
   */
  async getPastConversations(
    limit: number = 10,
  ): Promise<ConversationSummary[]> {
    try {
      if (!this.token) throw new Error("Not authenticated");

      const response = await fetch(
        `/api/ai/voice-conversations/?limit=${limit}`,
        {
          headers: {
            Authorization: `Token ${this.token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch conversations");

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("[Voice] Error fetching past conversations:", error);
      return [];
    }
  }

  /**
   * Load past conversation
   */
  async loadConversation(conversationId: string): Promise<VoiceMessage[]> {
    try {
      if (!this.token) throw new Error("Not authenticated");

      const response = await fetch(
        `/api/ai/voice-conversations/${conversationId}/`,
        {
          headers: {
            Authorization: `Token ${this.token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to load conversation");

      const data = await response.json();
      this.conversationId = conversationId;
      this.conversationHistory = data.messages || [];
      return this.conversationHistory;
    } catch (error) {
      console.error("[Voice] Error loading conversation:", error);
      return [];
    }
  }

  /**
   * Save conversation summary
   */
  async saveConversationSummary(title?: string): Promise<void> {
    try {
      if (!this.token || !this.conversationId) return;

      await fetch(
        `/api/ai/voice-conversations/${this.conversationId}/summary/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title || "Voice Conversation",
            messages: this.conversationHistory,
          }),
        },
      );

      console.log("[Voice] Conversation saved");
    } catch (error) {
      console.error("[Voice] Error saving conversation:", error);
    }
  }

  /**
   * Start exam mode
   */
  async startExamMode(subject: string, topic: string): Promise<void> {
    try {
      if (!this.token) throw new Error("Not authenticated");

      const response = await fetch("/api/ai/voice-conversation/exam/", {
        method: "POST",
        headers: {
          Authorization: `Token ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          topic,
        }),
      });

      if (!response.ok) throw new Error("Failed to start exam");

      const data = await response.json();
      this.conversationId = data.conversation_id;

      console.log("[Voice] Exam mode started");
    } catch (error) {
      console.error("[Voice] Error starting exam:", error);
      throw error;
    }
  }

  /**
   * Get current conversation history
   */
  getConversationHistory(): VoiceMessage[] {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    this.conversationId = null;
  }
}

export default new AIVoiceConversationService();
export type { VoiceMessage, ConversationSummary };
