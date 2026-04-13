import { motion } from 'framer-motion'
import { RotateCcw, Home, Trophy, Target, Flame, Clock, Brain, Zap } from 'lucide-react'
import { type GameStats, getAccuracy, formatTime, getDifficultyTier } from '@/lib/math-engine'
import { FloatingSymbols } from './FloatingSymbols'

interface ResultsScreenProps {
  stats: GameStats
  onPlayAgain: () => void
  onHome: () => void
}

export function ResultsScreen({ stats, onPlayAgain, onHome }: ResultsScreenProps) {
  const accuracy = getAccuracy(stats)
  const avgTime = stats.averageTime > 0 ? stats.averageTime.toFixed(1) + 's' : '—'
  const tier = getDifficultyTier(stats.highestDifficulty)

  const grade = accuracy >= 90 ? 'S' : accuracy >= 75 ? 'A' : accuracy >= 60 ? 'B' : accuracy >= 40 ? 'C' : 'D'
  const gradeColor = grade === 'S' ? 'text-amber-500' : grade === 'A' ? 'text-emerald-500' : grade === 'B' ? 'text-blue-500' : grade === 'C' ? 'text-orange-500' : 'text-red-500'
  const gradeLabel = grade === 'S' ? 'Superstar!' : grade === 'A' ? 'Amazing!' : grade === 'B' ? 'Great Job!' : grade === 'C' ? 'Good Try!' : 'Keep Going!'

  const statCards = [
    { icon: <Target size={20} />, label: 'Problems', value: stats.totalSolved, color: 'text-primary' },
    { icon: <Zap size={20} />, label: 'Correct', value: stats.totalCorrect, color: 'text-emerald-500' },
    { icon: <Flame size={20} />, label: 'Best Streak', value: stats.bestStreak, color: 'text-amber-500' },
    { icon: <Clock size={20} />, label: 'Avg Time', value: avgTime, color: 'text-blue-500' },
    { icon: <Brain size={20} />, label: 'Max Level', value: stats.highestDifficulty + 1, color: 'text-violet-500' },
    { icon: <Trophy size={20} />, label: 'Accuracy', value: `${accuracy}%`, color: 'text-rose-500' },
  ]

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center p-6 overflow-hidden">
      <FloatingSymbols />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10 flex flex-col items-center text-center w-full max-w-md"
      >
        {/* Grade circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
          className="w-28 h-28 rounded-full bg-card border-4 border-border shadow-xl flex flex-col items-center justify-center mb-5"
        >
          <span className={`font-heading text-5xl font-bold ${gradeColor}`}>{grade}</span>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Grade</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="font-heading text-3xl font-bold text-foreground mb-1"
        >
          {gradeLabel}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-muted-foreground text-sm mb-2"
        >
          You reached {tier.emoji} {tier.name}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground text-xs mb-6"
        >
          Total time: {formatTime(stats.totalTimePlayed)}
        </motion.p>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="grid grid-cols-3 gap-2 w-full mb-8"
        >
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.07 }}
              className="bg-card rounded-2xl border border-border p-3 shadow-sm text-center"
            >
              <div className={`${stat.color} flex justify-center mb-1`}>{stat.icon}</div>
              <div className="font-heading font-bold text-lg text-foreground">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Accuracy Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="w-full bg-muted rounded-full h-3 mb-8 overflow-hidden"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${accuracy}%` }}
            transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-primary"
          />
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="flex gap-3 w-full"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onHome}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-2xl
                       bg-card border border-border text-foreground font-heading font-bold
                       shadow-sm hover:bg-secondary transition-colors"
          >
            <Home size={18} />
            Home
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onPlayAgain}
            className="flex-[2] flex items-center justify-center gap-2 px-5 py-4 rounded-2xl
                       bg-primary text-primary-foreground font-heading font-bold
                       shadow-lg hover:shadow-xl transition-shadow"
          >
            <RotateCcw size={18} />
            Play Again
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}
