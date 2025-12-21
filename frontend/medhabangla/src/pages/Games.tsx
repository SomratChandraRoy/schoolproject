import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Games: React.FC = () => {
  const navigate = useNavigate();
  const [userPoints] = useState(25); // For testing, set to a value above threshold
  const [requiredPoints] = useState(20);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  // Mock game data
  const games = [
    {
      id: 'memory_matrix',
      name: 'Memory Matrix',
      description: 'Test your memory skills by remembering patterns',
      icon: '🧠',
      minClass: 6,
      maxClass: 12,
      difficulty: 'Easy'
    },
    {
      id: 'equation_storm',
      name: 'Equation Storm',
      description: 'Solve math equations as fast as you can',
      icon: '⚡',
      minClass: 8,
      maxClass: 12,
      difficulty: 'Medium'
    },
    {
      id: 'pathfinder',
      name: 'Pathfinder',
      description: 'Find the optimal path through a maze',
      icon: '🧭',
      minClass: 6,
      maxClass: 12,
      difficulty: 'Medium'
    },
    {
      id: 'infinite_loop',
      name: 'Infinite Loop',
      description: 'A challenging puzzle game that\'s hard to beat',
      icon: '🌀',
      minClass: 9,
      maxClass: 12,
      difficulty: 'Hard'
    }
  ];

  // Timer effect for active game
  useEffect(() => {
    if (!activeGame || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up, end the game and redirect to dashboard
          setActiveGame(null);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [activeGame, timeLeft, navigate]);

  const startGame = (gameId: string) => {
    if (userPoints >= requiredPoints) {
      setActiveGame(gameId);
      setTimeLeft(600); // Reset to 10 minutes
    }
  };

  const endGame = () => {
    setActiveGame(null);
    // In a real app, you would save the game results here
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // If a game is active, show the game screen
  if (activeGame) {
    const currentGame = games.find(game => game.id === activeGame);
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* Game Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentGame?.name}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {currentGame?.description}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                    <svg className="mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {formatTime(timeLeft)}
                  </div>
                  <button
                    onClick={endGame}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition"
                  >
                    End Game Early
                  </button>
                </div>
              </div>
            </div>
            
            {/* Game Area */}
            <div className="px-6 py-12 sm:p-12">
              <div className="text-center">
                <div className="text-8xl mb-8">{currentGame?.icon}</div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Playing {currentGame?.name}</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                  Enjoy the game! Time remaining: {formatTime(timeLeft)}
                </p>
                
                {/* Game simulation */}
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 max-w-2xl mx-auto">
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((item) => (
                      <div 
                        key={item} 
                        className="h-20 bg-white dark:bg-gray-600 rounded-lg shadow flex items-center justify-center text-2xl cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
                      Action 1
                    </button>
                    <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition">
                      Action 2
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Mind Zone</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Gamified learning experiences to boost cognitive abilities
          </p>
        </div>

        {/* Points Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Your Points</h2>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{userPoints}</p>
            </div>
            <div className="mt-4 md:mt-0">
              {userPoints >= requiredPoints ? (
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  <svg className="mr-1.5 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  You can play games!
                </div>
              ) : (
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                  <svg className="mr-1.5 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Need {requiredPoints - userPoints} more points to play
                </div>
              )}
            </div>
          </div>
          
          {userPoints < requiredPoints && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${(userPoints / requiredPoints) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span>0 points</span>
                <span>{requiredPoints} points required</span>
              </div>
            </div>
          )}
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {games.map(game => (
            <div key={game.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="text-6xl text-center mb-4">{game.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">{game.name}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-center mb-4 text-sm">{game.description}</p>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                    {game.difficulty}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Classes {game.minClass}-{game.maxClass}
                  </span>
                </div>
                
                {userPoints >= requiredPoints ? (
                  <button
                    onClick={() => startGame(game.id)}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
                  >
                    Play Now
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-300 font-medium rounded-md cursor-not-allowed"
                  >
                    Locked
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* How to Play */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-4">How to Play</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-500 text-white">
                  1
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-base font-medium text-blue-800 dark:text-blue-200">Earn Points</h4>
                <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  Take quizzes and complete activities to earn points.
                </p>
              </div>
            </div>
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-500 text-white">
                  2
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-base font-medium text-blue-800 dark:text-blue-200">Unlock Games</h4>
                <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  Accumulate 20 points to unlock access to games.
                </p>
              </div>
            </div>
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-500 text-white">
                  3
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-base font-medium text-blue-800 dark:text-blue-200">Play & Learn</h4>
                <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  Enjoy 10 minutes of gameplay to boost your cognitive skills.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Games;