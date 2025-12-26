import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameData, GameSession } from '../../services/gameService';

interface GameCardProps {
    game: GameData;
    session?: GameSession;
}

const GameCard: React.FC<GameCardProps> = ({ game, session }) => {
    const navigate = useNavigate();

    const handlePlay = () => {
        // Map game types to routes
        const gameRoutes: { [key: string]: string } = {
            'memory_pattern': '/games/memory_pattern',
            'ship_find': '/games/ship_find',
            'number_hunt': '/games/number_hunt',
            'memory_matrix': '/games/memory_matrix',
            'math_quiz': '/games/math_quiz',
            'equation_storm': '/games/equation_storm',
            'word_puzzle': '/games/word_puzzle',
            'pattern_matching': '/games/pattern_matching',
            'pathfinder': '/games/pathfinder',
            'infinite_loop': '/games/infinite_loop',
        };

        const route = gameRoutes[game.game_type] || `/games/${game.game_type}`;
        navigate(route);
    };

    const getGameIcon = (gameType: string) => {
        const icons: { [key: string]: string } = {
            memory_pattern: '🧠',
            ship_find: '🚢',
            number_hunt: '🔢',
            memory_matrix: '🎯',
            math_quiz: '➕',
            equation_storm: '⚡',
            word_puzzle: '📝',
            pattern_matching: '🎨',
            pathfinder: '🧭',
            infinite_loop: '🌀',
        };
        return icons[gameType] || '🎮';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
                <div className="text-6xl text-center mb-4">{getGameIcon(game.game_type)}</div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                    {game.name}
                </h3>

                <p className="text-gray-600 dark:text-gray-300 text-center mb-4 text-sm min-h-[40px]">
                    {game.description}
                </p>

                {session && (
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                        <div className="flex items-center gap-2 justify-center">
                            <span className="text-yellow-500">🏆</span>
                            <span className="text-gray-700 dark:text-gray-300">{session.session_score} pts</span>
                        </div>
                        <div className="flex items-center gap-2 justify-center">
                            <span className="text-blue-500">📊</span>
                            <span className="text-gray-700 dark:text-gray-300">
                                Level {session.current_level}
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        Grades {game.min_grade}-{game.max_grade}
                    </span>
                    {session && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            🔥 {session.current_streak} streak
                        </span>
                    )}
                </div>

                <button
                    onClick={handlePlay}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition flex items-center justify-center gap-2"
                >
                    <span>▶️</span>
                    {session ? 'Continue' : 'Play Now'}
                </button>
            </div>
        </div>
    );
};

export default GameCard;
