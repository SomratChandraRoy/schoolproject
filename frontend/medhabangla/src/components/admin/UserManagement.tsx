import React, { useState, useEffect } from "react";
import {
  getAccessRoleLabel,
  getBanReason,
  isUserBanned,
} from "../../utils/roleUtils";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_student: boolean;
  is_teacher: boolean;
  is_admin: boolean;
  is_banned: boolean;
  ban_reason?: string;
  total_points: number;
  date_joined: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("user");

  // Debug log
  console.log("[UserManagement] Component mounted");

  useEffect(() => {
    void fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const url =
        roleFilter === "all"
          ? "/api/superuser/accounts/users/"
          : `/api/superuser/accounts/users/?role=${roleFilter}`;

      console.log("[UserManagement] Fetching users from:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      console.log("[UserManagement] Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[UserManagement] Raw data:", data);

        // Handle both array and paginated response
        let usersArray = [];
        if (Array.isArray(data)) {
          usersArray = data;
        } else if (data && Array.isArray(data.results)) {
          // DRF paginated response
          usersArray = data.results;
        } else if (data && typeof data === "object") {
          // Single object, wrap in array
          usersArray = [data];
        } else {
          usersArray = [];
        }

        console.log("[UserManagement] Users loaded:", usersArray.length);
        setUsers(usersArray);
        setError(null);
      } else {
        const errorText = await response.text();
        console.error("[UserManagement] Error response:", errorText);
        setError(
          `Failed to load users: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error("[UserManagement] Error fetching users:", error);
      setError("Network error: Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/superuser/accounts/users/${selectedUser.id}/ban_user/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ban_reason: banReason }),
        },
      );

      if (response.ok) {
        alert(`User ${selectedUser.username} has been banned`);
        setShowBanModal(false);
        setBanReason("");
        setSelectedUser(null);
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to ban user");
      }
    } catch (error) {
      console.error("Error banning user:", error);
      alert("Failed to ban user");
    }
  };

  const handleUnbanUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to unban ${user.username}?`))
      return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/superuser/accounts/users/${user.id}/unban_user/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );

      if (response.ok) {
        alert(`User ${user.username} has been unbanned`);
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to unban user");
      }
    } catch (error) {
      console.error("Error unbanning user:", error);
      alert("Failed to unban user");
    }
  };

  const handleChangeRole = async (newRole: string) => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/superuser/accounts/users/${selectedUser.id}/change_role/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        },
      );

      if (response.ok) {
        alert(`User ${selectedUser.username} role updated`);
        setShowRoleModal(false);
        setSelectedUser(null);
        setSelectedRole("user");
        void fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role");
    }
  };

  const filteredUsers = Array.isArray(users)
    ? users.filter(
        (user) =>
          user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  const getRoleBadge = (user: User) => {
    const roleLabel = getAccessRoleLabel(user.role, "User");

    return (
      <div className="flex flex-wrap gap-1">
        <span
          className={`px-2 py-1 text-xs rounded-full font-medium ${
            user.role === "ban"
              ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
              : "bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200"
          }`}>
          {roleLabel}
        </span>
        {user.is_teacher && (
          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
            Teacher
          </span>
        )}
        {user.is_admin && (
          <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
            Admin
          </span>
        )}
      </div>
    );
  };

  const canModifyUser = (_user: User) => {
    return true;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 border-2 border-red-500 rounded-lg p-6">
        <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
          ❌ Error Loading Users
        </h3>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Header */}
      <div className="bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 rounded-lg p-4 mb-4">
        <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">
          🔧 User Management Component (New)
        </h2>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          This is the new UserManagement component with ban/unban features
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
          <option value="all">All Users</option>
          <option value="ban">Ban</option>
          <option value="pro">Pro</option>
          <option value="lite">Lite</option>
          <option value="user">User</option>
          <option value="enterprise">Enterprise</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={
                    isUserBanned(user) ? "bg-red-50 dark:bg-red-900/10" : ""
                  }>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        @{user.username}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isUserBanned(user) ? (
                      <div>
                        <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full">
                          🚫 Banned
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {getBanReason(user)}
                        </div>
                      </div>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                        ✅ Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.total_points}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.date_joined).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canModifyUser(user) ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setSelectedRole(user.role || "user");
                            setShowRoleModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-md text-xs font-medium transition flex items-center gap-1"
                          title="Change Role">
                          <span>👤</span>
                          <span>Role</span>
                        </button>
                        {isUserBanned(user) ? (
                          <button
                            onClick={() => handleUnbanUser(user)}
                            className="px-3 py-1.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800 rounded-md text-xs font-medium transition flex items-center gap-1"
                            title="Unban User">
                            <span>✅</span>
                            <span>Unban</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowBanModal(true);
                            }}
                            className="px-3 py-1.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 rounded-md text-xs font-medium transition flex items-center gap-1"
                            title="Ban User">
                            <span>🚫</span>
                            <span>Ban</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Ban User: {selectedUser.username}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ban Reason
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter reason for banning this user..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason("");
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Change Role: {selectedUser.username}
            </h3>
            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Access Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                <option value="ban">Ban</option>
                <option value="pro">Pro</option>
                <option value="lite">Lite</option>
                <option value="user">User</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => void handleChangeRole(selectedRole)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                Update Role
              </button>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                  setSelectedRole("user");
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
