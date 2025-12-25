import { useState, useEffect, useCallback } from 'react';
import gameService, { PlayerProfile, GameSession, ScoreSubmission } from '../services/gameService';

export const useGame = (gameType: string) => {
    const [playerSession, setPlayerSession] = useState<PlayerProfile | null>(null);
    const [gameSession, setGameSession] = useState<GameSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        initializePlayer();
    }, []);

    const initializePlayer = async () => {
        try {
            const profile = await gameService.getProfile();
            setPlayerSession(profile);
            setLoading(false);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const startGame = useCallback(async () => {
        if (!playerSession) return;

        try {
            const result = await gameService.startSession(gameType);
            setGameSession(result.session);
            return result;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, [playerSession, gameType]);

    const submitScore = useCallback(async (scoreData: Omit<ScoreSubmission, 'session_uuid'>) => {
        if (!gameSession) return;

        try {
            const result = await gameService.submitScore({
                session_uuid: gameSession.session_uuid,
                ...scoreData,
            });
            setGameSession(result.session);
            return result;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, [gameSession]);

    const updatePreferences = useCallback(async (preferences: any) => {
        if (!playerSession) return;

        try {
            const updated = await gameService.updatePreferences(preferences);
            setPlayerSession(updated);
        } catch (err: any) {
            setError(err.message);
        }
    }, [playerSession]);

    return {
        playerSession,
        gameSession,
        loading,
        error,
        startGame,
        submitScore,
        updatePreferences,
    };
};

export const useLeaderboard = (gameType?: string, grade?: number) => {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, [gameType, grade]);

    const fetchLeaderboard = async () => {
        try {
            let data;
            if (gameType) {
                data = await gameService.getGameLeaderboard(gameType);
            } else if (grade) {
                data = await gameService.getGradeLeaderboard(grade);
            } else {
                data = await gameService.getGlobalLeaderboard();
            }
            setLeaderboard(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
            setLoading(false);
        }
    };

    return { leaderboard, loading, refresh: fetchLeaderboard };
};
