import * as React from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

function Ollama() {
    const [input, setInput] = React.useState('');
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [serverStatus, setServerStatus] = React.useState<'checking' | 'online' | 'offline'>('checking');
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    // আপনার AWS configuration
    const AWS_BASE_URL = "http://51.21.208.44";
    const username = "bipul";
    const password = "Bipul$Ollama$Roy$2026$";
    const basicAuth = 'Basic ' + btoa(username + ":" + password);

    // Auto-scroll to bottom
    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Check server status on mount
    React.useEffect(() => {
        checkServerStatus();
    }, []);

    const checkServerStatus = async () => {
        setServerStatus('checking');
        try {
            const response = await fetch(`${AWS_BASE_URL}/api/tags`, {
                method: 'GET',
                headers: {
                    'Authorization': basicAuth
                }
            });

            if (response.ok) {
                setServerStatus('online');
                console.log('✅ Ollama server is online');
            } else {
                setServerStatus('offline');
                console.error('❌ Server responded with status:', response.status);
            }
        } catch (error) {
            setServerStatus('offline');
            console.error('❌ Cannot connect to server:', error);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch(`${AWS_BASE_URL}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': basicAuth
                },
                body: JSON.stringify({
                    model: "llama3",
                    prompt: userMessage.content,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server Error:", response.status, errorText);

                const errorMessage: Message = {
                    role: 'assistant',
                    content: `❌ Error: ${response.status} - ${errorText || 'Server error'}`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
                return;
            }

            const data = await response.json();
            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response || 'No response from AI',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Connection Error:", error);
            const errorMessage: Message = {
                role: 'assistant',
                content: `❌ Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearChat = () => {
        setMessages([]);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                                🦙 Ollama AI Chat
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                AWS EC2-তে hosted Ollama (IP: 16.171.19.161)
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${serverStatus === 'online'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : serverStatus === 'offline'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                }`}>
                                {serverStatus === 'online' && '● Online'}
                                {serverStatus === 'offline' && '● Offline'}
                                {serverStatus === 'checking' && '● Checking...'}
                            </div>
                            <button
                                onClick={checkServerStatus}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Refresh status"
                            >
                                🔄
                            </button>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <div className="text-2xl">ℹ️</div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                                    Server Information
                                </h3>
                                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                    <li>• Model: llama3</li>
                                    <li>• Authentication: Basic Auth (Username: {username})</li>
                                    <li>• Server: {AWS_BASE_URL}</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={clearChat}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            Clear Chat
                        </button>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 min-h-[400px] max-h-[600px] overflow-y-auto">
                    {messages.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                            <div className="text-6xl mb-4">💬</div>
                            <p className="text-lg">কোনো message নেই</p>
                            <p className="text-sm mt-2">নিচে একটি message লিখে শুরু করুন</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg px-4 py-3 ${message.role === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                            }`}
                                    >
                                        <div className="text-xs font-semibold mb-1 opacity-75">
                                            {message.role === 'user' ? 'You' : 'Ollama AI'}
                                        </div>
                                        <div className="whitespace-pre-wrap break-words">
                                            {message.content}
                                        </div>
                                        <div className="text-xs opacity-50 mt-1">
                                            {message.timestamp.toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white"></div>
                                            <span className="text-gray-900 dark:text-white">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                    <div className="flex space-x-4">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="আপনার message লিখুন... (Enter to send, Shift+Enter for new line)"
                            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={3}
                            disabled={loading || serverStatus === 'offline'}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim() || serverStatus === 'offline'}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Sending...</span>
                                </div>
                            ) : (
                                'Send'
                            )}
                        </button>
                    </div>
                </div>

                {/* Offline Warning */}
                {serverStatus === 'offline' && (
                    <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">
                            ⚠️ Ollama Server Offline
                        </h3>
                        <p className="text-red-700 dark:text-red-300 mb-4">
                            Ollama server-এ connect করতে পারছি না। নিশ্চিত করুন:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-red-700 dark:text-red-300 text-sm">
                            <li>AWS EC2 instance চালু আছে</li>
                            <li>Ollama service running আছে</li>
                            <li>Nginx running আছে (port 80)</li>
                            <li>Security Group-এ port 80 open আছে</li>
                            <li>Basic Auth credentials সঠিক আছে</li>
                        </ol>
                        <div className="mt-4">
                            <button
                                onClick={checkServerStatus}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Retry Connection
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Ollama;
