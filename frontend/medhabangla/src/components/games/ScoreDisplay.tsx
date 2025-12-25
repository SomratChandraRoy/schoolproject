import React from 'react';
import { GameSession } from '../../services/gameService';

interface ScoreDisplayProps {
    session: GameSession;
    compact?: boolean;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ session, compact = false }) => {
    if (compact) {
        return (
            <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                    <span className="text-blue-500">📊</span>
                    <span className="font-bold text-gray-900 dark:text-white">L{session.current_level}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-yellow-500">🏆</span>
                    <span className="font-bold text-gray-900 dark:text-white">{session.session_score}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-orange-500">🔥</span>
                    <span className="font-bold text-gray-900 dark:text-white">{session.current_streak}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700">
                <div className="flex justify-center mb-1">
                    <span className="text-2xl">📊</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{session.current_level}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Level</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700">
                <div className="flex justify-center mb-1">
                    <span className="text-2xl">🏆</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{session.session_score}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Score</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700">
                <div className="flex justify-center mb-1">
                    <span className="text-2xl">📈</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{session.games_played}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Played</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700">
                <div className="flex justify-center mb-1">
                    <span className="text-2xl">🔥</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{session.current_streak}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Streak</div>
            </div>
        </div>
    );
};

export default ScoreDisplay;
