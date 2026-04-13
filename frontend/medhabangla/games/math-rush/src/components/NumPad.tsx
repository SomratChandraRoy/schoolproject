import { motion } from 'framer-motion'
import { Delete, CornerDownLeft } from 'lucide-react'

interface NumPadProps {
  onDigit: (digit: string) => void
  onDelete: () => void
  onSubmit: () => void
  onNegative: () => void
  disabled?: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '(−)', '0', '⏎']

export function NumPad({ onDigit, onDelete, onSubmit, onNegative, disabled }: NumPadProps) {
  const handleKey = (key: string) => {
    if (disabled) return
    if (key === '⏎') {
      onSubmit()
    } else if (key === '(−)') {
      onNegative()
    } else {
      onDigit(key)
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-[280px] mx-auto">
      {KEYS.map((key) => {
        const isSubmit = key === '⏎'
        const isNeg = key === '(−)'

        return (
          <motion.button
            key={key}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.04 }}
            onClick={() => handleKey(key)}
            disabled={disabled}
            className={`
              h-14 rounded-2xl font-heading text-xl font-bold
              transition-colors duration-150 select-none
              active:brightness-90 disabled:opacity-40
              ${isSubmit
                ? 'bg-primary text-primary-foreground shadow-md'
                : isNeg
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-card text-card-foreground shadow-sm border border-border hover:bg-secondary'
              }
            `}
          >
            {isSubmit ? (
              <CornerDownLeft className="mx-auto" size={22} />
            ) : (
              key
            )}
          </motion.button>
        )
      })}
      <motion.button
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.04 }}
        onClick={onDelete}
        disabled={disabled}
        className="col-span-3 h-12 rounded-2xl bg-muted text-muted-foreground font-heading text-base font-bold
                   transition-colors duration-150 flex items-center justify-center gap-2
                   hover:bg-destructive/10 hover:text-destructive active:brightness-90 disabled:opacity-40"
      >
        <Delete size={18} />
        Delete
      </motion.button>
    </div>
  )
}
