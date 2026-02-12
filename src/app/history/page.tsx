"use client";

import { useState, useEffect } from "react";

import { useStore } from "@/lib/store";
import { CalendarDays } from "lucide-react";

export default function HistoryPage() {
  const history = useStore((state) => state.history);
  const players = useStore((state) => state.players);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name || "Unknown";

  if (history.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center text-gray-500">
        <CalendarDays className="w-16 h-16 mb-4 opacity-20" />
        <h2 className="text-xl font-semibold mb-2">No Games Yet</h2>
        <p>Start a new game to see history here.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24 bg-white">
      <h1 className="text-2xl font-bold mb-6 text-zinc-900 flex items-center gap-2">
        <CalendarDays className="text-orange-500" />
        Game History
      </h1>

      <div className="space-y-4">
        {history.map((game) => {
          const isTeamAWinner = game.scoreA > game.scoreB;
          return (
            <div key={game.id} className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm">
              <div className="flex justify-between items-center mb-4 text-xs text-zinc-400 uppercase tracking-widest font-bold">
                 <span>{new Date(game.date).toLocaleDateString()}</span>
                 <span className={isTeamAWinner ? "text-orange-600" : "text-blue-600"}>
                   {isTeamAWinner ? "Team A Won" : "Team B Won"}
                 </span>
              </div>

              <div className="flex justify-between items-center mb-6">
                <div className="text-center w-1/3">
                  <div className="text-3xl font-black text-orange-500 tracking-tighter">{game.scoreA}</div>
                  <div className="text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-widest">TEAM A</div>
                </div>
                <div className="text-zinc-200 font-bold italic text-xl">VS</div>
                <div className="text-center w-1/3">
                  <div className="text-3xl font-black text-blue-600 tracking-tighter">{game.scoreB}</div>
                  <div className="text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-widest">TEAM B</div>
                </div>
              </div>

              {/* Player Stats Summary */}
              <div className="space-y-2 border-t border-zinc-100 pt-4">
                 <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <h4 className="text-orange-600 font-bold mb-2 uppercase tracking-wider">Team A</h4>
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
                        <h4 className="text-blue-600 font-bold mb-2 uppercase tracking-wider">Team B</h4>
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
          );
        })}
      </div>
    </div>
  );
}
