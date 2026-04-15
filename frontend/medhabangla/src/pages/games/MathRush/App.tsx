import { useState, useCallback, useEffect } from "react";
import { HomeScreen } from "./components/HomeScreen";
import { GameScreen } from "./components/GameScreen";
import { ResultsScreen } from "./components/ResultsScreen";
import type { GameStats } from "@/lib/math-engine";
import "./index.css";

type Screen = "home" | "game" | "results";

const HIGH_SCORE_KEY = "mathrush_high_score";

function getStoredHighScore(): number {
  try {
    return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [lastStats, setLastStats] = useState<GameStats | null>(null);
  const [highScore, setHighScore] = useState(getStoredHighScore);

  const handleStart = useCallback(() => {
    setScreen("game");
  }, []);

  const handleFinish = useCallback(
    (stats: GameStats) => {
      setLastStats(stats);
      setScreen("results");

      if (stats.totalCorrect > highScore) {
        setHighScore(stats.totalCorrect);
        try {
          localStorage.setItem(HIGH_SCORE_KEY, stats.totalCorrect.toString());
        } catch {
          // ignore storage errors
        }
      }
    },
    [highScore],
  );

  const handlePlayAgain = useCallback(() => {
    setScreen("game");
  }, []);

  const handleHome = useCallback(() => {
    setScreen("home");
  }, []);

  // Update page title
  useEffect(() => {
    document.title = "MathRush - Infinite Math Challenge";
  }, []);

  return (
    <div className="mathrush-theme min-h-dvh bg-background">
      {screen === "home" && (
        <HomeScreen onStart={handleStart} highScore={highScore} />
      )}
      {screen === "game" && <GameScreen onFinish={handleFinish} />}
      {screen === "results" && lastStats && (
        <ResultsScreen
          stats={lastStats}
          onPlayAgain={handlePlayAgain}
          onHome={handleHome}
        />
      )}
    </div>
  );
}


