import { useCallback, useRef, useState, useEffect } from "react";

export type AudioFormat = "pcm_16000" | "pcm_8000";
export type CommitStrategy = "vad" | "no_vad";

export interface UseScribeOptions {
  apiKey?: string;
  modelId?: string;
  language?: string;
  languageCode?: string;
  audioFormat?: AudioFormat;
  commitStrategy?: CommitStrategy;
  baseUri?: string;
  token?: string;
  vadSilenceThresholdSecs?: number;
  vadThreshold?: number;
  minSpeechDurationMs?: number;
  minSilenceDurationMs?: number;
  sampleRate?: number;
  microphone?: Partial<MediaDeviceInfo>;
  onTranscript?: (transcript: string) => void;
  onError?: (error: Error | { error: string }) => void;
  onStart?: () => void;
  onStop?: () => void;
  onPartialTranscript?: (data: { text: string }) => void;
  onCommittedTranscript?: (data: { text: string }) => void;
  onAuthError?: (error: Error | { error: string }) => void;
  onQuotaExceededError?: (error: Error | { error: string }) => void;
}

export interface TranscriptItem {
  text: string;
  confidence?: number;
}

export interface UseScribeResult {
  isListening: boolean;
  isLoading: boolean;
  transcript: string;
  isFinal: boolean;
  isConnected: boolean;
  status: "idle" | "connecting" | "connected" | "disconnected";
  error: string | null;
  partialTranscript: string;
  committedTranscripts: TranscriptItem[];
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
  connect: (options: UseScribeOptions) => Promise<void>;
  disconnect: () => void;
  clearTranscripts: () => void;
}

export function useScribe({
  apiKey,
  modelId = "nova_2",
  language = "en",
  audioFormat = "pcm_16000",
  commitStrategy = "vad",
  baseUri,
  onTranscript,
  onError,
  onStart,
  onStop,
}: UseScribeOptions = {}): UseScribeResult {
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isFinal, setIsFinal] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "disconnected"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [committedTranscripts, setCommittedTranscripts] = useState<
    TranscriptItem[]
  >([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(
    async (options: UseScribeOptions) => {
      try {
        setStatus("connecting");
        setIsLoading(true);
        // Placeholder for actual connection logic
        setStatus("connected");
        setIsConnected(true);
        setIsLoading(false);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        setStatus("disconnected");
        setIsLoading(false);
        onError?.(err instanceof Error ? err : new Error(errorMsg));
      }
    },
    [onError],
  );

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsConnected(false);
    setStatus("disconnected");
    setIsListening(false);
    onStop?.();
  }, [isListening, onStop]);

  const clearTranscripts = useCallback(() => {
    setPartialTranscript("");
    setCommittedTranscripts([]);
    setTranscript("");
  }, []);

  const start = useCallback(async () => {
    try {
      setIsLoading(true);
      onStart?.();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/mp3" });
        // Placeholder for actual transcription API call
        setPartialTranscript("");
        setCommittedTranscripts([{ text: "Transcription placeholder" }]);
        setTranscript("Transcription placeholder");
        setIsFinal(true);
        onTranscript?.("Transcription placeholder");
      };

      mediaRecorder.start();
      setIsListening(true);
      setIsLoading(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      const error = err instanceof Error ? err : new Error(errorMsg);
      onError?.(error);
      setIsLoading(false);
    }
  }, [onStart, onTranscript, onError]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      onStop?.();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, [isListening, onStop]);

  const reset = useCallback(() => {
    clearTranscripts();
    setIsFinal(false);
    chunksRef.current = [];
  }, [clearTranscripts]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isListening,
    isLoading,
    transcript,
    isFinal,
    isConnected,
    status,
    error,
    partialTranscript,
    committedTranscripts,
    start,
    stop,
    reset,
    connect,
    disconnect,
    clearTranscripts,
  };
}
