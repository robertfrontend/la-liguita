export type TournamentTier = 'amateur' | 'pro';
export type Sport = 'basketball' | 'soccer';
export type TournamentStatus = 'draft' | 'active' | 'playoffs' | 'finished';

export interface TournamentSettings {
  maxTeams: number;
  playersPerTeam: number;
  periodDurationMinutes: number;
  totalPeriods: number;
  allowOvertime: boolean;
  publicLeaderboard: boolean;
  // Opciones exclusivas del plan PRO
  trackPlayByPlay?: boolean;
  trackShotCharts?: boolean;
  enableRefereeAssignment?: boolean;
  enableVideoHighlights?: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  sport: Sport;
  tier: TournamentTier;
  ownerId: string;
  adminEmails?: string[];
  organizationName?: string;
  bannerUrl?: string;
  logoUrl?: string;
  status: TournamentStatus;
  season?: string;
  settings: TournamentSettings;
  createdAt: string;
  updatedAt: string;
}

// --- Estadísticas de Jugador ---

// Nivel Amateur: Simple y directo
export interface AmateurGameStats {
  points: number;
  fouls: number;
  assists?: number;
}

// Nivel Profesional: Granular y estilo FIBA / NBA
export interface ProGameStats {
  points: number;
  assists: number;
  reboundsOffensive: number;
  reboundsDefensive: number;
  totalRebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  personalFouls: number;
  fouls?: number;
  technicalFouls: number;
  // Tiros (Anotados / Intentados)
  fg2Made: number;
  fg2Attempted: number;
  fg3Made: number;
  fg3Attempted: number;
  ftMade: number;
  ftAttempted: number;
  // Métricas avanzadas calculadas
  minutesPlayed?: number;
  plusMinus?: number;
  efficiency?: number;
}

// --- Evento Play-By-Play (Exclusivo Pro) ---
export type PlayEventType = 
  | '2pt_made' 
  | '2pt_miss' 
  | '3pt_made' 
  | '3pt_miss' 
  | 'ft_made' 
  | 'ft_miss' 
  | 'assist' 
  | 'rebound_off' 
  | 'rebound_def' 
  | 'steal' 
  | 'block' 
  | 'turnover' 
  | 'foul_personal' 
  | 'foul_technical' 
  | 'substitution' 
  | 'timeout';

export interface PlayByPlayEvent {
  id: string;
  gameId: string;
  period: number;
  gameClock: string; // ej: "08:42"
  teamId: string;
  playerId?: string;
  assistedByPlayerId?: string;
  type: PlayEventType;
  description: string;
  scoreA: number;
  scoreB: number;
  timestamp: string;
  createdBy: string;
}

export interface TournamentTeam {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  color?: string;
  seed?: number;
  playerIds: string[];
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface TournamentPlayer {
  id: string;
  tournamentId: string;
  teamId?: string;
  name: string;
  number?: number;
  position?: string;
  avatar?: string;
  isRegisteredPro?: boolean;
  gamesPlayed: number;
  totalPoints: number;
  totalAssists: number;
  totalRebounds?: number;
  totalFouls?: number;
}

export interface Referee {
  id: string;
  tournamentId: string;
  name: string;
  licenseNumber?: string;
  role: 'head_referee' | 'umpire' | 'table_official' | 'commissioner';
  phone?: string;
  assignedGamesCount: number;
}

// --- Partido (Game) ---
export interface TournamentGame {
  id: string;
  tournamentId: string;
  roundName: string;
  date: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  isFinished: boolean;
  status?: 'scheduled' | 'live' | 'finished';
  venue?: string;
  currentPeriod?: number;
  timeRemaining?: string;
  winnerTeamId?: string | null;
  sport: Sport;
  playerStats: Record<string, AmateurGameStats | ProGameStats>;
  refereeIds?: string[];
  streamUrl?: string;
  highlightUrls?: string[];
}
