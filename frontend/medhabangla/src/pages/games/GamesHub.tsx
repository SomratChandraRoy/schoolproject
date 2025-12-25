import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import GameCard from '../../components/games/GameCard';
import Leaderboard from '../../components/games/Leaderboard';
import gameService, { GameData, GameSession, PlayerProfile } from '../../services/gameService';

const GamesHub: React.FC = () => {
    const [games, setGames] = useState<GameData[]>([]);
    const [sessions, setSessions] = useState<{ [key: string]: GameSession }>({});
    const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadGamesAndProfile();
    }, []);

    const loadGamesAndProfile = async () => {
        try {
            // Get or create player profile
            const profile = await gameService.getProfile();
            setPlayerProfile(profile);

            // Load games
            const gamesData = await gameService.getAllGames();
            console.log('Games data received:', gamesData);

            // Ensure gamesData is an array
            if (Array.isArray(gamesData)) {
                setGames(gamesData);
            } else {
                console.error('Games data is not an array:', gamesData);
                setGames([]);
            }

            // Load player sessions
            const sessionsData = await gameService.getPlayerSessions();
            console.log('Sessions data received:', sessionsData);

            if (Array.isArray(sessionsData)) {
                const sessionsMap: { [key: string]: GameSession } = {};
                sessionsData.forEach((session) => {
                    sessionsMap[session.game_type] = session;
                });
                setSessions(sessionsMap);
            } else {
                console.error('Sessions data is not an array:', sessionsData);
                setSessions({});
            }

            setLoading(false);
        } catch (error: any) {
            console.error('Error loading games:', error);
            console.error('Error details:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to load games';
            setError(errorMessage);
            setGames([]);
            setSessions({});
            setLoading(false);
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
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">
                            Failed to Load Games
                        </h2>
                        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                        <button
                            onClick={() => {
                                setError(null);
                                setLoading(true);
                                loadGamesAndProfile();
                            }}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                        >
                            Try Again
                        </button>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                            Make sure the backend server is running at http://localhost:8000
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-5xl">🎮</span>
                        <h1 className="text-4xl font-bold">Games Hub</h1>
                    </div>
                    <p className="text-xl opacity-90">
                        Learn while having fun! Play educational games and track your progress.
                    </p>

                    {playerProfile && (
                        <div className="mt-6 flex flex-wrap items-center gap-6 text-sm">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                                <span className="opacity-75">Total Score: </span>
                                <span className="font-bold text-lg">{playerProfile.total_score.toLocaleString()}</span>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                                <span className="opacity-75">Games Played: </span>
                                <span className="font-bold text-lg">{playerProfile.total_games_played}</span>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                                <span className="opacity-75">Grade: </span>
                                <span className="font-bold text-lg">{playerProfile.grade}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Games Grid */}
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            Available Games
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {games.map((game) => (
                                <GameCard
                                    key={game.id}
                                    game={game}
                                    session={sessions[game.game_type]}
                                />
                            ))}
                        </div>

                        {games.length === 0 && (
                            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                                <span className="text-6xl mb-4 block">🎮</span>
                                <p className="text-gray-600 dark:text-gray-400">
                                    No games available yet. Check back soon!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Leaderboard */}
                    <div>
                        <Leaderboard />
                    </div>
                </div>

                {/* How to Play Section */}
                <div className="mt-12 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-4">
                        🎯 How to Play
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-500 text-white text-lg font-bold">
                                    1
                                </div>
                            </div>
                            <div>
                                <h4 className="text-base font-medium text-blue-800 dark:text-blue-200">
                                    Choose a Game
                                </h4>
                                <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                    Select from our collection of educational games suited for your grade level.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-500 text-white text-lg font-bold">
                                    2
                                </div>
                            </div>
                            <div>
                                <h4 className="text-base font-medium text-blue-800 dark:text-blue-200">
                                    Play & Progress
                                </h4>
                                <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                    Complete levels, earn points, and build win streaks to climb the leaderboard.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-500 text-white text-lg font-bold">
                                    3
                                </div>
                            </div>
                            <div>
                                <h4 className="text-base font-medium text-blue-800 dark:text-blue-200">
                                    Earn Achievements
                                </h4>
                                <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                    Unlock achievements and compete with friends for the top spot!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GamesHub;
