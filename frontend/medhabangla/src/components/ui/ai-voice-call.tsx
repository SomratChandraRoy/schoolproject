import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  "গণিতের বীজগণিত ধাপে ধাপে বুঝাও।",
  "Class 10 Science viva style প্রশ্ন করো।",
  "আমার ইংরেজি উচ্চারণ ঠিক করতে চাও।",
  "Exam mode এ ১টা প্রশ্ন করো এবং feedback দাও।",
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  meta?: string;
}

type ConversationMode = "tutor" | "exam" | "quiz" | "general";
type VoiceState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "disconnected";

interface ProviderTrace {
  stt?: string | null;
  llm?: string | null;
  tts?: string | null;
}

const VAD_RMS_THRESHOLD = 0.016;
const VAD_SILENCE_COMMIT_MS = 1200;
const VAD_MAX_TURN_MS = 9000;
const MIN_AUTO_COMMIT_BYTES = 4096;
const FORCE_AUTO_COMMIT_MS = 12000;
const MAX_BUFFERED_BYTES_BEFORE_COMMIT = 720000;
const CHUNK_UPLOAD_WAIT_TIMEOUT_MS = 2500;
const MIN_SPEECH_FRAMES = 3;

const AIVoiceCall: React.FC = () => {
  const navigate = useNavigate();
  const messagePanelRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const playbackChainRef = useRef<Promise<void>>(Promise.resolve());
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const supportedMimeTypeRef = useRef<string | undefined>(undefined);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const analyserDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const vadIntervalRef = useRef<number | null>(null);
  const pendingAudioBytesRef = useRef(0);
  const pendingChunkUploadsRef = useRef(0);
  const captureStartedAtRef = useRef<number | null>(null);
  const lastSpeechAtRef = useRef(0);
  const speechStartAtRef = useRef<number | null>(null);
  const speechFramesRef = useRef(0);
  const hasSpeechRef = useRef(false);
  const isTurnProcessingRef = useRef(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composerValue, setComposerValue] = useState("");
  const [subjectValue, setSubjectValue] = useState("General");
  const [topicValue, setTopicValue] = useState("");
  const [mode, setMode] = useState<ConversationMode>("tutor");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastProviders, setLastProviders] = useState<ProviderTrace | null>(
    null,
  );

  const isPopupWindow = typeof window !== "undefined" && window.opener !== null;

  const sessionActiveRef = useRef(isSessionActive);
  const micMutedRef = useRef(isMicMuted);

  useEffect(() => {
    sessionActiveRef.current = isSessionActive;
  }, [isSessionActive]);

  useEffect(() => {
    micMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const getAuthToken = () => {
    return localStorage.getItem("token") || "";
  };

  const resolveIdleState = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = sessionActiveRef.current && !micMutedRef.current;
      });
    }

    if (!sessionActiveRef.current) {
      setVoiceState("idle");
      return;
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setVoiceState("disconnected");
      return;
    }

    setVoiceState(micMutedRef.current ? "idle" : "listening");
  }, []);

  const closeSocket = useCallback(() => {
    const ws = wsRef.current;
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close();
      wsRef.current = null;
    }
    setIsSocketConnected(false);
  }, []);

  const stopMicrophone = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (vadIntervalRef.current !== null) {
      window.clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }

    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    analyserDataRef.current = null;
    supportedMimeTypeRef.current = undefined;
    pendingAudioBytesRef.current = 0;
    pendingChunkUploadsRef.current = 0;
    captureStartedAtRef.current = null;
    lastSpeechAtRef.current = 0;
    speechStartAtRef.current = null;
    speechFramesRef.current = 0;
    hasSpeechRef.current = false;
    isTurnProcessingRef.current = false;

    if (inputAudioContextRef.current) {
      void inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
  }, []);

  const duckMicrophone = useCallback(() => {
    if (!mediaStreamRef.current) {
      return;
    }

    mediaStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
  }, []);

  const restoreMicrophone = useCallback(() => {
    if (!mediaStreamRef.current) {
      return;
    }

    mediaStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = sessionActiveRef.current && !micMutedRef.current;
    });
  }, []);

  const base64FromBlob = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = String(reader.result || "");
        const base64 = result.split(",")[1] || "";
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read audio chunk"));
      reader.readAsDataURL(blob);
    });
  };

  const decodeBase64 = (value: string): ArrayBuffer => {
    const binary = window.atob(value);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const playAudioBase64 = useCallback(
    async (audioBase64: string, audioMimeType: string) => {
      if (!audioBase64) {
        return;
      }

      setVoiceState("speaking");
      duckMicrophone();

      const playWithElement = async () => {
        const src = `data:${audioMimeType || "audio/mpeg"};base64,${audioBase64}`;
        const audio = new Audio(src);
        await audio.play();

        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
        });
      };

      try {
        const AudioContextCtor =
          window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextCtor) {
          await playWithElement();
          return;
        }

        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContextCtor();
        }

        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }

        const arrayBuffer = decodeBase64(audioBase64);
        const decodedBuffer = await audioContextRef.current.decodeAudioData(
          arrayBuffer.slice(0),
        );

        await new Promise<void>((resolve) => {
          if (!audioContextRef.current) {
            resolve();
            return;
          }

          const source = audioContextRef.current.createBufferSource();
          source.buffer = decodedBuffer;
          source.connect(audioContextRef.current.destination);
          source.onended = () => resolve();
          source.start(0);
        });
      } catch (error) {
        console.warn("WebAudio decode failed, using HTMLAudio fallback", error);
        await playWithElement();
      } finally {
        restoreMicrophone();
        resolveIdleState();
      }
    },
    [duckMicrophone, resolveIdleState, restoreMicrophone],
  );

  const speakWithBrowserTts = useCallback(
    async (text: string) => {
      const normalizedText = text.trim();
      if (!normalizedText) {
        resolveIdleState();
        return;
      }

      if (
        !("speechSynthesis" in window) ||
        typeof SpeechSynthesisUtterance === "undefined"
      ) {
        resolveIdleState();
        return;
      }

      setVoiceState("speaking");
      duckMicrophone();

      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(normalizedText);
        utterance.lang = "bn-BD";
        utterance.rate = 1;
        utterance.pitch = 1;

        const availableVoices = window.speechSynthesis.getVoices();
        const banglaVoice = availableVoices.find((voice) =>
          voice.lang.toLowerCase().startsWith("bn"),
        );
        if (banglaVoice) {
          utterance.voice = banglaVoice;
        }

        const fallbackTimer = window.setTimeout(
          () => {
            resolve();
          },
          Math.max(5000, normalizedText.length * 90),
        );

        utterance.onend = () => {
          window.clearTimeout(fallbackTimer);
          resolve();
        };

        utterance.onerror = () => {
          window.clearTimeout(fallbackTimer);
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      });

      restoreMicrophone();
      resolveIdleState();
    },
    [duckMicrophone, resolveIdleState, restoreMicrophone],
  );

  const enqueueAudio = useCallback(
    (audioBase64?: string | null, audioMimeType?: string | null) => {
      if (!audioBase64) {
        resolveIdleState();
        return;
      }

      playbackChainRef.current = playbackChainRef.current
        .then(() => playAudioBase64(audioBase64, audioMimeType || "audio/mpeg"))
        .catch((error) => {
          console.error("Audio queue playback failed", error);
          resolveIdleState();
        });
    },
    [playAudioBase64, resolveIdleState],
  );

  const sendSocketEvent = useCallback(
    (payload: Record<string, unknown>, options?: { silent?: boolean }) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        if (!options?.silent) {
          appendMessage({
            role: "assistant",
            content:
              "Realtime socket not connected. Please restart the session.",
          });
        }
        setVoiceState("disconnected");
        return false;
      }

      wsRef.current.send(JSON.stringify(payload));
      return true;
    },
    [appendMessage],
  );

  const startRecorderStreaming = useCallback(
    (stream: MediaStream) => {
      const recorder = supportedMimeTypeRef.current
        ? new MediaRecorder(stream, { mimeType: supportedMimeTypeRef.current })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (event) => {
        if (!sessionActiveRef.current || micMutedRef.current) {
          return;
        }

        if (event.data.size <= 0) {
          return;
        }

        pendingChunkUploadsRef.current += 1;
        try {
          const normalizedMimeType = (
            event.data.type ||
            supportedMimeTypeRef.current ||
            "audio/webm"
          )
            .split(";", 1)[0]
            .trim();

          pendingAudioBytesRef.current += event.data.size;
          if (captureStartedAtRef.current === null) {
            captureStartedAtRef.current = Date.now();
          }

          const chunkBase64 = await base64FromBlob(event.data);
          sendSocketEvent(
            {
              type: "audio_chunk",
              chunk_base64: chunkBase64,
              mime_type: normalizedMimeType || "audio/webm",
            },
            { silent: true },
          );
        } catch (error) {
          console.error("Failed to stream audio chunk", error);
        } finally {
          pendingChunkUploadsRef.current = Math.max(
            0,
            pendingChunkUploadsRef.current - 1,
          );
        }
      };

      recorder.start(350);
    },
    [sendSocketEvent],
  );

  const waitForPendingChunkUploads = useCallback(async () => {
    const startedAt = Date.now();

    while (pendingChunkUploadsRef.current > 0) {
      if (Date.now() - startedAt >= CHUNK_UPLOAD_WAIT_TIMEOUT_MS) {
        break;
      }
      await new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), 40);
      });
    }
  }, []);

  const finalizeRecorderForCommit = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      await waitForPendingChunkUploads();
      return;
    }

    await new Promise<void>((resolve) => {
      const onStop = () => {
        recorder.removeEventListener("stop", onStop);
        resolve();
      };

      recorder.addEventListener("stop", onStop, { once: true });

      try {
        recorder.requestData();
      } catch {
        // Ignore requestData errors for browsers that don't support it in this state.
      }

      recorder.stop();
    });

    await waitForPendingChunkUploads();
  }, [waitForPendingChunkUploads]);

  const commitBufferedVoice = useCallback(
    async (source: "manual" | "auto") => {
      if (!sessionActiveRef.current || micMutedRef.current) {
        return false;
      }

      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return false;
      }

      if (isTurnProcessingRef.current) {
        return false;
      }

      if (
        source === "auto" &&
        pendingAudioBytesRef.current < MIN_AUTO_COMMIT_BYTES
      ) {
        return false;
      }

      isTurnProcessingRef.current = true;
      setVoiceState("thinking");

      await finalizeRecorderForCommit();

      const sent = sendSocketEvent({ type: "audio_commit" }, { silent: true });
      if (!sent) {
        isTurnProcessingRef.current = false;
        resolveIdleState();
        return false;
      }

      pendingAudioBytesRef.current = 0;
      captureStartedAtRef.current = null;
      lastSpeechAtRef.current = 0;
      speechStartAtRef.current = null;
      speechFramesRef.current = 0;
      hasSpeechRef.current = false;

      if (mediaStreamRef.current && sessionActiveRef.current) {
        startRecorderStreaming(mediaStreamRef.current);
      }

      return true;
    },
    [
      finalizeRecorderForCommit,
      resolveIdleState,
      sendSocketEvent,
      startRecorderStreaming,
    ],
  );

  const connectSocket = useCallback(
    (targetSessionId: string, token: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const wsUrl = `${protocol}://${window.location.host}/ws/ai/voice-tutor/${targetSessionId}/?token=${encodeURIComponent(token)}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsSocketConnected(true);
          setVoiceState(micMutedRef.current ? "idle" : "listening");
          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const eventType = data.type;

            if (eventType === "state") {
              const nextState = String(data.state || "").toLowerCase();
              if (
                nextState === "listening" ||
                nextState === "thinking" ||
                nextState === "speaking" ||
                nextState === "idle" ||
                nextState === "disconnected"
              ) {
                setVoiceState(nextState as VoiceState);

                if (nextState === "thinking") {
                  isTurnProcessingRef.current = true;
                }

                if (
                  nextState === "listening" ||
                  nextState === "idle" ||
                  nextState === "disconnected"
                ) {
                  isTurnProcessingRef.current = false;
                }
              }
              return;
            }

            if (eventType === "user_transcript") {
              const transcript = String(data.text || "").trim();
              if (transcript) {
                appendMessage({ role: "user", content: transcript });
              }
              return;
            }

            if (eventType === "assistant_response") {
              isTurnProcessingRef.current = false;

              const providers = (data.providers || {}) as ProviderTrace;
              setLastProviders(providers);
              const assistantText = String(data.text || "").trim();

              const providerMeta = [
                providers.stt ? `STT:${providers.stt}` : "",
                providers.llm ? `LLM:${providers.llm}` : "",
                providers.tts ? `TTS:${providers.tts}` : "",
              ]
                .filter(Boolean)
                .join(" | ");

              appendMessage({
                role: "assistant",
                content: assistantText,
                meta: providerMeta || undefined,
              });

              if (data.audio_base64) {
                enqueueAudio(data.audio_base64, data.audio_mime_type);
              } else {
                playbackChainRef.current = playbackChainRef.current
                  .then(() => speakWithBrowserTts(assistantText))
                  .catch((error) => {
                    console.error("Browser TTS fallback failed", error);
                    resolveIdleState();
                  });
              }
              return;
            }

            if (eventType === "error") {
              isTurnProcessingRef.current = false;
              appendMessage({
                role: "assistant",
                content: `Voice pipeline error: ${String(data.message || "Unknown error")}`,
              });
              resolveIdleState();
              return;
            }
          } catch (error) {
            console.error("Failed to parse voice websocket payload", error);
          }
        };

        ws.onerror = () => {
          setIsSocketConnected(false);
          isTurnProcessingRef.current = false;
          setVoiceState("disconnected");
          reject(new Error("Realtime voice socket connection failed"));
        };

        ws.onclose = () => {
          setIsSocketConnected(false);
          isTurnProcessingRef.current = false;
          if (sessionActiveRef.current) {
            setVoiceState("disconnected");
          }
        };
      });
    },
    [appendMessage, enqueueAudio, resolveIdleState, speakWithBrowserTts],
  );

  const startMicStreaming = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });
    mediaStreamRef.current = stream;
    pendingAudioBytesRef.current = 0;
    captureStartedAtRef.current = null;
    lastSpeechAtRef.current = 0;
    speechStartAtRef.current = null;
    speechFramesRef.current = 0;
    hasSpeechRef.current = false;

    const InputAudioContextCtor =
      window.AudioContext || (window as any).webkitAudioContext;

    if (InputAudioContextCtor) {
      if (!inputAudioContextRef.current) {
        inputAudioContextRef.current = new InputAudioContextCtor();
      }

      if (inputAudioContextRef.current.state === "suspended") {
        await inputAudioContextRef.current.resume();
      }

      if (inputSourceRef.current) {
        inputSourceRef.current.disconnect();
        inputSourceRef.current = null;
      }

      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }

      inputSourceRef.current =
        inputAudioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = inputAudioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.82;
      inputSourceRef.current.connect(analyserRef.current);
      analyserDataRef.current = new Uint8Array(
        analyserRef.current.fftSize,
      ) as Uint8Array<ArrayBuffer>;

      if (vadIntervalRef.current !== null) {
        window.clearInterval(vadIntervalRef.current);
      }

      // Commit automatically when speech ends to avoid requiring manual "Process Voice" each turn.
      vadIntervalRef.current = window.setInterval(() => {
        if (
          !sessionActiveRef.current ||
          micMutedRef.current ||
          isTurnProcessingRef.current
        ) {
          return;
        }

        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return;
        }

        const now = Date.now();

        // Safety net: force a commit for long/large turns even when VAD misses very low-volume speech.
        if (
          hasSpeechRef.current &&
          pendingAudioBytesRef.current >= MAX_BUFFERED_BYTES_BEFORE_COMMIT
        ) {
          void commitBufferedVoice("auto");
          return;
        }

        if (
          hasSpeechRef.current &&
          captureStartedAtRef.current &&
          pendingAudioBytesRef.current >= MIN_AUTO_COMMIT_BYTES &&
          now - captureStartedAtRef.current >= FORCE_AUTO_COMMIT_MS
        ) {
          void commitBufferedVoice("auto");
          return;
        }

        const analyser = analyserRef.current;
        const dataArray = analyserDataRef.current;
        if (!analyser || !dataArray) {
          return;
        }

        analyser.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i += 1) {
          const normalized = (dataArray[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }

        const rms = Math.sqrt(sumSquares / dataArray.length);

        if (rms >= VAD_RMS_THRESHOLD) {
          speechFramesRef.current += 1;
          if (speechFramesRef.current >= MIN_SPEECH_FRAMES) {
            hasSpeechRef.current = true;
            lastSpeechAtRef.current = now;
            if (speechStartAtRef.current === null) {
              speechStartAtRef.current = now;
            }
          }
          return;
        }

        if (!hasSpeechRef.current) {
          speechFramesRef.current = Math.max(0, speechFramesRef.current - 1);
        }

        if (!hasSpeechRef.current) {
          return;
        }

        if (
          speechStartAtRef.current !== null &&
          now - speechStartAtRef.current >= VAD_MAX_TURN_MS
        ) {
          void commitBufferedVoice("auto");
          return;
        }

        if (
          lastSpeechAtRef.current &&
          now - lastSpeechAtRef.current >= VAD_SILENCE_COMMIT_MS
        ) {
          void commitBufferedVoice("auto");
        }
      }, 220);
    }

    const mimeTypeCandidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
    ];

    const supportedMimeType = mimeTypeCandidates.find((candidate) => {
      return (
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported(candidate)
      );
    });
    supportedMimeTypeRef.current = supportedMimeType;
    startRecorderStreaming(stream);

    stream.getAudioTracks().forEach((track) => {
      track.enabled = !micMutedRef.current;
    });
  }, [commitBufferedVoice, startRecorderStreaming]);

  const startSession = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      appendMessage({
        role: "assistant",
        content: "Authentication token missing. Please login again.",
      });
      return;
    }

    try {
      setVoiceState("thinking");

      const response = await fetch("/api/ai/voice-conversation/start/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          subject: subjectValue,
          topic: topicValue,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.session_id) {
        throw new Error(data.error || "Failed to start voice session");
      }

      setSessionId(data.session_id);
      await connectSocket(data.session_id, token);
      await startMicStreaming();

      setIsSessionActive(true);
      appendMessage({
        role: "assistant",
        content:
          "Voice session started. Speak naturally and pause after each sentence. Turns are processed automatically.",
      });
      resolveIdleState();
    } catch (error) {
      console.error("Failed to start realtime session", error);
      appendMessage({
        role: "assistant",
        content: `Could not start session: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
      stopMicrophone();
      closeSocket();
      setSessionId(null);
      setIsSessionActive(false);
      setVoiceState("disconnected");
    }
  }, [
    appendMessage,
    closeSocket,
    connectSocket,
    mode,
    resolveIdleState,
    startMicStreaming,
    stopMicrophone,
    subjectValue,
    topicValue,
  ]);

  const endSession = useCallback(async () => {
    const token = getAuthToken();
    const currentSessionId = sessionId;

    try {
      if (currentSessionId && token) {
        await fetch("/api/ai/voice-conversation/end/", {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session_id: currentSessionId }),
        });
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "end_session" }));
      }
    } catch (error) {
      console.warn("Error while ending session", error);
    } finally {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      stopMicrophone();
      closeSocket();
      setIsSessionActive(false);
      setSessionId(null);
      setVoiceState("idle");
      setLastProviders(null);
    }
  }, [closeSocket, sessionId, stopMicrophone]);

  const sessionLabel = useMemo(() => {
    if (!isSessionActive) return "Session not started";
    if (isMicMuted) return "Mic muted";
    if (!isSocketConnected) return "Socket disconnected";
    if (voiceState === "thinking") return "Thinking...";
    if (voiceState === "speaking") return "Speaking...";
    if (voiceState === "disconnected") return "Connection lost";
    return "Listening...";
  }, [isMicMuted, isSessionActive, isSocketConnected, voiceState]);

  const aiIconMode: "thinking" | "responding" | "ready" | "offline" =
    voiceState === "thinking"
      ? "thinking"
      : voiceState === "speaking"
        ? "responding"
        : !isSessionActive || voiceState === "disconnected"
          ? "offline"
          : "ready";

  const aiOrbAgentState =
    aiIconMode === "thinking"
      ? "thinking"
      : aiIconMode === "responding"
        ? "talking"
        : aiIconMode === "ready"
          ? "listening"
          : null;

  const aiIconTitle =
    aiIconMode === "thinking"
      ? "AI Thinking"
      : aiIconMode === "responding"
        ? "AI Responding"
        : aiIconMode === "ready"
          ? "AI Ready"
          : "AI Offline";

  const aiIconHint =
    aiIconMode === "thinking"
      ? "Analyzing your voice"
      : aiIconMode === "responding"
        ? "Generating and speaking"
        : aiIconMode === "ready"
          ? "Waiting for your next turn"
          : "Start session to activate";

  useEffect(() => {
    const panel = messagePanelRef.current;
    if (!panel) {
      return;
    }

    panel.scrollTo({ top: panel.scrollHeight, behavior: "smooth" });
  }, [messages, voiceState]);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      stopMicrophone();
      closeSocket();
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [closeSocket, stopMicrophone]);

  const handleClose = () => {
    if (isSessionActive) {
      void endSession();
    }

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

  const submitPrompt = (rawValue: string) => {
    const value = rawValue.trim();
    if (!value) {
      return;
    }

    if (!isSessionActive) {
      appendMessage({
        role: "assistant",
        content: "Start session first to send messages.",
      });
      return;
    }

    const sent = sendSocketEvent({
      type: "text_message",
      text: value,
    });
    if (!sent) {
      return;
    }

    appendMessage({ role: "user", content: value });
    setComposerValue("");
    setVoiceState("thinking");
  };

  const addQuickPrompt = (prompt: string) => {
    submitPrompt(prompt);
  };

  const processVoiceTurn = () => {
    if (!isSessionActive) {
      appendMessage({
        role: "assistant",
        content: "Start session first, then speak and process voice.",
      });
      return;
    }

    void commitBufferedVoice("manual");
  };

  const toggleMic = () => {
    setIsMicMuted((prev) => {
      const next = !prev;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }

      if (isSessionActive) {
        setVoiceState(next ? "idle" : "listening");
      }
      return next;
    });
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
                Real-time Bangla voice tutor with STT/LLM/TTS provider fallback
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-sky-300/50 bg-sky-100/45 px-1.5 py-1 dark:border-sky-500/35 dark:bg-sky-900/20">
              <div
                className={cn(
                  "ai-voice-ai-icon",
                  aiIconMode === "thinking" && "is-thinking",
                  aiIconMode === "responding" && "is-responding",
                  aiIconMode === "ready" && "is-ready",
                  aiIconMode === "offline" && "is-offline",
                )}
                role="status"
                aria-live="polite"
                aria-label={`${aiIconTitle}. ${aiIconHint}`}>
                <div className="ai-voice-ai-icon-ring" />
                <div className="ai-voice-ai-icon-core">
                  <Orb className="h-full w-full" agentState={aiOrbAgentState} />
                </div>
                <div className="ai-voice-ai-icon-bars" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="hidden leading-tight md:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-200">
                  {aiIconTitle}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {aiIconHint}
                </p>
              </div>
            </div>

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
                          Start your realtime AI Bangla voice tutor
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                          Stream mic chunks continuously, then process each
                          speaking turn for contextual tutor feedback.
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
                            {message.meta && (
                              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                {message.meta}
                              </p>
                            )}
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

                  {voiceState === "thinking" && (
                    <div className="rounded-xl border border-sky-300/70 bg-sky-50/90 px-3 py-2 text-xs text-sky-900 dark:border-sky-500/40 dark:bg-sky-900/25 dark:text-sky-100 sm:text-sm">
                      Tutor is reasoning on your latest voice context...
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 bg-white/90 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/86 dark:shadow-[0_-8px_24px_rgba(0,0,0,0.2)] sm:p-4">
                  <div className="mb-2 grid gap-2 sm:grid-cols-3">
                    <select
                      value={mode}
                      onChange={(event) =>
                        setMode(event.target.value as ConversationMode)
                      }
                      disabled={isSessionActive}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                      <option value="tutor">Tutor Mode</option>
                      <option value="exam">Exam Mode</option>
                      <option value="quiz">Quiz Mode</option>
                      <option value="general">General Mode</option>
                    </select>
                    <input
                      value={subjectValue}
                      onChange={(event) => setSubjectValue(event.target.value)}
                      disabled={isSessionActive}
                      placeholder="Subject"
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <input
                      value={topicValue}
                      onChange={(event) => setTopicValue(event.target.value)}
                      disabled={isSessionActive}
                      placeholder="Topic (optional)"
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800/85 dark:text-slate-200 sm:text-xs">
                      <span
                        className={cn(
                          "inline-block h-2 w-2 rounded-full",
                          isSessionActive && !isMicMuted && isSocketConnected
                            ? "bg-sky-500 animate-pulse"
                            : "bg-slate-300/70",
                        )}
                      />
                      {sessionLabel}
                    </div>

                    <div className="flex items-center gap-2">
                      {lastProviders && (
                        <div className="hidden rounded-full border border-sky-300/60 bg-sky-100/70 px-2 py-1 text-[10px] font-semibold text-sky-800 dark:border-sky-500/45 dark:bg-sky-900/30 dark:text-sky-100 sm:block">
                          {`STT:${lastProviders.stt || "-"}  LLM:${lastProviders.llm || "-"}  TTS:${lastProviders.tts || "-"}`}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setMessages([])}
                        className="text-[11px] text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 sm:text-xs">
                        Clear transcript
                      </button>
                    </div>
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
                      onClick={toggleMic}
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
                        if (isSessionActive) {
                          void endSession();
                        } else {
                          void startSession();
                        }
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

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      onClick={processVoiceTurn}
                      disabled={!isSessionActive || voiceState === "thinking"}
                      aria-label="Process buffered voice chunks">
                      <Sparkles className="mr-1.5 size-4" />
                      Process Voice
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
