import { create } from 'zustand';
import type { Game, Player, Team, League } from './types';
import { 
  addPlayerToDb, 
  createGameInDb, 
  updateGameInDb, 
  updatePlayerStatsInDb,
  createLeague 
} from './db';

interface StoreState {
  players: Player[];
  activeGame: Game | null;
  history: Game[];
  leagues: League[];
  activeLeague: League | null;
  
  // State Setters (for subscriptions)
  setPlayers: (players: Player[]) => void;
  setHistory: (history: Game[]) => void;
  setActiveGame: (game: Game | null) => void;
  setLeagues: (leagues: League[]) => void;
  setActiveLeague: (league: League | null) => void;

  // Actions
  createLeague: (name: string, ownerId: string) => Promise<void>;
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
  leagues: [],
  activeLeague: null,

  setPlayers: (players) => set({ players }),
  setHistory: (history) => set({ history }),
  setActiveGame: (activeGame) => set({ activeGame }),
  setLeagues: (leagues) => set({ leagues }),
  setActiveLeague: (activeLeague) => set({ activeLeague }),

  createLeague: async (name, ownerId) => {
    const newLeague = await createLeague(name, ownerId);
    set({ activeLeague: newLeague }); // Auto-select new league
  },

  startGame: async (teamAIds, teamBIds) => {
    const { activeLeague } = get();
    if (!activeLeague) {
        alert("Please select a league first");
        return;
    }
    const newGame = await createGameInDb(activeLeague.id, teamAIds, teamBIds);
    set({ activeGame: newGame });
  },

  updateStat: async (playerId, type, amount) => {
    const { activeGame, activeLeague } = get();
    if (!activeGame || !activeLeague) return;

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
    await updateGameInDb(activeLeague.id, activeGame.id, updates);
  },

  finishGame: async () => {
    const { activeGame, players, activeLeague } = get();
    if (!activeGame || !activeLeague) return;

    const winner: Team | null = activeGame.scoreA > activeGame.scoreB ? 'A' : activeGame.scoreB > activeGame.scoreA ? 'B' : null;
    
    const finishedUpdates = { isFinished: true, winner: winner || undefined };

    // Update game in DB
    await updateGameInDb(activeLeague.id, activeGame.id, finishedUpdates);

    // Update player stats in DB
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
        
        await updatePlayerStatsInDb(activeLeague.id, updatedPlayer);
    });

    await Promise.all(playerUpdatesPromises);

    set({ activeGame: null }); 
  },

  resetActiveGame: () => set({ activeGame: null }),

  addPlayer: async (name) => {
    const { activeLeague } = get();
    if (!activeLeague) {
        alert("No active league");
        return;
    }
    await addPlayerToDb(activeLeague.id, name);
  }
}));
