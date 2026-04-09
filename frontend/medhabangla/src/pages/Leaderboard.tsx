import React, { useState, useEffect } from 'react';
interface LeaderboardEntry {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  total_points: number;
  class_level: number;
  profile_picture?: string;
  highest_score?: number; // For game leaderboards
}

interface Game {
  id: number;
  name: string;
}

const Leaderboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'global' | 'game'>('global');
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [gameLeaderboard, setGameLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGlobalLeaderboard();
    fetchGames();
  }, []);

  useEffect(() => {
    if (activeTab === 'game' && selectedGame) {
      fetchGameLeaderboard(selectedGame);
    }
  }, [activeTab, selectedGame]);

  const fetchGlobalLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/accounts/leaderboard/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setGlobalLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/games/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setGames(data);
        if (data.length > 0) {
          setSelectedGame(data[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const fetchGameLeaderboard = async (gameId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/games/leaderboard/${gameId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Transform game leaderboard data to match LeaderboardEntry
        const formattedData = data.map((entry: any) => ({
          id: entry.user.id,
          username: entry.user.username,
          first_name: entry.user.first_name,
          last_name: entry.user.last_name,
          total_points: entry.highest_score, // Use highest score as points for display
          class_level: entry.user.class_level,
          profile_picture: entry.user.profile_picture
        }));
        setGameLeaderboard(formattedData);
      }
    } catch (error) {
      console.error('Error fetching game leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderLeaderboardTable = (data: LeaderboardEntry[], isGame: boolean) => (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {data.length === 0 ? (
          <li className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
            No entries found.
          </li>
        ) : (
          data.map((entry, index) => (
            <li key={entry.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition duration-150 ease-in-out">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 min-w-[2rem] text-center">
                  {index < 3 ? (
                    <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-white font-bold ${
                      index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : 'bg-yellow-700'
                    }`}>
                      {index + 1}
                    </span>
                  ) : (
                    <span className="text-gray-500 font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="flex-shrink-0 h-10 w-10">
                  {entry.profile_picture ? (
                    <img className="h-10 w-10 rounded-full object-cover" src={entry.profile_picture} alt="" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                      {entry.first_name?.[0] || entry.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {entry.first_name && entry.last_name ? `${entry.first_name} ${entry.last_name}` : entry.username}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    Class {entry.class_level || 'N/A'}
                  </p>
                </div>
                <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                  {entry.total_points} {isGame ? 'Score' : 'Points'}
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Leaderboard</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            See who's topping the charts!
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-1 inline-flex">
            <button
              onClick={() => setActiveTab('global')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'global'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Global Ranking
            </button>
            <button
              onClick={() => setActiveTab('game')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'game'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Game High Scores
            </button>
          </div>
        </div>

        {activeTab === 'game' && (
          <div className="mb-6 flex justify-center">
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          renderLeaderboardTable(activeTab === 'global' ? globalLeaderboard : gameLeaderboard, activeTab === 'game')
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
