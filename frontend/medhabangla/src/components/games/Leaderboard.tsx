import React from 'react';
import { useLeaderboard } from '../../hooks/useGame';

interface LeaderboardProps {
    gameType?: string;
    grade?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ gameType, grade }) => {
    const { leaderboard, loading } = useLeaderboard(gameType, grade);

    const getRankIcon = (index: number) => {
        if (index === 0) return <span className="text-2xl">🥇</span>;
        if (index === 1) return <span className="text-2xl">🥈</span>;
        if (index === 2) return <span className="text-2xl">🥉</span>;
        return <span className="text-xl font-bold text-gray-500 dark:text-gray-400">#{index + 1}</span>;
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                <div className="text-center text-gray-500 dark:text-gray-400">Loading leaderboard...</div>
            </div>
        );
    }

    if (leaderboard.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>🏆</span>
                    Leaderboard
                </h3>
                <div className="text-center text-gray-500 dark:text-gray-400">
                    No players yet. Be the first!
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>🏆</span>
                    Leaderboard
                </h3>
            </div>
            <div className="p-6">
                <div className="space-y-3">
                    {leaderboard.map((entry, index) => (
                        <div
                            key={entry.id}
                            className={`
                flex items-center justify-between p-4 rounded-lg
                ${index < 3
                                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700'
                                    : 'bg-gray-50 dark:bg-gray-700/50'
                                }
              `}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 flex justify-center">
                                    {getRankIcon(index)}
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        {entry.player_name}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Level {entry.highest_level}
                                        {entry.grade && ` • Grade ${entry.grade}`}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {entry.total_score.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">points</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
