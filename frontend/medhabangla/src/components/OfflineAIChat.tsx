import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/offline-ai-premium.css";

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
  const [statusText, setStatusText] = useState(
    "Initializing offline premium model...",
  );
  const [activeModelLabel, setActiveModelLabel] = useState("Not loaded");
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
        setStatusText("Preparing offline model...");
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

        let rawPercent = 0;
        if (Number.isFinite(loaded) && Number.isFinite(total) && total > 0) {
          rawPercent = (loaded / total) * 100;
        } else if (Number.isFinite(reported)) {
          rawPercent = reported <= 1 ? reported * 100 : reported;
        }

        const pct = Number.isFinite(rawPercent)
          ? Math.max(0, Math.min(100, Math.round(rawPercent)))
          : downloadPercent;

        setState("downloading");
        setDownloadPercent(pct);
        setStatusText(`Model download in progress: ${pct}%`);
        return;
      }

      if (msg.type === "ready") {
        const modelName = String(msg?.modelLabel || "Offline model");
        setActiveModelLabel(modelName);
        setState("ready");
        setStatusText(`Ready in offline mode (${modelName})`);
        setDownloadPercent(100);
        setErrorMessage("");

        setMessages((prev) => {
          if (prev.length > 0) return prev;
          return [
            {
              id: `welcome-${Date.now()}`,
              role: "assistant",
              content:
                "Offline premium AI is ready. Ask normal study or general questions now.",
              timestamp: new Date(),
            },
          ];
        });
        return;
      }

      if (msg.type === "generating") {
        setState("processing");
        setStatusText("Analyzing your question...");
        return;
      }

      if (msg.type === "result") {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: msg.answer || "No answer was generated.",
            timestamp: new Date(),
          },
        ]);
        setState("ready");
        setStatusText("Ready for the next question");
        return;
      }

      if (msg.type === "error") {
        setState("error");
        setStatusText("Offline model error");
        setErrorMessage(msg.message || "Unknown model error");
      }
    };

    worker.onerror = (event) => {
      setState("error");
      setStatusText("Worker crashed");
      setErrorMessage(event.message || "Worker runtime error");
    };

    worker.postMessage({
      type: "load",
      payload: {
        deviceMemoryGb: Number((navigator as any).deviceMemory || 3),
      },
    });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const badgeClass = useMemo(() => {
    if (state === "downloading") return "status-chip warning";
    if (state === "ready") return "status-chip success";
    if (state === "processing") return "status-chip info";
    if (state === "error") return "status-chip error";
    return "status-chip neutral";
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
    setStatusText("Retrying model warm-up...");
    setDownloadPercent(0);
    workerRef.current.postMessage({
      type: "load",
      payload: {
        deviceMemoryGb: Number((navigator as any).deviceMemory || 3),
      },
    });
  };

  return (
    <div className="offline-premium-shell">
      <div className="offline-bg-orb offline-bg-orb-a" />
      <div className="offline-bg-orb offline-bg-orb-b" />
      <div className="offline-bg-orb offline-bg-orb-c" />

      <div className="offline-chat-container">
        <header className="offline-glass-card offline-chat-header">
          <div>
            <p className="offline-eyebrow">Premium Offline AI</p>
            <h1 className="offline-chat-title">Ask Anything, Even Offline</h1>
            <p className="offline-subtitle">Active model: {activeModelLabel}</p>
          </div>
          <span className={badgeClass}>{statusText}</span>
        </header>

        {state === "downloading" && (
          <section className="offline-glass-card offline-progress-card">
            <div className="offline-progress-track">
              <div
                className="offline-progress-fill"
                style={{ width: `${downloadPercent}%` }}
              />
            </div>
            <p className="offline-progress-text">{downloadPercent}% downloaded</p>
          </section>
        )}

        {errorMessage && (
          <section className="offline-glass-card offline-error-card">
            <p>{errorMessage}</p>
            <button type="button" onClick={handleRetryLoad}>
              Retry Model Load
            </button>
          </section>
        )}

        <section className="offline-glass-card offline-chat-stream">
          {messages.length === 0 ? (
            <div className="offline-empty-state">
              Model initialization is in progress. Your chat will open once ready.
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`offline-bubble-row ${message.role === "user" ? "user" : "assistant"}`}>
                <article
                  className={`offline-bubble ${message.role === "user" ? "user" : "assistant"}`}>
                  <p>{message.content}</p>
                  <time>{message.timestamp.toLocaleTimeString()}</time>
                </article>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </section>

        <section className="offline-glass-card offline-input-area">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAsk();
              }
            }}
            placeholder="Type your question here..."
            disabled={busy || !canAsk}
          />
          <button
            type="button"
            onClick={handleAsk}
            disabled={busy || !canAsk || !input.trim()}>
            {state === "processing" ? "Thinking..." : "Ask Offline AI"}
          </button>
        </section>
      </div>
    </div>
  );
};

export default OfflineAIChat;
