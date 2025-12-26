import React, { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import GameBoard from './GameBoard';
import gameService from '../../../services/gameService';

const NumberHunt: React.FC = () => {
    const [gameSession, setGameSession] = useState<any>(null);
    const [playerProfile, setPlayerProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);

    useEffect(() => {
        initializeGame();
    }, []);

    const initializeGame = async () => {
        try {
            // Get or create player profile
            const profile = await gameService.getProfile();
            setPlayerProfile(profile);

            // Start game session
            const session = await gameService.startSession('number_hunt');
            setGameSession(session.session);
            setLoading(false);
        } catch (error) {
            console.error('Error initializing game:', error);
            setLoading(false);
        }
    };

    const handleGameComplete = async (
        success: boolean,
        score: number,
        mistakes: number,
        timeInSeconds: number
    ) => {
        setIsPlaying(false);

        try {
            const result = await gameService.submitScore({
                session_uuid: gameSession.session_uuid,
                level: gameSession.current_level,
                score: score,
                time_taken: timeInSeconds,
                success: success,
                accuracy: success ? (100 - (mistakes * 10)) : 0,
                metadata: {
                    mistakes: mistakes,
                    game_type: 'number_hunt',
                },
            });

            setLastResult(result);
            setGameSession(result.session);
            setShowResults(true);

            setTimeout(() => {
                setShowResults(false);
            }, 3000);
        } catch (error) {
            console.error('Error submitting score:', error);
        }
    };

    const handlePlayAgain = () => {
        setShowResults(false);
        setIsPlaying(true);
    };

    if (loading || !gameSession) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navbar />
                <div className="max-w-7xl mx-auto py-12 px-4 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading game...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />

            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">🔢</span>
                        <h1 className="text-3xl font-bold">Number Hunt</h1>
                    </div>
                    <p className="text-lg opacity-90">Click numbers in order as fast as you can!</p>

                    {/* Game Stats */}
                    <div className="mt-4 flex flex-wrap gap-4 text-sm">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                            <span className="opacity-75">Level: </span>
                            <span className="font-bold text-lg">{gameSession.current_level}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                            <span className="opacity-75">Score: </span>
                            <span className="font-bold text-lg">{gameSession.session_score}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                            <span className="opacity-75">Streak: </span>
                            <span className="font-bold text-lg">{gameSession.current_streak}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Results Modal */}
                {showResults && lastResult && (
                    <div className="mb-6 bg-white dark:bg-gray-800 border-2 border-green-500 rounded-lg p-6 shadow-lg">
                        <div className="text-center">
                            <div className="text-6xl mb-3">
                                {lastResult.score.success ? '🎉' : '💪'}
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                                {lastResult.score.success ? 'Excellent!' : 'Keep Trying!'}
                            </h3>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                        {lastResult.score.score}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                        {lastResult.score.time_taken.toFixed(1)}s
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Time</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                        +{lastResult.score.bonus_points}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Bonus</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Game Area */}
                {!isPlaying ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center shadow-lg">
                        <div className="text-6xl mb-4">🔢</div>
                        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                            Ready to Hunt Numbers?
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                            Memorize the positions, then click numbers in order!
                        </p>
                        <p className="text-lg mb-8 text-gray-700 dark:text-gray-300">
                            Current Level: <span className="font-bold text-purple-600 dark:text-purple-400">{gameSession.current_level}</span>
                        </p>
                        <button
                            onClick={() => setIsPlaying(true)}
                            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-lg font-semibold transition flex items-center gap-2 mx-auto"
                        >
                            <span>▶️</span>
                            Start Game
                        </button>
                    </div>
                ) : (
                    <GameBoard
                        level={gameSession.current_level}
                        onGameComplete={handleGameComplete}
                    />
                )}

                {/* Instructions */}
                <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                        📖 Game Rules
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6 text-gray-700 dark:text-gray-300">
                        <div>
                            <h4 className="font-semibold mb-2 text-purple-600 dark:text-purple-400">Objective:</h4>
                            <ul className="space-y-1 text-sm">
                                <li>• Memorize number positions during countdown</li>
                                <li>• Click numbers in sequential order (1→2→3...)</li>
                                <li>• Complete all numbers to win</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">Scoring:</h4>
                            <ul className="space-y-1 text-sm">
                                <li>• Base score: 1000 points × level</li>
                                <li>• Time bonus: faster = more points</li>
                                <li>• Mistake penalty: -100 points per mistake</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2 text-red-600 dark:text-red-400">Lives:</h4>
                            <ul className="space-y-1 text-sm">
                                <li>• You have 3 lives (mistakes allowed)</li>
                                <li>• Wrong click = lose 1 life</li>
                                <li>• Game over if you lose all lives</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2 text-orange-600 dark:text-orange-400">Levels:</h4>
                            <ul className="space-y-1 text-sm">
                                <li>• Level 1-2: 3×3 grid, 6 numbers, 5s memorize</li>
                                <li>• Level 3-4: 4×4 grid, 12 numbers, 6s memorize</li>
                                <li>• Level 5-6: 5×5 grid, 20 numbers, 7s memorize</li>
                                <li>• Level 7+: 5×5 grid, 25 numbers, 8s memorize</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NumberHunt;
