import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

type ReviewStatus = "known" | "pending" | "unknown";

interface Flashcard {
  id: number;
  front: string;
  back: string;
  is_known: boolean;
  review_status: ReviewStatus;
}

interface FlashcardDeck {
  id: number;
  title: string;
  description?: string | null;
  cards_count: number;
  known_count: number;
  pending_count: number;
  unknown_count: number;
  cards: Flashcard[];
}

const SWIPE_THRESHOLD = 64;
const TAP_THRESHOLD = 10;
const TOTAL_CARDS_TARGET = 20;
const QUICK_BATCH_SIZE = 5;

const getCardTextClass = (text: string): string => {
  const length = (text || "").trim().length;
  if (length > 280) {
    return "text-base sm:text-lg";
  }
  if (length > 180) {
    return "text-lg sm:text-xl";
  }
  if (length > 100) {
    return "text-xl sm:text-2xl";
  }
  return "text-2xl sm:text-3xl";
};

const normalizeDeck = (deck: any): FlashcardDeck => {
  const cards = Array.isArray(deck?.cards)
    ? deck.cards.map((card: any) => {
        const fallbackStatus: ReviewStatus = card?.is_known
          ? "known"
          : "unknown";
        return {
          id: card.id,
          front: String(card.front || ""),
          back: String(card.back || ""),
          is_known: Boolean(card.is_known),
          review_status: (card.review_status || fallbackStatus) as ReviewStatus,
        };
      })
    : [];

  const knownCount = cards.filter(
    (card) => card.review_status === "known",
  ).length;
  const pendingCount = cards.filter(
    (card) => card.review_status === "pending",
  ).length;
  const unknownCount = cards.filter(
    (card) => card.review_status === "unknown",
  ).length;

  return {
    ...deck,
    cards,
    cards_count:
      typeof deck?.cards_count === "number" ? deck.cards_count : cards.length,
    known_count:
      typeof deck?.known_count === "number" ? deck.known_count : knownCount,
    pending_count:
      typeof deck?.pending_count === "number"
        ? deck.pending_count
        : pendingCount,
    unknown_count:
      typeof deck?.unknown_count === "number"
        ? deck.unknown_count
        : unknownCount,
  };
};

const normalizeDecksPayload = (payload: any): FlashcardDeck[] => {
  if (Array.isArray(payload)) {
    return payload.map(normalizeDeck);
  }

  if (payload && Array.isArray(payload.results)) {
    return payload.results.map(normalizeDeck);
  }

  return [];
};

const getGeneratedDeck = (payload: any): FlashcardDeck => {
  return normalizeDeck(payload?.deck || payload);
};

const getCreatedCount = (payload: any, fallback = 20): number => {
  if (typeof payload?.created_count === "number" && payload.created_count > 0) {
    return payload.created_count;
  }
  return fallback;
};

const topicFromDeck = (deck: FlashcardDeck | null): string => {
  if (!deck) {
    return "";
  }

  const text = deck.description || "";
  const match = text.match(/মূল বিষয়\s*:\s*(.+)$/i);
  if (match?.[1]) {
    return match[1].trim();
  }

  return text.trim();
};

