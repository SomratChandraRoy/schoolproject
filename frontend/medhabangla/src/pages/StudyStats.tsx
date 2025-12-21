import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

const StudyStats: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    fetchStudyData();
  }, []);

  const fetchStudyData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch study stats
      const statsResponse = await fetch('/api/accounts/study-stats/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
      
      // Fetch study sessions
      const sessionsResponse = await fetch('/api/accounts/study-sessions/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData);
      }
    } catch (error) {
      console.error('Error fetching study data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // Format time for display
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }
    return `${hours} hr ${remainingMinutes} min`;
  };

  // Get top subjects
  const topSubjects = stats?.subject_breakdown?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Study Statistics</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Track your learning progress and achievements
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Study Time</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatTime(stats?.total_study_time || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Streak</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats?.current_streak || 0} days
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Longest Streak</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats?.longest_streak || 0} days
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">This Week</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatTime(stats?.weekly_study_time || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Top Subjects */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Top Subjects</h3>
            {topSubjects.length > 0 ? (
              <div className="space-y-4">
                {topSubjects.map((subject: any, index: number) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {subject.subject}
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formatTime(subject.total_duration)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(subject.total_duration / (stats?.subject_breakdown[0]?.total_duration || 1)) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 dark:text-gray-500 mb-2">No study data yet</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Start studying to see your subject breakdown
                </p>
              </div>
            )}
          </div>

          {/* Recent Sessions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Sessions</h3>
            {sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.slice(0, 5).map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{session.subject}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(session.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatTime(session.duration)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 dark:text-gray-500 mb-2">No study sessions yet</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Complete a study session to track your progress
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Achievements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg">
              <div className="text-3xl mb-2">🎯</div>
              <div className="font-medium text-gray-900 dark:text-white">First Session</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Complete 1 session</div>
              {stats?.total_study_time > 0 && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">✓ Unlocked</div>
              )}
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg">
              <div className="text-3xl mb-2">🔥</div>
              <div className="font-medium text-gray-900 dark:text-white">Starter Streak</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">3-day streak</div>
              {stats?.current_streak >= 3 && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">✓ Unlocked</div>
              )}
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg">
              <div className="text-3xl mb-2">🏆</div>
              <div className="font-medium text-gray-900 dark:text-white">Scholar</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">10 hours studied</div>
              {stats?.total_study_time >= 600 && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">✓ Unlocked</div>
              )}
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-lg">
              <div className="text-3xl mb-2">🚀</div>
              <div className="font-medium text-gray-900 dark:text-white">Marathoner</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">7-day streak</div>
              {stats?.current_streak >= 7 && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">✓ Unlocked</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyStats;