import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface RoundResult {
  success: boolean;
  score: number;
  timeTaken: number;
  accuracy: number;
  metadata: Record<string, any>;
}

interface GameBoardProps {
  level: number;
  iqLevel: number;
  columns: number;
  rows: number;
  timeLimit: number;
  imageUrl: string;
  onGameComplete: (result: RoundResult) => void;
}

interface TileCellProps {
  tileId: number;
  position: number;
  columns: number;
  rows: number;
  blankTileId: number;
  imageUrl: string;
  disabled: boolean;
  isMovable: boolean;
  onTapMove: () => void;
}

const createSolvedBoard = (columns: number, rows: number): number[] => {
  return Array.from({ length: columns * rows }, (_, index) => index);
};

const fisherYatesShuffle = (items: number[]): number[] => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
};

const getInversionCount = (board: number[], blankTileId: number): number => {
  const tiles = board.filter((tileId) => tileId !== blankTileId);
  let inversions = 0;

  for (let left = 0; left < tiles.length; left += 1) {
    for (let right = left + 1; right < tiles.length; right += 1) {
      if (tiles[left] > tiles[right]) {
        inversions += 1;
      }
    }
  }

  return inversions;
};

const isSolvable = (
  board: number[],
  columns: number,
  rows: number,
  blankTileId: number,
): boolean => {
  const inversions = getInversionCount(board, blankTileId);

  if (columns % 2 === 1) {
    return inversions % 2 === 0;
  }

  const blankIndex = board.indexOf(blankTileId);
  const blankRowFromBottom = rows - Math.floor(blankIndex / columns);

  if (blankRowFromBottom % 2 === 0) {
    return inversions % 2 === 1;
  }

  return inversions % 2 === 0;
};

const forceSolvable = (board: number[], blankTileId: number): number[] => {
  const nextBoard = [...board];
  const swapIndexes: number[] = [];

  for (let index = 0; index < nextBoard.length; index += 1) {
    if (nextBoard[index] !== blankTileId) {
      swapIndexes.push(index);
    }
    if (swapIndexes.length === 2) {
      break;
    }
  }

  if (swapIndexes.length === 2) {
    [nextBoard[swapIndexes[0]], nextBoard[swapIndexes[1]]] = [
      nextBoard[swapIndexes[1]],
      nextBoard[swapIndexes[0]],
    ];
  }

  return nextBoard;
};

const isSolved = (board: number[]): boolean => {
  return board.every((tileId, index) => tileId === index);
};

const isAdjacent = (
  fromIndex: number,
  toIndex: number,
  columns: number,
): boolean => {
  const fromRow = Math.floor(fromIndex / columns);
  const fromCol = fromIndex % columns;
  const toRow = Math.floor(toIndex / columns);
  const toCol = toIndex % columns;

  const rowDistance = Math.abs(fromRow - toRow);
  const colDistance = Math.abs(fromCol - toCol);

  return rowDistance + colDistance === 1;
};

const getCompletedTileCount = (board: number[]): number => {
  return board.reduce((matched, tileId, index) => {
    return tileId === index ? matched + 1 : matched;
  }, 0);
};

const createPlayableBoard = (columns: number, rows: number): number[] => {
  const solvedBoard = createSolvedBoard(columns, rows);
  const blankTileId = solvedBoard.length - 1;
  let shuffled = solvedBoard;
  let attempts = 0;

  do {
    shuffled = fisherYatesShuffle(solvedBoard);
    attempts += 1;
  } while (isSolved(shuffled) && attempts < 30);

  if (!isSolvable(shuffled, columns, rows, blankTileId)) {
    shuffled = forceSolvable(shuffled, blankTileId);
  }

  if (isSolved(shuffled)) {
    shuffled = forceSolvable(shuffled, blankTileId);
  }

  return shuffled;
};

