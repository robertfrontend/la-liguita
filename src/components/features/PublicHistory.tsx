"use client";

import { useEffect, useState } from "react";
import { Game, League, Player } from "@/lib/types";
import { subscribeToLeague, subscribeToHistory, subscribeToPlayers } from "@/lib/db";
import { CalendarDays, Trophy } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PublicHistory({ leagueId }: { leagueId: string }) {
  const [league, setLeague] = useState<League | null>(null);
  const [history, setHistory] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    const unsubLeague = subscribeToLeague(leagueId, (fetched) => {
        setLeague(fetched);
    });

    const unsubHistory = subscribeToHistory(leagueId, (fetched) => {
        setHistory(fetched);
        setLoading(false);
    });

    const unsubPlayers = subscribeToPlayers(leagueId, (fetched) => {
        setPlayers(fetched);
    });

    return () => {
        unsubLeague();
        unsubHistory();
        unsubPlayers();
    };
  }, [leagueId]);

  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name || "Unknown";

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading history...</div>;

  if (!league) return <div className="p-8 text-center text-zinc-500">League not found</div>;

  const isBasketball = league.sport !== 'soccer';
  const themeBgLight = isBasketball ? "bg-orange-100 dark:bg-orange-950/40" : "bg-green-100 dark:bg-green-950/40";
  const themeIcon = isBasketball ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400";
  const themeBorderHover = isBasketball ? "group-hover:border-orange-500/50" : "group-hover:border-green-600/50";

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-24 transition-colors duration-300">
       {/* Public Header */}
       <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", themeBgLight, themeIcon)}>
             <Trophy size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">League History</h1>
            <h2 className="text-lg font-black text-zinc-900 dark:text-white leading-none">{league.name}</h2>
          </div>
       </header>

       <div className="max-w-md mx-auto p-4 space-y-4">
          {history.length === 0 ? (
             <div className="text-center py-12 text-zinc-400 dark:text-zinc-600">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No games played yet.</p>
             </div>
          ) : (
             history.map((game) => {
                const isTeamAWinner = game.scoreA > game.scoreB;
                const gameIsBasketball = game.sport !== 'soccer'; // Default to basketball
                const teamAColor = gameIsBasketball ? "text-orange-500" : "text-green-600";
                const teamAWinColor = gameIsBasketball ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400";
                
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
                  <Link href={`/history/${game.id}`} key={game.id} className="block group">
                  <div className={cn("bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors", themeBorderHover)}>
                    <div className="flex justify-between items-center mb-4 text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold">
                       <span>{new Date(game.date).toLocaleDateString()}</span>
                       <span className={isTeamAWinner ? teamAWinColor : "text-blue-600 dark:text-blue-400"}>
                         {isTeamAWinner ? `${game.teamAName || "Team A"} Won` : `${game.teamBName || "Team B"} Won`}
                       </span>
                    </div>
    
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-center w-1/3">
                        <div className={cn("text-3xl font-black tracking-tighter", teamAColor)}>{game.scoreA}</div>
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 uppercase font-bold tracking-widest truncate">{game.teamAName || "TEAM A"}</div>
                      </div>
                      <div className="text-zinc-200 dark:text-zinc-800 font-bold italic text-xl">VS</div>
                      <div className="text-center w-1/3">
                        <div className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">{game.scoreB}</div>
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 uppercase font-bold tracking-widest truncate">{game.teamBName || "TEAM B"}</div>
                      </div>
                    </div>
    
                    {/* Player Stats Summary */}
                    <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                       <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                              <h4 className={cn("font-bold mb-2 uppercase tracking-wider truncate", teamAWinColor)}>{game.teamAName || "Team A"}</h4>
                              {game.teamA.map(pid => {
                                  const stats = game.playerStats[pid] || { points: 0, assists: 0 };
                                  return (
                                      <div key={pid} className="flex justify-between mb-1 text-zinc-600 dark:text-zinc-300">
                                          <span className="font-medium truncate pr-2 flex items-center gap-1">
                                              {getPlayerName(pid)}
                                              {pid === mvpId && <span className="text-yellow-500 text-[10px]" title="MVP">👑</span>}
                                          </span>
                                          <span className="font-mono text-zinc-400 dark:text-zinc-500">{stats.points}</span>
                                      </div>
                                  )
                              })}
                          </div>
                          <div>
                              <h4 className="text-blue-600 dark:text-blue-400 font-bold mb-2 uppercase tracking-wider truncate">{game.teamBName || "Team B"}</h4>
                              {game.teamB.map(pid => {
                                  const stats = game.playerStats[pid] || { points: 0, assists: 0 };
                                  return (
                                      <div key={pid} className="flex justify-between mb-1 text-zinc-600 dark:text-zinc-300">
                                          <span className="font-medium truncate pr-2 flex items-center gap-1">
                                              {getPlayerName(pid)}
                                              {pid === mvpId && <span className="text-yellow-500 text-[10px]" title="MVP">👑</span>}
                                          </span>
                                          <span className="font-mono text-zinc-400 dark:text-zinc-500">{stats.points}</span>
                                      </div>
                                  )
                              })}
                          </div>
                       </div>
                    </div>
                  </div>
                  </Link>
                );
             })
          )}
       </div>
    </div>
  );
}
