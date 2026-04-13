import React, { useCallback, useEffect, useState } from "react";
import gameService, {
  GameSession,
  ImageDraggerProfile,
  PlayerProfile,
} from "../../../services/gameService";
import GameBoard, { RoundResult } from "./GameBoard";

const PUZZLE_COLUMNS = 4;
const PUZZLE_ROWS = 3;
const PRIMARY_IMAGE_SIZE = 1400;
const FALLBACK_IMAGE_SIZE = 1200;
const IMAGE_LOAD_TIMEOUT_MS = 9000;

const createImageSeed = (): number => {
  return Math.floor(Math.random() * 1000000);
};

const buildPicsumUrl = (size: number, seed: number): string => {
  return `https://picsum.photos/${size}/${size}?random=${seed}`;
};

const preloadImage = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const image = new Image();
    const timeout = window.setTimeout(() => {
      image.src = "";
      resolve(false);
    }, IMAGE_LOAD_TIMEOUT_MS);

    image.onload = () => {
      window.clearTimeout(timeout);
      resolve(true);
    };

    image.onerror = () => {
      window.clearTimeout(timeout);
      resolve(false);
    };

    image.src = url;
  });
};

const ImageDragger: React.FC = () => {
  const initialSeed = createImageSeed();

  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(
    null,
  );
  const [adaptiveProfile, setAdaptiveProfile] =
    useState<ImageDraggerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingRound, setIsPreparingRound] = useState(false);
  const [imageSeed, setImageSeed] = useState<number>(initialSeed);
  const [imageUrl, setImageUrl] = useState<string>(
    buildPicsumUrl(PRIMARY_IMAGE_SIZE, initialSeed),
  );
  const [imageReady, setImageReady] = useState(false);
  const [imageStatus, setImageStatus] = useState("Checking image path...");
  const [lastResult, setLastResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void initializeGame();
  }, []);

  const prepareImage = useCallback(async (seed: number): Promise<boolean> => {
    const primaryUrl = buildPicsumUrl(PRIMARY_IMAGE_SIZE, seed);
    const fallbackUrl = buildPicsumUrl(FALLBACK_IMAGE_SIZE, seed + 17);

    setImageReady(false);
    setImageStatus(
      `Checking path: https://picsum.photos/${PRIMARY_IMAGE_SIZE}/${PRIMARY_IMAGE_SIZE}`,
    );

    if (await preloadImage(primaryUrl)) {
      setImageUrl(primaryUrl);
      setImageReady(true);
      setImageStatus(
        `Image ready (${PRIMARY_IMAGE_SIZE}x${PRIMARY_IMAGE_SIZE})`,
      );
      return true;
    }

    setImageStatus("Primary image failed. Trying fallback...");

    if (await preloadImage(fallbackUrl)) {
      setImageUrl(fallbackUrl);
      setImageReady(true);
      setImageStatus(
        `Fallback ready (${FALLBACK_IMAGE_SIZE}x${FALLBACK_IMAGE_SIZE})`,
      );
      return true;
    }

    setImageReady(false);
    setImageUrl(primaryUrl);
    setImageStatus("Image path check failed. Refresh image and retry.");
    return false;
  }, []);

  const initializeGame = async () => {
    setError(null);
    try {
      const sessionResult = await gameService.startSession("image_dragger");
      setGameSession(sessionResult.session);

      try {
        const profile = await gameService.getProfile();
        setPlayerProfile(profile);
      } catch (profileError) {
        console.warn("Profile fetch failed for Image Dragger:", profileError);
      }

      try {
        const imageProfile = await gameService.getImageDraggerProfile();
        setAdaptiveProfile(imageProfile);
      } catch (profileError) {
        console.warn("Adaptive profile unavailable:", profileError);
        setAdaptiveProfile({
          iq_level: 100,
          recommended_grid_size: 3,
          recommended_time_limit: 180,
          current_level: sessionResult.session.current_level || 1,
          games_played: 0,
          games_won: 0,
          win_rate: 0,
          best_time: null,
          avg_time: null,
          last_grid_size: 3,
        });
      }

      const seed = createImageSeed();
      setImageSeed(seed);
      const imageOk = await prepareImage(seed);
      if (!imageOk) {
        setError(
          "Image source is unavailable right now. Please refresh image.",
        );
      }
    } catch (error) {
      console.error("Error initializing Image Dragger:", error);
      setError("Failed to initialize the game session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const refreshAdaptiveProfile = async () => {
    try {
      const imageProfile = await gameService.getImageDraggerProfile();
      setAdaptiveProfile(imageProfile);
    } catch (error) {
      console.error("Error refreshing IQ profile:", error);
    }
  };

  const startRound = async () => {
    if (!gameSession) {
      setError("Game session unavailable. Please reload this page.");
      return;
    }

    setError(null);
    setLastResult(null);
    setIsPreparingRound(true);

    try {
      const nextSeed = createImageSeed();
      setImageSeed(nextSeed);

      const imageOk = await prepareImage(nextSeed);
      if (!imageOk) {
        setError("Could not load image from Picsum. Please try again.");
        return;
      }

      await refreshAdaptiveProfile();
      setIsPlaying(true);
    } finally {
      setIsPreparingRound(false);
    }
  };

  const refreshImage = async () => {
    setError(null);
    setIsPreparingRound(true);

    try {
      const nextSeed = createImageSeed();
      setImageSeed(nextSeed);
      const imageOk = await prepareImage(nextSeed);

      if (!imageOk) {
        setError("Image path check failed. Please retry after a moment.");
      }
    } finally {
      setIsPreparingRound(false);
    }
  };

  const handleGameComplete = async (roundResult: RoundResult) => {
    if (!gameSession) {
      return;
    }

    setIsPlaying(false);
    setIsSubmitting(true);

    try {
      const response = await gameService.submitScore({
        session_uuid: gameSession.session_uuid,
        level: gameSession.current_level,
        score: roundResult.score,
        time_taken: roundResult.timeTaken,
        success: roundResult.success,
        accuracy: roundResult.accuracy,
        metadata: roundResult.metadata,
      });

      setGameSession(response.session);
      setLastResult(response.score);
      await refreshAdaptiveProfile();
      setError(null);
    } catch (error) {
      console.error("Error submitting Image Dragger score:", error);
      setError("Score submit failed. Your local round result is still shown.");
      setLastResult({
        success: roundResult.success,
        score: roundResult.score,
        bonus_points: 0,
        time_taken: roundResult.timeTaken,
        accuracy: roundResult.accuracy,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const level =
    gameSession?.current_level ?? adaptiveProfile?.current_level ?? 1;
  const iqLevel = adaptiveProfile?.iq_level ?? 100;
  const gridLabel = `${PUZZLE_COLUMNS}x${PUZZLE_ROWS}`;
  const timeLimit = Math.max(
    120,
    adaptiveProfile?.recommended_time_limit ?? 180,
  );
  const imageSizeLabel = imageUrl.includes(
    `/${PRIMARY_IMAGE_SIZE}/${PRIMARY_IMAGE_SIZE}`,
  )
    ? `${PRIMARY_IMAGE_SIZE}x${PRIMARY_IMAGE_SIZE}`
    : `${FALLBACK_IMAGE_SIZE}x${FALLBACK_IMAGE_SIZE}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="mt-4 text-base font-semibold text-slate-700 dark:text-slate-200">
            Loading Image Dragger...
          </p>
        </div>
      </div>
    );
  }

  if (!gameSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <div className="mx-auto mb-4 text-5xl">⚠️</div>
          <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
            {error || "Game session unavailable."}
          </p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void initializeGame();
            }}
            className="mt-4 rounded-xl bg-amber-600 px-5 py-2.5 font-semibold text-white hover:bg-amber-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 pb-12 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 py-8 text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Image Dragger Puzzle
            </h1>
            <p className="mt-2 text-sm font-medium text-amber-50 sm:text-base">
              Bigger images, fixed 4x3 split, and verified path loading for a
              smoother puzzle experience.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-amber-100">
                Level
              </p>
              <p className="text-xl font-bold">{level}</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-amber-100">
                IQ
              </p>
              <p className="text-xl font-bold">{iqLevel}</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-amber-100">
                Grid
              </p>
              <p className="text-xl font-bold">{gridLabel}</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-amber-100">
                Timer
              </p>
              <p className="text-xl font-bold">{timeLimit}s</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-amber-100">
                Image
              </p>
              <p className="text-xl font-bold">{imageSizeLabel}</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-amber-100">
                Win Rate
              </p>
              <p className="text-xl font-bold">
                {Math.round(adaptiveProfile?.win_rate ?? 0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl px-4">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {lastResult && (
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-lg dark:border-slate-700 dark:bg-slate-900/85">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Last Round
                </p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {lastResult.success
                    ? "Solved! Brilliant focus."
                    : "Time ended. Try again."}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-amber-50 px-4 py-2 text-center dark:bg-amber-900/30">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Score
                  </p>
                  <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                    {lastResult.score}
                  </p>
                </div>
                <div className="rounded-xl bg-cyan-50 px-4 py-2 text-center dark:bg-cyan-900/30">
                  <p className="text-xs text-cyan-700 dark:text-cyan-300">
                    Time
                  </p>
                  <p className="text-lg font-bold text-cyan-900 dark:text-cyan-100">
                    {Number(lastResult.time_taken).toFixed(1)}s
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 px-4 py-2 text-center dark:bg-emerald-900/30">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Accuracy
                  </p>
                  <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                    {Math.round(lastResult.accuracy)}%
                  </p>
                </div>
                <div className="rounded-xl bg-rose-50 px-4 py-2 text-center dark:bg-rose-900/30">
                  <p className="text-xs text-rose-700 dark:text-rose-300">
                    Bonus
                  </p>
                  <p className="text-lg font-bold text-rose-900 dark:text-rose-100">
                    +{lastResult.bonus_points ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isPlaying ? (
          <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900/85 sm:p-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Ready For The Next Puzzle?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                This mode now uses a fixed 4x3 layout with a larger image from
                Picsum. We validate the image path before the round starts, then
                generate a solvable shuffle.
              </p>

              <div className="mt-5 grid gap-3 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                  Adaptive IQ: {iqLevel}
                </div>
                <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                  Puzzle Grid: {gridLabel}
                </div>
                <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                  Best Time:{" "}
                  {adaptiveProfile?.best_time
                    ? `${adaptiveProfile.best_time}s`
                    : "No win yet"}
                </div>
                <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                  Image Path: {imageReady ? "Verified" : "Checking"}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    void startRound();
                  }}
                  disabled={isSubmitting || isPreparingRound || !imageReady}
                  className="inline-flex items-center rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-3 text-base font-bold text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50">
                  {isSubmitting
                    ? "Saving score..."
                    : isPreparingRound
                      ? "Preparing image..."
                      : "Start Puzzle"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void refreshImage();
                  }}
                  disabled={isPreparingRound}
                  className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                  Refresh Image
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-lg dark:border-slate-700 dark:bg-slate-900/85">
              <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                <div className="relative aspect-[4/3] w-full">
                  {imageReady ? (
                    <img
                      src={imageUrl}
                      alt="Puzzle preview"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500 dark:text-slate-300">
                      Loading preview image...
                    </div>
                  )}
                </div>
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                How To Play
              </h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>1. Drag or tap a tile next to the empty slot.</li>
                <li>
                  2. Rebuild the full image in a 4x3 board before time ends.
                </li>
                <li>
                  3. Fewer moves and faster time increase score and IQ trend.
                </li>
                <li>4. Use Refresh Image if image loading fails.</li>
              </ul>
              <p className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {imageStatus}
              </p>
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                Source path: https://picsum.photos/{`{size}`}/{`{size}`}
              </p>
            </div>
          </div>
        ) : (
          <GameBoard
            level={level}
            iqLevel={iqLevel}
            columns={PUZZLE_COLUMNS}
            rows={PUZZLE_ROWS}
            timeLimit={timeLimit}
            imageUrl={imageUrl}
            onGameComplete={handleGameComplete}
          />
        )}
      </div>

      {playerProfile && (
        <p className="mt-8 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
          Player: {playerProfile.player_name} | Total Score:{" "}
          {playerProfile.total_score}
        </p>
      )}
    </div>
  );
};

export default ImageDragger;
