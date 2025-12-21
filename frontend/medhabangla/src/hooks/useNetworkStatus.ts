/**
 * Custom hook to monitor network status
 * Provides online/offline status and connection quality
 */

import { useState, useEffect } from 'react';

interface NetworkStatus {
    isOnline: boolean;
    effectiveType: string | null;
    downlink: number | null;
    rtt: number | null;
    saveData: boolean;
}

export function useNetworkStatus(): NetworkStatus {
    const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
        isOnline: navigator.onLine,
        effectiveType: null,
        downlink: null,
        rtt: null,
        saveData: false
    });

    useEffect(() => {
        // Update network status
        const updateNetworkStatus = () => {
            const connection = (navigator as any).connection ||
                (navigator as any).mozConnection ||
                (navigator as any).webkitConnection;

            setNetworkStatus({
                isOnline: navigator.onLine,
                effectiveType: connection?.effectiveType || null,
                downlink: connection?.downlink || null,
                rtt: connection?.rtt || null,
                saveData: connection?.saveData || false
            });
        };

        // Initial update
        updateNetworkStatus();

        // Listen for online/offline events
        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);

        // Listen for connection changes
        const connection = (navigator as any).connection ||
            (navigator as any).mozConnection ||
            (navigator as any).webkitConnection;

        if (connection) {
            connection.addEventListener('change', updateNetworkStatus);
        }

        // Cleanup
        return () => {
            window.removeEventListener('online', updateNetworkStatus);
            window.removeEventListener('offline', updateNetworkStatus);

            if (connection) {
                connection.removeEventListener('change', updateNetworkStatus);
            }
        };
    }, []);

    return networkStatus;
}

/**
 * Hook to detect if user is on a slow connection
 */
export function useSlowConnection(): boolean {
    const { effectiveType, downlink } = useNetworkStatus();

    // Consider connection slow if:
    // - Effective type is 'slow-2g' or '2g'
    // - Downlink is less than 1 Mbps
    return effectiveType === 'slow-2g' ||
        effectiveType === '2g' ||
        (downlink !== null && downlink < 1);
}

/**
 * Hook to get connection quality
 */
export function useConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'offline' {
    const { isOnline, effectiveType, downlink } = useNetworkStatus();

    if (!isOnline) return 'offline';

    if (effectiveType === '4g' || (downlink !== null && downlink > 10)) {
        return 'excellent';
    }

    if (effectiveType === '3g' || (downlink !== null && downlink > 5)) {
        return 'good';
    }

    if (effectiveType === '2g' || (downlink !== null && downlink > 1)) {
        return 'fair';
    }

    return 'poor';
}
