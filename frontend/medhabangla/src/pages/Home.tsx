import React, { useState } from "react";
import { Link } from "react-router-dom";
import PremiumLoginModal from "../components/PremiumLoginModal";

const Home: React.FC = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  return (
    <>
      <PremiumLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Experience our premium glass effect login!"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Premium Hero Section */}
        <div className="-mx-4 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mb-16 overflow-hidden">
          {/* Hero Background Image */}
          <div className="relative h-[600px] md:h-[700px] flex items-center justify-center">
            <img
              src="/hero.png"
              alt="SOPAN Learning Platform"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Premium Gradient Overlay - Creates depth and emotional feel */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-blue-900/40 mix-blend-multiply"></div>

            {/* Additional emotional gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

            {/* Premium Content Container */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 z-10">
              {/* Logo with premium styling */}
              <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
                <img
                  src="/logo.png"
                  alt="SOPAN Logo"
                  className="h-24 md:h-32 w-auto drop-shadow-2xl filter brightness-110"
                />
              </div>

              {/* Premium Typography */}
              <div className="text-center max-w-4xl">
                {/* Main Heading - Emotional & Premium */}
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg tracking-tight">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
                    SOPAN
                  </span>
                </h1>

                {/* Subheading - Inspiring message */}
                <p className="text-xl md:text-2xl text-blue-100 mb-6 drop-shadow-lg font-light leading-relaxed max-w-2xl mx-auto">
                  Transform Your Learning Journey with AI-Powered Education
                </p>

                {/* Bangla tagline - Emotional connection */}
                <p className="text-lg md:text-xl text-purple-100 mb-8 drop-shadow-lg font-medium">
                  আপনার সাফল্যের পথ শুরু করুন আজই
                </p>

                {/* Premium CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link
                    to="/quiz"
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg overflow-hidden shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105">
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="relative flex items-center gap-2">
                      🚀 Start Learning Now
                    </span>
                  </Link>

                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="group relative px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
                    <span className="relative flex items-center gap-2">
                      ✨ Try Premium Login
                    </span>
                  </button>
                </div>

                {/* Premium Stats/Features */}
                <div className="mt-12 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="backdrop-blur-md bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="text-3xl font-bold text-blue-200">50K+</div>
                    <div className="text-sm text-blue-100 mt-1">
                      Active Students
                    </div>
                  </div>
                  <div className="backdrop-blur-md bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="text-3xl font-bold text-purple-200">
                      1000+
                    </div>
                    <div className="text-sm text-blue-100 mt-1">Quiz Topics</div>
                  </div>
                  <div className="backdrop-blur-md bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="text-3xl font-bold text-blue-200">AI</div>
                    <div className="text-sm text-blue-100 mt-1">Powered</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scroll Indicator - Premium animation */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
              <div className="w-8 h-12 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
                <div className="w-1 h-2 bg-white/50 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Quiz Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4 text-blue-500">🧠</div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Smart Quiz System
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Adaptive quizzes with dynamic difficulty leveling based on your
                performance.
              </p>
              <Link
                to="/quiz"
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Start Quiz
              </Link>
            </div>

            {/* AI Remediation Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4 text-green-500">🤖</div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                AI Guru
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Personalized learning with AI-powered remediation in Bangla.
              </p>
              <button className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Learn with AI
              </button>
            </div>

            {/* Mind Games Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4 text-purple-500">🎮</div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Mind Zone
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Gamified learning experiences to boost cognitive abilities.
              </p>
              <Link
                to="/games"
                className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Play Games
              </Link>
            </div>

            {/* Books Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4 text-yellow-500">📚</div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Digital Library
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Access to NCTB textbooks and educational resources in Bangla and
                English.
              </p>
              <Link
                to="/books"
                className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Read Books
              </Link>
            </div>

            {/* Offline Notes Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4 text-red-500">📝</div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Offline Notes
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                AI-powered note taking with offline access through PWA.
              </p>
              <button className="inline-block bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Take Notes
              </button>
            </div>

            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4 text-indigo-500">👤</div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Your Profile
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Track your progress and customize your learning experience.
              </p>
              <Link
                to="/profile"
                className="inline-block bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                View Profile
              </Link>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
              How It Works
            </h2>
            <p className="test-css-loading">
              If you see this text in red and bold, CSS is working!
            </p>
            <div className="flex flex-col md:flex-row justify-center items-center space-y-8 md:space-y-0 md:space-x-12">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Sign Up
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Create your free account
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Take Quizzes
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Practice with adaptive quizzes
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-white text-2xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Learn & Improve
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Get AI-powered guidance
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center text-white text-2xl font-bold mb-4">
                  4
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Play & Earn
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Unlock games with your points
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
