import React, { useState, useEffect } from "react";
import GameBoard from "./GameBoard";
import gameService from "../../../services/gameService";

const ShipFind: React.FC = () => {
  const [gameSession, setGameSession] = useState<any>(null);
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = async () => {
    setError(null);
    try {
      // Start game session first; profile is optional for display.
      const session = await gameService.startSession("ship_find");
      setGameSession(session.session);

      try {
        const profile = await gameService.getProfile();
        setPlayerProfile(profile);
      } catch (profileError) {
        console.warn("Profile fetch failed for Ship Find:", profileError);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error initializing game:", error);
      setError("Failed to initialize Ship Find. Please try again.");
      setLoading(false);
    }
  };

  const handleGameComplete = async (
    success: boolean,
    score: number,
    clicks: number,
    timeInSeconds: number,
    hits: number,
  ) => {
    setIsPlaying(false);

    if (!gameSession) {
      setError("Game session expired. Please restart this game.");
      return;
    }

    try {
      const accuracy = success
        ? Math.max(
            0,
            Math.min(100, Math.round((hits / Math.max(clicks, 1)) * 100)),
          )
        : 0;

      const result = await gameService.submitScore({
        session_uuid: gameSession.session_uuid,
        level: gameSession.current_level,
        score: score,
        time_taken: timeInSeconds,
        success: success,
        accuracy: accuracy,
        metadata: {
          clicks: clicks,
          hits: hits,
          game_type: "ship_find",
        },
      });

      setLastResult(result);
      setGameSession(result.session);
      setShowResults(true);

      setTimeout(() => {
        setShowResults(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting score:", error);
      setError("Could not submit score. Please try playing again.");
    }
  };

  const handlePlayAgain = () => {
    setShowResults(false);
    setIsPlaying(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading game...
          </p>
        </div>
      </div>
    );
  }

  if (!gameSession) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto py-12 px-4 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error || "Game session not available."}
          </p>
          <button
            onClick={() => {
              setLoading(true);
              void initializeGame();
            }}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🚢</span>
            <h1 className="text-3xl font-bold">Ship Find</h1>
          </div>
          <p className="text-lg opacity-90">
            Find all the hidden ships on the grid!
          </p>

          {/* Game Stats */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="opacity-75">Level: </span>
              <span className="font-bold text-lg">
                {gameSession.current_level}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="opacity-75">Score: </span>
              <span className="font-bold text-lg">
                {gameSession.session_score}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="opacity-75">Streak: </span>
              <span className="font-bold text-lg">
                {gameSession.current_streak}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Results Modal */}
        {showResults && lastResult && (
          <div className="mb-6 bg-white dark:bg-gray-800 border-2 border-green-500 rounded-lg p-6 shadow-lg">
            <div className="text-center">
              <div className="text-6xl mb-3">
                {lastResult.score.success ? "🎉" : "💪"}
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {lastResult.score.success ? "Great Job!" : "Try Again!"}
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {lastResult.score.score}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Score
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {lastResult.score.time_taken.toFixed(1)}s
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Time
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    +{lastResult.score.bonus_points}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Bonus
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Area */}
        {!isPlaying ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center shadow-lg">
            <div className="text-6xl mb-4">🚢</div>
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Ready to Hunt Ships?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
              Find all hidden ships by clicking on the grid cells!
            </p>
            <p className="text-lg mb-8 text-gray-700 dark:text-gray-300">
              Current Level:{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {gameSession.current_level}
              </span>
            </p>
            <button
              onClick={() => setIsPlaying(true)}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg font-semibold transition flex items-center gap-2 mx-auto">
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
              <h4 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">
                Objective:
              </h4>
              <ul className="space-y-1 text-sm">
                <li>• Find all hidden ships on the grid</li>
                <li>• Click cells to reveal what's underneath</li>
                <li>• Complete ships turn green</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">
                Scoring:
              </h4>
              <ul className="space-y-1 text-sm">
                <li>• Base score: 1000 points × level</li>
                <li>• Efficiency bonus: fewer clicks = more points</li>
                <li>• Time bonus: faster completion = more points</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-purple-600 dark:text-purple-400">
                Symbols:
              </h4>
              <ul className="space-y-1 text-sm">
                <li>• 💥 Hit - You found part of a ship!</li>
                <li>• 💧 Miss - No ship in this cell</li>
                <li>• 🟢 Complete - Entire ship found</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-orange-600 dark:text-orange-400">
                Levels:
              </h4>
              <ul className="space-y-1 text-sm">
                <li>• Level 1-3: 6×6 grid, 2 ships</li>
                <li>• Level 4-6: 8×8 grid, 4 ships</li>
                <li>• Level 7-10: 10×10 grid, 6 ships</li>
                <li>• Level 11+: 12×12 grid, 8 ships</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipFind;
