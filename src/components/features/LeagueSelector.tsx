"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/components/providers/AuthProvider";
import { Plus, Trophy, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function LeagueSelector() {
  const { user } = useAuth();
  const { leagues, activeLeague, setActiveLeague, createLeague } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");

  if (!user) return null;

  const handleCreate = async () => {
    if (!newLeagueName.trim()) return;
    await createLeague(newLeagueName.trim(), user.uid);
    setNewLeagueName("");
    setIsCreating(false);
    setIsOpen(false);
  };

  if (leagues.length === 0 && !isCreating) {
    return (
        <Button onClick={() => setIsCreating(true)} variant="outline" size="sm" className="gap-2">
            <Plus size={16} />
            Create League
        </Button>
    );
  }

  if (isCreating) {
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
                  <h3 className="text-lg font-bold mb-4">Create New League</h3>
                  <input
                      autoFocus
                      type="text"
                      placeholder="League Name (e.g. Sunday Hoops)"
                      className="w-full p-2 border border-zinc-200 rounded-lg mb-4"
                      value={newLeagueName}
                      onChange={(e) => setNewLeagueName(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                      <Button onClick={handleCreate} disabled={!newLeagueName.trim()}>Create</Button>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center text-orange-600">
            <Trophy size={16} />
        </div>
        <div className="text-left hidden md:block">
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Current League</div>
            <div className="font-bold text-sm leading-none">{activeLeague?.name || "Select League"}</div>
        </div>
        <ChevronDown size={16} className="text-zinc-400" />
      </button>

      {isOpen && (
        <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-xl shadow-xl border border-zinc-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-xs font-bold text-zinc-400 px-2 py-2 uppercase tracking-wider">My Leagues</div>
                <div className="space-y-1 mb-2">
                    {leagues.map(league => (
                        <button
                            key={league.id}
                            onClick={() => {
                                setActiveLeague(league);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-sm font-medium transition-colors",
                                activeLeague?.id === league.id ? "bg-orange-50 text-orange-700" : "hover:bg-zinc-50 text-zinc-700"
                            )}
                        >
                            {league.name}
                            {activeLeague?.id === league.id && <Check size={14} />}
                        </button>
                    ))}
                </div>
                <div className="border-t border-zinc-100 pt-2">
                    <button 
                        onClick={() => {
                            setIsOpen(false);
                            setIsCreating(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors"
                    >
                        <Plus size={16} />
                        Create New League
                    </button>
                </div>
            </div>
        </>
      )}
    </div>
  );
}
