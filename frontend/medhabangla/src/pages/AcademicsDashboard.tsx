import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AcademicsDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/academics/subjects/dashboard_stats/', {
                    headers: { 'Authorization': 'Token ' + token }
                });
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching academic stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="text-center p-10">Loading...</div>;

    if (!stats || stats.chart_data?.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                <h2 className="text-2xl font-bold mb-4">Your Study Progress</h2>
                <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                    <p>You haven't added any subjects or syllabus topics yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Study Progress Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Subjects</h3>
                    <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{stats.total_subjects}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Overall Progress</h3>
                    <div className="flex items-center mt-2">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.overall_progress}%</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcademicsDashboard;
