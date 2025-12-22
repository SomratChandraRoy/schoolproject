import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FormModal from '../components/admin/FormModal';
import UserForm from '../components/admin/UserForm';
import QuizForm from '../components/admin/QuizForm';
import SubjectForm from '../components/admin/SubjectForm';
import BookForm from '../components/admin/BookForm';
import SyllabusForm from '../components/admin/SyllabusForm';

type TabType = 'users' | 'quizzes' | 'books' | 'syllabus' | 'subjects' | 'stats';

const SuperuserDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('stats');
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.is_admin) {
                    setIsAdmin(true);
                } else {
                    navigate('/dashboard');
                }
            } catch (e) {
                navigate('/dashboard');
            }
        } else {
            navigate('/login');
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navbar />
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        🔐 Superuser Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Complete administrative control over all system resources
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex -mb-px overflow-x-auto">
                            {[
                                { id: 'stats', name: 'Statistics', icon: '📊' },
                                { id: 'users', name: 'Users', icon: '👥' },
                                { id: 'quizzes', name: 'Quizzes', icon: '📝' },
                                { id: 'subjects', name: 'Subjects', icon: '📚' },
                                { id: 'books', name: 'Books', icon: '�' },
                                { id: 'syllabus', name: 'Syllabus', icon: '�' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                        }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    {activeTab === 'stats' && <StatsTab />}
                    {activeTab === 'users' && <UsersTab />}
                    {activeTab === 'quizzes' && <QuizzesTab />}
                    {activeTab === 'subjects' && <SubjectsTab />}
                    {activeTab === 'books' && <BooksTab />}
                    {activeTab === 'syllabus' && <SyllabusTab />}
                </div>
            </div>
        </div>
    );
};

const StatsTab: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');

            const fetchWithCheck = async (url: string) => {
                const response = await fetch(url, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${url}: ${response.status}`);
                }
                return response.json();
            };

            const [userStats, quizStats, bookStats, syllabusStats] = await Promise.all([
                fetchWithCheck('/api/superuser/accounts/users/stats/'),
                fetchWithCheck('/api/superuser/quizzes/quizzes/stats/'),
                fetchWithCheck('/api/superuser/books/books/stats/'),
                fetchWithCheck('/api/superuser/books/syllabus/stats/'),
            ]);

            setStats({ userStats, quizStats, bookStats, syllabusStats });
            setError(null);
        } catch (error: any) {
            console.error('Error fetching stats:', error);
            setError(error.message || 'Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading statistics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400">❌ {error}</p>
                <button
                    onClick={fetchStats}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Statistics</h2>

            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">👥 Users</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Total Users" value={stats?.userStats?.total_users || 0} color="blue" />
                    <StatCard title="Students" value={stats?.userStats?.students || 0} color="green" />
                    <StatCard title="Teachers" value={stats?.userStats?.teachers || 0} color="purple" />
                    <StatCard title="Admins" value={stats?.userStats?.admins || 0} color="red" />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">📝 Quizzes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Total Quizzes" value={stats?.quizStats?.total_quizzes || 0} color="blue" />
                    <StatCard title="Easy" value={stats?.quizStats?.by_difficulty?.easy || 0} color="green" />
                    <StatCard title="Medium" value={stats?.quizStats?.by_difficulty?.medium || 0} color="yellow" />
                    <StatCard title="Hard" value={stats?.quizStats?.by_difficulty?.hard || 0} color="red" />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">📖 Books</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Total Books" value={stats?.bookStats?.total_books || 0} color="blue" />
                    <StatCard title="Textbooks" value={stats?.bookStats?.by_category?.textbook || 0} color="purple" />
                    <StatCard title="Stories" value={stats?.bookStats?.by_category?.story || 0} color="green" />
                    <StatCard title="Poems" value={stats?.bookStats?.by_category?.poem || 0} color="pink" />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">📋 Syllabus</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Total Chapters" value={stats?.syllabusStats?.total_chapters || 0} color="blue" />
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: number; color: string }> = ({ title, value, color }) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    };

    return (
        <div className={`p-4 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm font-medium">{title}</div>
        </div>
    );
};

const UsersTab: React.FC = () => {
    return <CRUDTable entity="users" title="Users" apiPath="/api/superuser/accounts/users/" />;
};

const QuizzesTab: React.FC = () => {
    return <CRUDTable entity="quizzes" title="Quizzes" apiPath="/api/superuser/quizzes/quizzes/" />;
};

const SubjectsTab: React.FC = () => {
    return <CRUDTable entity="subjects" title="Subjects" apiPath="/api/superuser/quizzes/subjects/" />;
};

const BooksTab: React.FC = () => {
    return <CRUDTable entity="books" title="Books" apiPath="/api/superuser/books/books/" />;
};

const SyllabusTab: React.FC = () => {
    return <CRUDTable entity="syllabus" title="Syllabus" apiPath="/api/superuser/books/syllabus/" />;
};

const CRUDTable: React.FC<{ entity: string; title: string; apiPath: string }> = ({ entity, title, apiPath }) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, [apiPath]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(apiPath, {
                headers: { 'Authorization': `Token ${token}` }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            setData(Array.isArray(result) ? result : []);
        } catch (error: any) {
            console.error(`Error fetching ${entity}:`, error);
            setError(error.message || `Failed to load ${title}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(`Are you sure you want to delete this ${entity}?`)) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiPath}${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Token ${token}` }
            });

            if (response.ok || response.status === 204) {
                fetchData();
            } else {
                alert(`Failed to delete: ${response.statusText}`);
            }
        } catch (error: any) {
            console.error(`Error deleting ${entity}:`, error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingItem(null);
        setShowModal(true);
    };

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading {title}...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400">❌ {error}</p>
                <button
                    onClick={fetchData}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    const filteredData = data.filter(item =>
        JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title} Management</h2>
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    + Create New
                </button>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder={`Search ${title}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {filteredData.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No {title.toLowerCase()} found. {searchTerm && 'Try a different search term or '}
                    <button onClick={handleCreate} className="text-blue-600 hover:underline">
                        create a new one
                    </button>.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Details
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        #{item.id}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                        <pre className="text-xs overflow-auto max-w-2xl max-h-40 bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                            {JSON.stringify(item, null, 2)}
                                        </pre>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-medium"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <CRUDModal
                    entity={entity}
                    item={editingItem}
                    apiPath={apiPath}
                    onClose={() => {
                        setShowModal(false);
                        setEditingItem(null);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
};

const CRUDModal: React.FC<{ entity: string; item: any; apiPath: string; onClose: () => void }> = ({
    entity,
    item,
    apiPath,
    onClose
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (data: any) => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const url = item ? `${apiPath}${item.id}/` : apiPath;
            const method = item ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                onClose();
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(JSON.stringify(errorData, null, 2) || `HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error: any) {
            console.error('Error:', error);
            setError(error.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const getFormComponent = () => {
        switch (entity) {
            case 'users':
                return <UserForm item={item} onSubmit={handleSubmit} onCancel={onClose} loading={loading} />;
            case 'quizzes':
                return <QuizForm item={item} onSubmit={handleSubmit} onCancel={onClose} loading={loading} />;
            case 'subjects':
                return <SubjectForm item={item} onSubmit={handleSubmit} onCancel={onClose} loading={loading} />;
            case 'books':
                return <BookForm item={item} onSubmit={handleSubmit} onCancel={onClose} loading={loading} />;
            case 'syllabus':
                return <SyllabusForm item={item} onSubmit={handleSubmit} onCancel={onClose} loading={loading} />;
            default:
                return <div>Form not available for {entity}</div>;
        }
    };

    return (
        <FormModal
            title={`${item ? 'Edit' : 'Create'} ${entity.charAt(0).toUpperCase() + entity.slice(1)}`}
            isOpen={true}
            onClose={onClose}
        >
            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
                    <p className="font-semibold">Error:</p>
                    <pre className="text-xs mt-1 overflow-auto max-h-32">{error}</pre>
                </div>
            )}
            {getFormComponent()}
        </FormModal>
    );
};

export default SuperuserDashboard;
