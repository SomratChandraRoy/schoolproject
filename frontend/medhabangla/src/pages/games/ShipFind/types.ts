export interface Ship {
    id: number;
    length: number;
    positions: [number, number][];
    found: [number, number][];
    isComplete: boolean;
}

export interface Cell {
    row: number;
    col: number;
    isRevealed: boolean;
    hasShip: boolean;
    shipId: number | null;
    isHit: boolean;
    isMiss: boolean;
}

export interface ShipFindConfig {
    level: number;
    gridSize: number;
    shipCount: number;
    shipLengths: number[];
}

export const SHIP_LENGTHS = [4, 3, 3, 2, 2, 2, 1, 1];

export const getShipFindConfig = (level: number): ShipFindConfig => {
    if (level <= 3) {
        return { level, gridSize: 6, shipCount: 2, shipLengths: [3, 2] };
    }
    if (level <= 6) {
        return { level, gridSize: 8, shipCount: 4, shipLengths: [4, 3, 2, 2] };
    }
    if (level <= 10) {
        return { level, gridSize: 10, shipCount: 6, shipLengths: [4, 3, 3, 2, 2, 1] };
    }
    return { level, gridSize: 12, shipCount: 8, shipLengths: SHIP_LENGTHS };
};

export const calculateShipFindScore = (
    level: number,
    clicks: number,
    shipsFound: number,
    timeInSeconds: number
): number => {
    const baseScore = 1000;
    const levelMultiplier = level;
    const efficiencyBonus = Math.max(0, (shipsFound * 3 - clicks) * 10);
    const timeBonus = Math.max(0, 500 - timeInSeconds);

    return Math.floor((baseScore + efficiencyBonus + timeBonus) * levelMultiplier);
};
