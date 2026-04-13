import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../../../hooks/useGame";
import ScoreDisplay from "../../../components/games/ScoreDisplay";
import GameBoard from "./GameBoard";

const MemoryPattern: React.FC = () => {
  const navigate = useNavigate();
  const { gameSession, loading, startGame, submitScore } =
    useGame("memory_pattern");
  const [isGameActive, setIsGameActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !gameSession) {
      handleStartSession();
    }
  }, [loading]);

  const handleStartSession = async () => {
    try {
      await startGame();
      setIsGameActive(false);
      setLocalError(null);
    } catch (error) {
      console.error("Error starting game:", error);
      setLocalError("Unable to start Memory Pattern session. Please retry.");
    }
  };

  const handleGameComplete = async (
    success: boolean,
    score: number,
    patternLength: number,
    timeTaken: number,
  ) => {
    setIsGameActive(false);

    if (!gameSession) {
      setLocalError("Game session expired. Please restart this game.");
      return;
    }

    try {
      const result = await submitScore({
        level: gameSession.current_level,
        score: score,
        time_taken: timeTaken,
        success: success,
        accuracy: success ? 100 : 0,
        metadata: { pattern_length: patternLength },
      });

      setLastResult(result);
      setShowResults(true);
      setLocalError(null);

      setTimeout(() => {
        setShowResults(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting score:", error);
      setLocalError("Could not submit score. Please play again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
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
            {localError || "Game session unavailable."}
          </p>
          <button
            onClick={handleStartSession}
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
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/games")}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>🧠</span>
                Memory Pattern
              </h1>
            </div>

            <ScoreDisplay session={gameSession} compact />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {localError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {localError}
          </div>
        )}

        {showResults && lastResult && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-6">
            <div className="text-center">
              <div className="text-5xl mb-3">
                {lastResult.score.success ? "🎉" : "💪"}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {lastResult.score.success ? "Great Job!" : "Try Again!"}
              </h3>
              <div className="flex justify-center gap-8 text-lg">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Score:{" "}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {lastResult.score.score}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Time:{" "}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {lastResult.score.time_taken.toFixed(2)}s
                  </span>
                </div>
                {lastResult.score.bonus_points > 0 && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Bonus:{" "}
                    </span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      +{lastResult.score.bonus_points}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!isGameActive ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-6">🧠</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Play?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Watch the pattern carefully, then repeat it!
            </p>
            <p className="text-lg mb-8 text-gray-700 dark:text-gray-300">
              Current Level:{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {gameSession.current_level}
              </span>
            </p>
            <button
              onClick={() => setIsGameActive(true)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2 mx-auto text-lg">
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
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">
            How to Play:
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Watch the sequence of colors light up</li>
            <li>• Click the colors in the same order</li>
            <li>• Complete the pattern correctly to level up</li>
            <li>• Higher levels have longer patterns and more colors</li>
            <li>• Earn bonus points for speed and accuracy</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MemoryPattern;
