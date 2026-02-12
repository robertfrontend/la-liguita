import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Game, Player, Team } from './types';

interface StoreState {
  players: Player[];
  activeGame: Game | null;
  history: Game[];
  
  // Actions
  startGame: (teamAIds: string[], teamBIds: string[]) => void;
  updateStat: (playerId: string, type: 'pts' | 'ast', amount: number) => void;
  finishGame: () => void;
  resetActiveGame: () => void;
  addPlayer: (name: string) => void;
}

const INITIAL_PLAYERS: Player[] = [
  { id: '1', name: 'Robert', wins: 12, gamesPlayed: 20, totalPoints: 145, totalAssists: 34, avatar: 'R' },
  { id: '2', name: 'Ricky', wins: 10, gamesPlayed: 18, totalPoints: 120, totalAssists: 45, avatar: 'Ri' },
  { id: '3', name: 'Leo', wins: 8, gamesPlayed: 15, totalPoints: 98, totalAssists: 22, avatar: 'L' },
  { id: '4', name: 'Mike', wins: 15, gamesPlayed: 22, totalPoints: 180, totalAssists: 15, avatar: 'M' },
  { id: '5', name: 'Dan', wins: 5, gamesPlayed: 10, totalPoints: 60, totalAssists: 10, avatar: 'D' },
  { id: '6', name: 'Jose', wins: 7, gamesPlayed: 14, totalPoints: 85, totalAssists: 28, avatar: 'J' },

];

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      players: INITIAL_PLAYERS,
      activeGame: null,
      history: [],

      startGame: (teamAIds, teamBIds) => {
        const newGame: Game = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          teamA: teamAIds,
          teamB: teamBIds,
          playerStats: {}, // Initialize empty
          scoreA: 0,
          scoreB: 0,
          isFinished: false,
        };
        // Initialize stats for players in the game
        [...teamAIds, ...teamBIds].forEach(pid => {
          newGame.playerStats[pid] = { points: 0, assists: 0 };
        });
        set({ activeGame: newGame });
      },

      updateStat: (playerId, type, amount) => {
        const { activeGame } = get();
        if (!activeGame) return;

        const currentStats = activeGame.playerStats[playerId] || { points: 0, assists: 0 };
        
        // Update player stats
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

        // Iterate over updated stats to sum up points for each team
        // This relies on knowing which team the player belongs to
        // If a player is in teamA, add to scoreA.
        
        // We can just iterate the team arrays.
        activeGame.teamA.forEach(pid => {
           const stats = updatedPlayerStats[pid] || { points: 0 };
           newScoreA += stats.points;
        });
        activeGame.teamB.forEach(pid => {
           const stats = updatedPlayerStats[pid] || { points: 0 };
           newScoreB += stats.points;
        });

        set({
          activeGame: {
            ...activeGame,
            playerStats: updatedPlayerStats,
            scoreA: newScoreA,
            scoreB: newScoreB,
          },
        });
      },

      finishGame: () => {
        const { activeGame, players, history } = get();
        if (!activeGame) return;

        const winner: Team | null = activeGame.scoreA > activeGame.scoreB ? 'A' : activeGame.scoreB > activeGame.scoreA ? 'B' : null; // Draw handling? Usually there's a winner in street ball.
        
        const finishedGame = { ...activeGame, isFinished: true, winner: winner || undefined };

        // Update player totals
        const updatedPlayers = players.map(p => {
          const stats = activeGame.playerStats[p.id];
          if (!stats) return p; // Player not in this game? Should not happen if logic is correct

          const isTeamA = activeGame.teamA.includes(p.id);
          const isTeamB = activeGame.teamB.includes(p.id);
          const won = (isTeamA && winner === 'A') || (isTeamB && winner === 'B');

          return {
            ...p,
            gamesPlayed: p.gamesPlayed + 1,
            wins: won ? p.wins + 1 : p.wins,
            totalPoints: p.totalPoints + stats.points,
            totalAssists: p.totalAssists + stats.assists,
          };
        });

        set({
          activeGame: null,
          history: [finishedGame, ...history],
          players: updatedPlayers,
        });
      },

      resetActiveGame: () => set({ activeGame: null }),

      addPlayer: (name) => {
        const newPlayer: Player = {
          id: crypto.randomUUID(),
          name,
          gamesPlayed: 0,
          wins: 0,
          totalPoints: 0,
          totalAssists: 0,
          avatar: name.slice(0, 2).toUpperCase(),
        };
        set(state => ({ players: [...state.players, newPlayer] }));
      }
    }),
    {
      name: 'la-liguita-storage', // unique name
    }
  )
);
