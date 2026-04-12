import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface PremiumLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const PremiumLoginModal: React.FC<PremiumLoginModalProps> = ({
    isOpen,
    onClose,
    message = "Please sign in to continue",
}) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const handleGoogleLogin = async () => {
        try {
            setError(null);
            setLoading(true);

            const response = await fetch(
                `${API_BASE_URL}/api/accounts/workos-auth-url/`,
            );

            if (!response.ok) {
                throw new Error("Failed to get authorization URL from server");
            }

            const data = await response.json();

            if (!data.authorization_url) {
                throw new Error("No authorization URL received from server");
            }

            window.location.href = data.authorization_url;
        } catch (error) {
            console.error("Google login error:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to initiate Google login. Please try again.",
            );
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Glassmorphism backdrop with blur */}
            <div
                className="absolute inset-0 backdrop-blur-md bg-black/30 animate-fade-in"
                onClick={onClose}
                style={{
                    animation: "fadeIn 0.3s ease-out",
                }}
            />

            {/* Premium Modal */}
            <div
                className="relative w-full max-w-md transform transition-all"
                style={{
                    animation: "modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}>
                {/* Glass card with gradient border */}
                <div className="relative rounded-3xl overflow-hidden">
                    {/* Gradient border effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-75 blur-sm" />

                    {/* Main glass card */}
                    <div className="relative m-[2px] rounded-3xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl">
                        {/* Animated gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 animate-gradient" />

                        {/* Content */}
                        <div className="relative p-8">
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-300/50 dark:hover:bg-gray-600/50 transition-all duration-200 backdrop-blur-sm"
                                aria-label="Close">
                                <svg
                                    className="w-5 h-5 text-gray-600 dark:text-gray-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>

                            {/* Icon with pulse animation */}
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse" />
                                    <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                        <svg
                                            className="w-10 h-10 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="text-3xl font-bold text-center mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Authentication Required
                            </h2>

                            {/* Message */}
                            <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                                {message}
                            </p>

                            {/* Error message */}
                            {error && (
                                <div className="mb-4 p-3 rounded-lg bg-red-100/80 dark:bg-red-900/30 border border-red-300 dark:border-red-700 backdrop-blur-sm">
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {error}
                                    </p>
                                </div>
                            )}

                            {/* Google Sign In Button */}
                            <button
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full py-4 px-6 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group">
                                <div className="flex items-center justify-center space-x-3">
                                    {loading ? (
                                        <>
                                            <svg
                                                className="animate-spin h-6 w-6 text-blue-600"
                                                fill="none"
                                                viewBox="0 0 24 24">
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            <span className="text-gray-700 dark:text-gray-200 font-medium">
                                                Connecting...
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <svg
                                                className="w-6 h-6 group-hover:scale-110 transition-transform"
                                                viewBox="0 0 24 24">
                                                <path
                                                    fill="#4285F4"
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                />
                                                <path
                                                    fill="#34A853"
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                />
                                                <path
                                                    fill="#FBBC05"
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                />
                                                <path
                                                    fill="#EA4335"
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                />
                                            </svg>
                                            <span className="text-gray-700 dark:text-gray-200 font-medium">
                                                Continue with Google
                                            </span>
                                        </>
                                    )}
                                </div>
                            </button>

                            {/* Footer text */}
                            <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400">
                                By signing in, you agree to our{" "}
                                <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                    Terms of Service
                                </span>{" "}
                                and{" "}
                                <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                    Privacy Policy
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes gradient {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-gradient {
          animation: gradient 3s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};

export default PremiumLoginModal;
