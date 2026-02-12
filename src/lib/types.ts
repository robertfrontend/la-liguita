export type Player = {
  id: string;
  name: string;
  avatar?: string;
  wins: number;
  gamesPlayed: number;
  totalPoints: number;
  totalAssists: number;
};

export type GameStats = {
  points: number;
  assists: number;
};

export type Team = 'A' | 'B';

export type Game = {
  id: string;
  date: string;
  teamA: string[]; // Player IDs
  teamB: string[]; // Player IDs
  playerStats: Record<string, GameStats>; // Maps player ID to stats for this game
  scoreA: number;
  scoreB: number;
  winner?: Team;
  isFinished: boolean;
};
