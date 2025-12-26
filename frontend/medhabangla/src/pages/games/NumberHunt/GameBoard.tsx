import React, { useState, useEffect, useCallback } from 'react';
import { Tile, getNumberHuntConfig, calculateNumberHuntScore } from './types';

interface GameBoardProps {
    level: number;
    onGameComplete: (success: boolean, score: number, mistakes: number, timeInSeconds: number) => void;
}

type GameState = 'idle' | 'countdown' | 'memorize' | 'playing' | 'won' | 'lost';

const GameBoard: React.FC<GameBoardProps> = ({ level, onGameComplete }) => {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
    const [nextNumber, setNextNumber] = useState(1);
    const [mistakes, setMistakes] = useState(0);
    const [clickedTile, setClickedTile] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [countdown, setCountdown] = useState(3);
    const [memorizeCountdown, setMemorizeCountdown] = useState(0);

    const config = getNumberHuntConfig(level);
    const maxMistakes = 3;

    const generateTiles = useCallback((): Tile[] => {
        const totalTiles = config.gridSize * config.gridSize;
        const numbers = Array.from({ length: config.totalNumbers }, (_, i) => i + 1);
        const emptyTiles = Array.from({ length: totalTiles - config.totalNumbers }, () => null);

        const allTiles = [...numbers, ...emptyTiles];

        // Shuffle array
        for (let i = allTiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allTiles[i], allTiles[j]] = [allTiles[j], allTiles[i]];
        }

        return allTiles.map((number, index) => ({
            id: index,
            number,
            isRevealed: false,
            isCorrect: false,
            isWrong: false,
        }));
    }, [config]);

    const startGame = useCallback(() => {
        const newTiles = generateTiles();
        setTiles(newTiles);
        setGameState('countdown');
        setNextNumber(1);
        setMistakes(0);
        setClickedTile(null);
        setCountdown(3);
        setRevealedTiles([]);

        // Countdown: 3, 2, 1...
        let count = 3;
        const countdownInterval = setInterval(() => {
            count--;
            setCountdown(count);
            if (count === 0) {
                clearInterval(countdownInterval);

                // Show numbers for memorization
                setGameState('memorize');
                const numberedTileIds = newTiles
                    .filter((t) => t.number !== null)
                    .map((t) => t.id);
                setRevealedTiles(numberedTileIds);

                // Start memorize countdown
                setMemorizeCountdown(Math.ceil(config.memorizeTime / 1000));
                const memorizeInterval = setInterval(() => {
                    setMemorizeCountdown((prev) => {
                        if (prev <= 1) {
                            clearInterval(memorizeInterval);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                // Hide numbers after memorize time
                setTimeout(() => {
                    setRevealedTiles([]);
                    setGameState('playing');
                    setStartTime(Date.now());
                }, config.memorizeTime);
            }
        }, 1000);
    }, [generateTiles, config.memorizeTime]);

    const handleTileClick = (tileId: number) => {
        if (gameState !== 'playing') return;

        const tile = tiles.find((t) => t.id === tileId);
        if (!tile || tile.number === null || tile.isCorrect) return;

        setClickedTile(tileId);
        setRevealedTiles((prev) => [...prev, tileId]);

        if (tile.number === nextNumber) {
            // Correct!
            setTiles((prev) =>
                prev.map((t) => (t.id === tileId ? { ...t, isCorrect: true } : t))
            );

            if (nextNumber === config.totalNumbers) {
                // Won!
                const timeInSeconds = startTime ? (Date.now() - startTime) / 1000 : 0;
                const score = calculateNumberHuntScore(level, timeInSeconds, mistakes);

                setGameState('won');
                setTimeout(() => {
                    onGameComplete(true, score, mistakes, timeInSeconds);
                }, 500);
            } else {
                setNextNumber((prev) => prev + 1);
            }

            setTimeout(() => setClickedTile(null), 300);
        } else {
            // Wrong!
            setTiles((prev) =>
                prev.map((t) => (t.id === tileId ? { ...t, isWrong: true } : t))
            );
            setMistakes((prev) => prev + 1);

            setTimeout(() => {
                setTiles((prev) =>
                    prev.map((t) => (t.id === tileId ? { ...t, isWrong: false } : t))
                );
                setRevealedTiles((prev) => prev.filter((id) => id !== tileId));
                setClickedTile(null);
            }, 500);

            if (mistakes + 1 >= maxMistakes) {
                setTimeout(() => {
                    const timeInSeconds = startTime ? (Date.now() - startTime) / 1000 : 0;
                    setGameState('lost');
                    onGameComplete(false, 0, mistakes + 1, timeInSeconds);
                }, 500);
            }
        }
    };

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'playing' && startTime) {
            interval = setInterval(() => {
                setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState, startTime]);

    useEffect(() => {
        startGame();
    }, [startGame]);

    const getTileClass = (tile: Tile): string => {
        const baseClass = 'aspect-square rounded-lg transition-all duration-200 flex items-center justify-center text-2xl font-bold';

        if (tile.isCorrect) {
            return `${baseClass} bg-green-500 dark:bg-green-600 text-white scale-95`;
        }

        if (tile.isWrong) {
            return `${baseClass} bg-red-500 dark:bg-red-600 text-white animate-shake`;
        }

        if (revealedTiles.includes(tile.id) && tile.number !== null) {
            return `${baseClass} bg-blue-500 dark:bg-blue-600 text-white cursor-pointer hover:scale-105`;
        }

        if (tile.number !== null) {
            return `${baseClass} bg-gray-300 dark:bg-gray-700 text-gray-300 dark:text-gray-700 cursor-pointer hover:scale-105 hover:bg-gray-400 dark:hover:bg-gray-600`;
        }

        return `${baseClass} bg-gray-200 dark:bg-gray-800 cursor-not-allowed`;
    };

    const getTileContent = (tile: Tile): string => {
        if (tile.isCorrect) return '✓';
        if (tile.isWrong) return '✗';
        if (revealedTiles.includes(tile.id) && tile.number !== null) {
            return tile.number.toString();
        }
        if (gameState === 'memorize' && tile.number !== null) {
            return tile.number.toString();
        }
        return '';
    };

    const getMessage = (): string => {
        if (gameState === 'idle') return 'Get ready...';
        if (gameState === 'countdown') return `Starting in ${countdown}...`;
        if (gameState === 'memorize') return `Memorize the numbers! (${memorizeCountdown}s remaining)`;
        if (gameState === 'playing') return `Find number: ${nextNumber}`;
        if (gameState === 'won') return '🎉 Perfect! You found all numbers!';
        if (gameState === 'lost') return '💪 Try again! You can do it!';
        return '';
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            {/* Stats */}
            <div className="mb-6 grid grid-cols-4 gap-4 text-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {nextNumber}/{config.totalNumbers}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {timeElapsed}s
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Time</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {mistakes}/{maxMistakes}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Mistakes</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {config.gridSize}×{config.gridSize}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Grid</div>
                </div>
            </div>

            {/* Message */}
            <div className="mb-4 text-center">
                {gameState === 'countdown' ? (
                    <div className="text-8xl font-bold text-purple-600 dark:text-purple-400 animate-pulse">
                        {countdown}
                    </div>
                ) : (
                    <>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {getMessage()}
                        </div>
                        {gameState === 'memorize' && (
                            <div className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400 animate-pulse">
                                {memorizeCountdown}s
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Game Board */}
            {gameState === 'countdown' ? (
                <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow-lg text-center">
                    <div className="text-6xl mb-4">🔢</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Get Ready!
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                        Memorize the number positions when they appear
                    </div>
                </div>
            ) : (
                <div
                    className="grid gap-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
                    style={{
                        gridTemplateColumns: `repeat(${config.gridSize}, minmax(0, 1fr))`,
                    }}
                >
                    {tiles.map((tile) => (
                        <button
                            key={tile.id}
                            onClick={() => handleTileClick(tile.id)}
                            disabled={gameState !== 'playing' || tile.isCorrect || tile.number === null}
                            className={getTileClass(tile)}
                        >
                            {getTileContent(tile)}
                        </button>
                    ))}
                </div>
            )}

            {/* Instructions */}
            <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">How to Play:</h3>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Memorize the number positions during the countdown</li>
                    <li>• Click numbers in order: 1 → 2 → 3 → ...</li>
                    <li>• You have {maxMistakes} lives (mistakes allowed)</li>
                    <li>• Faster completion = higher score!</li>
                </ul>
            </div>
        </div>
    );
};

export default GameBoard;
