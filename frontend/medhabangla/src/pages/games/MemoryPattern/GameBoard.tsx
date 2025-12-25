import React, { useState, useEffect, useCallback } from 'react';

interface GameBoardProps {
    level: number;
    onGameComplete: (success: boolean, score: number, patternLength: number, timeTaken: number) => void;
}

interface Color {
    id: number;
    bg: string;
    active: string;
    name: string;
}

const COLORS: Color[] = [
    { id: 0, bg: 'bg-red-500', active: 'bg-red-300', name: 'red' },
    { id: 1, bg: 'bg-blue-500', active: 'bg-blue-300', name: 'blue' },
    { id: 2, bg: 'bg-green-500', active: 'bg-green-300', name: 'green' },
    { id: 3, bg: 'bg-yellow-500', active: 'bg-yellow-300', name: 'yellow' },
    { id: 4, bg: 'bg-purple-500', active: 'bg-purple-300', name: 'purple' },
    { id: 5, bg: 'bg-pink-500', active: 'bg-pink-300', name: 'pink' },
    { id: 6, bg: 'bg-orange-500', active: 'bg-orange-300', name: 'orange' },
    { id: 7, bg: 'bg-teal-500', active: 'bg-teal-300', name: 'teal' },
];

const GameBoard: React.FC<GameBoardProps> = ({ level, onGameComplete }) => {
    const [pattern, setPattern] = useState<number[]>([]);
    const [userPattern, setUserPattern] = useState<number[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isUserTurn, setIsUserTurn] = useState(false);
    const [activeCell, setActiveCell] = useState<number | null>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [message, setMessage] = useState('Click Start to begin!');
    const [startTime, setStartTime] = useState<number | null>(null);

    const getPatternLength = useCallback(() => {
        return Math.min(3 + level, 15);
    }, [level]);

    const getGridSize = useCallback(() => {
        if (level <= 3) return 4;
        if (level <= 6) return 6;
        return 8;
    }, [level]);

    const gridSize = getGridSize();
    const patternLength = getPatternLength();

    const generatePattern = useCallback(() => {
        const newPattern: number[] = [];
        for (let i = 0; i < patternLength; i++) {
            newPattern.push(Math.floor(Math.random() * gridSize));
        }
        return newPattern;
    }, [patternLength, gridSize]);

    const showPattern = useCallback(async (patternToShow: number[]) => {
        setIsPlaying(true);
        setMessage('Watch carefully...');

        for (let i = 0; i < patternToShow.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 600));
            setActiveCell(patternToShow[i]);
            await new Promise(resolve => setTimeout(resolve, 400));
            setActiveCell(null);
        }

        setIsPlaying(false);
        setIsUserTurn(true);
        setMessage('Now repeat the pattern!');
        setStartTime(Date.now());
    }, []);

    const startGame = useCallback(() => {
        const newPattern = generatePattern();
        setPattern(newPattern);
        setUserPattern([]);
        setGameStarted(true);
        setIsUserTurn(false);
        showPattern(newPattern);
    }, [generatePattern, showPattern]);

    const handleCellClick = (cellId: number) => {
        if (!isUserTurn || isPlaying) return;

        const newUserPattern = [...userPattern, cellId];
        setUserPattern(newUserPattern);

        setActiveCell(cellId);
        setTimeout(() => setActiveCell(null), 300);

        if (pattern[newUserPattern.length - 1] !== cellId) {
            setMessage('Wrong! Try again.');
            setIsUserTurn(false);
            const timeTaken = startTime ? (Date.now() - startTime) / 1000 : 0;

            setTimeout(() => {
                onGameComplete(false, 0, patternLength, timeTaken);
                setGameStarted(false);
                setMessage('Click Start to try again!');
            }, 1500);
            return;
        }

        if (newUserPattern.length === pattern.length) {
            const timeTaken = startTime ? (Date.now() - startTime) / 1000 : 0;
            const score = Math.round(1000 * (patternLength / timeTaken));

            setMessage('Perfect! Well done! 🎉');
            setIsUserTurn(false);

            setTimeout(() => {
                onGameComplete(true, score, patternLength, timeTaken);
                setGameStarted(false);
                setMessage('Click Start for next level!');
            }, 1500);
        }
    };

    const cols = gridSize === 4 ? 2 : gridSize === 6 ? 3 : 4;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="mb-6 text-center">
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-4">{message}</p>

                <div className="flex gap-4 justify-center">
                    <button
                        onClick={startGame}
                        disabled={gameStarted}
                        className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${gameStarted
                                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        <span>▶️</span>
                        {gameStarted ? 'Game in Progress' : 'Start Game'}
                    </button>

                    {gameStarted && (
                        <button
                            onClick={() => {
                                setGameStarted(false);
                                setIsUserTurn(false);
                                setMessage('Click Start to begin!');
                            }}
                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition flex items-center gap-2"
                        >
                            <span>🔄</span>
                            Reset
                        </button>
                    )}
                </div>
            </div>

            <div
                className="grid gap-4 mb-4"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
                {COLORS.slice(0, gridSize).map((color) => (
                    <button
                        key={color.id}
                        onClick={() => handleCellClick(color.id)}
                        disabled={!isUserTurn || isPlaying}
                        className={`
              aspect-square rounded-lg transition-all duration-200 transform
              ${activeCell === color.id ? color.active + ' scale-95' : color.bg}
              ${isUserTurn && !isPlaying ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed opacity-70'}
              disabled:cursor-not-allowed
            `}
                    />
                ))}
            </div>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                <p>Pattern Length: {patternLength} | Grid: {cols}x{Math.ceil(gridSize / cols)}</p>
                {isUserTurn && (
                    <p className="mt-2 text-blue-600 dark:text-blue-400 font-medium">
                        Progress: {userPattern.length}/{pattern.length}
                    </p>
                )}
            </div>
        </div>
    );
};

export default GameBoard;
