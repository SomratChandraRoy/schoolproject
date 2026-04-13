/**
 * Bar Visualizer Component from ElevenLabs UI
 * Animated bar visualization for audio feedback
 * Based on https://ui.elevenlabs.io/docs/components/bar-visualizer
 */

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";

export interface BarVisualizerProps extends React.HTMLAttributes<HTMLDivElement> {
  isActive?: boolean;
  color?: string;
  barCount?: number;
  animating?: boolean;
}

export const BarVisualizer = React.forwardRef<
  HTMLDivElement,
  BarVisualizerProps
>(
  (
    {
      isActive = false,
      color = "#3b82f6",
      barCount = 12,
      animating = true,
      className,
      ...props
    }: BarVisualizerProps,
    ref,
  ) => {
    const [bars, setBars] = useState<number[]>(Array(barCount).fill(0.3));
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
      if (!animating || !isActive) return;

      const animate = () => {
        setBars((prev) =>
          prev.map(() => {
            const random = Math.random();
            return isActive ? 0.2 + random * 0.8 : 0.3 + random * 0.2;
          }),
        );
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [animating, isActive]);

    return (
      <div
        ref={ref}
        className={clsx("flex items-center justify-center gap-1", className)}
        {...props}>
        {bars.map((height, i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-all duration-75"
            style={{
              height: `${height * 32}px`,
              backgroundColor: color,
              opacity: isActive ? 1 : 0.5,
              minHeight: "4px",
              maxHeight: "32px",
            }}
          />
        ))}
      </div>
    );
  },
);

BarVisualizer.displayName = "BarVisualizer";
