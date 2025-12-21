import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 dark:text-white mb-6">
            MedhaBangla
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            বাংলাদেশি শিক্ষার্থীদের জন্য একটি বিশেষভাবে ডিজাইন করা শিক্ষামূলক প্ল্যাটফর্ম
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-4">
            An AI-Powered Educational Platform for Bangladeshi Students (Class 6-12)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Quiz Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4 text-blue-500">🧠</div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Smart Quiz System</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Adaptive quizzes with dynamic difficulty leveling based on your performance.
            </p>
            <Link to="/quiz" className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              Start Quiz
            </Link>
          </div>

          {/* AI Remediation Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4 text-green-500">🤖</div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">AI Guru</h3>
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
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Mind Zone</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Gamified learning experiences to boost cognitive abilities.
            </p>
            <Link to="/games" className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              Play Games
            </Link>
          </div>

          {/* Books Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4 text-yellow-500">📚</div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Digital Library</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Access to NCTB textbooks and educational resources in Bangla and English.
            </p>
            <Link to="/books" className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              Read Books
            </Link>
          </div>

          {/* Offline Notes Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4 text-red-500">📝</div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Offline Notes</h3>
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
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Your Profile</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Track your progress and customize your learning experience.
            </p>
            <Link to="/profile" className="inline-block bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              View Profile
            </Link>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">How It Works</h2>
          <p className="test-css-loading">If you see this text in red and bold, CSS is working!</p>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-8 md:space-y-0 md:space-x-12">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-4">1</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Sign Up</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Create your free account</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-bold mb-4">2</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Take Quizzes</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Practice with adaptive quizzes</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-white text-2xl font-bold mb-4">3</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Learn & Improve</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Get AI-powered guidance</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center text-white text-2xl font-bold mb-4">4</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Play & Earn</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Unlock games with your points</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;