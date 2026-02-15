"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { UserPlus, PlayCircle, Shuffle, Plus, X, Check, ArrowRightLeft } from "lucide-react";

export function GameSetup() {
  const router = useRouter();
  const { players, startGame, addPlayer } = useStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [step, setStep] = useState<"select" | "teams">("select");
  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);
  const [teamAName, setTeamAName] = useState("Team A");
  const [teamBName, setTeamBName] = useState("Team B");
  const [isMounted, setIsMounted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [selectedSwapId, setSelectedSwapId] = useState<string | null>(null);

  useEffect(() => {
    // Reset any active game state when starting a new setup
    useStore.getState().resetActiveGame();
    setIsMounted(true);
  }, []);

  const handleAddPlayer = async () => {
    if (newPlayerName.trim()) {
      await addPlayer(newPlayerName.trim());
      setNewPlayerName("");
      setIsAdding(false);
    }
  };

  if (!isMounted) return null;

  const togglePlayer = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((pid) => pid !== id));
    } else {
      if (selectedIds.length < 10) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const handleCreateTeams = () => {
    const count = selectedIds.length;
    if (count < 4 || count > 10 || count % 2 !== 0) return;
    
    // Randomly shuffle and split
    const shuffled = [...selectedIds].sort(() => Math.random() - 0.5);
    const half = count / 2;
    setTeamA(shuffled.slice(0, half));
    setTeamB(shuffled.slice(half));
    setStep("teams");
  };

  const handlePlayerSwapRef = (id: string) => {
    if (!selectedSwapId) {
      setSelectedSwapId(id);
      return;
    }

    if (selectedSwapId === id) {
      setSelectedSwapId(null);
      return;
    }

    // Perform swap if valid
    const isA = teamA.includes(id);
    const sourceIsA = teamA.includes(selectedSwapId);

    if (isA === sourceIsA) {
      // Same team, just switch selection
      setSelectedSwapId(id);
    } else {
      // Swap across teams
      const newTeamA = [...teamA];
      const newTeamB = [...teamB];

      if (sourceIsA) {
        // Swap selected (from A) with clicked (from B)
        const idxA = newTeamA.indexOf(selectedSwapId);
        const idxB = newTeamB.indexOf(id);
        newTeamA[idxA] = id;
        newTeamB[idxB] = selectedSwapId;
      } else {
        // Swap selected (from B) with clicked (from A)
        const idxB = newTeamB.indexOf(selectedSwapId);
        const idxA = newTeamA.indexOf(id);
        newTeamB[idxB] = id;
        newTeamA[idxA] = selectedSwapId;
      }

      setTeamA(newTeamA);
      setTeamB(newTeamB);
      setSelectedSwapId(null);
    }
  };

  const handleStartGame = async () => {
    await startGame(teamA, teamB, teamAName, teamBName);
    const gameId = useStore.getState().activeGame?.id;
    if (gameId) router.push(`/game/${gameId}`);
  };

  if (step === "select") {
       const isValidCount = selectedIds.length >= 4 && selectedIds.length <= 10 && selectedIds.length % 2 === 0;

       return (
      <div className="w-full max-w-md mx-auto p-4 pb-24">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <UserPlus className="text-orange-500" />
            Select Players
            </h1>
            <button
            onClick={() => setIsAdding(!isAdding)}
            className="p-2 bg-white border border-zinc-200 rounded-full shadow-sm text-zinc-500 hover:text-orange-500 hover:border-orange-500 transition-colors"
            >
            {isAdding ? <X size={20} /> : <Plus size={20} />}
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
        
        <p className="text-zinc-500 mb-4 flex justify-between items-center">
          <span>Select 4-10 players ({selectedIds.length})</span>
          {!isValidCount && selectedIds.length > 0 && (
              <span className="text-xs text-orange-500 font-bold bg-orange-50 px-2 py-1 rounded-full">
                  {selectedIds.length % 2 !== 0 ? "Need even number" : "Min 4 required"}
              </span>
          )}
        </p>

        {players.length === 0 ? (
            <div className="text-center p-8 bg-zinc-50 rounded-xl border border-dashed border-zinc-300">
                <p className="text-zinc-500 mb-4">No players found. Add at least 4 players to start a game.</p>
                <Button onClick={() => setIsAdding(true)} variant="outline">
                    Add Players First
                </Button>
            </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {players.map((player) => {
              const isSelected = selectedIds.includes(player.id);
              return (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  disabled={!isSelected && selectedIds.length >= 10}
                  className={cn(
                    "flex items-center p-3 rounded-lg border transition-all shadow-sm",
                    isSelected
                      ? "bg-orange-500 border-orange-500 text-white shadow-orange-500/20"
                      : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50",
                    !isSelected && selectedIds.length >= 10 && "opacity-50 cursor-not-allowed"
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
        )}

        <Button
          className="w-full h-12 text-lg bg-zinc-900 text-white hover:bg-zinc-800"
          disabled={!isValidCount}
          onClick={handleCreateTeams}
        >
          Create Teams ({selectedIds.length / 2} vs {selectedIds.length / 2})
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

        <p className="text-sm text-zinc-500 mb-4">Tap two players to swap them between teams.</p>

        <div className="space-y-6 mb-8">
          <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
                <input
                    type="text"
                    value={teamAName}
                    onChange={(e) => setTeamAName(e.target.value)}
                    className="text-orange-500 font-bold uppercase tracking-wider text-sm bg-transparent border-b border-transparent focus:border-orange-500 hover:border-zinc-200 outline-none w-32 transition-colors"
                />
                <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">Tap to swap</span>
            </div>
            <div className="space-y-2">
              {teamA.map(id => {
                 const p = players.find(x => x.id === id);
                 const isSelected = selectedSwapId === id;
                 return (
                    <div 
                        key={id} 
                        onClick={() => handlePlayerSwapRef(id)}
                        className={cn(
                            "flex items-center justify-between text-zinc-900 font-medium pl-3 pr-2 py-2 border-l-4 border-orange-500 bg-zinc-50 rounded-r-md cursor-pointer transition-all active:scale-95",
                            isSelected ? "ring-2 ring-orange-500 bg-orange-50" : "hover:bg-zinc-100"
                        )}
                    >
                        <span>{p?.name}</span>
                        {isSelected && <ArrowRightLeft size={16} className="text-orange-500 animate-pulse" />}
                    </div>
                 )
              })}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bg-zinc-100 rounded-full p-2 text-zinc-500 font-bold text-xs border border-zinc-200">VS</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
                <input
                    type="text"
                    value={teamBName}
                    onChange={(e) => setTeamBName(e.target.value)}
                    className="text-blue-500 font-bold uppercase tracking-wider text-sm bg-transparent border-b border-transparent focus:border-blue-500 hover:border-zinc-200 outline-none w-32 transition-colors"
                />
                <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">Tap to swap</span>
            </div>
            <div className="space-y-2">
              {teamB.map(id => {
                 const p = players.find(x => x.id === id);
                 const isSelected = selectedSwapId === id;
                 return (
                    <div 
                        key={id} 
                        onClick={() => handlePlayerSwapRef(id)}
                        className={cn(
                            "flex items-center justify-between text-zinc-900 font-medium pl-3 pr-2 py-2 border-l-4 border-blue-500 bg-zinc-50 rounded-r-md cursor-pointer transition-all active:scale-95",
                            isSelected ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-zinc-100"
                        )}
                    >
                        <span>{p?.name}</span>
                        {isSelected && <ArrowRightLeft size={16} className="text-blue-500 animate-pulse" />}
                    </div>
                 )
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 border-zinc-200 text-zinc-700 hover:bg-zinc-50" onClick={handleCreateTeams}>
            <Shuffle className="mr-2 h-4 w-4" />
            Reshuffle
          </Button>
          <Button className="flex-[2] bg-orange-500 text-white hover:bg-orange-600" size="lg" onClick={handleStartGame}>
            Start Game
          </Button>
        </div>
    </div>
  );
}
