import { create } from 'zustand';
import type { Game, Player, Team } from './types';
import { 
  addPlayerToDb, 
  createGameInDb, 
  updateGameInDb, 
  updatePlayerStatsInDb 
} from './db';

interface StoreState {
  players: Player[];
  activeGame: Game | null;
  history: Game[];
  
  // State Setters (for subscriptions)
  setPlayers: (players: Player[]) => void;
  setHistory: (history: Game[]) => void;
  setActiveGame: (game: Game | null) => void;

  // Actions
  startGame: (teamAIds: string[], teamBIds: string[]) => Promise<void>;
  updateStat: (playerId: string, type: 'pts' | 'ast', amount: number) => Promise<void>;
  finishGame: () => Promise<void>;
  resetActiveGame: () => void;
  addPlayer: (name: string) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  players: [],
  activeGame: null,
  history: [],

  setPlayers: (players) => set({ players }),
  setHistory: (history) => set({ history }),
  setActiveGame: (activeGame) => set({ activeGame }),

  startGame: async (teamAIds, teamBIds) => {
    // Optimistic update? Better to wait for DB creation to have ID.
    const newGame = await createGameInDb(teamAIds, teamBIds);
    set({ activeGame: newGame });
  },

  updateStat: async (playerId, type, amount) => {
    const { activeGame } = get();
    if (!activeGame) return;

    const currentStats = activeGame.playerStats[playerId] || { points: 0, assists: 0 };
    
    // Calculate new stats
    const updatedPlayerStats = {
      ...activeGame.playerStats,
      [playerId]: {
        ...currentStats,
        points: type === 'pts' ? currentStats.points + amount : currentStats.points,
        assists: type === 'ast' ? currentStats.assists + amount : currentStats.assists,
      },
    };

    // Recalculate team scores
    let newScoreA = 0;
    let newScoreB = 0;

    activeGame.teamA.forEach(pid => {
       const stats = updatedPlayerStats[pid] || { points: 0 };
       newScoreA += stats.points;
    });
    activeGame.teamB.forEach(pid => {
       const stats = updatedPlayerStats[pid] || { points: 0 };
       newScoreB += stats.points;
    });

    const updates = {
        playerStats: updatedPlayerStats,
        scoreA: newScoreA,
        scoreB: newScoreB,
    };

    // Optimistic update
    set({
      activeGame: {
        ...activeGame,
        ...updates
      },
    });

    // Write to DB
    await updateGameInDb(activeGame.id, updates);
  },

  finishGame: async () => {
    const { activeGame, players } = get();
    if (!activeGame) return;

    const winner: Team | null = activeGame.scoreA > activeGame.scoreB ? 'A' : activeGame.scoreB > activeGame.scoreA ? 'B' : null;
    
    const finishedUpdates = { isFinished: true, winner: winner || undefined };

    // Update game in DB
    await updateGameInDb(activeGame.id, finishedUpdates);

    // Update player stats in DB
    // We need to calculate the new totals for each player involved
    const playerUpdatesPromises = [...activeGame.teamA, ...activeGame.teamB].map(async (pid) => {
        const player = players.find(p => p.id === pid);
        if (!player) return;

        const stats = activeGame.playerStats[pid];
        const isTeamA = activeGame.teamA.includes(pid);
        const isTeamB = activeGame.teamB.includes(pid);
        const won = (isTeamA && winner === 'A') || (isTeamB && winner === 'B');

        const updatedPlayer = {
            ...player,
            gamesPlayed: player.gamesPlayed + 1,
            wins: won ? player.wins + 1 : player.wins,
            totalPoints: player.totalPoints + stats.points,
            totalAssists: player.totalAssists + stats.assists,
        };
        
        await updatePlayerStatsInDb(updatedPlayer);
    });

    await Promise.all(playerUpdatesPromises);

    set({ activeGame: null }); 
    // History will update via subscription
  },

  resetActiveGame: () => set({ activeGame: null }),

  addPlayer: async (name) => {
    await addPlayerToDb(name);
    // State updates via subscription
  }
}));
