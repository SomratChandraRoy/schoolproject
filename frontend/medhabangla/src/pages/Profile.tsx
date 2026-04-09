import React, { useState, useEffect } from 'react';
import { getCurriculumSubjectsForClass, getSubjectNameByCode } from '../utils/curriculumSubjects';

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    classLevel: 9,
    favSubjects: [] as string[],
    dislikedSubjects: [] as string[]
  });

  const subjects = getCurriculumSubjectsForClass(formData.classLevel);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/accounts/profile/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setFormData({
          classLevel: data.class_level || 9,
          favSubjects: data.fav_subjects || [],
          dislikedSubjects: data.disliked_subjects || []
        });
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (err) {
      setError('Failed to load profile data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/accounts/profile/update/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          class_level: formData.classLevel,
          fav_subjects: formData.favSubjects,
          disliked_subjects: formData.dislikedSubjects
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        setEditing(false);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    }
  };

  const handleSubjectToggle = (subjectCode: string, type: 'fav' | 'disliked') => {
    if (type === 'fav') {
      if (formData.favSubjects.includes(subjectCode)) {
        setFormData({
          ...formData,
          favSubjects: formData.favSubjects.filter(s => s !== subjectCode)
        });
      } else {
        setFormData({
          ...formData,
          favSubjects: [...formData.favSubjects, subjectCode],
          dislikedSubjects: formData.dislikedSubjects.filter(s => s !== subjectCode)
        });
      }
    } else {
      if (formData.dislikedSubjects.includes(subjectCode)) {
        setFormData({
          ...formData,
          dislikedSubjects: formData.dislikedSubjects.filter(s => s !== subjectCode)
        });
      } else {
        setFormData({
          ...formData,
          dislikedSubjects: [...formData.dislikedSubjects, subjectCode],
          favSubjects: formData.favSubjects.filter(s => s !== subjectCode)
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <button 
            onClick={fetchUserData}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">No user data available</p>
      </div>
    );
  }

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
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-12 sm:px-12">
            <div className="flex flex-col md:flex-row items-center">
              <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-3xl shadow-lg">
                {userData.first_name?.charAt(0)}{userData.last_name?.charAt(0)}
              </div>
              <div className="md:ml-8 mt-6 md:mt-0 text-center md:text-left">
                <h1 className="text-3xl font-bold text-white">{userData.first_name} {userData.last_name}</h1>
                <p className="text-blue-100 mt-2">Class {userData.class_level} Student</p>
                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                    <p className="text-sm text-blue-100">Total Points</p>
                    <p className="text-xl font-bold text-white">{userData.total_points}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                    <p className="text-sm text-blue-100">Role</p>
                    <p className="text-xl font-bold text-white">
                      {userData.is_admin ? 'Admin' : userData.is_teacher ? 'Teacher' : 'Student'}
                    </p>
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
                    <p className="text-gray-900 dark:text-white">{userData.first_name} {userData.last_name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <p className="text-gray-900 dark:text-white">{userData.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Class Level
                    </label>
                    {editing ? (
                      <select
                        value={formData.classLevel}
                        onChange={(e) => setFormData({...formData, classLevel: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        {[6, 7, 8, 9, 10, 11, 12].map(level => (
                          <option key={level} value={level}>Class {level}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900 dark:text-white">Class {userData.class_level}</p>
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
                    {editing ? (
                      <div className="grid grid-cols-2 gap-2">
                        {subjects.map(subject => (
                          <div key={subject.code} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`fav-${subject.code}`}
                              checked={formData.favSubjects.includes(subject.code)}
                              onChange={() => handleSubjectToggle(subject.code, 'fav')}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`fav-${subject.code}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                              {subject.bengaliName} ({subject.name})
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {userData.fav_subjects?.map((subject: string) => (
                          <span key={subject} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                            {getSubjectNameByCode(userData.class_level, subject)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Disliked Subjects
                    </label>
                    {editing ? (
                      <div className="grid grid-cols-2 gap-2">
                        {subjects.map(subject => (
                          <div key={subject.code} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`disliked-${subject.code}`}
                              checked={formData.dislikedSubjects.includes(subject.code)}
                              onChange={() => handleSubjectToggle(subject.code, 'disliked')}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`disliked-${subject.code}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                              {subject.bengaliName} ({subject.name})
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {userData.disliked_subjects?.map((subject: string) => (
                          <span key={subject} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                            {getSubjectNameByCode(userData.class_level, subject)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {editing && (
                  <div className="mt-6 flex space-x-3">
                    <button 
                      onClick={handleSaveChanges}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
                    >
                      Save Changes
                    </button>
                    <button 
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-md transition"
                    >
                      Cancel
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