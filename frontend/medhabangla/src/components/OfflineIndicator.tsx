/**
 * Offline Indicator Component
 * Shows a banner when the user is offline
 */

import React, { useState, useEffect } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { getDatabaseStats, syncAllData } from '../utils/db';

const OfflineIndicator: React.FC = () => {
    const { isOnline } = useNetworkStatus();
    const [showBanner, setShowBanner] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [unsyncedCount, setUnsyncedCount] = useState(0);

    useEffect(() => {
        // Update unsynced count
        const updateUnsyncedCount = async () => {
            try {
                const stats = await getDatabaseStats();
                const total = stats.notes.unsynced +
                    stats.quizzes.unsyncedAttempts +
                    stats.studySessions.unsynced +
                    stats.books.unsyncedBookmarks;
                setUnsyncedCount(total);
            } catch (error) {
                console.error('Error updating unsynced count:', error);
                setUnsyncedCount(0);
            }
        };

        updateUnsyncedCount();
        const interval = setInterval(updateUnsyncedCount, 10000); // Update every 10 seconds

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!isOnline) {
            setShowBanner(true);
            setWasOffline(true);
        } else if (wasOffline) {
            // Show "back online" message briefly
            setShowBanner(true);
            setTimeout(() => {
                setShowBanner(false);
                setWasOffline(false);
            }, 3000);
        }
    }, [isOnline, wasOffline]);

    const handleSync = async () => {
        const token = localStorage.getItem('token');
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

        if (!token) {
            alert('Please login to sync data');
            return;
        }

        setIsSyncing(true);
        try {
            const result = await syncAllData(apiBaseUrl, token);

            if (result.success) {
                alert(`Successfully synced ${result.synced.notes + result.synced.quizAttempts + result.synced.studySessions + result.synced.bookmarks} items!`);
                setUnsyncedCount(0);
            } else {
                alert(`Sync completed with errors:\n${result.errors.join('\n')}`);
            }
        } catch (error) {
            alert(`Sync failed: ${error}`);
        } finally {
            setIsSyncing(false);
        }
    };

    if (!showBanner) {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
            {!isOnline ? (
                // Offline banner
                <div className="bg-yellow-500 text-white px-4 py-3 shadow-lg">
                    <div className="container mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                            </svg>
                            <div>
                                <p className="font-semibold">You're offline</p>
                                <p className="text-sm">Don't worry! You can still use the app. Your data will sync when you're back online.</p>
                            </div>
                        </div>
                        {unsyncedCount > 0 && (
                            <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                                {unsyncedCount} unsynced
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Back online banner
                <div className="bg-green-500 text-white px-4 py-3 shadow-lg">
                    <div className="container mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-semibold">You're back online!</p>
                                {unsyncedCount > 0 && (
                                    <p className="text-sm">You have {unsyncedCount} items to sync.</p>
                                )}
                            </div>
                        </div>
                        {unsyncedCount > 0 && (
                            <button
                                onClick={handleSync}
                                disabled={isSyncing}
                                className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSyncing ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Syncing...
                                    </span>
                                ) : (
                                    'Sync Now'
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfflineIndicator;