const TileCell: React.FC<TileCellProps> = ({
  tileId,
  position,
  columns,
  rows,
  blankTileId,
  imageUrl,
  disabled,
  isMovable,
  onTapMove,
}) => {
  const isBlank = tileId === blankTileId;

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `cell-${position}`,
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `tile-${tileId}`,
    disabled: disabled || isBlank,
  });

  const setRefs = useCallback(
    (node: HTMLButtonElement | null) => {
      setDroppableRef(node);
      setDraggableRef(node);
    },
    [setDroppableRef, setDraggableRef],
  );

  const transformStyle = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const tileX = tileId % columns;
  const tileY = Math.floor(tileId / columns);
  const positionX = columns > 1 ? (tileX / (columns - 1)) * 100 : 0;
  const positionY = rows > 1 ? (tileY / (rows - 1)) * 100 : 0;

  return (
    <button
      type="button"
      ref={setRefs}
      {...attributes}
      {...listeners}
      onClick={onTapMove}
      disabled={disabled || isBlank}
      className={[
        "relative h-full w-full min-h-0 overflow-hidden rounded-xl border transition",
        "focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2",
        "select-none touch-none",
        isBlank
          ? "border-dashed border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800/60"
          : "border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900",
        isMovable && !isBlank ? "ring-2 ring-emerald-400/70" : "",
        isOver ? "ring-2 ring-cyan-400" : "",
        isDragging ? "z-20 scale-105 shadow-2xl" : "",
      ].join(" ")}
      style={{
        ...transformStyle,
        touchAction: "none",
        opacity: isDragging ? 0.95 : 1,
        backgroundImage: isBlank ? undefined : `url(${imageUrl})`,
        backgroundSize: `${columns * 100}% ${rows * 100}%`,
        backgroundPosition: `${positionX}% ${positionY}%`,
      }}>
      {!isBlank && (
        <span className="absolute right-1 top-1 rounded-full bg-white/85 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
          {tileId + 1}
        </span>
      )}
      {isBlank && (
        <span className="text-xs font-semibold text-slate-400">Empty</span>
      )}
    </button>
  );
};

