import React from 'react';

interface QuizResultsLoadingProps {
    isVisible: boolean;
}

const QuizResultsLoading: React.FC<QuizResultsLoadingProps> = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 animate-fadeIn">
            <div className="text-center px-4">
                {/* Animated Icon */}
                <div className="relative w-32 h-32 mx-auto mb-8">
                    {/* Outer rotating ring */}
                    <div className="absolute inset-0 border-8 border-blue-200 dark:border-blue-900 rounded-full"></div>
                    <div className="absolute inset-0 border-8 border-blue-600 rounded-full border-t-transparent animate-spin"></div>

                    {/* Middle rotating ring */}
                    <div className="absolute inset-4 border-6 border-purple-200 dark:border-purple-900 rounded-full"></div>
                    <div className="absolute inset-4 border-6 border-purple-600 rounded-full border-t-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>

                    {/* Center icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Loading Text */}
                <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white animate-pulse">
                        আপনার ফলাফল প্রস্তুত করা হচ্ছে...
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        অনুগ্রহ করে একটু অপেক্ষা করুন
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mt-12 max-w-md mx-auto">
                    <div className="space-y-4">
                        {/* Step 1 */}
                        <div className="flex items-center gap-4 animate-slideInLeft">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">উত্তর যাচাই করা হচ্ছে</p>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                                    <div className="bg-green-500 h-2 rounded-full w-full"></div>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex items-center gap-4 animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                                <svg className="w-6 h-6 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">স্কোর গণনা করা হচ্ছে</p>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                                    <div className="bg-blue-500 h-2 rounded-full animate-progress"></div>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex items-center gap-4 animate-slideInLeft" style={{ animationDelay: '0.4s' }}>
                            <div className="flex-shrink-0 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center animate-pulse" style={{ animationDelay: '0.5s' }}>
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">AI বিশ্লেষণ করছে</p>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                                    <div className="bg-purple-500 h-2 rounded-full animate-progress" style={{ animationDelay: '0.5s' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Animated Dots */}
                <div className="flex justify-center gap-2 mt-8">
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>

                {/* Fun Facts */}
                <div className="mt-12 max-w-lg mx-auto">
                    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-200 dark:border-blue-800 animate-slideUp" style={{ animationDelay: '0.6s' }}>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    💡 <span className="font-bold">জানেন কি?</span> নিয়মিত কুইজ অনুশীলন করলে স্মৃতিশক্তি ৮০% পর্যন্ত বৃদ্ধি পায়!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizResultsLoading;
