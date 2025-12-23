import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPluginRegistration } from '@embedpdf/core';
import { EmbedPDF } from '@embedpdf/core/react';
import { usePdfiumEngine } from '@embedpdf/engines/react';
import { Viewport, ViewportPluginPackage } from '@embedpdf/plugin-viewport/react';
import { Scroller, ScrollPluginPackage } from '@embedpdf/plugin-scroll/react';
import {
    DocumentContent,
    DocumentManagerPluginPackage,
} from '@embedpdf/plugin-document-manager/react';
import { RenderLayer, RenderPluginPackage } from '@embedpdf/plugin-render/react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface EnhancedPDFViewerProps {
    fileUrl: string;
    fileName: string;
    bookId: number;
    onClose: () => void;
}

const EnhancedPDFViewer: React.FC<EnhancedPDFViewerProps> = ({
    fileUrl,
    fileName,
    bookId,
    onClose
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [pdfAnalyzed, setPdfAnalyzed] = useState(false);
    const [showChat, setShowChat] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Initialize PDF engine
    const { engine, isLoading: engineLoading } = usePdfiumEngine();

    // Register plugins for PDF viewer - memoized to prevent re-creation
    const plugins = useMemo(() => [
        createPluginRegistration(DocumentManagerPluginPackage, {
            initialDocuments: [{ url: fileUrl }],
        }),
        createPluginRegistration(ViewportPluginPackage),
        createPluginRegistration(ScrollPluginPackage),
        createPluginRegistration(RenderPluginPackage),
    ], [fileUrl]);

    // Detect mobile/tablet screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth < 768) {
                setShowChat(false); // Hide chat by default on mobile
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Analyze PDF on mount - only once
    useEffect(() => {
        analyzePDF();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const analyzePDF = async () => {
        setIsAnalyzing(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/ai/analyze-pdf/', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pdf_url: fileUrl,
                    book_id: bookId,
                    file_name: fileName
                })
            });

            if (response.ok) {
                setPdfAnalyzed(true);

                // Add welcome message
                const welcomeMessage: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `আমি "${fileName}" বইটি বিশ্লেষণ করেছি। আপনি এই বই সম্পর্কে যেকোনো প্রশ্ন করতে পারেন। আমি বইয়ের বিষয়বস্তু, ধারণা, এবং বিস্তারিত ব্যাখ্যা দিতে পারব।\n\nI have analyzed the book "${fileName}". You can ask me any questions about this book. I can explain concepts, summarize sections, and provide detailed explanations.`,
                    timestamp: new Date()
                };
                setMessages([welcomeMessage]);
            } else {
                setError('Failed to analyze PDF. You can still read the book.');
            }
        } catch (err) {
            console.error('Error analyzing PDF:', err);
            setError('Error analyzing PDF. You can still read the book.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || isSending) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsSending(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/ai/chat-with-pdf/', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: inputMessage,
                    book_id: bookId,
                    pdf_url: fileUrl,
                    file_name: fileName
                })
            });

            if (response.ok) {
                const data = await response.json();
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.answer || data.response || 'দুঃখিত, আমি উত্তর দিতে পারিনি।',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: 'দুঃখিত, একটি ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।\nSorry, an error occurred. Please try again.',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (err) {
            console.error('Error sending message:', err);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'নেটওয়ার্ক ত্রুটি। অনুগ্রহ করে আবার চেষ্টা করুন।\nNetwork error. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Responsive layout classes - memoized to prevent re-calculation
    const layoutClasses = useMemo(() => {
        if (isMobile) {
            return {
                container: 'flex-col',
                pdfSection: showChat ? 'h-1/2' : 'h-full',
                chatSection: 'h-1/2 border-t',
            };
        }
        return {
            container: 'flex-row',
            pdfSection: showChat ? 'w-full md:w-2/3 lg:w-2/3' : 'w-full',
            chatSection: 'w-full md:w-1/3 lg:w-1/3 border-l',
        };
    }, [isMobile, showChat]);

    if (engineLoading || !engine) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        <p className="text-gray-900 dark:text-white">Loading PDF Engine...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-[98vw] sm:max-w-[95vw] max-h-[98vh] sm:max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                        <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-white truncate">
                            📚 {fileName}
                        </h3>
                        {isAnalyzing && (
                            <span className="hidden sm:flex text-sm text-blue-600 dark:text-blue-400 items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                                Analyzing...
                            </span>
                        )}
                        {pdfAnalyzed && (
                            <span className="text-xs sm:text-sm text-green-600 dark:text-green-400 flex items-center">
                                ✓ AI Ready
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                        >
                            {showChat ? (isMobile ? '📖' : '📖 Hide Chat') : (isMobile ? '💬' : '💬 AI Chat')}
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 p-1"
                        >
                            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className={`flex-1 flex ${layoutClasses.container} overflow-hidden`}>
                    {/* PDF Viewer - EmbedPDF */}
                    <div className={`${layoutClasses.pdfSection} transition-all duration-300`}>
                        <EmbedPDF engine={engine} plugins={plugins}>
                            {({ activeDocumentId }) =>
                                activeDocumentId && (
                                    <DocumentContent documentId={activeDocumentId}>
                                        {({ isLoaded, isLoading, isError }) => (
                                            <div className="w-full h-full flex items-center justify-center">
                                                {isLoading && (
                                                    <div className="flex flex-col items-center space-y-4">
                                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                                                        <p className="text-gray-600 dark:text-gray-400">Loading PDF...</p>
                                                    </div>
                                                )}
                                                {isError && (
                                                    <div className="text-center p-4">
                                                        <p className="text-red-600 dark:text-red-400">Failed to load PDF</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                            Please check the file URL and try again
                                                        </p>
                                                    </div>
                                                )}
                                                {isLoaded && (
                                                    <Viewport
                                                        documentId={activeDocumentId}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            backgroundColor: '#f1f3f5',
                                                        }}
                                                    >
                                                        <Scroller
                                                            documentId={activeDocumentId}
                                                            renderPage={({ width, height, pageIndex }) => (
                                                                <div
                                                                    style={{
                                                                        width,
                                                                        height,
                                                                        marginBottom: '16px',
                                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                                    }}
                                                                >
                                                                    <RenderLayer
                                                                        documentId={activeDocumentId}
                                                                        pageIndex={pageIndex}
                                                                    />
                                                                </div>
                                                            )}
                                                        />
                                                    </Viewport>
                                                )}
                                            </div>
                                        )}
                                    </DocumentContent>
                                )
                            }
                        </EmbedPDF>
                    </div>

                    {/* AI Chat Panel */}
                    {showChat && (
                        <div className={`${layoutClasses.chatSection} border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-900`}>
                            {/* Chat Header */}
                            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                                    <span className="text-lg sm:text-xl mr-2">🤖</span>
                                    AI Learning Assistant
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">
                                    Ask me anything about this book
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mx-3 sm:mx-4 mt-3 sm:mt-4 p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
                                </div>
                            )}

                            {/* Messages Area */}
                            <div
                                ref={chatContainerRef}
                                className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4"
                            >
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[90%] sm:max-w-[85%] rounded-lg px-3 sm:px-4 py-2 ${message.role === 'user'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                                                }`}
                                        >
                                            <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                            <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                                                }`}>
                                                {message.timestamp.toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {isSending && (
                                    <div className="flex justify-start">
                                        <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg px-3 sm:px-4 py-2">
                                            <div className="flex items-center space-x-2">
                                                <div className="animate-bounce">●</div>
                                                <div className="animate-bounce delay-100">●</div>
                                                <div className="animate-bounce delay-200">●</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <div className="flex space-x-2">
                                    <textarea
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask a question..."
                                        disabled={isSending || isAnalyzing}
                                        rows={isMobile ? 1 : 2}
                                        className="flex-1 px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none text-xs sm:text-sm"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!inputMessage.trim() || isSending || isAnalyzing}
                                        className="px-3 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors self-end"
                                    >
                                        {isSending ? (
                                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-b-2 border-white"></div>
                                        ) : (
                                            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 hidden sm:block">
                                    💡 Tip: Ask about concepts, summaries, or explanations
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EnhancedPDFViewer;
