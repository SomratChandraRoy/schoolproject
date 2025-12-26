export interface Tile {
    id: number;
    number: number | null;
    isRevealed: boolean;
    isCorrect: boolean;
    isWrong: boolean;
}

export interface NumberHuntConfig {
    level: number;
    gridSize: number;
    totalNumbers: number;
    memorizeTime: number;
}

export const getNumberHuntConfig = (level: number): NumberHuntConfig => {
    if (level <= 2) {
        return { level, gridSize: 3, totalNumbers: 6, memorizeTime: 5000 }; // 5 seconds
    }
    if (level <= 4) {
        return { level, gridSize: 4, totalNumbers: 12, memorizeTime: 6000 }; // 6 seconds
    }
    if (level <= 6) {
        return { level, gridSize: 5, totalNumbers: 20, memorizeTime: 7000 }; // 7 seconds
    }
    return { level, gridSize: 5, totalNumbers: 25, memorizeTime: 8000 }; // 8 seconds
};

export const calculateNumberHuntScore = (
    level: number,
    timeInSeconds: number,
    mistakes: number
): number => {
    const baseScore = 1000 * level;
    const timeBonus = Math.max(0, Math.floor((10000 - timeInSeconds * 1000) * 0.5));
    const mistakePenalty = mistakes * 100;

    return Math.max(0, baseScore + timeBonus - mistakePenalty);
};
