import { useMemo } from 'react'

interface CircularTimerProps {
  timeLeft: number
  totalTime: number
  size?: number
}

export function CircularTimer({ timeLeft, totalTime, size = 100 }: CircularTimerProps) {
  const strokeWidth = size > 80 ? 8 : 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = totalTime > 0 ? timeLeft / totalTime : 0
  const offset = circumference * (1 - progress)

  const isUrgent = timeLeft <= 3
  const isWarning = timeLeft <= 5 && !isUrgent

  const colorClass = useMemo(() => {
    if (isUrgent) return 'text-red-500'
    if (isWarning) return 'text-amber-500'
    return 'text-primary'
  }, [isUrgent, isWarning])

  const bgStrokeClass = useMemo(() => {
    if (isUrgent) return 'stroke-red-100'
    if (isWarning) return 'stroke-amber-100'
    return 'stroke-secondary'
  }, [isUrgent, isWarning])

  return (
    <div
      className={`relative inline-flex items-center justify-center ${isUrgent ? 'animate-timer-pulse' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={bgStrokeClass}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke="currentColor"
          className={`${colorClass} timer-circle`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={`absolute inset-0 flex flex-col items-center justify-center ${colorClass}`}>
        <span className={`font-heading font-bold ${size > 80 ? 'text-2xl' : 'text-lg'}`}>
          {Math.ceil(timeLeft)}
        </span>
        <span className={`${size > 80 ? 'text-[10px]' : 'text-[8px]'} opacity-60 uppercase tracking-wider font-semibold`}>
          sec
        </span>
      </div>
    </div>
  )
}
