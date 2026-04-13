import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Atom,
  BarChart3,
  BookText,
  BrainCircuit,
  Calculator,
  Flame,
  Gamepad2,
  Grid3x3,
  Infinity,
  Map,
  Play,
  Puzzle,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { GameData, GameSession } from "../../services/gameService";

interface GameCardProps {
  game: GameData;
  session?: GameSession;
}

const GameCard: React.FC<GameCardProps> = ({ game, session }) => {
  const navigate = useNavigate();

  const handlePlay = () => {
    const externalGameUrls: { [key: string]: string } = {
      molecular_memory_mechanics:
        "https://molecular-memory-mechanic-61.created.app/",
    };

    const externalUrl = externalGameUrls[game.game_type];
    if (externalUrl) {
      window.open(externalUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // Map game types to routes
    const gameRoutes: { [key: string]: string } = {
      image_dragger: "/games/image_dragger",
      memory_matrix: "/games/memory_matrix",
      math_quiz: "/games/math_quiz",
      equation_storm: "/games/equation_storm",
      word_puzzle: "/games/word_puzzle",
      pattern_matching: "/games/pattern_matching",
      pathfinder: "/games/pathfinder",
      infinite_loop: "/games/infinite_loop",
    };

    const route = gameRoutes[game.game_type] || `/games/${game.game_type}`;
    navigate(route);
  };

  const getGameIcon = (gameType: string): LucideIcon => {
    const icons: { [key: string]: LucideIcon } = {
      image_dragger: Puzzle,
      memory_matrix: Grid3x3,
      math_quiz: Calculator,
      equation_storm: Zap,
      word_puzzle: BookText,
      pattern_matching: Grid3x3,
      pathfinder: Map,
      infinite_loop: Infinity,
      molecular_memory_mechanics: Atom,
    };
    return icons[gameType] || Gamepad2;
  };

  const GameIcon = getGameIcon(game.game_type);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
            <GameIcon className="h-9 w-9" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
          {game.name}
        </h3>

        <p className="text-gray-600 dark:text-gray-300 text-center mb-4 text-sm min-h-[40px]">
          {game.description}
        </p>

        {session && (
          <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
            <div className="flex items-center gap-2 justify-center">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-gray-700 dark:text-gray-300">
                {session.session_score} pts
              </span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <BarChart3 className="h-4 w-4 text-blue-500" />
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
              <span className="inline-flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" /> {session.current_streak}{" "}
                streak
              </span>
            </span>
          )}
        </div>

        <button
          onClick={handlePlay}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition flex items-center justify-center gap-2">
          <Play className="h-4 w-4" />
          {session ? "Continue" : "Play Now"}
        </button>
      </div>
    </div>
  );
};

export default GameCard;
