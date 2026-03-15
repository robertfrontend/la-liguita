"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Game, Player } from "@/lib/types";
import { subscribeToGameGlobally, subscribeToPlayers } from "@/lib/db";
import { CalendarDays, Trophy, ArrowLeft, Share } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function GameDetailPage() {
  const { gameId } = useParams() as { gameId: string };
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;

    setLoading(true);

    const unsubGame = subscribeToGameGlobally(gameId, (fetchedGame) => {
        setGame(fetchedGame);
        setLoading(false);
    });

    return () => {
        unsubGame();
    };
  }, [gameId]);

  // Once we have a game, we need to fetch players.
  // Ideally we need leagueId, which is now in game.leagueId.
  useEffect(() => {
      if (game?.leagueId) {
          const unsubPlayers = subscribeToPlayers(game.leagueId, (p) => {
              setPlayers(p);
          });
          return () => unsubPlayers();
      }
  }, [game?.leagueId]);

  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name || "Unknown";

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
    );
  }

  if (!game) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <h1 className="text-xl font-bold mb-2">Game not found</h1>
            <Link href="/history" className="text-orange-500 hover:underline">Return to History</Link>
        </div>
    );
  }

  const isTeamAWinner = game.scoreA > game.scoreB;
  const isTeamBWinner = game.scoreB > game.scoreA;
  const isBasketball = game.sport !== 'soccer';
  const teamAColor = isBasketball ? "text-orange-500" : "text-green-600";
  const teamAWinColor = isBasketball ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400";
  const teamAWinBg = isBasketball ? "bg-orange-50 dark:bg-orange-950/40" : "bg-green-50 dark:bg-green-950/40";
  const teamAIconBg = isBasketball ? "bg-orange-100 dark:bg-orange-900/30" : "bg-green-100 dark:bg-green-900/30";
  const teamAIconText = isBasketball ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400";
  const pointLabel = isBasketball ? "PTS" : "GLS";

  // MVP Calculation
  let mvpId: string | null = null;
  let maxScore = -1;
  if (game.isFinished) {
      Object.entries(game.playerStats || {}).forEach(([id, stats]) => {
          const score = (stats.points * 1.5) + stats.assists; 
          if (score > maxScore && score > 0) {
              maxScore = score;
              mvpId = id;
          }
      });
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-20 transition-colors duration-300">
      <header className="bg-white dark:bg-zinc-950 p-4 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <Link href="/history" className="p-2 -ml-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors">
              <ArrowLeft size={20} />
          </Link>
          <span className="font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-wider">Match Details</span>
          <button className="p-2 -mr-2 text-zinc-600 hover:bg-zinc-100 rounded-full opacity-0 pointer-events-none">
              <Share size={20} />
          </button>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Scoreboard Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="text-center mb-6">
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-950 px-3 py-1 rounded-full uppercase tracking-widest">
                    {new Date(game.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
            </div>

            <div className="flex justify-between items-center mb-8">
                <div className="flex-1 flex flex-col items-center">
                    <span className={cn("text-5xl font-black tracking-tighter mb-2", isTeamAWinner ? teamAColor : "text-zinc-300 dark:text-zinc-700")}>
                        {game.scoreA}
                    </span>
                    <span className={cn("text-xs font-black uppercase tracking-widest text-center", isTeamAWinner ? teamAWinColor : "text-zinc-400 dark:text-zinc-600")}>
                        {game.teamAName || "Team A"}
                    </span>
                    {isTeamAWinner && <Trophy className={cn("w-4 h-4 mt-2", teamAColor)} />}
                </div>

                <div className="px-4">
                    <span className="text-2xl font-black text-zinc-200 dark:text-zinc-800 italic">VS</span>
                </div>

                <div className="flex-1 flex flex-col items-center">
                     <span className={cn("text-5xl font-black tracking-tighter mb-2", isTeamBWinner ? "text-blue-500" : "text-zinc-300 dark:text-zinc-700")}>
                        {game.scoreB}
                    </span>
                    <span className={cn("text-xs font-black uppercase tracking-widest text-center", isTeamBWinner ? "text-blue-600 dark:text-blue-400" : "text-zinc-400 dark:text-zinc-600")}>
                        {game.teamBName || "Team B"}
                    </span>
                    {isTeamBWinner && <Trophy className="text-blue-500 w-4 h-4 mt-2" />}
                </div>
            </div>

            <div className="text-center">
                <span className={cn("text-sm font-bold uppercase tracking-wider py-1 px-3 rounded-lg", 
                    isTeamAWinner ? cn(teamAWinBg, teamAWinColor) : 
                    isTeamBWinner ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" : "bg-zinc-100 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400"
                )}>
                    {isTeamAWinner ? `${game.teamAName || "Team A"} Won` : isTeamBWinner ? `${game.teamBName || "Team B"} Won` : "Draw"}
                </span>
            </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
             <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest px-1">Player Stats</h3>
             
             {/* Team A Stats */}
             <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="bg-zinc-50 dark:bg-zinc-950 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <span className={cn("font-bold text-sm uppercase tracking-wider", teamAWinColor)}>{game.teamAName || "Team A"}</span>
                    <div className="flex gap-4 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                        <span className="w-8 text-center">{pointLabel}</span>
                        <span className="w-8 text-center">AST</span>
                    </div>
                </div>
                <div>
                    {game.teamA.map((pid, idx) => {
                        const stats = game.playerStats[pid] || { points: 0, assists: 0 };
                        return (
                            <div key={pid} className={cn("px-4 py-3 flex justify-between items-center", idx !== game.teamA.length - 1 && "border-b border-zinc-100 dark:border-zinc-800")}>
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold", teamAIconBg, teamAIconText)}>
                                        {getPlayerName(pid).slice(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                        {getPlayerName(pid)}
                                        {pid === mvpId && <span className="text-yellow-500 animate-in zoom-in text-[10px]" title="MVP">👑</span>}
                                    </span>
                                </div>
                                <div className="flex gap-4 font-mono text-sm font-bold">
                                    <span className="w-8 text-center text-zinc-900 dark:text-zinc-100">{stats.points}</span>
                                    <span className="w-8 text-center text-zinc-400 dark:text-zinc-500">{stats.assists || 0}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>

             {/* Team B Stats */}
             <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="bg-zinc-50 dark:bg-zinc-950 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-sm uppercase tracking-wider">{game.teamBName || "Team B"}</span>
                    <div className="flex gap-4 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                        <span className="w-8 text-center">{pointLabel}</span>
                        <span className="w-8 text-center">AST</span>
                    </div>
                </div>
                <div>
                    {game.teamB.map((pid, idx) => {
                        const stats = game.playerStats[pid] || { points: 0, assists: 0 };
                        return (
                            <div key={pid} className={cn("px-4 py-3 flex justify-between items-center", idx !== game.teamB.length - 1 && "border-b border-zinc-100 dark:border-zinc-800")}>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">
                                        {getPlayerName(pid).slice(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                        {getPlayerName(pid)}
                                        {pid === mvpId && <span className="text-yellow-500 animate-in zoom-in text-[10px]" title="MVP">👑</span>}
                                    </span>
                                </div>
                                <div className="flex gap-4 font-mono text-sm font-bold">
                                    <span className="w-8 text-center text-zinc-900 dark:text-zinc-100">{stats.points}</span>
                                    <span className="w-8 text-center text-zinc-400 dark:text-zinc-500">{stats.assists || 0}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>
        </div>

      </div>
    </div>
  );
}
