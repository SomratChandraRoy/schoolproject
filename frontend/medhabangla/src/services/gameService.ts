import axios from "axios";

const API_BASE_URL = "/api/games";

interface GameData {
  id: number;
  game_type: string;
  name: string;
  description: string;
  thumbnail?: string;
  is_active: boolean;
  min_grade: number;
  max_grade: number;
  base_points: number;
}

interface PlayerProfile {
  id: number;
  session_id: string;
  player_name: string;
  grade: number;
  total_score: number;
  total_games_played: number;
  achievements: any;
  preferences: any;
  username: string;
}

interface GameSession {
  id: number;
  session_uuid: string;
  game_name: string;
  game_type: string;
  current_level: number;
  session_score: number;
  games_played: number;
  games_won: number;
  games_lost: number;
  current_streak: number;
  best_streak: number;
  started_at: string;
  last_played: string;
  is_active: boolean;
  recent_scores?: any[];
}

interface ScoreSubmission {
  session_uuid: string;
  level: number;
  score: number;
  time_taken: number;
  success: boolean;
  accuracy: number;
  metadata?: any;
}

interface LeaderboardEntry {
  id: number;
  player_name: string;
  game_name?: string;
  leaderboard_type: string;
  rank: number;
  highest_level: number;
  total_score: number;
  grade?: number;
  created_at: string;
}

interface ImageDraggerProfile {
  iq_level: number;
  recommended_grid_size: number;
  recommended_time_limit: number;
  current_level: number;
  games_played: number;
  games_won: number;
  win_rate: number;
  best_time: number | null;
  avg_time: number | null;
  last_grid_size: number;
}

class GameService {
  private api;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      console.log("Token from localStorage:", token ? "Present" : "Missing");
      console.log("Request URL:", config.url);
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
      return config;
    });

    // Add response interceptor for debugging
    this.api.interceptors.response.use(
      (response) => {
        console.log("API Response:", response.config.url, response.status);
        return response;
      },
      (error) => {
        console.error(
          "API Error:",
          error.config?.url,
          error.response?.status,
          error.response?.data,
        );
        return Promise.reject(error);
      },
    );
  }

  // Player Profile
  async createProfile(
    playerName?: string,
    grade?: number,
  ): Promise<PlayerProfile> {
    const response = await this.api.post("/profiles/create_profile/", {
      player_name: playerName,
      grade: grade,
    });
    return response.data;
  }

  async getProfile(): Promise<PlayerProfile> {
    const response = await this.api.get("/profiles/get_profile/");
    return response.data;
  }

  async updatePreferences(preferences: any): Promise<PlayerProfile> {
    const response = await this.api.patch("/profiles/update_preferences/", {
      preferences: preferences,
    });
    return response.data;
  }

  // Games
  async getAllGames(): Promise<GameData[]> {
    const response = await this.api.get("/games/");
    // Handle paginated response
    if (response.data.results) {
      return response.data.results;
    }
    return response.data;
  }

  async getGamesByGrade(grade: number): Promise<GameData[]> {
    const response = await this.api.get("/games/by_grade/", {
      params: { grade: grade },
    });
    // Handle paginated response
    if (response.data.results) {
      return response.data.results;
    }
    return response.data;
  }

  // Game Session
  async startSession(
    gameType: string,
  ): Promise<{ session: GameSession; is_new: boolean }> {
    const response = await this.api.post("/sessions/start_session/", {
      game_type: gameType,
    });
    return response.data;
  }

  async submitScore(scoreData: ScoreSubmission): Promise<any> {
    const response = await this.api.post("/sessions/submit_score/", scoreData);
    return response.data;
  }

  async getPlayerSessions(): Promise<GameSession[]> {
    const response = await this.api.get("/sessions/player_sessions/");
    // Handle paginated response
    if (response.data.results) {
      return response.data.results;
    }
    return response.data;
  }

  async getImageDraggerProfile(): Promise<ImageDraggerProfile> {
    try {
      const response = await this.api.get("/sessions/image_dragger_profile/");
      return response.data;
    } catch (error: any) {
      // Keep the game playable even if adaptive profile endpoint is unavailable.
      if (error?.response?.status && error.response.status >= 500) {
        throw error;
      }

      return {
        iq_level: 100,
        recommended_grid_size: 3,
        recommended_time_limit: 180,
        current_level: 1,
        games_played: 0,
        games_won: 0,
        win_rate: 0,
        best_time: null,
        avg_time: null,
        last_grid_size: 3,
      };
    }
  }

  // Leaderboard
  async getGlobalLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const response = await this.api.get("/leaderboard/global_top/", {
      params: { limit },
    });
    return response.data;
  }

  async getGameLeaderboard(
    gameType: string,
    limit: number = 10,
  ): Promise<LeaderboardEntry[]> {
    const response = await this.api.get("/leaderboard/game_top/", {
      params: { game_type: gameType, limit },
    });
    return response.data;
  }

  async getGradeLeaderboard(
    grade: number,
    limit: number = 10,
  ): Promise<LeaderboardEntry[]> {
    const response = await this.api.get("/leaderboard/grade_top/", {
      params: { grade, limit },
    });
    return response.data;
  }

  // Achievements
  async getAllAchievements(): Promise<any[]> {
    const response = await this.api.get("/achievements/");
    // Handle paginated response
    if (response.data.results) {
      return response.data.results;
    }
    return response.data;
  }

  async getPlayerAchievements(): Promise<any[]> {
    const response = await this.api.get("/achievements/player_achievements/");
    // Handle paginated response
    if (response.data.results) {
      return response.data.results;
    }
    return response.data;
  }
}

export default new GameService();
export type {
  GameData,
  PlayerProfile,
  GameSession,
  ScoreSubmission,
  LeaderboardEntry,
  ImageDraggerProfile,
};
