import React, { useState, useEffect } from 'react';

interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_member: boolean;
    is_student: boolean;
    is_teacher: boolean;
    is_admin: boolean;
    date_joined: string;
}

const MemberManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    useEffect(() => {
        fetchUsers();
    }, [filterRole]);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            let url = '/api/superuser/accounts/users/';

            if (filterRole !== 'all') {
                url += `?role=${filterRole}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Handle both array and paginated response
                if (Array.isArray(data)) {
                    setUsers(data);
                } else if (data.results && Array.isArray(data.results)) {
                    setUsers(data.results);
                } else {
                    console.error('Unexpected API response format:', data);
                    setUsers([]);
                }
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleMemberStatus = async (userId: number, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/superuser/accounts/users/${userId}/toggle_member/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_member: !currentStatus })
            });

            if (response.ok) {
                const data = await response.json();
                // Update local state
                setUsers(users.map(user =>
                    user.id === userId ? { ...user, is_member: data.is_member } : user
                ));
                alert(data.message);
            }
        } catch (error) {
            console.error('Error toggling member status:', error);
            alert('Failed to update member status');
        }
    };

    const filteredUsers = Array.isArray(users) ? users.filter(user => {
        const matchesSearch =
            user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.last_name?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
    }) : [];

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    👥 Member Role Management
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Manage which users have access to the chat system. Only members can use chat features.
                </p>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users..."
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Users</option>
                        <option value="student">Students</option>
                        <option value="teacher">Teachers</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 dark:text-blue-400">Total Users</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {Array.isArray(users) ? users.length : 0}
                        </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <p className="text-sm text-green-600 dark:text-green-400">Members</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {Array.isArray(users) ? users.filter(u => u.is_member).length : 0}
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Non-Members</p>
                        <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                            {Array.isArray(users) ? users.filter(u => !u.is_member).length : 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Member Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                            {user.first_name?.[0] || user.username[0]}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {user.first_name} {user.last_name}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                @{user.username}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-wrap gap-1">
                                        {user.is_admin && (
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                Admin
                                            </span>
                                        )}
                                        {user.is_teacher && (
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                Teacher
                                            </span>
                                        )}
                                        {user.is_student && (
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                Student
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${user.is_member
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                        {user.is_member ? '✓ Member' : '✗ Not Member'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <button
                                        onClick={() => toggleMemberStatus(user.id, user.is_member)}
                                        className={`px-4 py-2 rounded-lg font-medium transition ${user.is_member
                                            ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                                            }`}
                                    >
                                        {user.is_member ? 'Remove Member' : 'Make Member'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">No users found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemberManagement;
