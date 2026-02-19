"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/components/providers/AuthProvider";
import { Plus, Trophy, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Sport } from "@/lib/types";

import { createPortal } from "react-dom";

export function LeagueSelector() {
  const { user } = useAuth();
  const { leagues, activeLeague, setActiveLeague, createLeague } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [selectedSport, setSelectedSport] = useState<Sport>('basketball');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!user) return null;

  const handleCreate = async () => {
    if (!newLeagueName.trim()) return;
    await createLeague(newLeagueName.trim(), user.uid, selectedSport);
    setNewLeagueName("");
    setIsCreating(false);
    setIsOpen(false);
  };

  const CreateLeagueModal = isMounted ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div 
            className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl ring-1 ring-zinc-200 transform transition-all scale-100"
            onClick={e => e.stopPropagation()}
        >
            <h3 className="text-xl font-bold mb-4 text-zinc-900 border-b border-zinc-100 pb-2">Create New League</h3>
            <div className="mb-6">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">League Name</label>
                <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Sunday Hoops"
                    className="w-full p-3 border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-zinc-900 placeholder:text-zinc-400"
                    value={newLeagueName}
                    onChange={(e) => setNewLeagueName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
            </div>
            <div className="mb-6">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Select Sport</label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setSelectedSport('basketball')}
                        className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                            selectedSport === 'basketball' 
                                ? "border-orange-500 bg-orange-50 text-orange-700" 
                                : "border-zinc-100 hover:border-zinc-200 text-zinc-500"
                        )}
                    >
                        <span className="text-2xl mb-1">🏀</span>
                        <span className="text-xs font-bold">Basketball</span>
                    </button>
                    <button
                        onClick={() => setSelectedSport('soccer')}
                        className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                            selectedSport === 'soccer' 
                                ? "border-green-500 bg-green-50 text-green-700" 
                                : "border-zinc-100 hover:border-zinc-200 text-zinc-500"
                        )}
                    >
                        <span className="text-2xl mb-1">⚽</span>
                        <span className="text-xs font-bold">Soccer</span>
                    </button>
                </div>
            </div>
            <div className="flex justify-end gap-3">
                <button 
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleCreate}
                    disabled={!newLeagueName.trim()}
                    className="px-5 py-2 rounded-lg text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95"
                >
                    Create League
                </button>
            </div>
        </div>
    </div>,
    document.body
  ) : null;

  if (leagues.length === 0) {
    return (
        <>
            <Button onClick={() => setIsCreating(true)} variant="outline" size="sm" className="gap-2 border-dashed border-zinc-300 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50">
                <Plus size={16} />
                Create League
            </Button>
            {isCreating && CreateLeagueModal}
        </>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-100 rounded-lg transition-colors group"
      >
        <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center text-orange-600 group-hover:bg-orange-200 transition-colors">
            <Trophy size={16} />
        </div>
        <div className="text-left hidden md:block">
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider group-hover:text-orange-500 transition-colors">Current League</div>
            <div className="font-bold text-sm leading-none max-w-[120px] truncate text-zinc-900">{activeLeague?.name || "Select League"}</div>
        </div>
        <ChevronDown size={16} className="text-zinc-400 group-hover:text-zinc-600" />
      </button>

      {isOpen && (
        <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-xl shadow-xl border border-zinc-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-2 py-2 mb-1">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">My Leagues</span>
                    <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-mono">{leagues.length}</span>
                </div>
                
                <div className="space-y-1 mb-2 max-h-60 overflow-y-auto scrollbar-thin">
                    {leagues.map(league => (
                        <button
                            key={league.id}
                            onClick={() => {
                                setActiveLeague(league);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-sm font-medium transition-colors group",
                                activeLeague?.id === league.id ? "bg-orange-50 text-orange-800" : "hover:bg-zinc-50 text-zinc-700"
                            )}
                        >
                            <span className="truncate flex-1">{league.name}</span>
                            {activeLeague?.id === league.id && <Check size={16} className="text-orange-500 shrink-0 ml-2" />}
                        </button>
                    ))}
                </div>
                <div className="border-t border-zinc-100 pt-2">
                    <button 
                        onClick={() => {
                            setIsOpen(false);
                            setIsCreating(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        Create New League
                    </button>
                </div>
            </div>
        </>
      )}
      
      {isCreating && CreateLeagueModal}
    </div>
  );
}
