"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { CheckCircle } from "lucide-react";
import { Team, Player } from "@/lib/types";

export function LiveScoreboard({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { activeGame, players, updateStat, finishGame } = useStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!activeGame || activeGame.id !== params.id) {
       // If no active game or mismatched ID, redirect home or history?
       // For MVP, just redirect home if not active.
       if (!activeGame) router.push('/');
    }
  }, [activeGame, params.id, router]);

  if (!activeGame) return null;

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  const handleFinish = () => {
    if (confirm("Are you sure you want to finish the game?")) {
      finishGame();
      router.push("/");
    }
  };

  const PlayerRow = ({ playerId, team }: { playerId: string; team: Team }) => {
    const player = getPlayer(playerId);
    const stats = activeGame.playerStats[playerId] || { points: 0, assists: 0 };
    
    if (!player) return null;

    return (
      <div className={cn(
        "bg-white rounded-xl p-3 border mb-3 shadow-sm",
        team === 'A' ? "border-l-4 border-l-orange-500 border-zinc-200" : "border-l-4 border-l-blue-500 border-zinc-200",
      )}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-xs text-zinc-500 border border-zinc-200">
              {player.avatar || player.name.substring(0, 2)}
            </div>
            <div>
              <div className="font-bold text-sm text-zinc-900">{player.name}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                {stats.points} PTS • {stats.assists} AST
              </div>
            </div>
          </div>
          <div className="text-xl font-bold font-mono tracking-tighter text-zinc-900">
            {stats.points}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => updateStat(playerId, 'pts', 1)}
            className="bg-white hover:bg-orange-500 hover:text-white hover:border-orange-500 text-zinc-700 py-2 rounded-md font-bold text-xs transition-colors border border-zinc-200 shadow-sm"
          >
            +1
          </button>
          <button
             onClick={() => updateStat(playerId, 'pts', 2)}
            className="bg-white hover:bg-orange-500 hover:text-white hover:border-orange-500 text-zinc-700 py-2 rounded-md font-bold text-xs transition-colors border border-zinc-200 shadow-sm"
          >
            +2
          </button>
          <button
            onClick={() => updateStat(playerId, 'pts', 3)}
            className="bg-white hover:bg-orange-500 hover:text-white hover:border-orange-500 text-zinc-700 py-2 rounded-md font-bold text-xs transition-colors border border-zinc-200 shadow-sm"
          >
            +3
          </button>
          <button
             onClick={() => updateStat(playerId, 'ast', 1)}
            className="bg-white hover:bg-blue-500 hover:text-white hover:border-blue-500 text-zinc-700 py-2 rounded-md font-bold text-xs transition-colors border border-zinc-200 shadow-sm"
          >
            AST
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Sticky Score Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-zinc-200 p-4 shadow-sm">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div className="flex flex-col items-center w-1/3">
            <span className="text-xs text-zinc-500 font-bold mb-1 uppercase tracking-widest">Team A</span>
            <span className="text-4xl font-black text-orange-500 tracking-tighter">{activeGame.scoreA}</span>
          </div>
          
          <div className="text-zinc-300 font-black text-xl italic opacity-50">VS</div>
          
          <div className="flex flex-col items-center w-1/3">
            <span className="text-xs text-zinc-500 font-bold mb-1 uppercase tracking-widest">Team B</span>
            <span className="text-4xl font-black text-blue-600 tracking-tighter">{activeGame.scoreB}</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-8">
        {/* Team A Roster */}
        <div>
          <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 pl-1">Team A</h3>
          {activeGame.teamA.map(pid => (
            <PlayerRow key={pid} playerId={pid} team="A" />
          ))}
        </div>

        {/* Team B Roster */}
        <div>
          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 pl-1">Team B</h3>
          {activeGame.teamB.map(pid => (
            <PlayerRow key={pid} playerId={pid} team="B" />
          ))}
        </div>

        <Button 
          variant="destructive" 
          size="lg" 
          className="w-full font-bold h-14 text-sm uppercase tracking-widest"
          onClick={handleFinish}
        >
          <CheckCircle className="mr-2 h-5 w-5" />
          Finish Game
        </Button>
      </div>
    </div>
  );
}
