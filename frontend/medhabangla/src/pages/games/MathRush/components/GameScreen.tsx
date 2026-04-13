import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Square, Flame, Zap } from "lucide-react";
import { CircularTimer } from "./CircularTimer";
import { NumPad } from "./NumPad";
import { FloatingSymbols } from "./FloatingSymbols";
import {
  generateProblem,
  getDifficultyTier,
  createInitialStats,
  type MathProblem,
  type GameStats,
} from "@/lib/math-engine";

interface GameScreenProps {
  onFinish: (stats: GameStats) => void;
}

type FeedbackState = "correct" | "wrong" | "timeout" | null;

export function GameScreen({ onFinish }: GameScreenProps) {
  const [stats, setStats] = useState<GameStats>(createInitialStats());
  const [problem, setProblem] = useState<MathProblem>(() => generateProblem(0));
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(problem.timeLimit);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [difficulty, setDifficulty] = useState(0);
  const [problemKey, setProblemKey] = useState(0);

  const problemStartRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Timer
  useEffect(() => {
    if (feedback) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          handleTimeout();
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [problem, feedback]);

  const handleTimeout = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setFeedback("timeout");

    setStats((prev) => ({
      ...prev,
      totalSolved: prev.totalSolved + 1,
      totalWrong: prev.totalWrong + 1,
      currentStreak: 0,
    }));

    setTimeout(() => nextProblem(false), 1200);
  }, []);

  const nextProblem = useCallback(
    (wasCorrect: boolean) => {
      const newDiff = wasCorrect ? difficulty + 1 : Math.max(0, difficulty - 1);
      setDifficulty(newDiff);

      const newProblem = generateProblem(newDiff);
      setProblem(newProblem);
      setTimeLeft(newProblem.timeLimit);
      setAnswer("");
      setFeedback(null);
      setProblemKey((k) => k + 1);
      problemStartRef.current = Date.now();

      setTimeout(() => inputRef.current?.focus(), 100);
    },
    [difficulty],
  );

  const submitAnswer = useCallback(() => {
    if (feedback || !answer.trim()) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    const timeTaken = (Date.now() - problemStartRef.current) / 1000;
    const numAnswer = parseInt(answer, 10);
    const isCorrect = numAnswer === problem.answer;

    if (isCorrect) {
      setFeedback("correct");
      setStats((prev) => {
        const newStreak = prev.currentStreak + 1;
        return {
          ...prev,
          totalSolved: prev.totalSolved + 1,
          totalCorrect: prev.totalCorrect + 1,
          currentStreak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
          totalTimePlayed: prev.totalTimePlayed + timeTaken,
          highestDifficulty: Math.max(prev.highestDifficulty, difficulty),
          problemTimes: [...prev.problemTimes, timeTaken],
          averageTime: 0,
        };
      });
    } else {
      setFeedback("wrong");
      setStats((prev) => ({
        ...prev,
        totalSolved: prev.totalSolved + 1,
        totalWrong: prev.totalWrong + 1,
        currentStreak: 0,
        totalTimePlayed: prev.totalTimePlayed + timeTaken,
        problemTimes: [...prev.problemTimes, timeTaken],
      }));
    }

    setTimeout(() => nextProblem(isCorrect), 1000);
  }, [answer, feedback, problem, difficulty, nextProblem]);

  const handleStop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const finalStats = {
      ...stats,
      averageTime:
        stats.problemTimes.length > 0
          ? stats.problemTimes.reduce((a, b) => a + b, 0) /
            stats.problemTimes.length
          : 0,
    };
    onFinish(finalStats);
  };

  const handleDigit = (digit: string) => {
    if (feedback) return;
    setAnswer((prev) => prev + digit);
  };

  const handleDelete = () => {
    if (feedback) return;
    setAnswer((prev) => prev.slice(0, -1));
  };

  const handleNegative = () => {
    if (feedback) return;
    setAnswer((prev) => (prev.startsWith("-") ? prev.slice(1) : "-" + prev));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitAnswer();
    }
  };

  const tier = getDifficultyTier(difficulty);

  return (
    <div className="relative min-h-dvh flex flex-col items-center p-4 pb-6 overflow-hidden">
      <FloatingSymbols />

      {/* Top Bar */}
      <div className="relative z-10 w-full max-w-lg flex items-center justify-between mb-4">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleStop}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-card border border-border
                     text-muted-foreground font-semibold text-sm shadow-sm
                     hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors">
          <Square size={14} fill="currentColor" />
          Stop
        </motion.button>

        <div className="flex items-center gap-3">
          {/* Streak */}
          {stats.currentStreak > 1 && (
            <motion.div
              key={stats.currentStreak}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent/15 text-accent">
              <Flame size={14} />
              <span className="font-bold text-sm">{stats.currentStreak}</span>
            </motion.div>
          )}

          {/* Score */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
            <Zap size={14} />
            <span className="font-bold text-sm">{stats.totalCorrect}</span>
          </div>
        </div>
      </div>

      {/* Difficulty Badge */}
      <motion.div
        key={tier.name}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border shadow-sm mb-4">
        <span>{tier.emoji}</span>
        <span className="font-heading font-bold text-xs">{tier.name}</span>
        <span className="text-[10px] text-muted-foreground font-semibold ml-1">
          Lv.{difficulty + 1}
        </span>
      </motion.div>

      {/* Timer */}
      <div className="relative z-10 mb-5">
        <CircularTimer
          timeLeft={timeLeft}
          totalTime={problem.timeLimit}
          size={100}
        />
      </div>

      {/* Problem Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={problemKey}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative z-10 w-full max-w-sm mb-4">
          <div className="bg-card rounded-3xl border border-border shadow-lg p-6 text-center">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {problem.operationLabel}
            </div>
            <div className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
              {problem.question} = ?
            </div>

            {/* Answer display */}
            <div
              className={`
              relative h-16 flex items-center justify-center rounded-2xl border-2 transition-all duration-200
              ${
                feedback === "correct"
                  ? "border-emerald-400 bg-emerald-50"
                  : feedback === "wrong" || feedback === "timeout"
                    ? "border-red-400 bg-red-50 animate-shake"
                    : "mathrush-answer-shell-neutral"
              }
            `}>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={answer}
                onChange={(e) => {
                  if (!feedback) {
                    const val = e.target.value.replace(/[^0-9-]/g, "");
                    setAnswer(val);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="?"
                className="mathrush-answer-input w-full h-full bg-transparent text-center font-heading text-3xl font-bold leading-none
                           text-foreground placeholder:text-muted-foreground/40 border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                autoFocus
                disabled={!!feedback}
              />
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-3 text-sm font-bold ${
                    feedback === "correct" ? "text-emerald-600" : "text-red-500"
                  }`}>
                  {feedback === "correct" && "🎉 Correct!"}
                  {feedback === "wrong" && `❌ Nope! It was ${problem.answer}`}
                  {feedback === "timeout" &&
                    `⏰ Time's up! Answer: ${problem.answer}`}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* NumPad */}
      <div className="relative z-10 w-full max-w-sm">
        <NumPad
          onDigit={handleDigit}
          onDelete={handleDelete}
          onSubmit={submitAnswer}
          onNegative={handleNegative}
          disabled={!!feedback}
        />
      </div>
    </div>
  );
}
