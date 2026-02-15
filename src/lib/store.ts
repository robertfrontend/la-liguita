import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Game, Player, Team, League } from './types';
import { 
  addPlayerToDb, 
  createGameInDb, 
  updateGameInDb, 
  updatePlayerStatsInDb,
  createLeague,
  deleteGameFromDb
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
  startGame: (teamAIds: string[], teamBIds: string[], teamAName?: string, teamBName?: string) => Promise<void>;
  updateStat: (playerId: string, type: 'pts' | 'ast', amount: number) => Promise<void>;
  finishGame: () => Promise<void>;
  resetActiveGame: () => void;
  addPlayer: (name: string) => Promise<void>;
  deleteGame: (gameId: string) => Promise<void>;
  updateTeamName: (team: Team, name: string) => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      players: [],
      activeGame: null,
      history: [],
      leagues: [],
      activeLeague: null,

      setPlayers: (players) => set({ players }),
      setHistory: (history) => set({ history }),
      setLeagues: (leagues) => set({ leagues }),
      setActiveLeague: (activeLeague) => set({ activeLeague }),
      
      setActiveGame: (incomingGame) => {
        const { activeGame } = get();
        // Smart merge to prevent overwriting local progress with stale DB data
        // Only if we have a local active game that matches ID
        if (activeGame && incomingGame && activeGame.id === incomingGame.id) {
           const localTotal = activeGame.scoreA + activeGame.scoreB;
           const incomingTotal = incomingGame.scoreA + incomingGame.scoreB;
           // If local has more points, keep local (it's ahead)
           if (localTotal > incomingTotal) {
               return; // Ignore DB update
           }
           
           // If incoming is finished, accept it
           if (incomingGame.isFinished) {
               set({ activeGame: incomingGame });
               return;
           }
        }
        // If local thinks we are playing, but DB says null (not found yet? or finished?), keep local
        // This handles the case where a game is just created locally, but the DB subscription hasn't caught up,
        // or if the DB somehow reports no active game while the local state still has one that's not finished.
        if (activeGame && !activeGame.isFinished && incomingGame === null) {
            return;
        }

        set({ activeGame: incomingGame });
      },

      createLeague: async (name, ownerId) => {
        const newLeague = await createLeague(name, ownerId);
        set({ activeLeague: newLeague }); // Auto-select new league
      },

      startGame: async (teamAIds, teamBIds, teamAName = "Team A", teamBName = "Team B") => {
        const { activeLeague } = get();
        if (!activeLeague) {
            alert("Please select a league first");
            return;
        }
        const newGame = await createGameInDb(activeLeague.id, teamAIds, teamBIds, teamAName, teamBName);
        set({ activeGame: newGame });
      },

      updateStat: async (playerId, type, amount) => {
        const { activeGame } = get();
        if (!activeGame) return;

        const currentStats = activeGame.playerStats[playerId] || { points: 0, assists: 0 };
        
        // Calculate new stats
        // Prevent negative stats
        const newPoints = Math.max(0, type === 'pts' ? currentStats.points + amount : currentStats.points);
        const newAssists = Math.max(0, type === 'ast' ? currentStats.assists + amount : currentStats.assists);

        const updatedPlayerStats = {
          ...activeGame.playerStats,
          [playerId]: {
            ...currentStats,
            points: newPoints,
            assists: newAssists,
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
        // DB update removed to save bandwidth/costs
      },

      finishGame: async () => {
        const { activeGame, players, activeLeague } = get();
        if (!activeGame || !activeLeague) return;

        const winner: Team | null = activeGame.scoreA > activeGame.scoreB ? 'A' : activeGame.scoreB > activeGame.scoreA ? 'B' : null;
        
        // Save FULL game state to DB now
        const finishedUpdates = { 
            isFinished: true, 
            winner: winner || null,
            scoreA: activeGame.scoreA,
            scoreB: activeGame.scoreB,
            playerStats: activeGame.playerStats
        };

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
      },

      deleteGame: async (gameId) => {
        const { activeLeague } = get();
        if (!activeLeague) return;
        
        await deleteGameFromDb(activeLeague.id, gameId);
        
        const { history } = get();
        set({ history: history.filter(g => g.id !== gameId) });
      },

      updateTeamName: async (team: Team, name: string) => {
        const { activeGame, activeLeague } = get();
        if (!activeGame) {
            console.error("No active game found in store");
            return;
        }

        const leagueId = activeGame.leagueId || activeLeague?.id;

        if (!leagueId) {
            console.error("No league ID found for updating team name. Game:", activeGame, "League:", activeLeague);
            alert("Error: Cannot save team name. Missing league context.");
            return;
        }

        const updates = team === 'A' ? { teamAName: name } : { teamBName: name };

        // Optimistic update
        set({
            activeGame: {
                ...activeGame,
                ...updates
            }
        });

        // Persist to DB
        try {
            await updateGameInDb(leagueId, activeGame.id, updates);
        } catch (error) {
            console.error("Failed to update team name in DB:", error);
        }
      }
    }),
    {
      name: 'la-liguita-storage',
      partialize: (state) => ({ 
        activeGame: state.activeGame,
        activeLeague: state.activeLeague
      }),
    }
  )
);
