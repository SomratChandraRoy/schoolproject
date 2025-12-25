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
    content: string;
    created_at: string;
}

interface ChatRoom {
    id: number;
    other_participant: User;
    last_message: Message | null;
    unread_count: number;
    updated_at: string;
}

interface ChatRoomItemProps {
    room: ChatRoom;
    isSelected: boolean;
    onClick: () => void;
}

const ChatRoomItem: React.FC<ChatRoomItemProps> = ({ room, isSelected, onClick }) => {
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 p-4 cursor-pointer transition-all duration-200 border-b border-gray-100 dark:border-gray-700 ${isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
        >
            {/* Avatar with Online Status */}
            <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg shadow-md">
                    {room.other_participant.first_name?.[0] || room.other_participant.username[0]}
                </div>
                {/* Online indicator (you can add online status logic) */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-semibold truncate ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                        }`}>
                        {room.other_participant.first_name} {room.other_participant.last_name}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                        {room.last_message && formatTime(room.last_message.created_at)}
                    </span>
                </div>

                <div className="flex justify-between items-center">
                    <p className={`text-sm truncate ${room.unread_count > 0
                            ? 'font-medium text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                        {room.last_message?.content || 'No messages yet'}
                    </p>

                    {/* Unread Badge */}
                    {room.unread_count > 0 && (
                        <div className="ml-2 flex-shrink-0">
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-blue-500 text-white text-xs font-bold rounded-full animate-pulse">
                                {room.unread_count > 99 ? '99+' : room.unread_count}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatRoomItem;
