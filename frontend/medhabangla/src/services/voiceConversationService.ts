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
  private speechRecognition: any | null = null;
  private latestTranscript: string = "";
  private audioChunks: Blob[] = [];
  private conversationHistory: VoiceMessage[] = [];
  private conversationId: string | null = null;
  private activeMode: "tutor" | "exam" | "quiz" | "general" = "tutor";

  private async fetchWithTimeout(
    input: RequestInfo | URL,
    init: RequestInit = {},
    timeoutMs: number = 20000,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  private getToken(): string {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not authenticated");
    return token;
  }

  private async ensureConversation(
    mode: "tutor" | "exam" | "quiz" | "general" = "tutor",
  ): Promise<string> {
    if (this.conversationId && this.activeMode === mode)
      return this.conversationId;

    if (this.conversationId && this.activeMode !== mode) {
      this.conversationId = null;
    }

    const token = this.getToken();
    const response = await this.fetchWithTimeout(
      "/api/ai/voice-conversation/start/",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode }),
      },
    );

    if (!response.ok) throw new Error("Failed to start voice conversation");

    const data = await response.json();
    this.conversationId = data.session_id;
    this.activeMode = mode;
    return this.conversationId;
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    try {
      this.latestTranscript = "";
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.lang = "bn-BD";
        this.speechRecognition.interimResults = true;
        this.speechRecognition.continuous = false;
        this.speechRecognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((r: any) => r?.[0]?.transcript || "")
            .join(" ")
            .trim();
          this.latestTranscript = transcript;
        };
        this.speechRecognition.start();
        console.log("[Voice] Speech recognition started");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };
      this.mediaRecorder.start();
      console.log("[Voice] Media recording started");
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
      if (this.speechRecognition) {
        let settled = false;
        const resolveOnce = () => {
          if (settled) return;
          settled = true;
          const transcriptBlob = new Blob([this.latestTranscript], {
            type: "text/plain",
          });
          this.speechRecognition = null;
          resolve(transcriptBlob);
        };

        this.speechRecognition.onend = resolveOnce;
        this.speechRecognition.onerror = resolveOnce;

        try {
          this.speechRecognition.stop();
        } catch {
          resolveOnce();
        }

        // Some browsers can miss onend; hard-stop the pending state.
        setTimeout(resolveOnce, 1200);
        return;
      }

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
  async sendVoiceMessage(
    audioBlob: Blob,
    mode: "tutor" | "exam" | "quiz" | "general" = "tutor",
  ): Promise<VoiceMessage> {
    try {
      const token = this.getToken();
      const sessionId = await this.ensureConversation(mode);

      let transcript = this.latestTranscript?.trim() || "";
      if (!transcript) {
        try {
          transcript = (await audioBlob.text()).trim();
        } catch {
          transcript = "";
        }
      }

      if (!transcript) {
        throw new Error("Could not detect speech. Please try again.");
      }

      const response = await this.fetchWithTimeout(
        "/api/ai/voice-conversation/message/",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: sessionId,
            transcript,
            message_text: transcript,
          }),
        },
        25000,
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to process voice message");

      const backendMessage = data.message || {};
      const responseText =
        backendMessage.message_text ||
        backendMessage.ai_response ||
        "No response";

      const assistantMessage: VoiceMessage = {
        id: backendMessage.id || Date.now().toString(),
        role: "assistant",
        text: responseText,
        audioUrl: undefined,
        timestamp: new Date(),
        type: "voice",
      };

      // Store conversation ID for future messages
      if (!this.conversationId && data.session_id) {
        this.conversationId = data.session_id;
      }

      this.conversationHistory.push(assistantMessage);
      this.latestTranscript = "";
      return assistantMessage;
    } catch (error) {
      console.error("[Voice] Error sending message:", error);
      throw error;
    }
  }

  /**
   * Send text message to AI (for typing instead of voice)
   */
  async sendTextMessage(
    text: string,
    mode: "tutor" | "exam" | "quiz" | "general" = "tutor",
  ): Promise<VoiceMessage> {
    try {
      const token = this.getToken();
      const sessionId = await this.ensureConversation(mode);

      const response = await this.fetchWithTimeout(
        "/api/ai/voice-conversation/message/",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: sessionId,
            message_text: text,
          }),
        },
        25000,
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to process message");

      const backendMessage = data.message || {};

      const assistantMessage: VoiceMessage = {
        id: backendMessage.id || Date.now().toString(),
        role: "assistant",
        text:
          backendMessage.message_text ||
          backendMessage.ai_response ||
          "No response",
        audioUrl: undefined,
        timestamp: new Date(),
        type: "voice",
      };

      if (!this.conversationId && data.session_id) {
        this.conversationId = data.session_id;
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
      const token = this.getToken();

      const response = await fetch(
        `/api/ai/voice-conversation/history/?limit=${limit}`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch conversations");

      const data = await response.json();
      if (!Array.isArray(data)) return [];
      return data.map((session: any) => ({
        id: session.session_id,
        title: `${session.mode || "tutor"} - ${session.subject || "General"}`,
        summary: session.conversation_summary || "",
        keyTopics: Array.isArray(session.key_points) ? session.key_points : [],
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at || session.created_at),
        messageCount: session.total_questions_asked || 0,
      }));
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
      const token = this.getToken();

      const response = await fetch(
        `/api/ai/voice-conversation/${conversationId}/`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to load conversation");

      const data = await response.json();
      this.conversationId = conversationId;

      const backendMessages = data.messages || [];
      this.conversationHistory = backendMessages.map((m: any) => ({
        id: m.id?.toString?.() || Date.now().toString(),
        role: m.is_user_message ? "user" : "assistant",
        text: m.message_text || m.ai_response || "",
        timestamp: new Date(m.timestamp || Date.now()),
        type: "text",
      }));
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
      if (!this.conversationId) return;
      const token = this.getToken();

      await fetch(`/api/ai/voice-conversation/end/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: this.conversationId,
          title: title || "Voice Conversation",
        }),
      });

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
      const token = this.getToken();

      const response = await fetch("/api/ai/voice-conversation/start/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "exam",
          subject,
          topic,
        }),
      });

      if (!response.ok) throw new Error("Failed to start exam");

      const data = await response.json();
      this.conversationId = data.session_id;

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
    this.activeMode = "tutor";
  }
}

export default new AIVoiceConversationService();
export type { VoiceMessage, ConversationSummary };
