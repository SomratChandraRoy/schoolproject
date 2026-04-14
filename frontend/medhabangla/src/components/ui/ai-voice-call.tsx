import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckIcon,
  CopyIcon,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  SendHorizonal,
  Sparkles,
  X,
} from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Message, MessageContent } from "./message";
import { Orb } from "./orb";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import "../../styles/ai-voice-call.css";

const QUICK_PROMPTS = [
  "Help me practice spoken English for 2 minutes.",
  "Take a viva-style quiz on Class 10 Science.",
  "Explain algebra in simple Bengali and English.",
  "Test my pronunciation and speaking confidence.",
];

const MOCK_ASSISTANT_REPLIES = [
  "Great energy. Continue in short, clear sentences and slow your ending words slightly.",
  "Nice start. I heard strong confidence. Want a 30-second follow-up speaking task?",
  "Your pronunciation is improving. Focus on stress in key words for more natural rhythm.",
  "Excellent. I can now switch to viva mode and ask one question at a time.",
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const AIVoiceCall: React.FC = () => {
  const navigate = useNavigate();
  const messagePanelRef = useRef<HTMLDivElement>(null);
  const replyTimerRef = useRef<number | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composerValue, setComposerValue] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);

  const isPopupWindow = typeof window !== "undefined" && window.opener !== null;

  const sessionLabel = useMemo(() => {
    if (isAssistantThinking) {
      return "Analyzing your voice context...";
    }

    if (isSessionActive && !isMicMuted) {
      return "Voice session live";
    }

    if (isSessionActive && isMicMuted) {
      return "Voice session muted";
    }

    return "Session not started";
  }, [isAssistantThinking, isSessionActive, isMicMuted]);

  useEffect(() => {
    const panel = messagePanelRef.current;
    if (!panel) {
      return;
    }

    panel.scrollTo({ top: panel.scrollHeight, behavior: "smooth" });
  }, [messages, isAssistantThinking]);

  useEffect(() => {
    return () => {
      if (replyTimerRef.current !== null) {
        window.clearTimeout(replyTimerRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    if (isPopupWindow) {
      window.close();
      return;
    }
    navigate("/chat");
  };

  const handleCopy = async (index: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1800);
    } catch (error) {
      console.error("Failed to copy response:", error);
    }
  };

  const queueAssistantReply = () => {
    if (replyTimerRef.current !== null) {
      window.clearTimeout(replyTimerRef.current);
    }

    setIsAssistantThinking(true);
    replyTimerRef.current = window.setTimeout(() => {
      const reply =
        MOCK_ASSISTANT_REPLIES[
          Math.floor(Math.random() * MOCK_ASSISTANT_REPLIES.length)
        ];

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setIsAssistantThinking(false);
      replyTimerRef.current = null;
    }, 900);
  };

  const submitPrompt = (rawValue: string) => {
    const value = rawValue.trim();
    if (!value) {
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: value }]);
    setComposerValue("");

    if (isSessionActive) {
      queueAssistantReply();
    }
  };

  const addQuickPrompt = (prompt: string) => {
    submitPrompt(prompt);
  };

  return (
    <div className="fixed inset-0 z-[13050] overflow-hidden bg-[radial-gradient(circle_at_12%_8%,rgba(59,130,246,0.16),transparent_25%),radial-gradient(circle_at_88%_10%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#edf2ff_55%,#f8fafc_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_14%_8%,rgba(59,130,246,0.24),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(14,165,233,0.18),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_55%,#020617_100%)] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_84%_14%,rgba(14,165,233,0.14),transparent_36%)] dark:bg-[radial-gradient(circle_at_14%_15%,rgba(59,130,246,0.26),transparent_38%),radial-gradient(circle_at_86%_12%,rgba(14,165,233,0.24),transparent_34%)]" />
        <div className="ai-voice-blob-a absolute -left-16 top-16 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl dark:bg-blue-500/24" />
        <div className="ai-voice-blob-b absolute -right-20 bottom-14 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl dark:bg-cyan-500/24" />
      </div>

      <div className="relative z-10 flex h-full flex-col p-3 sm:p-4 md:p-6">
        <header className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/88 px-3 py-2.5 shadow-[0_10px_35px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/84 dark:shadow-[0_10px_35px_rgba(0,0,0,0.35)] sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={handleClose}
              aria-label="Back to chat">
              <ArrowLeft className="size-4" />
            </Button>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100 sm:text-base">
                AI Voice Visualization Window
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs">
                Emotion-triggered live conversation UI from chat composer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-full border border-sky-300/65 bg-sky-100/75 px-2.5 py-1 text-[11px] font-semibold text-sky-800 dark:border-sky-500/45 dark:bg-sky-900/35 dark:text-sky-200 sm:inline-flex">
              <Sparkles className="size-3.5" />
              Premium Voice Mode
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={handleClose}
              aria-label="Close voice window">
              <X className="size-4" />
            </Button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 justify-center">
          <Card className="ai-voice-shell-in relative flex h-full w-full max-w-6xl flex-col gap-0 overflow-hidden rounded-[26px] border border-slate-200/85 bg-white/90 shadow-[0_28px_90px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/84 dark:shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
            <CardContent className="relative min-h-0 flex-1 overflow-hidden p-0">
              <div className="flex h-full min-h-0 flex-col">
                <div
                  ref={messagePanelRef}
                  className="premium-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_12%_10%,rgba(59,130,246,0.1),transparent_26%),radial-gradient(circle_at_85%_85%,rgba(14,165,233,0.08),transparent_28%),#eef2ff] px-4 py-4 dark:bg-[radial-gradient(circle_at_12%_10%,rgba(59,130,246,0.2),transparent_30%),radial-gradient(circle_at_86%_84%,rgba(14,165,233,0.14),transparent_30%),#020617] sm:px-6 sm:py-6">
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                      <div className="size-16 rounded-full ring-2 ring-sky-300/60 dark:ring-sky-500/45">
                        <Orb className="h-full w-full" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">
                          Start your premium voice interaction
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                          Start session, speak naturally, then send a prompt to
                          see animated response flow.
                        </p>
                      </div>
                      <div className="mx-auto mt-1 flex w-full max-w-3xl flex-wrap justify-center gap-2.5">
                        {QUICK_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => addQuickPrompt(prompt)}
                            className="rounded-full border border-slate-300/80 bg-white/88 px-3 py-1.5 text-left text-xs text-slate-700 transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 hover:shadow-[0_8px_20px_rgba(59,130,246,0.2)] dark:border-slate-600 dark:bg-slate-800/85 dark:text-slate-100 dark:hover:border-sky-500/50 dark:hover:bg-slate-700 sm:text-sm">
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className="ai-voice-message-in flex w-full flex-col gap-1.5">
                        <Message from={message.role}>
                          <MessageContent
                            className={cn(
                              "max-w-full min-w-0 rounded-2xl border px-3.5 py-2.5 text-sm leading-relaxed sm:px-4 sm:py-3",
                              message.role === "user"
                                ? "border-sky-300/70 bg-[linear-gradient(135deg,#DBEAFE_0%,#E0F2FE_100%)] text-slate-800 dark:border-sky-500/45 dark:bg-[linear-gradient(135deg,#1D4ED8_0%,#0F172A_100%)] dark:text-sky-50"
                                : "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
                            )}>
                            <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                              {message.content}
                            </p>
                          </MessageContent>

                          {message.role === "assistant" && (
                            <div className="relative size-7 flex-shrink-0 self-end overflow-hidden rounded-full ring-1 ring-sky-300/70 dark:ring-sky-500/55">
                              <div className="ai-voice-pulse-ring absolute inset-0 rounded-full" />
                              <Orb className="h-full w-full" />
                            </div>
                          )}
                        </Message>

                        {message.role === "assistant" && (
                          <div className="flex items-center gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    className="size-8 rounded-full border border-slate-300 bg-white/90 p-0 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/85 dark:text-slate-300 dark:hover:bg-slate-700"
                                    size="sm"
                                    type="button"
                                    variant="ghost"
                                    onClick={() =>
                                      void handleCopy(index, message.content)
                                    }>
                                    {copiedIndex === index ? (
                                      <CheckIcon className="size-3.5" />
                                    ) : (
                                      <CopyIcon className="size-3.5" />
                                    )}
                                    <span className="sr-only">
                                      {copiedIndex === index
                                        ? "Copied"
                                        : "Copy"}
                                    </span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {copiedIndex === index ? "Copied" : "Copy"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {isAssistantThinking && (
                    <div className="rounded-xl border border-sky-300/70 bg-sky-50/90 px-3 py-2 text-xs text-sky-900 dark:border-sky-500/40 dark:bg-sky-900/25 dark:text-sky-100 sm:text-sm">
                      AI assistant is crafting your response based on voice
                      flow...
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 bg-white/90 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/86 dark:shadow-[0_-8px_24px_rgba(0,0,0,0.2)] sm:p-4">
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800/85 dark:text-slate-200 sm:text-xs">
                      <span
                        className={cn(
                          "inline-block h-2 w-2 rounded-full",
                          isSessionActive && !isMicMuted
                            ? "bg-sky-500 animate-pulse"
                            : "bg-slate-300/70",
                        )}
                      />
                      {sessionLabel}
                    </div>

                    <button
                      type="button"
                      onClick={() => setMessages([])}
                      className="text-[11px] text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 sm:text-xs">
                      Clear transcript
                    </button>
                  </div>

                  <div className="flex items-end gap-2.5">
                    <textarea
                      value={composerValue}
                      onChange={(event) => setComposerValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          submitPrompt(composerValue);
                        }
                      }}
                      placeholder="Type your voice prompt, viva question, or speaking task..."
                      className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
                      rows={2}
                    />
                    <Button
                      type="button"
                      size="icon"
                      className="h-11 w-11 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700"
                      onClick={() => submitPrompt(composerValue)}
                      aria-label="Send voice prompt">
                      <SendHorizonal className="size-4" />
                    </Button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      onClick={() => setIsMicMuted((prev) => !prev)}
                      aria-label={
                        isMicMuted ? "Unmute microphone" : "Mute microphone"
                      }>
                      {isMicMuted ? (
                        <MicOff className="mr-1.5 size-4" />
                      ) : (
                        <Mic className="mr-1.5 size-4" />
                      )}
                      {isMicMuted ? "Mic Off" : "Mic On"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200",
                        isSessionActive
                          ? "bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/35 dark:hover:bg-rose-900/50"
                          : "bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700",
                      )}
                      onClick={() => {
                        setIsSessionActive((prev) => !prev);
                        setIsAssistantThinking(false);
                      }}
                      aria-label={
                        isSessionActive
                          ? "End voice session"
                          : "Start voice session"
                      }>
                      {isSessionActive ? (
                        <PhoneOff className="mr-1.5 size-4" />
                      ) : (
                        <Phone className="mr-1.5 size-4" />
                      )}
                      {isSessionActive ? "End Session" : "Start Session"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIVoiceCall;
