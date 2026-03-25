"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Plus, Trophy, Check, ChevronDown, Trash2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Sport, League } from "@/lib/types";

import { createPortal } from "react-dom";

export function LeagueSelector() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { leagues, activeLeague, setActiveLeague, createLeague, updateLeague, deleteLeague } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingLeague, setEditingLeague] = useState<League | null>(null);
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

  const handleUpdate = async () => {
    if (!editingLeague || !newLeagueName.trim()) return;
    await updateLeague(editingLeague.id, { 
        name: newLeagueName.trim(), 
        sport: selectedSport 
    });
    setEditingLeague(null);
    setNewLeagueName("");
  };

  const handleOpenCreate = () => {
      setNewLeagueName("");
      setSelectedSport('basketball');
      setIsCreating(true);
      setIsOpen(false);
  };

  const handleOpenEdit = (e: React.MouseEvent, league: League) => {
      e.stopPropagation();
      setEditingLeague(league);
      setNewLeagueName(league.name);
      setSelectedSport(league.sport);
      setIsOpen(false);
  };

  const handleDeleteLeague = async (e: React.MouseEvent, leagueId: string, leagueName: string) => {
    e.stopPropagation();
    if (confirm(t("common.confirmDelete").replace("{name}", leagueName) + "\n\n" + t("leagues.confirmDeleteDesc"))) {
        await deleteLeague(leagueId);
        if (editingLeague?.id === leagueId) setEditingLeague(null);
    }
  };

  const LeagueFormModal = ({ mode }: { mode: 'create' | 'edit' }) => {
    if (!isMounted) return null;
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div 
              className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-sm shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800 transform transition-all scale-100"
              onClick={e => e.stopPropagation()}
          >
              <h3 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">
                {mode === 'create' ? t("leagues.createLeague") : t("leagues.editLeague")}
              </h3>
              
              <div className="mb-6">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">
                    {t("leagues.leagueName")}
                  </label>
                  <input
                      autoFocus
                      type="text"
                      placeholder="e.g. Sunday Hoops"
                      className="w-full p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400"
                      value={newLeagueName}
                      onChange={(e) => setNewLeagueName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (mode === 'create' ? handleCreate() : handleUpdate())}
                  />
              </div>

              <div className="mb-6">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">
                    {t("leagues.selectSport")}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                      <button
                          onClick={() => setSelectedSport('basketball')}
                          className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                              selectedSport === 'basketball' 
                                  ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400" 
                                  : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 text-zinc-500 dark:text-zinc-500"
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
                                  ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400" 
                                  : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 text-zinc-500 dark:text-zinc-500"
                          )}
                      >
                          <span className="text-2xl mb-1">⚽</span>
                          <span className="text-xs font-bold">Soccer</span>
                      </button>
                  </div>
              </div>

              <div className="flex justify-between gap-3">
                  {mode === 'edit' ? (
                      <button 
                          onClick={(e) => editingLeague && handleDeleteLeague(e, editingLeague.id, editingLeague.name)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                          <Trash2 size={16} />
                          {t("common.delete")}
                      </button>
                  ) : <div />}

                  <div className="flex gap-2">
                    <button 
                        onClick={() => mode === 'create' ? setIsCreating(false) : setEditingLeague(null)}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                        {t("common.cancel")}
                    </button>
                    <button 
                        onClick={mode === 'create' ? handleCreate : handleUpdate}
                        disabled={!newLeagueName.trim()}
                        className="px-5 py-2 rounded-lg text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95"
                    >
                        {mode === 'create' ? t("leagues.createLeague") : t("common.save")}
                    </button>
                  </div>
              </div>
          </div>
      </div>,
      document.body
    );
  };

  if (leagues.length === 0) {
    return (
        <>
            <Button onClick={handleOpenCreate} variant="outline" size="sm" className="gap-2 border-dashed border-zinc-300 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20">
                <Plus size={16} />
                {t("leagues.createLeague")}
            </Button>
            {isCreating && <LeagueFormModal mode="create" />}
        </>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors group"
      >
        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-md flex items-center justify-center text-orange-600 dark:text-orange-500 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
            <Trophy size={16} />
        </div>
        <div className="text-left hidden md:block">
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider group-hover:text-orange-500 transition-colors">Current League</div>
            <div className="font-bold text-sm leading-none max-w-[120px] truncate text-zinc-900 dark:text-white">{activeLeague?.name || "Select League"}</div>
        </div>
        <ChevronDown size={16} className="text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
      </button>

      {isOpen && (
        <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-100 dark:border-zinc-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-2 py-2 mb-1">
                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{t("leagues.myLeagues")}</span>
                    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded font-mono">{leagues.length}</span>
                </div>
                
                <div className="space-y-1 mb-2 max-h-60 overflow-y-auto scrollbar-thin">
                    {leagues.map(league => (
                        <div key={league.id} className="group/item flex items-center gap-1">
                            <button
                                onClick={() => {
                                    setActiveLeague(league);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "flex-1 text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-sm font-medium transition-colors group",
                                    activeLeague?.id === league.id 
                                        ? "bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-400" 
                                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                )}
                            >
                                <span className="truncate flex-1 flex items-center gap-2">
                                    <span>{league.sport === 'soccer' ? '⚽' : '🏀'}</span>
                                    {league.name}
                                </span>
                                {activeLeague?.id === league.id && <Check size={16} className="text-orange-500 shrink-0 ml-2" />}
                            </button>
                            <button 
                                onClick={(e) => handleOpenEdit(e, league)}
                                className="opacity-0 group-hover/item:opacity-100 p-2 text-zinc-300 dark:text-zinc-600 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-lg transition-all"
                                title={t("common.settings")}
                            >
                                <Settings2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2">
                    <button 
                        onClick={handleOpenCreate}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-white bg-zinc-900 dark:bg-orange-500 hover:bg-zinc-800 dark:hover:bg-orange-600 rounded-lg transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        {t("leagues.createLeague")}
                    </button>
                </div>
            </div>
        </>
      )}
      
      {isCreating && <LeagueFormModal mode="create" />}
      {editingLeague && <LeagueFormModal mode="edit" />}
    </div>
  );
}
