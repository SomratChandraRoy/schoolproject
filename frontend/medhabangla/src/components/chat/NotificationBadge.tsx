import React, { useEffect, useState } from 'react';

interface NotificationBadgeProps {
    count: number;
    maxCount?: number;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    size?: 'sm' | 'md' | 'lg';
    color?: 'blue' | 'red' | 'green' | 'yellow';
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
    count,
    maxCount = 99,
    position = 'top-right',
    size = 'md',
    color = 'blue'
}) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (count > 0) {
            setShow(true);
        } else {
            // Fade out animation
            const timeout = setTimeout(() => setShow(false), 300);
            return () => clearTimeout(timeout);
        }
    }, [count]);

    if (!show || count === 0) return null;

    const displayCount = count > maxCount ? `${maxCount}+` : count;

    const positionClasses = {
        'top-right': '-top-2 -right-2',
        'top-left': '-top-2 -left-2',
        'bottom-right': '-bottom-2 -right-2',
        'bottom-left': '-bottom-2 -left-2'
    };

    const sizeClasses = {
        'sm': 'min-w-[16px] h-4 text-[10px] px-1',
        'md': 'min-w-[20px] h-5 text-xs px-1.5',
        'lg': 'min-w-[24px] h-6 text-sm px-2'
    };

    const colorClasses = {
        'blue': 'bg-blue-500 text-white',
        'red': 'bg-red-500 text-white',
        'green': 'bg-green-500 text-white',
        'yellow': 'bg-yellow-500 text-gray-900'
    };

    return (
        <span
            className={`
                absolute ${positionClasses[position]} ${sizeClasses[size]} ${colorClasses[color]}
                inline-flex items-center justify-center
                font-bold rounded-full
                shadow-lg
                animate-notificationPop
                transition-all duration-300
            `}
        >
            {displayCount}
        </span>
    );
};

export default NotificationBadge;
