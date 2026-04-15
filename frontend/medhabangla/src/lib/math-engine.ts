// Math Engine: generates problems with increasing difficulty and shrinking timers

export type Operation = '+' | '-' | '×' | '÷'

export interface MathProblem {
  question: string
  answer: number
  difficulty: number
  timeLimit: number
  operationLabel: string
}

export interface GameStats {
  totalSolved: number
  totalCorrect: number
  totalWrong: number
  bestStreak: number
  currentStreak: number
  averageTime: number
  totalTimePlayed: number
  highestDifficulty: number
  problemTimes: number[]
}

// Difficulty tiers with labels
const DIFFICULTY_TIERS = [
  { name: 'Easy Peasy', emoji: '🌱', color: 'text-emerald-500' },
  { name: 'Getting Warm', emoji: '🔥', color: 'text-amber-500' },
  { name: 'Brain Power', emoji: '🧠', color: 'text-violet-500' },
  { name: 'Super Smart', emoji: '⚡', color: 'text-blue-500' },
  { name: 'Math Wizard', emoji: '🧙', color: 'text-purple-500' },
  { name: 'Genius Mode', emoji: '🚀', color: 'text-rose-500' },
  { name: 'Legendary', emoji: '👑', color: 'text-yellow-500' },
]

export function getDifficultyTier(difficulty: number) {
  const index = Math.min(Math.floor(difficulty / 4), DIFFICULTY_TIERS.length - 1)
  return DIFFICULTY_TIERS[index]
}

// Timer calculation: starts at 15s, shrinks to min 3s
export function getTimeLimit(difficulty: number): number {
  const base = 15
  const min = 3
  const reduction = difficulty * 0.5
  return Math.max(min, base - reduction)
}

