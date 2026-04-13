import React, { useState, useEffect, useCallback } from "react";
import { Ship, Cell, getShipFindConfig } from "./types";

interface GameBoardProps {
  level: number;
  onGameComplete: (
    success: boolean,
    score: number,
    clicks: number,
    timeInSeconds: number,
    hits: number,
  ) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ level, onGameComplete }) => {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [clicks, setClicks] = useState(0);
  const [hits, setHits] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const config = getShipFindConfig(level);

  // Initialize game board
  const initializeGame = useCallback(() => {
    const newGrid: Cell[][] = [];
    for (let row = 0; row < config.gridSize; row++) {
      const gridRow: Cell[] = [];
      for (let col = 0; col < config.gridSize; col++) {
        gridRow.push({
          row,
          col,
          isRevealed: false,
          hasShip: false,
          shipId: null,
          isHit: false,
          isMiss: false,
        });
      }
      newGrid.push(gridRow);
    }

    // Place ships
    const placedShips: Ship[] = [];
    const shipLengths = config.shipLengths;

    for (let i = 0; i < shipLengths.length; i++) {
      const length = shipLengths[i];
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 100) {
        const horizontal = Math.random() < 0.5;
        const row = Math.floor(Math.random() * config.gridSize);
        const col = Math.floor(Math.random() * config.gridSize);

        if (canPlaceShip(newGrid, row, col, length, horizontal)) {
          const positions = placeShip(
            newGrid,
            row,
            col,
            length,
            horizontal,
            i + 1,
          );
          placedShips.push({
            id: i + 1,
            length,
            positions,
            found: [],
            isComplete: false,
          });
          placed = true;
        }
        attempts++;
      }
    }

    setGrid(newGrid);
    setShips(placedShips);
    setClicks(0);
    setHits(0);
    setGameOver(false);
    setGameStarted(true);
    setStartTime(Date.now());
  }, [config]);

  const canPlaceShip = (
    grid: Cell[][],
    row: number,
    col: number,
    length: number,
    horizontal: boolean,
  ): boolean => {
    if (horizontal) {
      if (col + length > config.gridSize) return false;
      for (let i = 0; i < length; i++) {
        if (grid[row][col + i].hasShip) return false;
        // Check surrounding cells
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const newRow = row + dr;
            const newCol = col + i + dc;
            if (
              newRow >= 0 &&
              newRow < config.gridSize &&
              newCol >= 0 &&
              newCol < config.gridSize
            ) {
              if (grid[newRow][newCol].hasShip) return false;
            }
          }
        }
      }
    } else {
      if (row + length > config.gridSize) return false;
      for (let i = 0; i < length; i++) {
        if (grid[row + i][col].hasShip) return false;
        // Check surrounding cells
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const newRow = row + i + dr;
            const newCol = col + dc;
            if (
              newRow >= 0 &&
              newRow < config.gridSize &&
              newCol >= 0 &&
              newCol < config.gridSize
            ) {
              if (grid[newRow][newCol].hasShip) return false;
            }
          }
        }
      }
    }
    return true;
  };

  const placeShip = (
    grid: Cell[][],
    row: number,
    col: number,
    length: number,
    horizontal: boolean,
    shipId: number,
  ): [number, number][] => {
    const positions: [number, number][] = [];
    if (horizontal) {
      for (let i = 0; i < length; i++) {
        grid[row][col + i].hasShip = true;
        grid[row][col + i].shipId = shipId;
        positions.push([row, col + i]);
      }
    } else {
      for (let i = 0; i < length; i++) {
        grid[row + i][col].hasShip = true;
        grid[row + i][col].shipId = shipId;
        positions.push([row + i, col]);
      }
    }
    return positions;
  };

  const handleCellClick = (row: number, col: number) => {
    if (gameOver || grid[row][col].isRevealed) return;

    const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
    const cell = newGrid[row][col];
    cell.isRevealed = true;

    setClicks((prev) => prev + 1);

    if (cell.hasShip) {
      // Hit!
      cell.isHit = true;
      setHits((prev) => prev + 1);

      // Update ship found status
      const newShips = ships.map((ship) => {
        if (ship.id === cell.shipId) {
          const newFound = [...ship.found, [row, col] as [number, number]];
          const isComplete = newFound.length === ship.length;
          return { ...ship, found: newFound, isComplete };
        }
        return ship;
      });

      setShips(newShips);

      // Check if all ships are found
      const allShipsFound = newShips.every((ship) => ship.isComplete);
      if (allShipsFound) {
        setGameOver(true);
        const timeInSeconds = startTime
          ? Math.floor((Date.now() - startTime) / 1000)
          : 0;
        const score = calculateScore(timeInSeconds);
        setTimeout(() => {
          onGameComplete(true, score, clicks + 1, timeInSeconds, hits + 1);
        }, 500);
      }
    } else {
      // Miss
      cell.isMiss = true;
    }

    setGrid(newGrid);
  };

  const calculateScore = (timeInSeconds: number): number => {
    const baseScore = 1000;
    const levelMultiplier = level;
    const efficiencyBonus = Math.max(0, (hits * 3 - clicks) * 10);
    const timeBonus = Math.max(0, 500 - timeInSeconds);

    return Math.floor(
      (baseScore + efficiencyBonus + timeBonus) * levelMultiplier,
    );
  };

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const getCellClass = (cell: Cell): string => {
    const baseClass =
      "aspect-square rounded-lg transition-all duration-200 cursor-pointer hover:scale-105";

    if (!cell.isRevealed) {
      return `${baseClass} bg-blue-500 dark:bg-blue-600 hover:bg-blue-400`;
    }

    if (cell.isHit) {
      const ship = ships.find((s) => s.id === cell.shipId);
      if (ship?.isComplete) {
        return `${baseClass} bg-green-500 dark:bg-green-600`;
      }
      return `${baseClass} bg-red-500 dark:bg-red-600`;
    }

    if (cell.isMiss) {
      return `${baseClass} bg-gray-300 dark:bg-gray-700`;
    }

    return `${baseClass} bg-gray-200 dark:bg-gray-800`;
  };

  const getCellContent = (cell: Cell): string => {
    if (!cell.isRevealed) return "";
    if (cell.isHit) return "💥";
    if (cell.isMiss) return "💧";
    return "";
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {clicks}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Clicks</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {hits}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Hits</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {ships.filter((s) => s.isComplete).length}/{ships.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Ships Found
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div
        className="grid gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg"
        style={{
          gridTemplateColumns: `repeat(${config.gridSize}, minmax(0, 1fr))`,
        }}>
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              disabled={gameOver || cell.isRevealed}
              className={getCellClass(cell)}>
              <span className="text-2xl">{getCellContent(cell)}</span>
            </button>
          )),
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">
          How to Play:
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Click cells to find hidden ships</li>
          <li>• 💥 = Hit! You found part of a ship</li>
          <li>• 💧 = Miss! No ship here</li>
          <li>• Green = Complete ship found</li>
          <li>• Find all {ships.length} ships to win!</li>
        </ul>
      </div>
    </div>
  );
};

export default GameBoard;
