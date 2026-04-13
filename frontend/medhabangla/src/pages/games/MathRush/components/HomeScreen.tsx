import { motion } from 'framer-motion'
import { Play, Trophy, Zap, Brain, Infinity } from 'lucide-react'
import { FloatingSymbols } from './FloatingSymbols'

interface HomeScreenProps {
  onStart: () => void
  highScore: number
}

export function HomeScreen({ onStart, highScore }: HomeScreenProps) {
  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center p-6 overflow-hidden">
      <FloatingSymbols />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10 flex flex-col items-center text-center max-w-md w-full"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
          className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-primary shadow-xl flex items-center justify-center mb-6"
        >
          <span className="text-5xl md:text-6xl font-heading font-bold text-primary-foreground">
            M
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-2"
        >
          MathRush
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-muted-foreground text-lg mb-8 max-w-xs"
        >
          How fast is your brain? Solve infinite math challenges!
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex flex-wrap gap-2 justify-center mb-8"
        >
          {[
            { icon: <Infinity size={14} />, label: 'Infinite' },
            { icon: <Zap size={14} />, label: 'Speed Up' },
            { icon: <Brain size={14} />, label: 'Get Harder' },
          ].map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                         bg-secondary text-secondary-foreground border border-border"
            >
              {f.icon}
              {f.label}
            </span>
          ))}
        </motion.div>

        {/* High Score */}
        {highScore > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-2 mb-6 px-4 py-2 rounded-2xl bg-accent/10 text-accent"
          >
            <Trophy size={18} />
            <span className="font-bold text-sm">Best Score: {highScore}</span>
          </motion.div>
        )}

        {/* Start Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.65, type: 'spring', stiffness: 200, damping: 15 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="group relative flex items-center gap-3 px-10 py-5 rounded-3xl
                     bg-primary text-primary-foreground font-heading text-xl font-bold
                     shadow-xl hover:shadow-2xl transition-shadow duration-300"
        >
          <Play size={24} fill="currentColor" />
          Start Game
          <span className="absolute inset-0 rounded-3xl border-2 border-primary-foreground/20 animate-pulse-ring pointer-events-none" />
        </motion.button>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 p-5 rounded-2xl bg-card/80 backdrop-blur border border-border shadow-sm max-w-sm w-full"
        >
          <h3 className="font-heading font-bold text-sm text-foreground mb-3">How to Play</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">1.</span>
              Solve math problems as fast as you can
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">2.</span>
              Problems get harder & timer gets faster
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">3.</span>
              Keep your streak alive for bonus points
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">4.</span>
              Stop anytime to see your results
            </li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  )
}
