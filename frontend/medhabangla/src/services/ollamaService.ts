// Ollama API Service
// AWS EC2-তে hosted Ollama ব্যবহার করার জন্য

// আপনার AWS instance-র public IP এখানে দিন
const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';

export interface OllamaMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface OllamaGenerateRequest {
    model: string;
    prompt: string;
    stream?: boolean;
    system?: string;
    temperature?: number;
    max_tokens?: number;
}

export interface OllamaChatRequest {
    model: string;
    messages: OllamaMessage[];
    stream?: boolean;
    temperature?: number;
}

export interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    eval_count?: number;
    eval_duration?: number;
}

export interface OllamaModel {
    name: string;
    modified_at: string;
    size: number;
    digest: string;
}

class OllamaService {
    private baseUrl: string;

    constructor(baseUrl: string = OLLAMA_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Simple text generation
     * সহজ text generate করার জন্য
     */
    async generate(
        prompt: string,
        model: string = 'llama3.2',
        options?: Partial<OllamaGenerateRequest>
    ): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    prompt,
                    stream: false,
                    ...options,
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const data: OllamaResponse = await response.json();
            return data.response;
        } catch (error) {
            console.error('Ollama generate error:', error);
            throw error;
        }
    }

    /**
     * Chat with conversation history
     * Conversation history সহ chat করার জন্য
     */
    async chat(
        messages: OllamaMessage[],
        model: string = 'llama3.2',
        options?: Partial<OllamaChatRequest>
    ): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages,
                    stream: false,
                    ...options,
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.message.content;
        } catch (error) {
            console.error('Ollama chat error:', error);
            throw error;
        }
    }

    /**
     * Streaming generation
     * Real-time streaming response-র জন্য
     */
    async *generateStream(
        prompt: string,
        model: string = 'llama3.2',
        options?: Partial<OllamaGenerateRequest>
    ): AsyncGenerator<string, void, unknown> {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    prompt,
                    stream: true,
                    ...options,
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const data = JSON.parse(line);
                            if (data.response) {
                                yield data.response;
                            }
                        } catch (e) {
                            console.error('Failed to parse line:', line);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Ollama stream error:', error);
            throw error;
        }
    }

    /**
     * Get list of available models
     * Available models-র list পাওয়ার জন্য
     */
    async listModels(): Promise<OllamaModel[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }
            const data = await response.json();
            return data.models || [];
        } catch (error) {
            console.error('Ollama list models error:', error);
            throw error;
        }
    }

    /**
     * Check if Ollama server is running
     * Server running আছে কিনা check করার জন্য
     */
    async isServerRunning(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: 'GET',
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Pull a model from Ollama library
     * নতুন model download করার জন্য
     */
    async pullModel(modelName: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/api/pull`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: modelName,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to pull model: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Ollama pull model error:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const ollamaService = new OllamaService();

// Export helper functions
export const askOllama = (prompt: string, model?: string) =>
    ollamaService.generate(prompt, model);

export const chatWithOllama = (messages: OllamaMessage[], model?: string) =>
    ollamaService.chat(messages, model);

export const streamOllama = (prompt: string, model?: string) =>
    ollamaService.generateStream(prompt, model);

export const getAvailableModels = () =>
    ollamaService.listModels();

export const checkOllamaServer = () =>
    ollamaService.isServerRunning();
