import { useMemo } from 'react'

const SYMBOLS = ['+', '-', '×', '÷', '=', '%', '√', 'π', '∞', '∑', '±', '∆']

interface FloatingSymbol {
  id: number
  symbol: string
  left: number
  delay: number
  duration: number
  size: number
  opacity: number
}

export function FloatingSymbols() {
  const symbols = useMemo<FloatingSymbol[]>(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      symbol: SYMBOLS[i % SYMBOLS.length],
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 5 + Math.random() * 8,
      size: 16 + Math.random() * 28,
      opacity: 0.04 + Math.random() * 0.08,
    }))
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {symbols.map((s) => (
        <span
          key={s.id}
          className="absolute animate-float select-none font-bold text-primary"
          style={{
            left: `${s.left}%`,
            top: `${20 + Math.random() * 60}%`,
            fontSize: `${s.size}px`,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        >
          {s.symbol}
        </span>
      ))}
    </div>
  )
}
