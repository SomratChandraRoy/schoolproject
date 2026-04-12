import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ScrubBarContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  duration: number;
  value: number;
  onScrub: (time: number) => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
}

const ScrubBarContainer = React.forwardRef<
  HTMLDivElement,
  ScrubBarContainerProps
>(
  (
    {
      duration = 0,
      value = 0,
      onScrub,
      onScrubStart,
      onScrubEnd,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isScrubbing, setIsScrubbing] = useState(false);

    const handleMouseDown = () => {
      setIsScrubbing(true);
      onScrubStart?.();
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      onScrubEnd?.();
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isScrubbing || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const time = Math.max(0, Math.min(percent * duration, duration));
      onScrub(time);
    };

    useEffect(() => {
      if (isScrubbing) {
        document.addEventListener("mouseup", handleMouseUp);
        return () => document.removeEventListener("mouseup", handleMouseUp);
      }
    }, [isScrubbing]);

    return (
      <div
        ref={containerRef || ref}
        data-slot="scrub-bar-container"
        className={cn(
          "group/scrub-bar relative flex w-full touch-none select-none items-center",
          className,
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        {...props}>
        {children}
      </div>
    );
  },
);

ScrubBarContainer.displayName = "ScrubBarContainer";

interface ScrubBarTrackProps extends React.HTMLAttributes<HTMLDivElement> {}

const ScrubBarTrack = React.forwardRef<HTMLDivElement, ScrubBarTrackProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="scrub-bar-track"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
      {...props}>
      {children}
    </div>
  ),
);

ScrubBarTrack.displayName = "ScrubBarTrack";

interface ScrubBarProgressProps extends React.HTMLAttributes<HTMLDivElement> {}

const ScrubBarProgress = React.forwardRef<
  HTMLDivElement,
  ScrubBarProgressProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="scrub-bar-progress"
    className={cn(
      "absolute left-0 top-0 h-full bg-primary rounded-full",
      className,
    )}
    {...props}
  />
));

ScrubBarProgress.displayName = "ScrubBarProgress";

interface ScrubBarThumbProps extends React.HTMLAttributes<HTMLDivElement> {}

const ScrubBarThumb = React.forwardRef<HTMLDivElement, ScrubBarThumbProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="scrub-bar-thumb"
      className={cn(
        "absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-md",
        className,
      )}
      {...props}
    />
  ),
);

ScrubBarThumb.displayName = "ScrubBarThumb";

interface ScrubBarTimeLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  time?: number;
}

const ScrubBarTimeLabel = React.forwardRef<
  HTMLDivElement,
  ScrubBarTimeLabelProps
>(({ time = 0, className, ...props }, ref) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div
      ref={ref}
      data-slot="scrub-bar-time-label"
      className={cn("text-xs", className)}
      {...props}>
      {formatTime(time)}
    </div>
  );
});

ScrubBarTimeLabel.displayName = "ScrubBarTimeLabel";

export {
  ScrubBarContainer,
  ScrubBarTrack,
  ScrubBarProgress,
  ScrubBarThumb,
  ScrubBarTimeLabel,
};
