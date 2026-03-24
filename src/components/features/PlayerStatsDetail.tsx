"use client";

import { Player, Game, Sport } from "@/lib/types";
import { X, Trophy, Award, TrendingUp, CalendarDays, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PlayerStatsDetailProps {
  player: Player;
  games: Game[];
  onClose: () => void;
  sport: Sport;
}

export function PlayerStatsDetail({ player, games, onClose, sport }: PlayerStatsDetailProps) {
  const isBasketball = sport !== 'soccer';
  const pointLabelShort = isBasketball ? 'PTS' : 'GLS';
  
  const themeBg = isBasketball ? "bg-orange-500" : "bg-green-600";
  const themeText = isBasketball ? "text-orange-500" : "text-green-600";
  const themeBgLight = isBasketball ? "bg-orange-100 dark:bg-orange-950/40" : "bg-green-100 dark:bg-green-950/40";
  const themeTextDark = isBasketball ? "text-orange-600 dark:text-orange-400" : "text-green-700 dark:text-green-400";

  // Filter games where the player participated and sort by date descending
  const playerGames = games
    .filter(game => game.isFinished && (game.teamA.includes(player.id) || game.teamB.includes(player.id)))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const winRate = player.gamesPlayed > 0 ? Math.round((player.wins / player.gamesPlayed) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-2xl text-zinc-500 dark:text-zinc-400 shadow-sm">
              {player.avatar || player.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight">{player.name}</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium flex items-center gap-1.5 uppercase tracking-wider">
                <span className={cn("w-2 h-2 rounded-full", themeBg)} />
                {sport} Player
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 dark:text-zinc-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="px-6 py-4 grid grid-cols-3 gap-3">
          <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center">
            <div className={cn("w-8 h-8 mx-auto mb-1 flex items-center justify-center rounded-lg opacity-80", themeBgLight, themeText)}>
                <TrendingUp size={16} />
            </div>
            <div className="text-xl font-black text-zinc-900 dark:text-white">{player.totalPoints}</div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">{pointLabelShort}</div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center">
            <div className="w-8 h-8 mx-auto mb-1 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 opacity-80">
                <Award size={16} />
            </div>
            <div className="text-xl font-black text-zinc-900 dark:text-white">{player.totalAssists}</div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Assists</div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center">
            <div className="w-8 h-8 mx-auto mb-1 flex items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-500 opacity-80">
                <Trophy size={16} />
            </div>
            <div className="text-xl font-black text-zinc-900 dark:text-white">{winRate}%</div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Win Rate</div>
          </div>
        </div>

        {/* Extra Info */}
        <div className="px-6 py-2 flex items-center gap-6 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-1.5">
                <span className="text-zinc-900 dark:text-zinc-200">{player.gamesPlayed}</span> Games Played
            </div>
            <div className="flex items-center gap-1.5">
                <span className="text-zinc-900 dark:text-zinc-200">{player.wins}</span> Wins
            </div>
        </div>

        {/* Game History List */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/20">
          <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4">Recent Match Performance</h3>
          
          {playerGames.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 dark:text-zinc-600">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No matches found for this player.</p>
            </div>
          ) : (
            playerGames.map((game) => {
              const stats = game.playerStats[player.id] || { points: 0, assists: 0 };
              const isTeamA = game.teamA.includes(player.id);
              const won = (isTeamA && game.winner === 'A') || (!isTeamA && game.winner === 'B');
              const opponentName = isTeamA ? (game.teamBName || "Team B") : (game.teamAName || "Team A");
              const teamScore = isTeamA ? game.scoreA : game.scoreB;
              const opponentScore = isTeamA ? game.scoreB : game.scoreA;

              return (
                <Link 
                  href={`/history/${game.id}`} 
                  key={game.id} 
                  onClick={onClose}
                  className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shadow-inner shrink-0",
                    won ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500"
                  )}>
                    {won ? "W" : "L"}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-bold text-zinc-900 dark:text-white truncate">vs {opponentName}</h4>
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">
                        {new Date(game.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                            Score: <span className="font-bold text-zinc-700 dark:text-zinc-300">{teamScore}-{opponentScore}</span>
                        </span>
                        <div className="flex items-center gap-2">
                             <span className={cn("text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider", themeBgLight, themeTextDark)}>
                                {stats.points} {pointLabelShort}
                             </span>
                             <span className="text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                                {stats.assists} AST
                             </span>
                        </div>
                    </div>
                  </div>
                  
                  <ChevronRight size={16} className="text-zinc-300 dark:text-zinc-700 group-hover:translate-x-1 transition-transform" />
                </Link>
              );
            })
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 sm:hidden bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
            <button 
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
}
