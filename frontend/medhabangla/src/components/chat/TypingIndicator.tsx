import React from 'react';

interface TypingIndicatorProps {
    userName?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userName }) => {
    return (
        <div className="flex items-end gap-2 mb-4 animate-fadeIn">
            {/* Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                {userName?.[0] || '?'}
            </div>

            {/* Typing Bubble */}
            <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-sm px-5 py-3 shadow-sm border border-gray-200 dark:border-gray-600">
                <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
};

export default TypingIndicator;
