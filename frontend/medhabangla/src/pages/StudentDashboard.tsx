import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface Subject {
  id: number;
  name: string;
  color_code: string;
  icon?: string;
  progress_percentage: number;
  total: number;
  completed: number;
}

interface DashboardStats {
  overall_progress: number;
  total_subjects: number;
  total_topics: number;
  completed_topics: number;
  chart_data: Subject[];
}

const StudentDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    color_code: "#3B82F6",
    icon: "📚",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [activeChart, setActiveChart] = useState<"bar" | "pie" | "radar">(
    "bar",
  );

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "/api/academics/subjects/dashboard_stats/",
        {
          headers: { Authorization: `Token ${token}` },
        },
      );
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axios.post("/api/academics/subjects/", formData, {
        headers: { Authorization: `Token ${token}` },
      });

      setFormData({ name: "", color_code: "#3B82F6", icon: "📚" });
      setShowAddSubject(false);
      fetchStats();
    } catch (error) {
      console.error("Error adding subject:", error);
      alert("Failed to add subject. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    try {
      await axios.delete(`/api/academics/subjects/${subjectId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setDeleteConfirm(null);
      fetchStats();
    } catch (error) {
      console.error("Error deleting subject:", error);
      alert("Failed to delete subject");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!stats || stats.chart_data.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              📊 Study Dashboard
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Track your academic progress
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-6">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to Your Dashboard!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Add your subjects to start tracking your study progress. Set
              goals, monitor completion, and visualize your learning journey.
            </p>
            <button
              onClick={() => setShowAddSubject(true)}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105">
              <span className="mr-2 text-xl">➕</span>
              Add Your First Subject
            </button>
          </div>

          {showAddSubject && (
            <AddSubjectModal
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleAddSubject}
              onClose={() => setShowAddSubject(false)}
              submitting={submitting}
            />
          )}
        </div>
      </div>
    );
  }

  const displayData = stats.chart_data.map((item) => ({
    ...item,
    progress: item.progress_percentage || 0,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              📊 Study Dashboard
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Track your academic progress across all subjects
            </p>
          </div>
          <button
            onClick={() => setShowAddSubject(true)}
            className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center">
            <span className="mr-2">➕</span>
            Add Subject
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Overall Progress"
            value={`${stats.overall_progress}%`}
            icon="📈"
            color="blue"
            subtext={`${stats.completed_topics}/${stats.total_topics} topics`}
          />
          <KPICard
            title="Total Subjects"
            value={stats.total_subjects.toString()}
            icon="📚"
            color="purple"
            subtext="Active subjects"
          />
          <KPICard
            title="Topics Completed"
            value={stats.completed_topics.toString()}
            icon="✅"
            color="green"
            subtext={`of ${stats.total_topics} total`}
          />
          <KPICard
            title="Completion Rate"
            value={
              stats.total_topics > 0
                ? `${Math.round((stats.completed_topics / stats.total_topics) * 100)}%`
                : "0%"
            }
            icon="🎯"
            color="orange"
            subtext="Topics done"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Progress Bar Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Subject Progress
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Completion status for each subject
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveChart("bar")}
                  className={`px-3 py-1 rounded ${activeChart === "bar" ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"}`}>
                  📊
                </button>
                <button
                  onClick={() => setActiveChart("pie")}
                  className={`px-3 py-1 rounded ${activeChart === "pie" ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"}`}>
                  🥧
                </button>
                <button
                  onClick={() => setActiveChart("radar")}
                  className={`px-3 py-1 rounded ${activeChart === "radar" ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"}`}>
                  ⭐
                </button>
              </div>
            </div>

            <div className="w-full h-80">
              {activeChart === "bar" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Bar
                      dataKey="progress"
                      fill="#3b82f6"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {activeChart === "pie" && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={displayData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, progress }) => `${name}: ${progress}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="progress">
                      {displayData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color_code} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {activeChart === "radar" && (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={displayData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="name" stroke="#9ca3af" />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      stroke="#9ca3af"
                    />
                    <Radar
                      name="Progress %"
                      dataKey="progress"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Progress Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Progress Overview
            </h3>
            <div className="space-y-4">
              {displayData.map((subject, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-gray-900 dark:text-white flex items-center">
                      <span className="mr-2 text-lg">
                        {subject.icon || "📕"}
                      </span>
                      {subject.name}
                    </span>
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                      {subject.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${subject.progress}%`,
                        backgroundColor: subject.color_code,
                      }}></div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {subject.completed} of {subject.total} topics completed
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Subjects Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              📚 Your Subjects
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Subject
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Progress
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Topics
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Completion
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {displayData.map((subject) => (
                  <tr
                    key={subject.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: subject.color_code }}></div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {subject.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${subject.progress}%`,
                            backgroundColor: subject.color_code,
                          }}></div>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-gray-600 dark:text-gray-400">
                      {subject.completed}/{subject.total}
                    </td>
                    <td className="px-8 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          subject.progress >= 75
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : subject.progress >= 50
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : subject.progress >= 25
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}>
                        {subject.progress}%
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      {deleteConfirm === subject.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteSubject(subject.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm font-semibold hover:bg-red-600">
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded text-sm font-semibold hover:bg-gray-400">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(subject.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold text-sm">
                          🗑️ Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Subject Modal */}
        {showAddSubject && (
          <AddSubjectModal
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleAddSubject}
            onClose={() => setShowAddSubject(false)}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
};

// KPI Card Component
const KPICard: React.FC<{
  title: string;
  value: string;
  icon: string;
  color: "blue" | "purple" | "green" | "orange";
  subtext?: string;
}> = ({ title, value, icon, color, subtext }) => {
  const colorClasses = {
    blue: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400",
    purple:
      "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400",
    green:
      "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700 text-green-600 dark:text-green-400",
    orange:
      "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} border-2 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-transform hover:scale-105`}>
      <div className="text-3xl mb-3">{icon}</div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
        {title}
      </p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </p>
      {subtext && (
        <p className="text-xs text-gray-600 dark:text-gray-400">{subtext}</p>
      )}
    </div>
  );
};

// Add Subject Modal Component
interface AddSubjectModalProps {
  formData: { name: string; color_code: string; icon: string };
  setFormData: React.Dispatch<
    React.SetStateAction<{ name: string; color_code: string; icon: string }>
  >;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  submitting: boolean;
}

const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  formData,
  setFormData,
  onSubmit,
  onClose,
  submitting,
}) => {
  const colorOptions = [
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#F59E0B",
    "#10B981",
    "#06B6D4",
    "#EF4444",
    "#6366F1",
  ];

  const iconOptions = [
    "📚",
    "📕",
    "📖",
    "📗",
    "📘",
    "📙",
    "🎓",
    "✏️",
    "📝",
    "🖊️",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            ➕ Add New Subject
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Subject Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Subject Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Mathematics, Physics, History"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
              required
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Subject Icon
            </label>
            <div className="flex gap-2 flex-wrap">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-10 h-10 text-xl rounded-lg transition-all ${
                    formData.icon === icon
                      ? "ring-4 ring-blue-500 scale-110"
                      : "hover:scale-110 bg-gray-100 dark:bg-gray-700"
                  }`}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Progress Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, color_code: color })
                  }
                  className={`w-8 h-8 rounded-full transition-all ${
                    formData.color_code === color
                      ? "ring-4 ring-offset-2 ring-gray-400"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting || !formData.name}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 transition-all">
              {submitting ? "Adding..." : "Add Subject"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentDashboard;
