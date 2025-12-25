import React from 'react';

const MessageSkeleton: React.FC = () => {
    return (
        <div className="flex items-end gap-2 mb-4 animate-pulse">
            {/* Avatar Skeleton */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>

            {/* Message Skeleton */}
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-bl-sm px-4 py-3 max-w-xs space-y-2">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-16 mt-2"></div>
            </div>
        </div>
    );
};

export default MessageSkeleton;
