import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);

  // Mock user data
  const userData = {
    name: "Ahmed Rahman",
    email: "ahmed.rahman@example.com",
    classLevel: 9,
    points: 1250,
    rank: 15,
    favSubjects: ["Mathematics", "Physics"],
    dislikedSubjects: ["English"],
    joinDate: "January 15, 2024",
    lastActive: "2 hours ago"
  };

  const achievements = [
    { id: 1, name: "Quiz Master", description: "Completed 10 quizzes", icon: "🏆" },
    { id: 2, name: "Bookworm", description: "Read 5 books", icon: "📚" },
    { id: 3, name: "Game Champion", description: "Played 20 games", icon: "🎮" },
    { id: 4, name: "Early Bird", description: "Logged in before 8 AM", icon: "🌅" }
  ];

  const recentActivity = [
    { id: 1, activity: "Completed Math Quiz", points: "+50", time: "2 hours ago" },
    { id: 2, activity: "Played Memory Matrix", points: "+30", time: "1 day ago" },
    { id: 3, activity: "Read Physics Chapter 3", points: "+20", time: "2 days ago" },
    { id: 4, activity: "Updated profile", points: "+5", time: "3 days ago" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-12 sm:px-12">
            <div className="flex flex-col md:flex-row items-center">
              <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-3xl shadow-lg">
                AR
              </div>
              <div className="md:ml-8 mt-6 md:mt-0 text-center md:text-left">
                <h1 className="text-3xl font-bold text-white">{userData.name}</h1>
                <p className="text-blue-100 mt-2">Class {userData.classLevel} Student</p>
                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                    <p className="text-sm text-blue-100">Total Points</p>
                    <p className="text-xl font-bold text-white">{userData.points}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                    <p className="text-sm text-blue-100">Class Rank</p>
                    <p className="text-xl font-bold text-white">#{userData.rank}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'achievements'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Achievements
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'activity'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Activity
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8">
            {activeTab === 'profile' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Information</h2>
                  <button
                    onClick={() => setEditing(!editing)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition"
                  >
                    {editing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        defaultValue={userData.name}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{userData.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    {editing ? (
                      <input
                        type="email"
                        defaultValue={userData.email}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{userData.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Class Level
                    </label>
                    {editing ? (
                      <select
                        defaultValue={userData.classLevel}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        {[6, 7, 8, 9, 10, 11, 12].map(level => (
                          <option key={level} value={level}>Class {level}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900 dark:text-white">Class {userData.classLevel}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Member Since
                    </label>
                    <p className="text-gray-900 dark:text-white">{userData.joinDate}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Active
                    </label>
                    <p className="text-gray-900 dark:text-white">{userData.lastActive}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Favorite Subjects
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {userData.favSubjects.map(subject => (
                        <span key={subject} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Disliked Subjects
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {userData.dislikedSubjects.map(subject => (
                        <span key={subject} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {editing && (
                  <div className="mt-6">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition">
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'achievements' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Achievements</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {achievements.map(achievement => (
                    <div key={achievement.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                      <div className="text-4xl mb-3">{achievement.icon}</div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{achievement.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{achievement.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
                <div className="bg-white dark:bg-gray-700 shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                    {recentActivity.map(activity => (
                      <li key={activity.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                              {activity.activity}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {activity.points}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              {activity.time}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;