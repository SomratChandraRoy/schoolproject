import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Dashboard: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  // Mock data for dashboard
  const userData = {
    name: "Ahmed Rahman",
    class: 9,
    points: 1250,
    rank: 15,
    favSubjects: ["Mathematics", "Physics"],
    recentActivity: [
      { activity: "Completed Math Quiz", points: "+50", time: "2 hours ago" },
      { activity: "Played Memory Matrix", points: "+30", time: "1 day ago" },
      { activity: "Read Physics Chapter 3", points: "+20", time: "2 days ago" },
    ]
  };

  const stats = [
    { name: "Total Points", value: userData.points },
    { name: "Class Rank", value: `#${userData.rank}` },
    { name: "Quizzes Taken", value: 24 },
    { name: "Books Read", value: 5 },
  ];

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // In a real app, you would save this preference to localStorage
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {userData.name}!</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Ready to learn something new today? You're in Class {userData.class}.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{stat.name}</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{stat.value}</dd>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Recent Activity</h3>
              </div>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {userData.recentActivity.map((activity, index) => (
                  <li key={index} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.activity}</p>
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {activity.points}
                        </span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{activity.time}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Recommended for You</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-900 dark:text-white">Math Quiz: Algebra Basics</h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Test your knowledge of algebra fundamentals</p>
                  <Link to="/quiz" className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                    Start Quiz
                  </Link>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-900 dark:text-white">Physics: Laws of Motion</h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Interactive lesson on Newton's laws</p>
                  <Link to="/books" className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                    Read Chapter
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Your Profile</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                    AR
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">{userData.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Class {userData.class}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Favorite Subjects</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {userData.favSubjects.map((subject) => (
                      <span key={subject} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-6">
                  <Link to="/profile" className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 p-6">
                <Link to="/quiz" className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="text-2xl">🧠</div>
                  <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Take Quiz</span>
                </Link>
                <Link to="/games" className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="text-2xl">🎮</div>
                  <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Play Games</span>
                </Link>
                <Link to="/books" className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="text-2xl">📚</div>
                  <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Read Books</span>
                </Link>
                <button className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="text-2xl">🤖</div>
                  <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Ask AI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;