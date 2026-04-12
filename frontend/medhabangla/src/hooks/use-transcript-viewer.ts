import { useCallback, useEffect, useRef, useState } from "react";

export interface TranscriptWord extends TranscriptSegment {
  text: string;
  start: number;
  end: number;
  confidence?: number;
  segmentIndex: number;
  kind: "word";
}

export interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
  kind: "word" | "gap";
  segmentIndex: number;
}

export type SegmentComposer = (
  segments: TranscriptSegment[],
) => TranscriptSegment[];

export interface CharacterAlignmentModel {
  characters: Array<{
    character: string;
    start: number;
    end: number;
  }>;
}

export interface CharacterAlignmentResponseModel {
  characters?:
    | Array<{
        character: string;
        start?: number;
        end?: number;
      }>
    | string[];
}

export interface UseTranscriptViewerResult {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  spokenSegments: TranscriptSegment[];
  unspokenSegments: TranscriptSegment[];
  currentWord: TranscriptWord | null;
  segments: TranscriptSegment[];
  audioRef: React.RefObject<HTMLAudioElement>;
  play: () => void;
  pause: () => void;
  seekToTime: (time: number) => void;
  startScrubbing: () => void;
  endScrubbing: () => void;
}

export function useTranscriptViewer({
  alignment,
  hideAudioTags = true,
  segmentComposer,
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
  onDurationChange,
}: {
  alignment: CharacterAlignmentResponseModel;
  hideAudioTags?: boolean;
  segmentComposer?: SegmentComposer;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  onDurationChange?: (duration: number) => void;
}): UseTranscriptViewerResult {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isScrubbing = useRef(false);

  const segments: TranscriptSegment[] = (alignment.characters || []).map(
    (char: any, idx: number) => ({
      text: typeof char === "string" ? char : char.character || "",
      start: typeof char === "string" ? 0 : char.start || 0,
      end: typeof char === "string" ? 0 : char.end || 0,
      kind: "word" as const,
      segmentIndex: idx,
    }),
  );

  const composedSegments = segmentComposer
    ? segmentComposer(segments)
    : segments;

  const spokenSegments = composedSegments.filter((s) => s.end <= currentTime);
  const unspokenSegments = composedSegments.filter(
    (s) => s.start >= currentTime,
  );
  const currentWord = composedSegments.find(
    (s) => s.start <= currentTime && s.end >= currentTime,
  ) as TranscriptWord | undefined;

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      onPlay?.();
    }
  }, [onPlay]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      onPause?.();
    }
  }, [onPause]);

  const seekToTime = useCallback(
    (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
        onTimeUpdate?.(time);
      }
    },
    [onTimeUpdate],
  );

  const startScrubbing = useCallback(() => {
    isScrubbing.current = true;
  }, []);

  const endScrubbing = useCallback(() => {
    isScrubbing.current = false;
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      if (!isScrubbing.current) {
        setCurrentTime(audio.currentTime);
        onTimeUpdate?.(audio.currentTime);
      }
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      onDurationChange?.(audio.duration);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onTimeUpdate, onDurationChange, onEnded]);

  return {
    isPlaying,
    duration,
    currentTime,
    spokenSegments,
    unspokenSegments,
    currentWord: currentWord || null,
    segments: composedSegments,
    audioRef,
    play,
    pause,
    seekToTime,
    startScrubbing,
    endScrubbing,
  };
}
