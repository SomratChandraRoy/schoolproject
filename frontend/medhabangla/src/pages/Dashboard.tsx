import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { name: "Total Points", value: 0 },
    { name: "Quizzes Taken", value: 0 },
    { name: "Games Played", value: 0 },
    { name: "Books Read", value: 0 },
  ]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Redirect to login if no token
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/accounts/dashboard/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Check if profile is incomplete
        if (!data.user.class_level) {
          navigate('/profile-setup');
          return;
        }

        // Update stats with real data
        setStats([
          { name: "Total Points", value: data.stats.total_points || 0 },
          { name: "Quizzes Taken", value: data.stats.quizzes_taken || 0 },
          { name: "Games Played", value: data.stats.games_played || 0 },
          { name: "Books Read", value: data.stats.books_read || 0 },
        ]);
      } else {
        // Token might be invalid, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
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
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-red-500 dark:text-red-400">Failed to load user data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {userData.first_name} {userData.last_name || ''}!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Ready to learn something new today? {userData.class_level ? `You're in Class ${userData.class_level}.` : 'Complete your profile to get started.'}
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
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No recent activity yet. Start taking quizzes to see your progress!</p>
                <Link to="/quiz/select" className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition">
                  Take Your First Quiz
                </Link>
              </div>
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
                    {userData.first_name?.charAt(0)}{userData.last_name?.charAt(0) || userData.email?.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {userData.first_name} {userData.last_name || ''}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {userData.class_level ? `Class ${userData.class_level}` : 'No class set'}
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Favorite Subjects</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {userData.fav_subjects && userData.fav_subjects.length > 0 ? (
                      userData.fav_subjects.map((subject: string) => (
                        <span key={subject} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          {subject}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No favorite subjects set</p>
                    )}
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
                <Link to="/notes" className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="text-2xl">📝</div>
                  <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Notes</span>
                </Link>
                <Link to="/syllabus" className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="text-2xl">📖</div>
                  <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Syllabus</span>
                </Link>
                <Link to="/study-timer" className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="text-2xl">⏱️</div>
                  <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Study Timer</span>
                </Link>
                <Link to="/study-stats" className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="text-2xl">📊</div>
                  <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Study Stats</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;