// Random int between min and max (inclusive)
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Pick random item from array
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateProblem(difficulty: number): MathProblem {
  const timeLimit = getTimeLimit(difficulty)

  // Difficulty 0-3: Simple addition (1-10)
  if (difficulty < 4) {
    const a = randInt(1, 10 + difficulty * 3)
    const b = randInt(1, 10 + difficulty * 3)
    return {
      question: `${a} + ${b}`,
      answer: a + b,
      difficulty,
      timeLimit,
      operationLabel: 'Addition',
    }
  }

  // Difficulty 4-7: Addition & Subtraction (bigger numbers)
  if (difficulty < 8) {
    const ops: Operation[] = ['+', '-']
    const op = pick(ops)
    const range = 15 + (difficulty - 4) * 10
    if (op === '+') {
      const a = randInt(5, range)
      const b = randInt(5, range)
      return { question: `${a} + ${b}`, answer: a + b, difficulty, timeLimit, operationLabel: 'Addition' }
    } else {
      const b = randInt(2, Math.floor(range / 2))
      const a = randInt(b + 1, range)
      return { question: `${a} - ${b}`, answer: a - b, difficulty, timeLimit, operationLabel: 'Subtraction' }
    }
  }

  // Difficulty 8-11: Multiplication (small)
  if (difficulty < 12) {
    const ops: Operation[] = ['+', '-', '×']
    const op = pick(ops)
    const range = 30 + (difficulty - 8) * 10
    if (op === '×') {
      const a = randInt(2, 6 + Math.floor((difficulty - 8) * 1.5))
      const b = randInt(2, 9 + difficulty - 8)
      return { question: `${a} × ${b}`, answer: a * b, difficulty, timeLimit, operationLabel: 'Multiplication' }
    } else if (op === '-') {
      const b = randInt(5, Math.floor(range / 2))
      const a = randInt(b + 1, range)
      return { question: `${a} - ${b}`, answer: a - b, difficulty, timeLimit, operationLabel: 'Subtraction' }
    } else {
      const a = randInt(10, range)
      const b = randInt(10, range)
      return { question: `${a} + ${b}`, answer: a + b, difficulty, timeLimit, operationLabel: 'Addition' }
    }
  }

  // Difficulty 12-15: All four operations
  if (difficulty < 16) {
    const ops: Operation[] = ['+', '-', '×', '÷']
    const op = pick(ops)
    if (op === '÷') {
      const b = randInt(2, 8 + Math.floor((difficulty - 12) * 1.5))
      const answer = randInt(2, 12 + difficulty - 12)
      const a = b * answer
      return { question: `${a} ÷ ${b}`, answer, difficulty, timeLimit, operationLabel: 'Division' }
    } else if (op === '×') {
      const a = randInt(3, 10 + difficulty - 12)
      const b = randInt(3, 10 + difficulty - 12)
      return { question: `${a} × ${b}`, answer: a * b, difficulty, timeLimit, operationLabel: 'Multiplication' }
    } else if (op === '-') {
      const range = 50 + (difficulty - 12) * 15
      const b = randInt(10, Math.floor(range / 2))
      const a = randInt(b + 1, range)
      return { question: `${a} - ${b}`, answer: a - b, difficulty, timeLimit, operationLabel: 'Subtraction' }
    } else {
      const range = 50 + (difficulty - 12) * 15
      const a = randInt(20, range)
      const b = randInt(20, range)
      return { question: `${a} + ${b}`, answer: a + b, difficulty, timeLimit, operationLabel: 'Addition' }
    }
  }

  // Difficulty 16-19: Multi-digit, harder ops
  if (difficulty < 20) {
    const ops: Operation[] = ['+', '-', '×', '÷']
    const op = pick(ops)
    const scale = difficulty - 16
    if (op === '÷') {
      const b = randInt(3, 12 + scale * 2)
      const answer = randInt(3, 15 + scale * 3)
      const a = b * answer
      return { question: `${a} ÷ ${b}`, answer, difficulty, timeLimit, operationLabel: 'Division' }
    } else if (op === '×') {
      const a = randInt(6, 15 + scale * 3)
      const b = randInt(6, 15 + scale * 3)
      return { question: `${a} × ${b}`, answer: a * b, difficulty, timeLimit, operationLabel: 'Multiplication' }
    } else if (op === '-') {
      const range = 100 + scale * 50
      const b = randInt(20, Math.floor(range / 2))
      const a = randInt(b + 1, range)
      return { question: `${a} - ${b}`, answer: a - b, difficulty, timeLimit, operationLabel: 'Subtraction' }
    } else {
      const range = 100 + scale * 50
      const a = randInt(30, range)
      const b = randInt(30, range)
      return { question: `${a} + ${b}`, answer: a + b, difficulty, timeLimit, operationLabel: 'Addition' }
    }
  }

  // Difficulty 20+: Expert mode — huge numbers, complex ops
  const ops: Operation[] = ['+', '-', '×', '÷']
  const op = pick(ops)
  const extra = difficulty - 20
  if (op === '÷') {
    const b = randInt(4, 15 + extra * 2)
    const answer = randInt(5, 20 + extra * 4)
    const a = b * answer
    return { question: `${a} ÷ ${b}`, answer, difficulty, timeLimit, operationLabel: 'Division' }
  } else if (op === '×') {
    const a = randInt(8, 20 + extra * 4)
    const b = randInt(8, 20 + extra * 4)
    return { question: `${a} × ${b}`, answer: a * b, difficulty, timeLimit, operationLabel: 'Multiplication' }
  } else if (op === '-') {
    const range = 200 + extra * 80
    const b = randInt(50, Math.floor(range / 2))
    const a = randInt(b + 1, range)
    return { question: `${a} - ${b}`, answer: a - b, difficulty, timeLimit, operationLabel: 'Subtraction' }
  } else {
    const range = 200 + extra * 80
    const a = randInt(50, range)
    const b = randInt(50, range)
    return { question: `${a} + ${b}`, answer: a + b, difficulty, timeLimit, operationLabel: 'Addition' }
  }
}

export function createInitialStats(): GameStats {
  return {
    totalSolved: 0,
    totalCorrect: 0,
    totalWrong: 0,
    bestStreak: 0,
    currentStreak: 0,
    averageTime: 0,
    totalTimePlayed: 0,
    highestDifficulty: 0,
    problemTimes: [],
  }
}

export function getAccuracy(stats: GameStats): number {
  if (stats.totalSolved === 0) return 0
  return Math.round((stats.totalCorrect / stats.totalSolved) * 100)
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}
