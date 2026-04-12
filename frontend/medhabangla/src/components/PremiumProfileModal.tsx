import React, { useEffect, useState } from "react";

interface PremiumProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData: any;
}

const PremiumProfileModal: React.FC<PremiumProfileModalProps> = ({
    isOpen,
    onClose,
    userData,
}) => {
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            // Delay content appearance for dramatic effect
            setTimeout(() => setShowContent(true), 300);
        } else {
            document.body.style.overflow = "unset";
            setShowContent(false);
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const achievements = [
        { icon: "🏆", count: userData?.quiz_count || 0, label: "Quizzes" },
        { icon: "📚", count: userData?.books_read || 0, label: "Books" },
        { icon: "🎮", count: userData?.games_played || 0, label: "Games" },
        { icon: "⭐", count: userData?.total_points || 0, label: "Points" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Glassmorphism backdrop with animated gradient */}
            <div
                className="absolute inset-0 backdrop-blur-xl bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-pink-900/40 animate-fade-in"
                onClick={onClose}
                style={{
                    animation: "fadeIn 0.4s ease-out",
                }}
            >
                {/* Animated floating orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" />
                <div
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float"
                    style={{ animationDelay: "1s" }}
                />
                <div
                    className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-float"
                    style={{ animationDelay: "2s" }}
                />
            </div>

            {/* Premium Profile Card */}
            <div
                className="relative w-full max-w-2xl transform transition-all"
                style={{
                    animation: "modalSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}>
                {/* Gradient border effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-75 blur-sm rounded-3xl" />

                {/* Main glass card */}
                <div className="relative m-[2px] rounded-3xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl shadow-2xl overflow-hidden">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 animate-gradient-shift" />

                    {/* Content */}
                    <div className="relative">
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-300/50 dark:hover:bg-gray-600/50 transition-all duration-200 backdrop-blur-sm group"
                            aria-label="Close">
                            <svg
                                className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:rotate-90 transition-transform duration-300"
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

                        {/* Header with avatar */}
                        <div className="relative pt-12 pb-8 px-8 bg-gradient-to-br from-blue-500/90 via-purple-500/90 to-pink-500/90 backdrop-blur-sm">
                            {/* Sparkle effects */}
                            <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-ping" />
                                <div
                                    className="absolute top-20 right-20 w-2 h-2 bg-white rounded-full animate-ping"
                                    style={{ animationDelay: "0.5s" }}
                                />
                                <div
                                    className="absolute bottom-10 left-1/3 w-2 h-2 bg-white rounded-full animate-ping"
                                    style={{ animationDelay: "1s" }}
                                />
                            </div>

                            <div className="relative flex flex-col items-center">
                                {/* Avatar with glow effect */}
                                <div className="relative mb-4">
                                    <div className="absolute inset-0 bg-white rounded-full blur-xl opacity-50 animate-pulse" />
                                    <div className="relative w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-2xl ring-4 ring-white/30">
                                        {userData?.profile_picture ? (
                                            <img
                                                src={userData.profile_picture}
                                                alt="Profile"
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-4xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                {userData?.first_name?.charAt(0)}
                                                {userData?.last_name?.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* User info */}
                                <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                                    {userData?.first_name} {userData?.last_name}
                                </h2>
                                <p className="text-white/90 text-lg mb-1">
                                    Class {userData?.class_level} Student
                                </p>
                                <div className="flex items-center gap-2 text-white/80 text-sm">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                    {userData?.email}
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        {showContent && (
                            <div
                                className="p-8"
                                style={{
                                    animation: "fadeInUp 0.6s ease-out 0.2s both",
                                }}>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    {achievements.map((achievement, index) => (
                                        <div
                                            key={index}
                                            className="relative group"
                                            style={{
                                                animation: `fadeInUp 0.6s ease-out ${0.3 + index * 0.1}s both`,
                                            }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-2xl blur-sm group-hover:blur-md transition-all" />
                                            <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20 dark:border-gray-700/20 hover:scale-105 transition-transform duration-300">
                                                <div className="text-3xl mb-2 animate-bounce-slow">
                                                    {achievement.icon}
                                                </div>
                                                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                    {achievement.count}
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                    {achievement.label}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Role Badge */}
                                <div
                                    className="flex justify-center mb-6"
                                    style={{
                                        animation: "fadeInUp 0.6s ease-out 0.7s both",
                                    }}>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                                        <div className="relative px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white font-semibold shadow-lg">
                                            <span className="flex items-center gap-2">
                                                {userData?.is_admin ? (
                                                    <>
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                            />
                                                        </svg>
                                                        Administrator
                                                    </>
                                                ) : userData?.is_teacher ? (
                                                    <>
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                                            />
                                                        </svg>
                                                        Teacher
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                            />
                                                        </svg>
                                                        Student
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div
                                    className="text-center"
                                    style={{
                                        animation: "fadeInUp 0.6s ease-out 0.8s both",
                                    }}>
                                    <button
                                        onClick={onClose}
                                        className="relative group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                                        <span className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <span className="relative flex items-center gap-2">
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                            View Full Profile
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}
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
            transform: scale(0.9) translateY(-30px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce 3s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
        </div>
    );
};

export default PremiumProfileModal;
