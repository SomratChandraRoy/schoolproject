import React from 'react';

interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture: string | null;
}

interface Message {
    id: number;
    sender: User;
    message_type: string;
    content: string;
    file_url: string | null;
    file_name: string | null;
    is_read: boolean;
    created_at: string;
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    tempId?: number;
}

interface ChatMessageProps {
    message: Message;
    isOwn: boolean;
    showAvatar: boolean;
    onRetry?: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwn, showAvatar, onRetry }) => {
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusIcon = () => {
        if (!isOwn || !message.status) return null;

        switch (message.status) {
            case 'sending':
                return <span className="text-xs ml-1 opacity-70">⏱️</span>;
            case 'sent':
                return <span className="text-xs ml-1 opacity-70">✓</span>;
            case 'delivered':
                return <span className="text-xs ml-1 opacity-70">✓✓</span>;
            case 'read':
                return <span className="text-xs ml-1 text-blue-300">✓✓</span>;
            case 'failed':
                return (
                    <button
                        onClick={onRetry}
                        className="text-xs ml-1 text-red-300 hover:text-red-200"
                        title="Tap to retry"
                    >
                        ⚠️
                    </button>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`flex items-end gap-2 mb-4 animate-fadeIn ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            {showAvatar && !isOwn && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                    {message.sender.first_name?.[0] || message.sender.username[0]}
                </div>
            )}

            {/* Message Bubble */}
            <div className={`group relative max-w-xs lg:max-w-md ${isOwn ? 'ml-auto' : 'mr-auto'}`}>
                {/* Message Content */}
                <div className={`relative rounded-2xl px-4 py-2 shadow-sm ${isOwn
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm border border-gray-200 dark:border-gray-600'
                    }`}>
                    {/* Sender Name (for received messages) */}
                    {!isOwn && (
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                            {message.sender.first_name} {message.sender.last_name}
                        </p>
                    )}

                    {/* Message Text */}
                    <p className="break-words whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                    </p>

                    {/* Time and Status */}
                    <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                        <span className="text-xs opacity-75">
                            {formatTime(message.created_at)}
                        </span>
                        {getStatusIcon()}
                    </div>
                </div>

                {/* Hover Actions */}
                <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-2 py-1">
                    <button className="text-gray-600 dark:text-gray-300 hover:text-blue-500 text-sm" title="Reply">
                        ↩️
                    </button>
                    <button className="text-gray-600 dark:text-gray-300 hover:text-yellow-500 text-sm" title="React">
                        😊
                    </button>
                    <button className="text-gray-600 dark:text-gray-300 hover:text-red-500 text-sm" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>

            {/* Spacer for own messages */}
            {showAvatar && isOwn && <div className="w-8"></div>}
        </div>
    );
};

export default ChatMessage;
