import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import UserManagement from '../components/admin/UserManagement';
import MemberManagement from '../components/admin/MemberManagement';

interface User {
  id: number;
  username: string;
  email: string;
  class_level: number | null;
  total_points: number;
  is_teacher: boolean;
  is_admin: boolean;
  date_joined: string;
}

interface Statistics {
  total_users: number;
  total_teachers: number;
  total_admins: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total_users: 0,
    total_teachers: 0,
    total_admins: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [aiQuestionForm, setAiQuestionForm] = useState({
    subject: 'math',
    class_level: 9,
    difficulty: 'medium',
    question_type: 'mcq'
  });
  const [aiQuestionResult, setAiQuestionResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is teacher or admin
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      if (!userData.is_teacher && !userData.is_admin) {
        navigate('/dashboard');
      }
    }

    fetchAdminData();
  }, [navigate]);



  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/accounts/admin-panel/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data.statistics);
        setUsers(data.recent_users);
      } else if (response.status === 403) {
        // Not authorized as admin
        navigate('/dashboard');
      } else {
        throw new Error('Failed to fetch admin data');
      }
    } catch (err) {
      setError('Failed to load admin data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: number, updates: Partial<User>) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/accounts/admin-panel/${userId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        // Update the user in the state
        setUsers(users.map(user =>
          user.id === userId ? { ...user, ...data.user } : user
        ));
        setShowEditModal(false);
        setEditingUser(null);
      } else {
        throw new Error('Failed to update user');
      }
    } catch (err) {
      setError('Failed to update user');
      console.error(err);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/accounts/admin-panel/${userId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove the user from the state
        setUsers(users.filter(user => user.id !== userId));
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (err) {
      setError('Failed to delete user');
      console.error(err);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleSaveUser = () => {
    if (editingUser) {
      updateUserRole(editingUser.id, {
        is_teacher: editingUser.is_teacher,
        is_admin: editingUser.is_admin
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const generateAIQuestion = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiQuestionResult(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/ai/generate-question/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(aiQuestionForm)
      });

      if (response.ok) {
        const data = await response.json();
        setAiQuestionResult(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate question');
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate question');
      console.error(err);
    } finally {
      setAiLoading(false);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage users and monitor system activity
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'members' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}
            >
              💬 Member Management
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'ai' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}
            >
              AI Question Generator
            </button>
          </nav>
        </div>

        {activeTab === 'users' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Users</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.total_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                    <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Teachers</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.total_teachers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Admins</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.total_admins}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Users</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Points</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Roles</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <span className="text-blue-800 dark:text-blue-200 font-medium">
                                  {user.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {user.class_level ? `Class ${user.class_level}` : 'Not set'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{user.total_points}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {user.is_teacher && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                Teacher
                              </span>
                            )}
                            {user.is_admin && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                                Admin
                              </span>
                            )}
                            {!user.is_teacher && !user.is_admin && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                Student
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(user.date_joined)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'members' && (
          <MemberManagement />
        )}

        {activeTab === 'ai' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">AI Question Generator</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Generate curriculum-appropriate questions for Bangladeshi students using AI.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <select
                  value={aiQuestionForm.subject}
                  onChange={(e) => setAiQuestionForm({ ...aiQuestionForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="physics">Physics</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="math">General Math</option>
                  <option value="bangla">Bangla</option>
                  <option value="english">English</option>
                  <option value="biology">Biology</option>
                  <option value="ict">ICT</option>
                  <option value="general_knowledge">General Knowledge</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class Level
                </label>
                <select
                  value={aiQuestionForm.class_level}
                  onChange={(e) => setAiQuestionForm({ ...aiQuestionForm, class_level: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {[6, 7, 8, 9, 10, 11, 12].map(level => (
                    <option key={level} value={level}>Class {level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={aiQuestionForm.difficulty}
                  onChange={(e) => setAiQuestionForm({ ...aiQuestionForm, difficulty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Question Type
                </label>
                <select
                  value={aiQuestionForm.question_type}
                  onChange={(e) => setAiQuestionForm({ ...aiQuestionForm, question_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="short">Short Answer</option>
                  <option value="long">Long Answer</option>
                </select>
              </div>
            </div>

            <button
              onClick={generateAIQuestion}
              disabled={aiLoading}
              className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition ${aiLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {aiLoading ? 'Generating...' : 'Generate Question'}
            </button>

            {aiError && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      <p>{aiError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {aiQuestionResult && (
              <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-2">Generated Question</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Question:</p>
                    <p className="text-gray-900 dark:text-white mt-1">{aiQuestionResult.question_text}</p>
                  </div>

                  {aiQuestionResult.options && Object.keys(aiQuestionResult.options).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Options:</p>
                      <ul className="mt-1 space-y-1">
                        {Object.entries(aiQuestionResult.options).map(([key, value]) => (
                          <li key={key} className="text-gray-900 dark:text-white">
                            <strong>{key}.</strong> {value as string}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Correct Answer:</p>
                    <p className="text-gray-900 dark:text-white mt-1">{aiQuestionResult.correct_answer}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Explanation:</p>
                    <p className="text-gray-900 dark:text-white mt-1">{aiQuestionResult.explanation}</p>
                  </div>

                  <div className="pt-4 border-t border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      <strong>Subject:</strong> {aiQuestionResult.subject} |
                      <strong>Class:</strong> {aiQuestionResult.class_target} |
                      <strong>Difficulty:</strong> {aiQuestionResult.difficulty} |
                      <strong>Type:</strong> {aiQuestionResult.question_type}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit User Roles</h3>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <p className="text-gray-900 dark:text-white">{editingUser.username}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <p className="text-gray-900 dark:text-white">{editingUser.email}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="is_teacher"
                    type="checkbox"
                    checked={editingUser.is_teacher}
                    onChange={(e) => setEditingUser({ ...editingUser, is_teacher: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_teacher" className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Teacher
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="is_admin"
                    type="checkbox"
                    checked={editingUser.is_admin}
                    onChange={(e) => setEditingUser({ ...editingUser, is_admin: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_admin" className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Admin
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;