"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { CalendarDays, Trash2, ExternalLink } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const history = useStore((state) => state.history);
  const players = useStore((state) => state.players);
  const activeLeague = useStore((state) => state.activeLeague);
  const deleteGame = useStore((state) => state.deleteGame);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name || "Unknown";

  const handleDelete = async (gameId: string) => {
      if (confirm("Are you sure you want to delete this game? Player stats will be reverted.")) {
          await deleteGame(gameId);
      }
  };

  if (history.length === 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center text-gray-500">
          <CalendarDays className="w-16 h-16 mb-4 opacity-20" />
          <h2 className="text-xl font-semibold mb-2">No Games Yet</h2>
          <p>Start a new game to see history here.</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 pb-24 bg-white">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <CalendarDays className="text-orange-500" />
            Game History
            </h1>
            {activeLeague && (
               <Link 
                  href={`/league/${activeLeague.id}/history`}
                  target="_blank"
                  className="flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors border border-orange-100"
               >
                  Public View <ExternalLink size={14} />
               </Link>
            )}
        </div>

        <div className="space-y-4">
          {history.map((game) => {
            const isTeamAWinner = game.scoreA > game.scoreB;
            return (
              <Link href={`/history/${game.id}`} key={game.id} className="block group">
                <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm group-hover:border-orange-500/50 transition-colors">
                  <div className="flex justify-between items-center mb-4 text-xs text-zinc-400 uppercase tracking-widest font-bold">
                     <div className="flex items-center gap-3">
                         <button 
                             onClick={(e) => {
                                 e.preventDefault();
                                 handleDelete(game.id);
                             }} 
                             className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
                             title="Delete Game"
                         >
                             <Trash2 className="w-4 h-4" />
                         </button>
                         <span>{new Date(game.date).toLocaleDateString()}</span>
                     </div>
                     <span className={isTeamAWinner ? "text-orange-600" : "text-blue-600"}>
                       {isTeamAWinner ? `${game.teamAName || "Team A"} Won` : `${game.teamBName || "Team B"} Won`}
                     </span>
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <div className="text-center w-1/3">
                      <div className="text-3xl font-black text-orange-500 tracking-tighter">{game.scoreA}</div>
                      <div className="text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-widest truncate">{game.teamAName || "TEAM A"}</div>
                    </div>
                    <div className="text-zinc-200 font-bold italic text-xl">VS</div>
                    <div className="text-center w-1/3">
                      <div className="text-3xl font-black text-blue-600 tracking-tighter">{game.scoreB}</div>
                      <div className="text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-widest truncate">{game.teamBName || "TEAM B"}</div>
                    </div>
                  </div>

                  {/* Player Stats Summary */}
                  <div className="space-y-2 border-t border-zinc-100 pt-4">
                     <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <h4 className="text-orange-600 font-bold mb-2 uppercase tracking-wider truncate">{game.teamAName || "Team A"}</h4>
                            {game.teamA.map(pid => {
                                const stats = game.playerStats[pid] || { points: 0, assists: 0 };
                                return (
                                    <div key={pid} className="flex justify-between mb-1 text-zinc-600">
                                        <span className="font-medium">{getPlayerName(pid)}</span>
                                        <span className="font-mono text-zinc-400">{stats.points}pts</span>
                                    </div>
                                )
                            })}
                        </div>
                        <div>
                            <h4 className="text-blue-600 font-bold mb-2 uppercase tracking-wider truncate">{game.teamBName || "Team B"}</h4>
                            {game.teamB.map(pid => {
                                const stats = game.playerStats[pid] || { points: 0, assists: 0 };
                                return (
                                    <div key={pid} className="flex justify-between mb-1 text-zinc-600">
                                        <span className="font-medium">{getPlayerName(pid)}</span>
                                        <span className="font-mono text-zinc-400">{stats.points}pts</span>
                                    </div>
                                )
                            })}
                        </div>
                     </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </ProtectedRoute>
  );
}
