"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Trophy, Award, TrendingUp, UserPlus, X, Check, ExternalLink, Trash2 } from "lucide-react";
import { PlayerStatsDetail } from "./PlayerStatsDetail";
import { Player } from "@/lib/types";
import { useLanguage } from "@/components/providers/LanguageProvider";

type SortKey = "points" | "assists" | "winRate";

export function Leaderboard() {
  const { players, addPlayer, deletePlayer, activeLeague, history } = useStore();
  const { t } = useLanguage();
  const [sortBy, setSortBy] = useState<SortKey>("points");
  const [isMounted, setIsMounted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleAddPlayer = async () => {
    if (newPlayerName.trim()) {
      if (!activeLeague) {
          alert(t("leaderboard.noLeagueSelected"));
          return;
      }
      const nameExists = players.some(p => p.name.trim().toLowerCase() === newPlayerName.trim().toLowerCase());
      if (nameExists) return;

      await addPlayer(newPlayerName.trim());
      setNewPlayerName("");
      setIsAdding(false);
    }
  };

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (window.confirm(t("common.confirmDelete").replace("{name}", playerName))) {
      await deletePlayer(playerId);
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
          <div className="w-full max-w-md mx-auto p-8 text-center mt-12 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
              <Trophy className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{t("leaderboard.noLeagueSelected")}</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">{t("leaderboard.selectLeagueDesc")}</p>
              <div className="text-sm text-blue-500 font-bold animate-bounce">
                  {t("leaderboard.checkTopMenu")}
              </div>
          </div>
      );
  }

  const isBasketball = activeLeague?.sport !== 'soccer';
  const pointLabel = isBasketball ? t("leaderboard.points") : t("leaderboard.goals");
  const pointLabelShort = isBasketball ? t("leaderboard.pointsShort") : t("leaderboard.goalsShort");
  const themeBg = isBasketball ? "bg-blue-600" : "bg-green-600";
  const themeText = isBasketball ? "text-blue-500" : "text-green-600";
  const themeTextDark = isBasketball ? "text-blue-600 dark:text-blue-400" : "text-green-700 dark:text-green-400";
  const themeBgLight = isBasketball ? "bg-blue-100 dark:bg-blue-950/40" : "bg-green-100 dark:bg-green-950/40";
  const themeBorderLight = isBasketball ? "border-blue-200 dark:border-blue-900/30" : "border-green-200 dark:border-green-900/30";

  return (
    <div className="w-full max-w-md mx-auto p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 text-wrap">
            <span className={cn("text-xs font-black uppercase tracking-wider px-2 py-1 rounded-md", themeText, themeBgLight)}>{activeLeague.name}</span>
            <Link 
                href={`/league/${activeLeague.id}/leaderboard`}
                target="_blank"
                className={cn("ml-2 flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-900 px-2 py-1 rounded-full transition-colors border border-zinc-200 dark:border-zinc-800", isBasketball ? "hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20" : "hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20")}
            >
                {t("common.public")} <ExternalLink size={10} />
            </Link>
        </h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={cn("p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-sm text-zinc-500 dark:text-zinc-400 transition-colors", isBasketball ? "hover:text-blue-500 hover:border-blue-500 dark:hover:border-blue-400" : "hover:text-green-600 hover:border-green-600 dark:hover:border-green-400")}
        >
          {isAdding ? <X size={20} /> : <UserPlus size={20} />}
        </button>
      </div>

      {isAdding && (
        <div className={cn("mb-6 p-4 bg-white dark:bg-zinc-900 rounded-lg border shadow-sm animate-in fade-in slide-in-from-top-2", themeBorderLight)}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t("leaderboard.newPlayer")}</h3>
            {newPlayerName.trim() && players.some(p => p.name.trim().toLowerCase() === newPlayerName.trim().toLowerCase()) && (
                <span className="text-[10px] font-bold text-red-500 uppercase bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded">{t("leaderboard.nameExists")}</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              placeholder={t("leaderboard.enterPlayerName")}
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
              className={cn("flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none transition-all font-medium", isBasketball ? "focus:ring-blue-500/20 focus:border-blue-500" : "focus:ring-green-500/20 focus:border-green-600")}
            />
            <button
              onClick={handleAddPlayer}
              disabled={!newPlayerName.trim() || players.some(p => p.name.trim().toLowerCase() === newPlayerName.trim().toLowerCase())}
              className={cn("text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors", themeBg)}
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
              "flex items-center px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border-2 transition-colors",
              sortBy === key
                ? cn("text-white", themeBg)
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            )}
          >
            {key === "points" && <TrendingUp size={16} className="mr-2" />}
            {key === "assists" && <Award size={16} className="mr-2" />}
            {key === "winRate" && <Trophy size={16} className="mr-2" />}
            {key === "points" ? pointLabel : key === "assists" ? t("leaderboard.assists") : t("leaderboard.winRate")}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {sortedPlayers.map((player, index) => {
          const winRate = player.gamesPlayed > 0 ? Math.round((player.wins / player.gamesPlayed) * 100) : 0;
          return (
            <div
              key={player.id}
              onClick={() => setSelectedPlayer(player)}
              className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 shadow-sm cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group"
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded font-black text-sm transition-colors",
                index === 0 ? "bg-yellow-400 text-yellow-950" :
                index === 1 ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200" :
                index === 2 ? (isBasketball ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200" : "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200") :
                "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              )}>
                {index + 1}
              </div>
              
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-zinc-500 dark:text-zinc-400">
                {player.avatar || player.name.substring(0, 2).toUpperCase()}
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-zinc-900 dark:text-white text-lg leading-none group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">{player.name}</h3>
                <div className="flex items-center gap-3 text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-1">
                  <span className={cn(sortBy === "points" && cn("font-bold", themeTextDark))}>
                    {player.totalPoints} {pointLabelShort}
                  </span>
                  <span>•</span>
                  <span className={cn(sortBy === "assists" && cn("font-bold", themeTextDark))}>
                    {player.totalAssists} {t("leaderboard.assistsShort")}
                  </span>
                  <span>•</span>
                  <span className={cn(sortBy === "winRate" && cn("font-bold", themeTextDark))}>
                    {winRate}% WR
                  </span>
                </div>
              </div>

              <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePlayer(player.id, player.name);
                  }}
                  className="p-2 text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              >
                  <Trash2 size={16} />
              </button>
            </div>
          );
        })}

        {sortedPlayers.length === 0 && (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
            {t("leaderboard.noPlayers")}
          </div>
        )}
      </div>

      {selectedPlayer && (
        <PlayerStatsDetail 
          player={selectedPlayer}
          games={history}
          onClose={() => setSelectedPlayer(null)}
          sport={activeLeague.sport}
        />
      )}
    </div>
  );
}
