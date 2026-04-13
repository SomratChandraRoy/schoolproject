import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Message, MessageAvatar, MessageContent } from "./ui/message";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "./ui/conversation";
import { Orb, type AgentState } from "./ui/orb";
import { BarVisualizer } from "./ui/bar-visualizer";
import { LiveWaveform } from "./ui/live-waveform";
import { MicSelector } from "./ui/mic-selector";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Response } from "./ui/response";

type ChatMode = "mini" | "fullscreen";
type MessageType = "general" | "homework_help" | "exam_prep" | "voice";

interface ChatMessage {
  id: string;
  from: "user" | "assistant";
  text: string;
  timestamp: Date;
  audioBase64?: string;
}

// Removed duplicate SpeechRecognition declarations

const PremiumAIChatWithElevenLabsUI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("mini");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("general");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [voiceConversationEnabled, setVoiceConversationEnabled] =
    useState(false);
  const [selectedMic, setSelectedMic] = useState("");

  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const agentState: AgentState = useMemo(() => {
    if (isListening) return "listening";
    if (isThinking) return "thinking";
    if (isTalking) return "talking";
    return null;
  }, [isListening, isThinking, isTalking]);

  useEffect(() => {
    if (!isOpen || sessionId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("/api/ai/chat/start/", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Unable to start chat session");
        }
        const data = await res.json();
        setSessionId(data.session_id);
      })
      .catch((err) => {
        console.error("Start session failed", err);
      });
  }, [isOpen, sessionId]);

  useEffect(() => {
    if (!isOpen || messages.length > 0) return;
    setMessages([
      {
        id: "welcome",
        from: "assistant",
        text: "স্বাগতম! আমি আপনার AI সহায়ক। আপনি লিখে বা মাইক্রোফোন দিয়ে কথা বলতে পারেন।",
        timestamp: new Date(),
      },
    ]);
  }, [isOpen, messages.length]);

  const playAudio = async (audioBase64: string) => {
    try {
      setIsTalking(true);
      const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
      audio.onended = () => setIsTalking(false);
      audio.onerror = () => setIsTalking(false);
      await audio.play();
    } catch (err) {
      setIsTalking(false);
      console.error("Audio play failed", err);
    }
  };

  const speakWithBrowserTTS = (text: string) => {
    if (!("speechSynthesis" in window) || !text?.trim()) return;
    try {
      setIsTalking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "bn-BD";
      utterance.rate = 1;
      utterance.onend = () => setIsTalking(false);
      utterance.onerror = () => setIsTalking(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsTalking(false);
    }
  };

  const appendMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  const sendChatMessage = async (text: string) => {
    const token = localStorage.getItem("token");
    if (!token || !sessionId) {
      appendMessage({
        id: Date.now().toString(),
        from: "assistant",
        text: "Please login and reopen AI window.",
        timestamp: new Date(),
      });
      return;
    }

    setIsThinking(true);
    try {
      const response = await fetch("/api/ai/chat/message/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          message_type: messageType,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "AI request failed");
      }

      appendMessage({
        id: `${Date.now()}-ai`,
        from: "assistant",
        text: data.ai_message || "No response received",
        timestamp: new Date(),
      });
    } catch (err) {
      appendMessage({
        id: `${Date.now()}-err`,
        from: "assistant",
        text: err instanceof Error ? err.message : "AI response failed",
        timestamp: new Date(),
      });
    } finally {
      setIsThinking(false);
    }
  };

  const sendVoiceTutorMessage = async (text: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsThinking(true);
    try {
      const response = await fetch("/api/ai/voice-tutor/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Voice tutor failed");
      }

      const aiText = data.text || "No voice response";
      appendMessage({
        id: `${Date.now()}-voice-ai`,
        from: "assistant",
        text: aiText,
        timestamp: new Date(),
        audioBase64: data.audio_base64 || undefined,
      });

      if (data.audio_base64) {
        await playAudio(data.audio_base64);
      } else {
        speakWithBrowserTTS(aiText);
        if (data.tts_error) {
          appendMessage({
            id: `${Date.now()}-tts-info`,
            from: "assistant",
            text: `Voice fallback active: ${data.tts_error}`,
            timestamp: new Date(),
          });
        }
      }
    } catch (err) {
      appendMessage({
        id: `${Date.now()}-voice-err`,
        from: "assistant",
        text: err instanceof Error ? err.message : "Voice AI failed",
        timestamp: new Date(),
      });
    } finally {
      setIsThinking(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isThinking) return;

    appendMessage({
      id: `${Date.now()}-user`,
      from: "user",
      text,
      timestamp: new Date(),
    });
    setInput("");

    if (voiceConversationEnabled || messageType === "voice") {
      await sendVoiceTutorMessage(text);
      return;
    }

    await sendChatMessage(text);
  };

  const startSpeechRecognition = () => {
    const Recognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!Recognition) {
      appendMessage({
        id: `${Date.now()}-speech-na`,
        from: "assistant",
        text: "Speech recognition is not supported in this browser.",
        timestamp: new Date(),
      });
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "bn-BD";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;
    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setInput(transcript);
      setIsListening(false);
      if (
        (voiceConversationEnabled || messageType === "voice") &&
        transcript.trim()
      ) {
        appendMessage({
          id: `${Date.now()}-user-voice`,
          from: "user",
          text: transcript,
          timestamp: new Date(),
        });
        void sendVoiceTutorMessage(transcript);
        setInput("");
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-2xl"
          size="icon-lg">
          AI
        </Button>
      )}

      {isOpen && (
        <div
          className={clsx(
            "fixed z-40 border border-border bg-background shadow-2xl",
            mode === "mini"
              ? "bottom-6 right-6 h-[32rem] w-[24rem] rounded-2xl"
              : "inset-4 rounded-2xl",
          )}>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <Orb agentState={agentState} className="h-8 w-8" />
                <div>
                  <p className="text-sm font-semibold">AI Conversation</p>
                  <p className="text-xs opacity-80">
                    Gemini / Groq / Alibaba / ElevenLabs Voice
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setMode(mode === "mini" ? "fullscreen" : "mini")
                  }>
                  {mode === "mini" ? "Fullscreen" : "Mini"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
              {(
                [
                  "general",
                  "homework_help",
                  "exam_prep",
                  "voice",
                ] as MessageType[]
              ).map((t) => (
                <Button
                  key={t}
                  size="xs"
                  variant={messageType === t ? "default" : "outline"}
                  onClick={() => setMessageType(t)}>
                  {t}
                </Button>
              ))}

              <Button
                size="xs"
                variant={voiceConversationEnabled ? "default" : "outline"}
                onClick={() => setVoiceConversationEnabled((prev) => !prev)}>
                Voice Conversation {voiceConversationEnabled ? "On" : "Off"}
              </Button>

              <MicSelector value={selectedMic} onValueChange={setSelectedMic} />
            </div>

            <Conversation>
              <ConversationContent className="space-y-3">
                {messages.length === 0 ? (
                  <ConversationEmptyState
                    title="Start AI conversation"
                    description="Type or speak to begin"
                  />
                ) : (
                  messages.map((msg) => (
                    <Message key={msg.id} from={msg.from}>
                      <MessageAvatar
                        name={msg.from === "user" ? "You" : "AI"}
                        src={msg.from === "user" ? "👤" : "🤖"}
                      />
                      <div className="flex w-full flex-col gap-1">
                        <MessageContent>
                          {msg.from === "assistant" ? (
                            <Response>{msg.text}</Response>
                          ) : (
                            msg.text
                          )}
                        </MessageContent>
                        {msg.audioBase64 && (
                          <audio
                            controls
                            src={`data:audio/mpeg;base64,${msg.audioBase64}`}
                            className="mt-1 h-8 w-full"
                          />
                        )}
                      </div>
                    </Message>
                  ))
                )}
                {isThinking && (
                  <Message from="assistant">
                    <MessageAvatar name="AI" src="🤖" />
                    <BarVisualizer isActive animating barCount={8} />
                  </Message>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>

            <div className="space-y-3 border-t border-border p-3">
              <div className="overflow-hidden rounded-md border border-border px-2 py-1">
                <LiveWaveform
                  active={isListening}
                  processing={isThinking || isTalking}
                  deviceId={selectedMic || undefined}
                  mode="static"
                  height={28}
                />
              </div>

              <div className="flex items-end gap-2">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="min-h-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <Button
                  size="icon"
                  variant={isListening ? "destructive" : "outline"}
                  onClick={
                    isListening ? stopSpeechRecognition : startSpeechRecognition
                  }>
                  {isListening ? "Stop" : "Mic"}
                </Button>
                <Button
                  size="icon"
                  onClick={() => void handleSend()}
                  disabled={isThinking || !input.trim()}>
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PremiumAIChatWithElevenLabsUI;
