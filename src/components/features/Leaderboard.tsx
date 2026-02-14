"use client";

import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Trophy, Award, TrendingUp, UserPlus, X, Check } from "lucide-react";

type SortKey = "points" | "assists" | "winRate";

export function Leaderboard() {
  const { players, addPlayer, activeLeague } = useStore();
  const [sortBy, setSortBy] = useState<SortKey>("points");
  const [isMounted, setIsMounted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleAddPlayer = async () => {
    if (newPlayerName.trim()) {
      if (!activeLeague) {
          alert("Please create a league first.");
          return;
      }
      await addPlayer(newPlayerName.trim());
      setNewPlayerName("");
      setIsAdding(false);
    }
  };
  
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      if (sortBy === "points") return b.totalPoints - a.totalPoints;
      if (sortBy === "assists") return b.totalAssists - a.totalAssists;
      if (sortBy === "winRate") {
        const rateA = a.gamesPlayed > 0 ? a.wins / a.gamesPlayed : 0;
        const rateB = b.gamesPlayed > 0 ? b.wins / b.gamesPlayed : 0;
        return rateB - rateA;
      }
      return 0;
    });
  }, [players, sortBy]);

  if (!isMounted) return null;

  if (!activeLeague) {
      return (
          <div className="w-full max-w-md mx-auto p-8 text-center mt-12 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
              <Trophy className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-zinc-900 mb-2">No League Selected</h2>
              <p className="text-zinc-500 mb-6">Create or select a league from the top menu to start tracking players and games.</p>
              <div className="text-sm text-orange-500 font-bold animate-bounce">
                  ↑ Check the top menu
              </div>
          </div>
      );
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <span className="text-orange-500 text-xs font-black uppercase tracking-wider bg-orange-100 px-2 py-1 rounded-md">{activeLeague.name}</span>
        </h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 bg-white border border-zinc-200 rounded-full shadow-sm text-zinc-500 hover:text-orange-500 hover:border-orange-500 transition-colors"
        >
          {isAdding ? <X size={20} /> : <UserPlus size={20} />}
        </button>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-orange-200 shadow-sm animate-in fade-in slide-in-from-top-2">
          <h3 className="text-sm font-bold text-zinc-500 mb-3 uppercase tracking-wider">New Player</h3>
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              placeholder="Enter player name..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
              className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
            />
            <button
              onClick={handleAddPlayer}
              disabled={!newPlayerName.trim()}
              className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Check size={24} />
            </button>
          </div>
        </div>
      )}

      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {(["points", "assists", "winRate"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={cn(
              "flex items-center px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border-2",
              sortBy === key
                ? "bg-orange-500 border-orange-500 text-white"
                : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"
            )}
          >
            {key === "points" && <TrendingUp size={16} className="mr-2" />}
            {key === "assists" && <Award size={16} className="mr-2" />}
            {key === "winRate" && <Trophy size={16} className="mr-2" />}
            {key === "points" ? "Points" : key === "assists" ? "Assists" : "Win Rate"}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {sortedPlayers.map((player, index) => {
          const winRate = player.gamesPlayed > 0 ? Math.round((player.wins / player.gamesPlayed) * 100) : 0;
          return (
            <div
              key={player.id}
              className="bg-white rounded-lg p-4 border border-zinc-200 flex items-center gap-4 shadow-sm"
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded font-black text-sm",
                index === 0 ? "bg-yellow-400 text-yellow-950" :
                index === 1 ? "bg-zinc-200 text-zinc-700" :
                index === 2 ? "bg-amber-100 text-amber-800" :
                "bg-zinc-100 text-zinc-500"
              )}>
                {index + 1}
              </div>
              
              <div className="w-10 h-10 rounded-full bg-zinc-100 border-2 border-zinc-200 flex items-center justify-center font-bold text-zinc-500">
                {player.avatar || player.name.substring(0, 2).toUpperCase()}
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-zinc-900 text-lg leading-none">{player.name}</h3>
                <div className="flex items-center gap-3 text-xs font-mono text-zinc-500 mt-1">
                  <span className={cn(sortBy === "points" && "text-orange-600 font-bold")}>
                    {player.totalPoints} PTS
                  </span>
                  <span>•</span>
                  <span className={cn(sortBy === "assists" && "text-orange-600 font-bold")}>
                    {player.totalAssists} AST
                  </span>
                  <span>•</span>
                  <span className={cn(sortBy === "winRate" && "text-orange-600 font-bold")}>
                    {winRate}% WR
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {sortedPlayers.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            No players found.
          </div>
        )}
      </div>
    </div>
  );
}