const GameBoard: React.FC<GameBoardProps> = ({
  level,
  iqLevel,
  columns,
  rows,
  timeLimit,
  imageUrl,
  onGameComplete,
}) => {
  const totalTiles = useMemo(() => columns * rows, [columns, rows]);
  const blankTileId = useMemo(() => totalTiles - 1, [totalTiles]);

  const [board, setBoard] = useState<number[]>(() =>
    createPlayableBoard(columns, rows),
  );
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [statusMessage, setStatusMessage] = useState(
    "Drag or tap a tile next to the empty box.",
  );
  const [isFinished, setIsFinished] = useState(false);
  const [showReference, setShowReference] = useState(false);

  const completionLock = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
  );

  useEffect(() => {
    setBoard(createPlayableBoard(columns, rows));
    setMoves(0);
    setTimeLeft(timeLimit);
    setIsFinished(false);
    setShowReference(false);
    setStatusMessage("Drag or tap a tile next to the empty box.");
    completionLock.current = false;
  }, [columns, rows, timeLimit, imageUrl, level]);

  const finishRound = useCallback(
    (
      success: boolean,
      finalBoard: number[],
      finalMoves: number,
      finalTimeLeft: number,
    ) => {
      if (completionLock.current) {
        return;
      }

      completionLock.current = true;
      setIsFinished(true);

      const timeTaken = Math.max(1, timeLimit - finalTimeLeft);
      const completedTiles = getCompletedTileCount(finalBoard);
      const idealMoves = Math.max(20, totalTiles * 2 + columns + rows);

      const accuracy = success
        ? Math.max(
            35,
            Math.min(
              100,
              Math.round((idealMoves / Math.max(finalMoves, idealMoves)) * 100),
            ),
          )
        : Math.max(
            5,
            Math.min(100, Math.round((completedTiles / totalTiles) * 100)),
          );

      const score = success
        ? Math.max(
            200,
            Math.round(
              totalTiles * 125 +
                finalTimeLeft * 12 +
                Math.max(0, idealMoves - finalMoves) * 18 +
                level * 45,
            ),
          )
        : Math.max(0, Math.round(completedTiles * 18));

      setStatusMessage(
        success
          ? "Puzzle solved. Great focus!"
          : "Time is up. Try another round.",
      );

      onGameComplete({
        success,
        score,
        timeTaken,
        accuracy,
        metadata: {
          game_type: "image_dragger",
          grid_size: columns,
          grid_rows: rows,
          grid_columns: columns,
          grid_layout: `${columns}x${rows}`,
          tile_count: totalTiles,
          move_count: finalMoves,
          time_limit: timeLimit,
          time_remaining: finalTimeLeft,
          completed_tiles: completedTiles,
          image_url: imageUrl,
          iq_level_used: iqLevel,
          solvable_shuffle: true,
        },
      });
    },
    [
      columns,
      imageUrl,
      iqLevel,
      level,
      onGameComplete,
      rows,
      timeLimit,
      totalTiles,
    ],
  );

  useEffect(() => {
    if (isFinished) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((previousTime) => {
        if (previousTime <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return previousTime - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isFinished]);

  useEffect(() => {
    if (timeLeft === 0 && !isFinished) {
      finishRound(false, board, moves, 0);
    }
  }, [board, finishRound, isFinished, moves, timeLeft]);

  const performMove = useCallback(
    (tileId: number, targetCellIndex: number) => {
      if (isFinished) {
        return;
      }

      const sourceIndex = board.indexOf(tileId);
      const blankIndex = board.indexOf(blankTileId);

      if (sourceIndex === -1 || blankIndex === -1) {
        return;
      }

      if (
        targetCellIndex !== blankIndex ||
        !isAdjacent(sourceIndex, blankIndex, columns)
      ) {
        setStatusMessage("Only tiles next to the empty box can move.");
        return;
      }

      const nextBoard = [...board];
      [nextBoard[sourceIndex], nextBoard[blankIndex]] = [
        nextBoard[blankIndex],
        nextBoard[sourceIndex],
      ];

      const nextMoves = moves + 1;
      setBoard(nextBoard);
      setMoves(nextMoves);
      setStatusMessage("Nice move. Keep going.");

      if (isSolved(nextBoard)) {
        finishRound(true, nextBoard, nextMoves, timeLeft);
      }
    },
    [blankTileId, board, columns, finishRound, isFinished, moves, timeLeft],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) {
        return;
      }

      const activeTileId = Number(String(active.id).replace("tile-", ""));
      const targetCellIndex = Number(String(over.id).replace("cell-", ""));

      if (Number.isNaN(activeTileId) || Number.isNaN(targetCellIndex)) {
        return;
      }

      performMove(activeTileId, targetCellIndex);
    },
    [performMove],
  );

  const blankIndex = board.indexOf(blankTileId);
  const completedTiles = getCompletedTileCount(board);
  const timerPercent = Math.max(
    0,
    Math.min(100, (timeLeft / Math.max(1, timeLimit)) * 100),
  );
  const completionPercent = Math.round((completedTiles / totalTiles) * 100);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 sm:p-6">
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl bg-amber-50 p-3 text-center dark:bg-amber-900/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            Moves
          </p>
          <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
            {moves}
          </p>
        </div>
        <div className="rounded-2xl bg-cyan-50 p-3 text-center dark:bg-cyan-900/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
            Time Left
          </p>
          <p className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">
            {timeLeft}s
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3 text-center dark:bg-emerald-900/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            Grid
          </p>
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
            {columns}x{rows}
          </p>
        </div>
        <div className="rounded-2xl bg-violet-50 p-3 text-center dark:bg-violet-900/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
            Placed
          </p>
          <p className="text-2xl font-bold text-violet-900 dark:text-violet-100">
            {Math.max(0, completedTiles - 1)}/{totalTiles - 1}
          </p>
        </div>
      </div>

      <div className="mb-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-1000"
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 transition-all duration-300"
          style={{ width: `${completionPercent}%` }}
        />
      </div>

      <p className="mb-4 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {statusMessage}
      </p>

      <div className="grid gap-5 xl:grid-cols-[1.35fr,0.65fr]">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="mx-auto w-full max-w-[920px]">
            <div
              className="grid aspect-[4/3] gap-1 rounded-2xl bg-slate-100 p-2 shadow-inner dark:bg-slate-800 sm:gap-2"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
              }}>
              {board.map((tileId, position) => {
                const movable =
                  tileId !== blankTileId &&
                  isAdjacent(position, blankIndex, columns);

                return (
                  <TileCell
                    key={`cell-${position}-${tileId}`}
                    tileId={tileId}
                    position={position}
                    columns={columns}
                    rows={rows}
                    blankTileId={blankTileId}
                    imageUrl={imageUrl}
                    disabled={isFinished}
                    isMovable={movable && !isFinished}
                    onTapMove={() => {
                      if (movable && !isFinished) {
                        performMove(tileId, blankIndex);
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/80">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                Reference Image
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowReference((previous) => !previous);
                }}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                {showReference ? "Hide" : "Show"}
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800">
                {showReference ? (
                  <img
                    src={imageUrl}
                    alt="Reference"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-300">
                    Keep this hidden for full challenge. Toggle it if you need a
                    hint.
                  </div>
                )}
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Tip: corner and edge tiles are fastest anchors. Solve around the
              empty tile to reduce total moves.
            </p>
          </div>
        </DndContext>
      </div>
    </div>
  );
};

export type { RoundResult };
export default GameBoard;
