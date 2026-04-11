import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProfileCompletionModal from "../components/ProfileCompletionModal";
import AIVoiceConversation from "../components/AIVoiceConversation";

const Dashboard: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [stats, setStats] = useState([
    { name: "Total Points", value: 0 },
    { name: "Quizzes Taken", value: 0 },
    { name: "Games Played", value: 0 },
    { name: "Books Read", value: 0 },
  ]);
  const [streakDays, setStreakDays] = useState(0);
  const [totalHoursLearned, setTotalHoursLearned] = useState(0);
  const [studyStreak, setStudyStreak] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // Redirect to login if no token
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/accounts/dashboard/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Check if profile is incomplete
        const isProfileIncomplete =
          !data.user.class_level ||
          !data.user.fav_subjects ||
          data.user.fav_subjects.length === 0;

        if (isProfileIncomplete) {
          setShowProfileModal(true);
        }

        // Update stats with real data
        setStats([
          { name: "Total Points", value: data.stats.total_points || 0 },
          { name: "Quizzes Taken", value: data.stats.quizzes_taken || 0 },
          { name: "Games Played", value: data.stats.games_played || 0 },
          { name: "Books Read", value: data.stats.books_read || 0 },
        ]);

        // Set streak and learning time
        setStreakDays(data.stats.current_streak || 0);
        setTotalHoursLearned(data.stats.total_hours_learned || 0);
        setStudyStreak((data.stats.current_streak || 0) > 0);
      } else {
        // Token might be invalid, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileComplete = () => {
    setShowProfileModal(false);
    // Refresh user data
    fetchUserData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-red-500 dark:text-red-400">
              Failed to load user data
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onComplete={handleProfileComplete}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {userData.first_name} {userData.last_name || ""}!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Ready to learn something new today?{" "}
            {userData.class_level
              ? `You're in Class ${userData.class_level}.`
              : "Complete your profile to get started."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  {stat.name}
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </dd>
              </div>
            </div>
          ))}
        </div>

        {/* Achievement & Streak Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Study Streak Card */}
          <div className="bg-gradient-to-br from-orange-400 to-red-500 dark:from-orange-600 dark:to-red-700 text-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Study Streak</p>
                <p className="text-3xl font-bold mt-1">{streakDays} days</p>
                {studyStreak && (
                  <p className="text-xs mt-2 opacity-75">🔥 Keep it up!</p>
                )}
              </div>
              <div className="text-5xl">🔥</div>
            </div>
          </div>

          {/* Learning Hours Card */}
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 text-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">
                  Total Learning Time
                </p>
                <p className="text-3xl font-bold mt-1">{totalHoursLearned}h</p>
                <p className="text-xs mt-2 opacity-75">
                  Keep learning every day
                </p>
              </div>
              <div className="text-5xl">⏱️</div>
            </div>
          </div>

          {/* Rank/Level Card */}
          <div className="bg-gradient-to-br from-purple-400 to-indigo-600 dark:from-purple-600 dark:to-indigo-800 text-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Your Level</p>
                <p className="text-3xl font-bold mt-1">
                  {Math.floor((stats[0]?.value || 0) / 100) + 1}
                </p>
                <p className="text-xs mt-2 opacity-75">
                  {(stats[0]?.value || 0) % 100} / 100 to next level
                </p>
              </div>
              <div className="text-5xl">⭐</div>
            </div>
          </div>
        </div>

        {/* All Features Showcase - Full Width */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl leading-6 font-bold text-gray-900 dark:text-white">
              🚀 ALL FEATURES & TOOLS
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Access all your learning tools, organized by category
            </p>
          </div>

          <div className="px-6 py-6">
            {/* Academic Learning */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">🎓</span> Academic Learning
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <Link
                  to="/quiz"
                  className="p-4 border-2 border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🧠
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Quiz
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Test knowledge
                  </p>
                </Link>
                <Link
                  to="/quiz/adaptive"
                  className="p-4 border-2 border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🎓
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Adaptive Quiz
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Smart learning
                  </p>
                </Link>
                <Link
                  to="/books"
                  className="p-4 border-2 border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:border-amber-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    📚
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Books
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Read content
                  </p>
                </Link>
                <Link
                  to="/syllabus"
                  className="p-4 border-2 border-cyan-200 dark:border-cyan-700 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/30 hover:border-cyan-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    📖
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Syllabus
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Curriculum info
                  </p>
                </Link>
                <Link
                  to="/flashcards"
                  className="p-4 border-2 border-pink-200 dark:border-pink-700 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/30 hover:border-pink-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🎴
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Flashcards
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Quick review
                  </p>
                </Link>
              </div>
            </div>

            {/* Interactive & Gaming */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">🎮</span> Interactive & Gaming
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <Link
                  to="/games"
                  className="p-4 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30 hover:border-yellow-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🎮
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Games
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Learn by playing
                  </p>
                </Link>
                <Link
                  to="/tldraw"
                  className="p-4 border-2 border-green-200 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 hover:border-green-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🎨
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Whiteboard
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Creative drawing
                  </p>
                </Link>
                <Link
                  to="/chat"
                  className="p-4 border-2 border-emerald-200 dark:border-emerald-700 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    💬
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Chat
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Talk & share
                  </p>
                </Link>
                <Link
                  to="/ai-chat"
                  className="p-4 border-2 border-indigo-200 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🤖
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    AI Chat
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ask AI
                  </p>
                </Link>
              </div>
            </div>

            {/* Progress & Analytics */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">📊</span> Progress & Analytics
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <Link
                  to="/study-dashboard"
                  className="p-4 border-2 border-green-200 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 hover:border-green-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    📊
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Progress
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Track progress
                  </p>
                </Link>
                <Link
                  to="/study-stats"
                  className="p-4 border-2 border-indigo-200 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    📈
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Statistics
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    View analytics
                  </p>
                </Link>
                <Link
                  to="/leaderboard"
                  className="p-4 border-2 border-orange-200 dark:border-orange-700 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:border-orange-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🏆
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Leaderboard
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Rank system
                  </p>
                </Link>
                <Link
                  to="/achievements"
                  className="p-4 border-2 border-red-200 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🎖️
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Achievements
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Badges earned
                  </p>
                </Link>
              </div>
            </div>

            {/* Tools & Utilities */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">🛠️</span> Tools & Utilities
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <Link
                  to="/notes"
                  className="p-4 border-2 border-red-200 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    📝
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Notes
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Take notes
                  </p>
                </Link>
                <Link
                  to="/study-timer"
                  className="p-4 border-2 border-orange-200 dark:border-orange-700 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:border-orange-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    ⏱️
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Timer
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Manage time
                  </p>
                </Link>
                <Link
                  to="/document-vision"
                  className="p-4 border-2 border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    👁️
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Doc Vision
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    OCR & scanning
                  </p>
                </Link>
                <Link
                  to="/offline-ai"
                  className="p-4 border-2 border-violet-200 dark:border-violet-700 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:border-violet-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🤖
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Offline AI
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    AI assistant
                  </p>
                </Link>
                <Link
                  to="/translator"
                  className="p-4 border-2 border-teal-200 dark:border-teal-700 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:border-teal-400 transition-all group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    🌐
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Translator
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Translate text
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Recent Activity Section */}
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  📈 Your Progress at a Glance
                </h3>
              </div>
              <div className="px-6 py-8">
                <div className="space-y-6">
                  {/* Quiz Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Quiz Progress: {Math.min(stats[1]?.value || 0, 100)}%
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stats[1]?.value || 0} quizzes
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(((stats[1]?.value || 0) / 20) * 100, 100)}%`,
                        }}></div>
                    </div>
                  </div>

                  {/* Books Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Reading Progress: {Math.min(stats[3]?.value || 0, 100)}%
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stats[3]?.value || 0} books
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(((stats[3]?.value || 0) / 20) * 100, 100)}%`,
                        }}></div>
                    </div>
                  </div>

                  {/* Games Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Gaming Progress: {Math.min(stats[2]?.value || 0, 100)}%
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stats[2]?.value || 0} games
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(((stats[2]?.value || 0) / 20) * 100, 100)}%`,
                        }}></div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {streakDays}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Day Streak
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalHoursLearned}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Hours Learned
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats[0]?.value || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Points Earned
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended for You Section */}
            <div className="mt-8 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  🎯 Recommended for You
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-blue-400 dark:hover:border-blue-500">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    📐 Math Quiz: Geometry
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Master geometry concepts and solve complex problems
                  </p>
                  <Link
                    to="/quiz"
                    className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                    Start Quiz →
                  </Link>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-purple-400 dark:hover:border-purple-500">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    ⚛️ Physics Fundamentals
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Learn the laws of motion with interactive lessons
                  </p>
                  <Link
                    to="/books"
                    className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                    Read Chapter →
                  </Link>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-green-400 dark:hover:border-green-500">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    🧬 Biology Challenge
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Play interactive games to learn biology concepts
                  </p>
                  <Link
                    to="/games"
                    className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                    Play Game →
                  </Link>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-orange-400 dark:hover:border-orange-500">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    📚 English Literature
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Explore classic texts and improve your writing skills
                  </p>
                  <Link
                    to="/flashcards"
                    className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                    Study Cards →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Your Profile
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                    {userData.first_name?.charAt(0)}
                    {userData.last_name?.charAt(0) || userData.email?.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {userData.first_name} {userData.last_name || ""}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {userData.class_level
                        ? `Class ${userData.class_level}`
                        : "No class set"}
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Favorite Subjects
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {userData.fav_subjects &&
                    userData.fav_subjects.length > 0 ? (
                      userData.fav_subjects.map((subject: string) => (
                        <span
                          key={subject}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          {subject}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No favorite subjects set
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    to="/profile"
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">⭐</span> Quick Tips
              </h4>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-lg mr-2">💡</span>
                  <span>Start with a quiz to test your knowledge</span>
                </li>
                <li className="flex items-start">
                  <span className="text-lg mr-2">📚</span>
                  <span>Read books to learn deeply</span>
                </li>
                <li className="flex items-start">
                  <span className="text-lg mr-2">🎮</span>
                  <span>Play games to make learning fun</span>
                </li>
                <li className="flex items-start">
                  <span className="text-lg mr-2">📊</span>
                  <span>Check progress for motivation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-lg mr-2">🔄</span>
                  <span>Use flashcards for quick review</span>
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-700">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  👉 All features are available in the 🚀 ALL FEATURES section
                  above
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Voice Tutor Section */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-2">
              🎤 AI Voice Tutor - Learn by Speaking!
            </h2>
            <p className="text-white/90">
              Have real conversations with our AI tutor. Get exam help, solve
              doubts, take voice quizzes, and more - all recorded for future
              reference.
            </p>
          </div>
          <AIVoiceConversation isFloating={false} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
