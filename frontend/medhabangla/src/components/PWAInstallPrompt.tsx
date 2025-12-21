/**
 * PWA Install Prompt Component
 * Shows a prompt to install the app when available
 */

import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Show prompt after a delay (don't be too aggressive)
            setTimeout(() => {
                const dismissed = localStorage.getItem('pwa-install-dismissed');
                if (!dismissed) {
                    setShowPrompt(true);
                }
            }, 5000); // Show after 5 seconds
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user's response
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // Clear the deferred prompt
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Remember dismissal for 7 days
        const dismissedUntil = new Date();
        dismissedUntil.setDate(dismissedUntil.getDate() + 7);
        localStorage.setItem('pwa-install-dismissed', dismissedUntil.toISOString());
    };

    if (isInstalled || !showPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start gap-3">
                    {/* App Icon */}
                    <div className="flex-shrink-0">
                        <img
                            src="/icon-192.png"
                            alt="MedhaBangla"
                            className="w-12 h-12 rounded-lg"
                        />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            Install MedhaBangla
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            Install our app for a better experience with offline access, faster loading, and more!
                        </p>

                        {/* Features */}
                        <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-3">
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Works offline</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Faster loading</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Home screen access</span>
                            </li>
                        </ul>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleInstallClick}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                Install
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                            >
                                Not now
                            </button>
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
