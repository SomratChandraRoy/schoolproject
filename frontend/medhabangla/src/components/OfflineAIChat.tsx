import React, { useEffect, useMemo, useRef, useState } from "react";

type AppState =
  | "initializing"
  | "downloading"
  | "ready"
  | "processing"
  | "error";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const OfflineAIChat: React.FC = () => {
  const workerRef = useRef<Worker | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<AppState>("initializing");
  const [statusText, setStatusText] = useState("লোকাল AI মডেল চালু হচ্ছে...");
  const [activeModelLabel, setActiveModelLabel] = useState("লোড হয়নি");
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/offlineAIWorker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent) => {
      const msg = event.data || {};

      if (msg.type === "loading-start") {
        setState("downloading");
        setStatusText("লোকাল মডেল ফাইল প্রস্তুত হচ্ছে...");
        setErrorMessage("");
        setDownloadPercent(0);
        return;
      }

      if (msg.type === "loading-progress") {
        if (msg?.modelLabel) {
          setActiveModelLabel(String(msg.modelLabel));
        }

        const loaded = Number(msg?.progress?.loaded ?? 0);
        const total = Number(msg?.progress?.total ?? 0);
        const reported = Number(
          msg?.progress?.progress ?? msg?.progress?.percentage ?? 0,
        );

        let raw = 0;
        if (Number.isFinite(loaded) && Number.isFinite(total) && total > 0) {
          raw = (loaded / total) * 100;
        } else if (Number.isFinite(reported)) {
          raw = reported <= 1 ? reported * 100 : reported;
        }

        const pct = Number.isFinite(raw)
          ? Math.max(0, Math.min(100, Math.round(raw)))
          : downloadPercent;

        const statusHint = msg?.progress?.status
          ? ` (${String(msg.progress.status)})`
          : "";
        setState("downloading");
        setDownloadPercent(pct);
        setStatusText(`মডেল ডাউনলোড হচ্ছে: ${pct}%${statusHint}`);
        return;
      }

      if (msg.type === "ready") {
        const modelName = String(msg?.modelLabel || "লোকাল মডেল");
        setActiveModelLabel(modelName);
        setState("ready");
        setStatusText(`প্রস্তুত - অফলাইন মোড চালু (${modelName})`);
        setDownloadPercent(100);
        setErrorMessage("");

        setMessages((prev) => {
          if (prev.length > 0) return prev;
          return [
            {
              id: `welcome-${Date.now()}`,
              role: "assistant",
              content:
                "অফলাইন AI প্রস্তুত। এখন ইন্টারনেট বন্ধ থাকলেও আপনি প্রশ্ন করতে পারবেন।",
              timestamp: new Date(),
            },
          ];
        });
        return;
      }

      if (msg.type === "generating") {
        setState("processing");
        setStatusText("AI উত্তর তৈরি করছে...");
        return;
      }

      if (msg.type === "result") {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: msg.answer || "কোনো উত্তর পাওয়া যায়নি।",
            timestamp: new Date(),
          },
        ]);
        setState("ready");
        setStatusText("প্রস্তুত - অফলাইন মোড চালু");
        return;
      }

      if (msg.type === "error") {
        setState("error");
        setStatusText("অফলাইন মডেল ত্রুটি");
        setErrorMessage(msg.message || "অজানা ত্রুটি");
      }
    };

    worker.onerror = (event) => {
      setState("error");
      setStatusText("ওয়ার্কার ক্র্যাশ করেছে");
      setErrorMessage(event.message || "ওয়ার্কার রানটাইম ত্রুটি");
    };

    worker.postMessage({ type: "load" });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const badgeClasses = useMemo(() => {
    if (state === "downloading") {
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    }
    if (state === "ready") {
      return "bg-green-100 text-green-800 border-green-300";
    }
    if (state === "processing") {
      return "bg-blue-100 text-blue-800 border-blue-300";
    }
    if (state === "error") {
      return "bg-red-100 text-red-800 border-red-300";
    }
    return "bg-slate-100 text-slate-700 border-slate-300";
  }, [state]);

  const canAsk = state === "ready";
  const busy = state === "processing" || state === "downloading";

  const handleAsk = () => {
    const question = input.trim();
    if (!question || !workerRef.current || !canAsk) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: question,
        timestamp: new Date(),
      },
    ]);

    setInput("");
    workerRef.current.postMessage({
      type: "generate",
      payload: { question },
    });
  };

  const handleRetryLoad = () => {
    if (!workerRef.current) return;
    setErrorMessage("");
    setState("downloading");
    setStatusText("মডেল আবার ডাউনলোড করা হচ্ছে...");
    setDownloadPercent(0);
    workerRef.current.postMessage({ type: "load" });
  };

  const handleHardReset = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map((registration) => registration.unregister()),
        );
      }

      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      localStorage.removeItem("sopan-models-auto-installed");
      localStorage.removeItem("sopan-model-metadata");
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <div className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                অফলাইন AI প্রশ্নোত্তর
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                সম্পূর্ণ ব্রাউজারভিত্তিক লোকাল মডেল, প্রথম ডাউনলোডের পর
                ব্যাকএন্ড ছাড়াই চলবে।
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                সক্রিয় মডেল: {activeModelLabel}
              </p>
            </div>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses}`}>
              {statusText}
            </span>
          </div>

          {state === "downloading" && (
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-300"
                  style={{ width: `${downloadPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {downloadPercent}%
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
              <div>{errorMessage}</div>
              <button
                onClick={handleRetryLoad}
                className="mt-2 rounded border border-red-400 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-200 dark:hover:bg-red-900/40">
                মডেল আবার লোড করুন
              </button>
              <button
                onClick={() => void handleHardReset()}
                className="ml-2 mt-2 rounded border border-red-400 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-200 dark:hover:bg-red-900/40">
                ক্যাশ মুছে রিলোড
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-hidden px-4 pb-4 pt-3">
        <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-slate-500 dark:text-slate-400">
              মডেল ডাউনলোড শেষ হলে আপনার প্রথম প্রশ্ন করুন।
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] rounded-xl px-4 py-3 text-sm shadow-sm md:max-w-[80%] ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  }`}>
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <p className="mt-2 text-[10px] opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              placeholder="প্রশ্ন লিখুন..."
              disabled={busy || !canAsk}
              className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              onClick={handleAsk}
              disabled={busy || !canAsk || !input.trim()}
              className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400">
              {state === "processing"
                ? "প্রসেস হচ্ছে..."
                : "AI-কে জিজ্ঞাসা করুন"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineAIChat;
