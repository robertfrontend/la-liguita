"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { UserPlus, PlayCircle, Shuffle } from "lucide-react";

export function GameSetup() {
  const router = useRouter();
  const { players, startGame } = useStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [step, setStep] = useState<"select" | "teams">("select");
  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const togglePlayer = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((pid) => pid !== id));
    } else {
      if (selectedIds.length < 6) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const handleCreateTeams = () => {
    if (selectedIds.length !== 6) return;
    
    // Randomly shuffle and split
    const shuffled = [...selectedIds].sort(() => Math.random() - 0.5);
    setTeamA(shuffled.slice(0, 3));
    setTeamB(shuffled.slice(3, 6));
    setStep("teams");
  };

  const handleStartGame = () => {
    startGame(teamA, teamB);
    const id = useStore.getState().activeGame?.id; // Access directly to be sure, or rely on store update
    // Since zustand updates are sync usually, we can expect activeGame to be set.
    // But better to just redirect to /game/live or something.
    // Wait, the store updates activeGame.
    // I need the ID to redirect.
    // Let's get it from the store state after call.
    const gameId = useStore.getState().activeGame?.id;
    if (gameId) {
      router.push(`/game/${gameId}`);
    }
  };

  if (step === "select") {
    return (
      <div className="w-full max-w-md mx-auto p-4 pb-24">
        <h1 className="text-2xl font-bold mb-6 text-zinc-900 flex items-center gap-2">
          <UserPlus className="text-orange-500" />
          Select Players
        </h1>
        
        <p className="text-zinc-500 mb-4">
          Select 6 players to start ({selectedIds.length}/6)
        </p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {players.map((player) => {
            const isSelected = selectedIds.includes(player.id);
            return (
              <button
                key={player.id}
                onClick={() => togglePlayer(player.id)}
                disabled={!isSelected && selectedIds.length >= 6}
                className={cn(
                  "flex items-center p-3 rounded-lg border transition-all shadow-sm",
                  isSelected
                    ? "bg-orange-500 border-orange-500 text-white shadow-orange-500/20"
                    : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50",
                  !isSelected && selectedIds.length >= 6 && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center font-bold mr-3 text-sm">
                  {player.avatar || player.name.slice(0, 2)}
                </div>
                <span className="font-medium truncate">{player.name}</span>
              </button>
            );
          })}
        </div>

        <Button
          className="w-full h-12 text-lg bg-zinc-900 text-white hover:bg-zinc-800"
          disabled={selectedIds.length !== 6}
          onClick={handleCreateTeams}
        >
          Create Teams
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 pb-24">
       <h1 className="text-2xl font-bold mb-6 text-zinc-900 flex items-center gap-2">
          <PlayCircle className="text-orange-500" />
          Preview Matchup
        </h1>

        <div className="space-y-6 mb-8">
          <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm">
            <h3 className="text-orange-500 font-bold mb-3 uppercase tracking-wider text-sm">Team A</h3>
            <div className="space-y-2">
              {teamA.map(id => {
                 const p = players.find(x => x.id === id);
                 return <div key={id} className="text-zinc-900 font-medium pl-2 border-l-2 border-orange-500">{p?.name}</div>
              })}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bg-zinc-100 rounded-full p-2 text-zinc-500 font-bold text-xs border border-zinc-200">VS</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm">
            <h3 className="text-blue-500 font-bold mb-3 uppercase tracking-wider text-sm">Team B</h3>
            <div className="space-y-2">
              {teamB.map(id => {
                 const p = players.find(x => x.id === id);
                 return <div key={id} className="text-zinc-900 font-medium pl-2 border-l-2 border-blue-500">{p?.name}</div>
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 border-zinc-200 text-zinc-700 hover:bg-zinc-50" onClick={handleCreateTeams}>
            <Shuffle className="mr-2 h-4 w-4" />
            Shuffle
          </Button>
          <Button className="flex-[2] bg-orange-500 text-white hover:bg-orange-600" size="lg" onClick={handleStartGame}>
            Start Game
          </Button>
        </div>
    </div>
  );
}