const Flashcards: React.FC = () => {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [studyQueue, setStudyQueue] = useState<number[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [deckTitle, setDeckTitle] = useState("");
  const [activeTopic, setActiveTopic] = useState("");
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [continuingTopic, setContinuingTopic] = useState(false);
  const [backgroundGenerating, setBackgroundGenerating] = useState(false);
  const [backgroundCardsPending, setBackgroundCardsPending] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [error, setError] = useState("");
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchGestureRef = useRef(false);
  const topicInputRef = useRef<HTMLInputElement | null>(null);
  const backgroundRunRef = useRef(0);

  const selectedDeck = useMemo(() => {
    return decks.find((deck) => deck.id === selectedDeckId) || null;
  }, [decks, selectedDeckId]);

  const cardMap = useMemo(() => {
    const map = new Map<number, Flashcard>();
    (selectedDeck?.cards || []).forEach((card) => {
      map.set(card.id, card);
    });
    return map;
  }, [selectedDeck]);

  const currentCardId = studyQueue[queueIndex];
  const currentCard = currentCardId ? cardMap.get(currentCardId) || null : null;
  const waitingForMoreCards =
    backgroundCardsPending > 0 &&
    studyQueue.length > 0 &&
    queueIndex >= studyQueue.length;
  const sessionDone =
    backgroundCardsPending <= 0 &&
    studyQueue.length > 0 &&
    queueIndex >= studyQueue.length;
  const studiedCount = Math.min(queueIndex, studyQueue.length);
  const progressPercent =
    studyQueue.length > 0
      ? Math.round((studiedCount / studyQueue.length) * 100)
      : 0;

  useEffect(() => {
    void fetchDecks();
  }, []);

  useEffect(() => {
    if (
      !selectedDeckId ||
      !selectedDeck ||
      selectedDeck.id !== selectedDeckId
    ) {
      return;
    }

    const selectedCardIds = selectedDeck.cards.map((card) => card.id);
    if (selectedCardIds.length === 0) {
      return;
    }

    setStudyQueue((prevQueue) => {
      if (!Array.isArray(prevQueue) || prevQueue.length === 0) {
        return prevQueue;
      }

      const existing = new Set(prevQueue);
      const additions = selectedCardIds.filter((id) => !existing.has(id));
      if (additions.length === 0) {
        return prevQueue;
      }

      return [...prevQueue, ...additions];
    });
  }, [selectedDeck, selectedDeckId]);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Token ${token}`,
    };
  };

  const fetchDecks = async () => {
    setLoadingDecks(true);
    try {
      const res = await axios.get("/api/academics/flashcards/", {
        headers: authHeaders(),
      });
      const normalized = normalizeDecksPayload(res.data);
      setDecks(normalized);

      if (
        selectedDeckId &&
        !normalized.some((deck) => deck.id === selectedDeckId)
      ) {
        setSelectedDeckId(null);
        setStudyQueue([]);
        setQueueIndex(0);
        setShowAnswer(false);
      }
    } catch (err: any) {
      console.error("Error fetching flashcard decks", err);
      setError("ডেক লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoadingDecks(false);
    }
  };

  const startStudySession = (deck: FlashcardDeck, customQueue?: number[]) => {
    const queue =
      Array.isArray(customQueue) && customQueue.length > 0
        ? customQueue
        : deck.cards.map((card) => card.id);

    setSelectedDeckId(deck.id);
    setStudyQueue(queue);
    setQueueIndex(0);
    setShowAnswer(false);
    setDragOffset({ x: 0, y: 0 });
    setActiveTopic(topicFromDeck(deck));
  };

  const upsertDeck = (nextDeck: FlashcardDeck) => {
    setDecks((prev) => {
      const others = (Array.isArray(prev) ? prev : []).filter(
        (deck) => deck.id !== nextDeck.id,
      );
      return [nextDeck, ...others];
    });
  };

  const resetBackgroundGeneration = () => {
    backgroundRunRef.current += 1;
    setBackgroundGenerating(false);
    setBackgroundCardsPending(0);
  };

  const requestGenerateCards = async (
    deckId: number,
    topic: string,
    count: number,
  ) => {
    const safeCount = Math.max(1, Math.min(count, TOTAL_CARDS_TARGET));
    return axios.post(
      `/api/academics/flashcards/${deckId}/generate_cards/`,
      {
        instruction: topic,
        count: safeCount,
      },
      { headers: authHeaders() },
    );
  };

  const generateRemainingCardsInBackground = async (
    deckId: number,
    topic: string,
    remainingTarget: number,
  ) => {
    if (remainingTarget <= 0) {
      return;
    }

    const runId = backgroundRunRef.current + 1;
    backgroundRunRef.current = runId;

    setBackgroundGenerating(true);
    setBackgroundCardsPending(remainingTarget);

    let remaining = remainingTarget;
    const maxAttempts = Math.ceil(remainingTarget / QUICK_BATCH_SIZE) + 2;
    let attempts = 0;

    while (remaining > 0 && attempts < maxAttempts) {
      if (backgroundRunRef.current !== runId) {
        return;
      }

      attempts += 1;
      const batchSize = Math.min(QUICK_BATCH_SIZE, remaining);

      try {
        const batchRes = await requestGenerateCards(deckId, topic, batchSize);
        if (backgroundRunRef.current !== runId) {
          return;
        }

        const nextDeck = getGeneratedDeck(batchRes.data);
        const createdCount = getCreatedCount(batchRes.data, batchSize);
        upsertDeck(nextDeck);

        remaining = Math.max(remaining - Math.max(createdCount, 0), 0);
        setBackgroundCardsPending(remaining);

        if (createdCount <= 0) {
          break;
        }
      } catch (err: any) {
        if (backgroundRunRef.current !== runId) {
          return;
        }
        console.error("Background flashcard generation error", err);
        setError(
          (prev) =>
            prev ||
            "প্রথম কার্ডগুলো প্রস্তুত হয়েছে, বাকিগুলো আনতে সমস্যা হয়েছে।",
        );
        break;
      }
    }

    if (backgroundRunRef.current === runId) {
      setBackgroundCardsPending(0);
      setBackgroundGenerating(false);
    }
  };

  const createAndGenerateDeck = async () => {
    const topic = topicInput.trim();
    if (!topic) {
      setError("দয়া করে একটি বিষয় লিখুন।");
      return;
    }

    resetBackgroundGeneration();
    setGenerating(true);
    setError("");
    try {
      const title =
        deckTitle.trim() || `${topic} - ${TOTAL_CARDS_TARGET} Cards`;
      const deckRes = await axios.post(
        "/api/academics/flashcards/",
        {
          title,
          description: `মূল বিষয়: ${topic}`,
        },
        { headers: authHeaders() },
      );

      const generateRes = await requestGenerateCards(
        deckRes.data.id,
        topic,
        QUICK_BATCH_SIZE,
      );

      const nextDeck = getGeneratedDeck(generateRes.data);
      const createdCount = getCreatedCount(generateRes.data, QUICK_BATCH_SIZE);
      upsertDeck(nextDeck);

      const latestIds = nextDeck.cards
        .slice(-createdCount)
        .map((card) => card.id);
      startStudySession(nextDeck, latestIds.length > 0 ? latestIds : undefined);

      const remainingTarget = Math.max(TOTAL_CARDS_TARGET - createdCount, 0);
      if (remainingTarget > 0) {
        void generateRemainingCardsInBackground(
          deckRes.data.id,
          topic,
          remainingTarget,
        );
      }

      setDeckTitle("");
      setActiveTopic(topic);
    } catch (err: any) {
      console.error("Error generating flashcards", err);
      setError(
        err?.response?.data?.error || "ফ্ল্যাশকার্ড তৈরি করতে সমস্যা হয়েছে।",
      );
    } finally {
      setGenerating(false);
    }
  };

  const continueSameTopicWithNewQuestions = async () => {
    if (!selectedDeck) {
      return;
    }

    const topic =
      activeTopic || topicFromDeck(selectedDeck) || topicInput.trim();
    if (!topic) {
      setError("একই বিষয়ে নতুন প্রশ্ন আনতে একটি বিষয় প্রয়োজন।");
      return;
    }

    resetBackgroundGeneration();
    setContinuingTopic(true);
    setError("");
    try {
      const generateRes = await requestGenerateCards(
        selectedDeck.id,
        topic,
        QUICK_BATCH_SIZE,
      );

      const nextDeck = getGeneratedDeck(generateRes.data);
      const createdCount = getCreatedCount(generateRes.data, QUICK_BATCH_SIZE);
      upsertDeck(nextDeck);

      const newestIds = nextDeck.cards
        .slice(-createdCount)
        .map((card) => card.id);
      startStudySession(nextDeck, newestIds.length > 0 ? newestIds : undefined);

      const remainingTarget = Math.max(TOTAL_CARDS_TARGET - createdCount, 0);
      if (remainingTarget > 0) {
        void generateRemainingCardsInBackground(
          selectedDeck.id,
          topic,
          remainingTarget,
        );
      }

      setActiveTopic(topic);
    } catch (err: any) {
      console.error("Error continuing topic", err);
      setError(err?.response?.data?.error || "নতুন প্রশ্ন আনতে সমস্যা হয়েছে।");
    } finally {
      setContinuingTopic(false);
    }
  };

  const prepareNewTopicFlow = () => {
    resetBackgroundGeneration();
    setSelectedDeckId(null);
    setStudyQueue([]);
    setQueueIndex(0);
    setShowAnswer(false);
    setDragOffset({ x: 0, y: 0 });
    setActiveTopic("");
    setTopicInput("");
    setDeckTitle("");
    window.requestAnimationFrame(() => {
      topicInputRef.current?.focus();
    });
  };

  const updateLocalCardStatus = (
    deckId: number,
    cardId: number,
    nextStatus: ReviewStatus,
  ) => {
    setDecks((prev) =>
      (Array.isArray(prev) ? prev : []).map((deck) => {
        if (deck.id !== deckId) {
          return deck;
        }

        const updatedCards = deck.cards.map((card) => {
          if (card.id !== cardId) {
            return card;
          }

          return {
            ...card,
            review_status: nextStatus,
            is_known: nextStatus === "known",
          };
        });

        return normalizeDeck({ ...deck, cards: updatedCards });
      }),
    );
  };

  const setCardStatusOnServer = async (
    deckId: number,
    cardId: number,
    nextStatus: ReviewStatus,
  ) => {
    await axios.post(
      `/api/academics/flashcards/${deckId}/cards/${cardId}/set_status/`,
      { status: nextStatus },
      { headers: authHeaders() },
    );
  };

  const handleCardAction = async (nextStatus: ReviewStatus) => {
    if (!selectedDeck || !currentCardId || reviewing) {
      return;
    }

    setReviewing(true);
    setError("");
    try {
      await setCardStatusOnServer(selectedDeck.id, currentCardId, nextStatus);
      updateLocalCardStatus(selectedDeck.id, currentCardId, nextStatus);

      if (nextStatus === "pending") {
        setStudyQueue((prevQueue) => {
          const working = [...prevQueue];
          const safeIndex = Math.min(queueIndex, working.length - 1);
          const [card] = working.splice(safeIndex, 1);
          if (typeof card !== "number") {
            return prevQueue;
          }
          const insertAt = Math.min(safeIndex + 5, working.length);
          working.splice(insertAt, 0, card);
          return working;
        });
      } else {
        setQueueIndex((prev) => prev + 1);
      }

      setShowAnswer(false);
      setDragOffset({ x: 0, y: 0 });
    } catch (err: any) {
      console.error("Error updating card status", err);
      setError(err?.response?.data?.error || "কার্ড আপডেট করতে সমস্যা হয়েছে।");
    } finally {
      setReviewing(false);
    }
  };

  const applyGestureResult = (dx: number, dy: number) => {
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX < TAP_THRESHOLD && absY < TAP_THRESHOLD) {
      setShowAnswer((prev) => !prev);
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    if (absY > absX && dy < -SWIPE_THRESHOLD) {
      void handleCardAction("known");
      return;
    }

    if (absX >= absY && dx < -SWIPE_THRESHOLD) {
      void handleCardAction("pending");
      return;
    }

    if (absX >= absY && dx > SWIPE_THRESHOLD) {
      void handleCardAction("unknown");
      return;
    }

    setDragOffset({ x: 0, y: 0 });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (touchGestureRef.current || !currentCard || reviewing) {
      return;
    }

    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    setDragOffset({ x: 0, y: 0 });
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Ignore if pointer capture is unavailable.
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (touchGestureRef.current) {
      return;
    }

    const start = pointerStartRef.current;
    if (!start || reviewing) {
      return;
    }

    setDragOffset({
      x: event.clientX - start.x,
      y: event.clientY - start.y,
    });
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (touchGestureRef.current) {
      return;
    }

    const start = pointerStartRef.current;
    pointerStartRef.current = null;

    if (!start || reviewing) {
      return;
    }

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore pointer capture release failures.
    }

    applyGestureResult(dx, dy);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!currentCard || reviewing) {
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    touchGestureRef.current = true;
    pointerStartRef.current = { x: touch.clientX, y: touch.clientY };
    setDragOffset({ x: 0, y: 0 });
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!touchGestureRef.current || !start || reviewing) {
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    setDragOffset({
      x: touch.clientX - start.x,
      y: touch.clientY - start.y,
    });
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;

    if (!touchGestureRef.current || !start || reviewing) {
      touchGestureRef.current = false;
      return;
    }

    const touch = event.changedTouches[0];
    touchGestureRef.current = false;

    if (!touch) {
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    applyGestureResult(dx, dy);
  };

  const deckList = Array.isArray(decks) ? decks : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E9F7F1] to-[#F7FCFA] dark:from-gray-950 dark:to-gray-900 px-3 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[340px,1fr]">
        <section className="space-y-4">
          <div className="rounded-2xl border border-[#D1EBDD] bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">
              Premium Flashcards
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              সহজ, সুন্দর, মোবাইল-ফ্রেন্ডলি শেখার অভিজ্ঞতা
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                  বিষয় লিখুন
                </label>
                <input
                  ref={topicInputRef}
                  type="text"
                  placeholder="উদাহরণ: সৌরজগৎ"
                  value={topicInput}
                  onChange={(event) => setTopicInput(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 outline-none ring-0 transition focus:border-[#135D41] focus:ring-2 focus:ring-[#135D41]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                  ডেক নাম (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="না দিলে অটো নাম হবে"
                  value={deckTitle}
                  onChange={(event) => setDeckTitle(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 outline-none ring-0 transition focus:border-[#135D41] focus:ring-2 focus:ring-[#135D41]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <button
                onClick={createAndGenerateDeck}
                disabled={
                  generating || backgroundGenerating || !topicInput.trim()
                }
                className="w-full rounded-xl bg-[#135D41] px-4 py-3 text-base font-bold text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                {generating
                  ? `প্রথম ${QUICK_BATCH_SIZE} কার্ড তৈরি হচ্ছে...`
                  : backgroundGenerating
                    ? "বাকি কার্ডগুলো প্রস্তুত হচ্ছে..."
                    : `${TOTAL_CARDS_TARGET}টি বাংলা ফ্ল্যাশকার্ড তৈরি করুন`}
              </button>

              {backgroundGenerating && (
                <p className="rounded-lg bg-[#135D41]/8 px-3 py-2 text-xs font-semibold text-[#135D41]">
                  দ্রুত শুরু: প্রথম {QUICK_BATCH_SIZE}টি কার্ড এখন দেখানো হচ্ছে,
                  বাকি {backgroundCardsPending}টি কার্ড প্রস্তুত হচ্ছে।
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#D1EBDD] bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-200">
                My Decks
              </h2>
              <button
                onClick={() => void fetchDecks()}
                className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">
                Refresh
              </button>
            </div>

            {loadingDecks ? (
              <p className="text-sm text-gray-500">Loading decks...</p>
            ) : deckList.length === 0 ? (
              <p className="text-sm text-gray-500">
                এখনও কোন ডেক নেই। উপরে বিষয় লিখে শুরু করুন।
              </p>
            ) : (
              <ul className="space-y-2">
                {deckList.map((deck) => {
                  const isActive = deck.id === selectedDeckId;
                  return (
                    <li key={deck.id}>
                      <button
                        onClick={() => startStudySession(deck)}
                        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                          isActive
                            ? "border-[#135D41] bg-[#135D41]/10"
                            : "border-gray-200 bg-white hover:border-[#135D41]/40 hover:bg-[#F5FBF8] dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
                        }`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-semibold text-gray-900 dark:text-white">
                            {deck.title}
                          </p>
                          <span className="rounded-full bg-[#135D41]/10 px-2 py-0.5 text-xs font-semibold text-[#135D41]">
                            {deck.cards_count}
                          </span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-2 rounded-full bg-[#135D41]"
                            style={{
                              width: `${deck.cards_count > 0 ? Math.round((deck.known_count / deck.cards_count) * 100) : 0}%`,
                            }}
                          />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#D1EBDD] bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="mb-3 flex justify-end">
            <button
              onClick={() => setShowHelpModal(true)}
              aria-label="Show flashcards help"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#135D41]/30 bg-[#135D41] text-white shadow-md transition hover:scale-105 hover:brightness-110">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.09 9a3 3 0 115.82 1c0 2-3 2-3 4"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 17h.01"
                />
              </svg>
            </button>
          </div>

          {!selectedDeck ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <div className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-[#135D41]/10" />
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                শুরু করতে একটি ডেক সিলেক্ট করুন
              </h3>
              <p className="mt-2 max-w-lg text-sm text-gray-600 dark:text-gray-300">
                উপরে বিষয় লিখে {TOTAL_CARDS_TARGET}টি বাংলা ফ্ল্যাশকার্ড তৈরি
                করুন, অথবা বাম পাশ থেকে একটি ডেক নির্বাচন করুন।
              </p>
            </div>
          ) : waitingForMoreCards ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#135D41]/20 border-t-[#135D41]" />
              <h3 className="mt-4 text-2xl font-extrabold text-gray-900 dark:text-white">
                আরও কার্ড তৈরি হচ্ছে...
              </h3>
              <p className="mt-2 max-w-md text-sm text-gray-600 dark:text-gray-300">
                প্রথম ব্যাচ শেষ হয়েছে। বাকি {backgroundCardsPending}টি কার্ড
                কয়েক সেকেন্ডের মধ্যে যোগ হবে।
              </p>
            </div>
          ) : sessionDone ? (
            <div className="flex min-h-[420px] flex-col justify-center">
              <div className="rounded-2xl border border-[#135D41]/20 bg-[#135D41]/5 p-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-[#135D41]">
                  Session Completed
                </p>
                <h3 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
                  চমৎকার! আপনি এই {TOTAL_CARDS_TARGET}টি কার্ড শেষ করেছেন
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  মূল বিষয়:{" "}
                  {activeTopic ||
                    topicFromDeck(selectedDeck) ||
                    selectedDeck.title}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={continueSameTopicWithNewQuestions}
                    disabled={continuingTopic || backgroundGenerating}
                    className="rounded-xl bg-[#135D41] px-4 py-3 text-sm font-bold text-white shadow transition hover:brightness-110 disabled:opacity-60">
                    {continuingTopic
                      ? `প্রথম ${QUICK_BATCH_SIZE} প্রশ্ন আসছে...`
                      : `একই বিষয়ে নতুন ${TOTAL_CARDS_TARGET} প্রশ্ন`}
                  </button>

                  <button
                    onClick={prepareNewTopicFlow}
                    className="rounded-xl border border-[#135D41]/30 bg-white px-4 py-3 text-sm font-bold text-[#135D41] transition hover:bg-[#F3FBF7] dark:bg-gray-900">
                    অন্য বিষয়ে নতুন ডেক তৈরি করুন
                  </button>
                </div>
              </div>
            </div>
          ) : !currentCard ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                এই ডেকে কার্ড নেই
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                নতুন প্রশ্ন জেনারেট করতে একই বিষয় চালিয়ে যান।
              </p>
              <button
                onClick={continueSameTopicWithNewQuestions}
                disabled={continuingTopic || backgroundGenerating}
                className="mt-4 rounded-xl bg-[#135D41] px-4 py-3 text-sm font-bold text-white">
                {continuingTopic
                  ? `প্রথম ${QUICK_BATCH_SIZE} প্রশ্ন আসছে...`
                  : `${TOTAL_CARDS_TARGET}টি নতুন প্রশ্ন আনুন`}
              </button>
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    {selectedDeck.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    কার্ড {Math.min(queueIndex + 1, studyQueue.length)} /{" "}
                    {studyQueue.length}
                  </p>
                </div>
                <div className="rounded-xl bg-[#135D41]/10 px-3 py-2 text-xs font-bold text-[#135D41]">
                  Topic: {activeTopic || topicFromDeck(selectedDeck) || "N/A"}
                </div>
              </div>

              {backgroundGenerating && (
                <div className="mb-3 rounded-xl border border-[#135D41]/20 bg-[#135D41]/8 px-3 py-2 text-xs font-semibold text-[#135D41]">
                  নতুন কার্ড তৈরি হচ্ছে... আরও {backgroundCardsPending}টি কার্ড
                  আসছে।
                </div>
              )}

              <div className="mb-3 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-2 rounded-full bg-[#135D41]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="relative flex-1">
                <div
                  role="button"
                  tabIndex={0}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setShowAnswer((prev) => !prev);
                    }
                  }}
                  style={{
                    transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x / 30}deg)`,
                    transition: pointerStartRef.current
                      ? "none"
                      : "transform 160ms ease",
                    touchAction: "none",
                  }}
                  className="h-full min-h-[320px] w-full select-none rounded-3xl border border-[#135D41]/20 bg-gradient-to-b from-[#F7FCFA] to-white p-4 shadow-xl outline-none ring-0 dark:from-gray-800 dark:to-gray-900 sm:p-6">
                  <div className="mb-3 text-xs font-bold uppercase tracking-wide text-[#135D41]">
                    {showAnswer ? "উত্তর" : "প্রশ্ন"}
                  </div>
                  <div className="flex min-h-[220px] max-h-[50vh] items-center justify-center overflow-y-auto rounded-2xl bg-white/70 px-2 text-center dark:bg-gray-900/40 sm:min-h-[260px]">
                    <p
                      className={`w-full break-words whitespace-pre-wrap font-extrabold leading-relaxed text-gray-900 dark:text-white ${getCardTextClass(
                        showAnswer ? currentCard.back : currentCard.front,
                      )}`}>
                      {showAnswer ? currentCard.back : currentCard.front}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  onClick={() => void handleCardAction("known")}
                  disabled={reviewing}
                  className="rounded-xl bg-[#135D41] px-3 py-3 text-sm font-bold text-white shadow transition hover:brightness-110 disabled:opacity-60">
                  ⬆️ জানি
                </button>
                <button
                  onClick={() => void handleCardAction("pending")}
                  disabled={reviewing}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                  ↔️ পরে আবার
                </button>
                <button
                  onClick={() => void handleCardAction("unknown")}
                  disabled={reviewing}
                  className="rounded-xl border border-red-300 bg-red-50 px-3 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
                  ➡️ জানি না
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#135D41]/20 bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                ব্যবহার নির্দেশিকা
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                aria-label="Close help"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
              <p>👆 ট্যাপ করুন: উত্তর দেখুন</p>
              <p>⬆️ নিচ থেকে উপরে সোয়াইপ: জানি + পরের কার্ড</p>
              <p>↔️ ডান থেকে বামে সোয়াইপ: ৫ কার্ড পরে আবার দেখাবে</p>
              <p>➡️ বাম থেকে ডানে সোয়াইপ: জানি না</p>
              <p>
                ✅ সব 20 কার্ড শেষ হলে: একই বিষয়ে নতুন 20 প্রশ্ন বা নতুন বিষয়
                বেছে নিতে পারবেন
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Flashcards;
