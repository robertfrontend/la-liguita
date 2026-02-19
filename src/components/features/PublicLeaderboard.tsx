"use client";

import { useEffect, useState, useMemo } from "react";
import { League, Player } from "@/lib/types";
import { subscribeToLeague, subscribeToPlayers } from "@/lib/db";
import { Trophy, TrendingUp, Award, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type SortKey = "points" | "assists" | "winRate";

export function PublicLeaderboard({ leagueId }: { leagueId: string }) {
  const [league, setLeague] = useState<League | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("points");

  useEffect(() => {
    setLoading(true);

    const unsubLeague = subscribeToLeague(leagueId, (fetched) => {
        setLeague(fetched);
    });

    const unsubPlayers = subscribeToPlayers(leagueId, (fetched) => {
        setPlayers(fetched);
        setLoading(false);
    });

    return () => {
        unsubLeague();
        unsubPlayers();
    };
  }, [leagueId]);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      // Primary sort
      let diff = 0;
      if (sortBy === "points") diff = b.totalPoints - a.totalPoints;
      else if (sortBy === "assists") diff = b.totalAssists - a.totalAssists;
      else if (sortBy === "winRate") {
        const rateA = a.gamesPlayed > 0 ? a.wins / a.gamesPlayed : 0;
        const rateB = b.gamesPlayed > 0 ? b.wins / b.gamesPlayed : 0;
        diff = rateB - rateA;
      }
      
      // Secondary sort: games played (more is better if tied)
      if (diff === 0) {
          return b.gamesPlayed - a.gamesPlayed;
      }
      return diff;
    });
  }, [players, sortBy]);

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading leaderboard...</div>;
  if (!league) return <div className="p-8 text-center text-zinc-500">League not found</div>;

  const isBasketball = league.sport !== 'soccer';
  const pointLabel = isBasketball ? 'Points' : 'Goals';
  const pointLabelShort = isBasketball ? 'PTS' : 'GLS';
  const themeBg = isBasketball ? "bg-orange-500" : "bg-green-600";
  const themeTextDark = isBasketball ? "text-orange-600 dark:text-orange-400" : "text-green-700 dark:text-green-400";
  const themeBorder = isBasketball ? "border-orange-500" : "border-green-600";
  const themeShadow = isBasketball ? "shadow-orange-500/20" : "shadow-green-500/20";
  const themeBgLight = isBasketball ? "bg-orange-50 dark:bg-orange-950/40" : "bg-green-50 dark:bg-green-950/40";

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-24 transition-colors duration-300">
      {/* Public Header */}
      <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", isBasketball ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500" : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500")}>
             <Trophy size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">League Standings</h1>
            <h2 className="text-lg font-black text-zinc-900 dark:text-white leading-none">{league.name}</h2>
          </div>
       </header>

       <div className="max-w-md mx-auto p-4">
            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                <button
                    onClick={() => setSortBy("points")}
                    className={cn(
                    "flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap border transition-all shadow-sm",
                    sortBy === "points"
                        ? cn("text-white", themeBg, themeBorder, themeShadow)
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    )}
                >
                    <TrendingUp size={16} className="mr-2" />
                    {pointLabel}
                </button>
                <button
                    onClick={() => setSortBy("assists")}
                    className={cn(
                    "flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap border transition-all shadow-sm",
                    sortBy === "assists"
                        ? "bg-blue-500 border-blue-500 text-white shadow-blue-500/20"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    )}
                >
                    <Award size={16} className="mr-2" />
                    Assists
                </button>
                <button
                    onClick={() => setSortBy("winRate")}
                    className={cn(
                    "flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap border transition-all shadow-sm",
                    sortBy === "winRate"
                        ? "bg-yellow-500 border-yellow-500 text-white shadow-yellow-500/20"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    )}
                >
                    <Trophy size={16} className="mr-2" />
                    Win %
                </button>
            </div>

            <div className="space-y-3">
                {sortedPlayers.map((player, index) => {
                    const winRate = player.gamesPlayed > 0 ? Math.round((player.wins / player.gamesPlayed) * 100) : 0;
                    return (
                        <div
                        key={player.id}
                        className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 shadow-sm relative overflow-hidden group"
                        >
                            {/* Rank Indicator */}
                            <div className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm transition-colors",
                                index === 0 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500" :
                                index === 1 ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400" :
                                index === 2 ? (isBasketball ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-500" : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-500") :
                                "bg-zinc-50 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-600"
                            )}>
                                {index + 1}
                            </div>
                        
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-bold text-zinc-400 dark:text-zinc-500 text-sm">
                                {player.avatar || player.name.substring(0, 2).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-zinc-900 dark:text-white text-base truncate">{player.name}</h3>
                                <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 dark:text-zinc-500 mt-1">
                                    <span className={cn(sortBy === "points" && cn("font-bold px-1 rounded", themeTextDark, themeBgLight))}>
                                        {player.totalPoints} {pointLabelShort}
                                    </span>
                                    <span>•</span>
                                    <span className={cn(sortBy === "assists" && "text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40 px-1 rounded")}>
                                        {player.totalAssists} AST
                                    </span>
                                    <span>•</span>
                                    <span className={cn(sortBy === "winRate" && "text-yellow-600 dark:text-yellow-400 font-bold bg-yellow-50 dark:bg-yellow-950/40 px-1 rounded")}>
                                        {winRate}% WR
                                    </span>
                                </div>
                            </div>
                            
                            {/* Highlight Bar */}
                            <div className={cn(
                                "absolute left-0 top-0 bottom-0 w-1 opacity-0 transition-opacity group-hover:opacity-100",
                                index === 0 ? "bg-yellow-400 opacity-100" : 
                                index === 1 ? "bg-zinc-300 dark:bg-zinc-700" :
                                index === 2 ? (isBasketball ? "bg-orange-300 dark:bg-orange-700" : "bg-green-300 dark:bg-green-700") : "bg-transparent"
                            )} />
                        </div>
                    );
                })}

                {sortedPlayers.length === 0 && (
                    <div className="text-center py-12 text-zinc-400 dark:text-zinc-600">
                        No players found in this league.
                    </div>
                )}
            </div>
       </div>
    </div>
  );
}
