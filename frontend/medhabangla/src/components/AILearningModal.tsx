import React, { useEffect, useState } from 'react';

interface AILearningModalProps {
    isOpen: boolean;
    onClose: () => void;
    learningPlan: string;
    isLoading: boolean;
}

const AILearningModal: React.FC<AILearningModalProps> = ({
    isOpen,
    onClose,
    learningPlan,
    isLoading
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Clean markdown formatting from AI response
    const cleanText = (text: string): string => {
        return text
            .replace(/#{1,6}\s/g, '') // Remove # headers
            .replace(/\*\*(.+?)\*\*/g, '$1') // Remove ** bold
            .replace(/\*(.+?)\*/g, '$1') // Remove * italic
            .replace(/`(.+?)`/g, '$1') // Remove ` code
            .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove [text](link)
            .trim();
    };

    // Typing animation effect
    useEffect(() => {
        if (learningPlan && !isLoading) {
            setIsTyping(true);
            setDisplayedText('');

            const cleanedText = cleanText(learningPlan);
            let currentIndex = 0;

            const typingInterval = setInterval(() => {
                if (currentIndex < cleanedText.length) {
                    setDisplayedText(cleanedText.substring(0, currentIndex + 1));
                    currentIndex++;
                } else {
                    setIsTyping(false);
                    clearInterval(typingInterval);
                }
            }, 10); // Typing speed

            return () => clearInterval(typingInterval);
        }
    }, [learningPlan, isLoading]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">AI শিক্ষা সহায়ক</h2>
                            <p className="text-sm text-white/80">আপনার ব্যক্তিগত শিক্ষা পরিকল্পনা</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative w-20 h-20 mb-6">
                                <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                                AI আপনার শিক্ষা পরিকল্পনা তৈরি করছে...
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                অনুগ্রহ করে একটু অপেক্ষা করুন
                            </p>
                            <div className="flex gap-2 mt-4">
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* AI Avatar */}
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl rounded-tl-none p-6 shadow-sm border border-blue-100 dark:border-blue-800">
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
                                                {displayedText || learningPlan}
                                            </div>
                                            {isTyping && (
                                                <span className="inline-block w-2 h-5 bg-blue-600 ml-1 animate-pulse"></span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {!isLoading && learningPlan && (
                                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(cleanText(learningPlan));
                                            alert('শিক্ষা পরিকল্পনা কপি করা হয়েছে!');
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        কপি করুন
                                    </button>
                                    <button
                                        onClick={() => {
                                            const printWindow = window.open('', '_blank');
                                            if (printWindow) {
                                                printWindow.document.write(`
                          <html>
                            <head>
                              <title>শিক্ষা পরিকল্পনা</title>
                              <style>
                                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                                h1 { color: #2563eb; }
                                pre { white-space: pre-wrap; }
                              </style>
                            </head>
                            <body>
                              <h1>আপনার ব্যক্তিগত শিক্ষা পরিকল্পনা</h1>
                              <pre>${cleanText(learningPlan)}</pre>
                            </body>
                          </html>
                        `);
                                                printWindow.document.close();
                                                printWindow.print();
                                            }
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        প্রিন্ট করুন
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg transition-colors ml-auto"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        বুঝেছি, ধন্যবাদ!
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AILearningModal;
