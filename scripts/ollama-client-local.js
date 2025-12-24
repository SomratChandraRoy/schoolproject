/**
 * Ollama Client for Local Computer (Node.js)
 * আপনার local computer থেকে AWS Ollama ব্যবহার করার জন্য
 */

const axios = require('axios');

class OllamaClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.apiUrl = `${this.baseUrl}/api`;
    }

    /**
     * Server connection check করুন
     */
    async checkConnection() {
        try {
            const response = await axios.get(`${this.apiUrl}/tags`, { timeout: 5000 });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    /**
     * Available models-র list পান
     */
    async listModels() {
        try {
            const response = await axios.get(`${this.apiUrl}/tags`);
            return response.data.models.map(model => model.name);
        } catch (error) {
            console.error('Error:', error.message);
            return [];
        }
    }

    /**
     * Text generate করুন
     */
    async generate(prompt, model = 'llama3.2', options = {}) {
        try {
            const response = await axios.post(
                `${this.apiUrl}/generate`,
                {
                    model: model,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: options.temperature || 0.7
                    }
                },
                { timeout: 300000 } // 5 minutes
            );

            return response.data.response;
        } catch (error) {
            throw new Error(`Generation failed: ${error.message}`);
        }
    }

    /**
     * Chat with conversation history
     */
    async chat(messages, model = 'llama3.2') {
        try {
            const response = await axios.post(
                `${this.apiUrl}/chat`,
                {
                    model: model,
                    messages: messages,
                    stream: false
                },
                { timeout: 300000 }
            );

            return response.data.message.content;
        } catch (error) {
            throw new Error(`Chat failed: ${error.message}`);
        }
    }

    /**
     * Streaming generation
     */
    async *generateStream(prompt, model = 'llama3.2') {
        try {
            const response = await axios.post(
                `${this.apiUrl}/generate`,
                {
                    model: model,
                    prompt: prompt,
                    stream: true
                },
                {
                    responseType: 'stream',
                    timeout: 300000
                }
            );

            let buffer = '';

            for await (const chunk of response.data) {
                buffer += chunk.toString();
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
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } catch (error) {
            throw new Error(`Streaming failed: ${error.message}`);
        }
    }
}

// Example usage
async function main() {
    // আপনার Ollama server-র URL দিন
    const OLLAMA_URL = 'http://54.123.45.67'; // আপনার EC2 IP দিন

    // Client initialize করুন
    const client = new OllamaClient(OLLAMA_URL);

    // Connection test করুন
    console.log('🔍 Testing connection...');
    const isConnected = await client.checkConnection();

    if (isConnected) {
        console.log('✅ Connected to Ollama server!');
    } else {
        console.log('❌ Cannot connect to Ollama server');
        process.exit(1);
    }

    // Available models দেখুন
    console.log('\n📋 Available models:');
    const models = await client.listModels();
    models.forEach(model => console.log(`  - ${model}`));

    // Simple generation test
    console.log('\n💬 Testing text generation...');
    const response = await client.generate(
        'What is the capital of Bangladesh?',
        'llama3.2'
    );
    console.log(`Response: ${response}`);

    // Chat test
    console.log('\n💬 Testing chat...');
    const messages = [
        { role: 'user', content: 'What is JavaScript?' },
        { role: 'assistant', content: 'JavaScript is a programming language.' },
        { role: 'user', content: 'What can I do with it?' }
    ];
    const chatResponse = await client.chat(messages, 'llama3.2');
    console.log(`Response: ${chatResponse}`);

    // Streaming test
    console.log('\n💬 Testing streaming...');
    process.stdout.write('Response: ');
    for await (const chunk of client.generateStream('Count from 1 to 5', 'llama3.2')) {
        process.stdout.write(chunk);
    }
    console.log('\n');

    console.log('✅ All tests completed!');
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = OllamaClient;
