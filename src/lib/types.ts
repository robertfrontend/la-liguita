export type Sport = 'basketball' | 'soccer';

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
  teamAName?: string;
  teamBName?: string;
  playerStats: Record<string, GameStats>; // Maps player ID to stats for this game
  scoreA: number;
  scoreB: number;
  winner?: Team | null;
  isFinished: boolean;
  leagueId?: string;
  sport: Sport;
};

export type League = {
  id: string;
  name: string;
  sport: Sport;
  ownerId: string;
  createdAt: string;
  tier?: 'amateur' | 'pro';
};

export * from '@/types/tournament';

export type UserProfile = {
  uid: string;
  isPro: boolean;
  email?: string;
  displayName?: string;
};
