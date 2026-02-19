"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Pencil } from "lucide-react";
import { Team, Game } from "@/lib/types";
import { subscribeToGameGlobally, subscribeToGame } from "@/lib/db";

export function LiveScoreboard({ gameId }: { gameId: string }) {
  const router = useRouter();
  const { activeGame, activeLeague, players, updateStat, finishGame, updateTeamName } = useStore();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;

    // 1. Instant load from store if matching and not stale check
    if (activeGame && activeGame.id === gameId) {
      // Ensure we don't load a finished game as active if we are expecting a live one?
      // Actually, LiveScoreboard handles both.
      setGame(activeGame);
      setLoading(false);
      return;
    }
    
    // ... use gameId instead of params.id ...
    let unsubGlobal: (() => void) | undefined;

    // 2. If we are in a league, try to find it there first (more reliable)
    if (activeLeague) {
        const unsubLocal = subscribeToGame(activeLeague.id, gameId, (fetchedGame) => {
            if (fetchedGame) {
                setGame(fetchedGame);
                setLoading(false);
            } else {
                // Not in this league? Try global lookup (in case it's a cross-league link)
                if (!unsubGlobal) {
                    try {
                        unsubGlobal = subscribeToGameGlobally(gameId, (globalGame) => {
                            if (globalGame) {
                                setGame(globalGame);
                            }
                            setLoading(false);
                        });
                    } catch (e) {
                        setDebugError(e instanceof Error ? e.message : String(e));
                        setLoading(false);
                    }
                }
            }
        });

        return () => {
            unsubLocal();
            if (unsubGlobal) unsubGlobal();
        };
    } 
    
    // 3. No league selected (Guest)? Use global lookup.
    try {
        unsubGlobal = subscribeToGameGlobally(gameId, (fetchedGame) => {
            if (fetchedGame) {
                setGame(fetchedGame);
            }
            setLoading(false);
        });
    } catch (e) {
         setDebugError(e instanceof Error ? e.message : String(e));
         setLoading(false);
    }

    return () => {
        if (unsubGlobal) unsubGlobal();
    };
  }, [activeGame, activeLeague, gameId]);

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading game... <br/><span className="text-xs text-zinc-400">ID: {gameId}</span></div>;
  // ... rest same ...
  
  if (debugError) return (
      <div className="p-8 text-center text-red-500 border border-red-200 bg-red-50 m-4 rounded-lg">
          <h3 className="font-bold">Error Loading Game</h3>
          <p className="text-sm font-mono mt-2">{debugError}</p>
          <p className="text-xs text-zinc-500 mt-4">Please check your network and permissions.</p>
          <Button onClick={() => router.push("/")} className="mt-4">Go Home</Button>
      </div>
  );

  if (!game) return <div className="p-8 text-center text-zinc-500">Game not found</div>;

  const canEdit = activeGame?.id === game.id;
  const getPlayer = (id: string) => players.find((p) => p.id === id);

  const isBasketball = game.sport !== 'soccer';
  const teamAColor = isBasketball ? "text-orange-500" : "text-green-600";
  const teamAColorWinner = isBasketball ? "text-orange-600" : "text-green-600";
  const teamAColorBg = isBasketball ? "bg-orange-500" : "bg-green-600";
  const teamAColorBorder = isBasketball ? "border-l-orange-500" : "border-l-green-600";

  const handleFinish = async () => {
    if (confirm("Are you sure you want to finish the game?")) {
      await finishGame();
      router.push("/history");
    }
  };

  const PlayerRow = ({ playerId, team }: { playerId: string; team: Team }) => {
    const player = getPlayer(playerId);
    const stats = game.playerStats[playerId] || { points: 0, assists: 0 };
    
    const displayName = player ? player.name : "Unknown";
    const displayAvatar = player ? (player.avatar || player.name.substring(0, 2)) : "?";

    const pointLabel = isBasketball ? 'PTS' : 'GLS';
    const assistLabel = 'AST';

    return (
      <div className={cn(
        "bg-white dark:bg-zinc-900 rounded-xl p-3 border mb-3 shadow-sm transition-colors",
        team === 'A' ? cn("border-l-4 border-zinc-200 dark:border-zinc-800", teamAColorBorder) : "border-l-4 border-l-blue-500 border-zinc-200 dark:border-zinc-800",
      )}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              {displayAvatar}
            </div>
            <div>
              <div className="font-bold text-sm text-zinc-900 dark:text-white">{displayName}</div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {stats.points} {pointLabel} • {stats.assists} {assistLabel}
              </div>
            </div>
          </div>
          <div className="text-xl font-bold font-mono tracking-tighter text-zinc-900 dark:text-white">
            {stats.points}
          </div>
        </div>

        {canEdit && (
            <div className="grid grid-cols-4 gap-1">
            <button
                onClick={() => updateStat(playerId, 'pts', 1)}
                className={cn(
                    "bg-white dark:bg-zinc-900 hover:text-white py-2 rounded-md font-bold text-[10px] md:text-xs transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm",
                    isBasketball ? "hover:bg-orange-500 hover:border-orange-500" : "hover:bg-green-600 hover:border-green-600"
                )}
            >
                +1 {pointLabel}
            </button>
            <button
                onClick={() => updateStat(playerId, 'pts', -1)}
                className="bg-white dark:bg-zinc-900 hover:bg-red-500 hover:text-white hover:border-red-500 text-zinc-700 dark:text-zinc-300 py-2 rounded-md font-bold text-[10px] md:text-xs transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm"
            >
                -1 {pointLabel}
            </button>
            <button
                onClick={() => updateStat(playerId, 'ast', 1)}
                className="bg-white dark:bg-zinc-900 hover:bg-blue-500 hover:text-white hover:border-blue-500 text-zinc-700 dark:text-zinc-300 py-2 rounded-md font-bold text-[10px] md:text-xs transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm"
            >
                +1 {assistLabel}
            </button>
            <button
                onClick={() => updateStat(playerId, 'ast', -1)}
                className="bg-white dark:bg-zinc-900 hover:bg-red-500 hover:text-white hover:border-red-500 text-zinc-700 dark:text-zinc-300 py-2 rounded-md font-bold text-[10px] md:text-xs transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm"
            >
                -1 {assistLabel}
            </button>
            </div>
        )}
      </div>
    );
  };

  const isWinnerA = game.isFinished && game.scoreA > game.scoreB;
  const isWinnerB = game.isFinished && game.scoreB > game.scoreA;
  
  const EditableTeamName = ({ team, currentName, isWinner }: { team: 'A' | 'B', currentName?: string, isWinner: boolean }) => {
      const [isEditing, setIsEditing] = useState(false);
      const [name, setName] = useState(currentName || (team === 'A' ? "Team A" : "Team B"));
      
      const handleSave = () => {
          if (name.trim()) {
              updateTeamName(team, name.trim());
          }
          setIsEditing(false);
      };

      if (isEditing) {
          return (
              <div className="flex items-center gap-1 mb-1 justify-center w-full">
                  <input
                      autoFocus
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={handleSave}
                      onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                      className="w-full text-center text-lg font-black uppercase tracking-tight border-b-2 border-orange-500 outline-none bg-transparent"
                  />
              </div>
          );
      }

      return (
          <div className="flex items-center gap-2 mb-1 group cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 px-2 py-1 rounded-lg transition-colors" onClick={() => canEdit && setIsEditing(true)}>
             <span className={cn("text-sm md:text-md font-black uppercase tracking-wider", isWinner ? (team === 'A' ? teamAColorWinner : "text-blue-600") : "text-zinc-500 dark:text-zinc-400")}>
                 {currentName || (team === 'A' ? "Team A" : "Team B")}
             </span>
             {canEdit && <Pencil size={14} className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />}
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-32 transition-colors duration-300">
      {/* Sticky Score Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
                 {game.isFinished ? (
                     <span className="bg-zinc-900 dark:bg-zinc-800 text-white px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Final</span>
                 ) : (
                     <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                         <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Live
                     </span>
                 )}
                 <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{new Date(game.date).toLocaleDateString()}</span>
            </div>
        </div>

        <div className="flex justify-between items-center max-w-md mx-auto">
          <div className="flex flex-col items-center w-1/3">
            <EditableTeamName team="A" currentName={game.teamAName} isWinner={isWinnerA} />
            <span className={cn("text-4xl font-black tracking-tighter", teamAColor)}>{game.scoreA}</span>
            {isWinnerA && <span className={cn("text-[10px] text-white px-2 py-0.5 rounded-full mt-1 font-bold uppercase", teamAColorBg)}>Winner</span>}
          </div>
          
          <div className="text-zinc-300 dark:text-zinc-800 font-black text-xl italic opacity-50">VS</div>
          
          <div className="flex flex-col items-center w-1/3">
            <EditableTeamName team="B" currentName={game.teamBName} isWinner={isWinnerB} />
            <span className="text-4xl font-black text-blue-600 tracking-tighter">{game.scoreB}</span>
            {isWinnerB && <span className="text-[10px] text-white bg-blue-600 px-2 py-0.5 rounded-full mt-1 font-bold uppercase">Winner</span>}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-8">
        {/* Team A Roster */}
        <div>
          <h3 className={cn("text-xs font-bold uppercase tracking-widest mb-3 pl-1", teamAColor)}>{game.teamAName || "Team A"}</h3>
          {game.teamA.map(pid => (
            <PlayerRow key={pid} playerId={pid} team="A" />
          ))}
        </div>

        {/* Team B Roster */}
        <div>
          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 pl-1">{game.teamBName || "Team B"}</h3>
          {game.teamB.map(pid => (
            <PlayerRow key={pid} playerId={pid} team="B" />
          ))}
        </div>

        {canEdit && (
            <div className="space-y-3">
                <Button 
                className="w-full font-bold h-14 text-sm uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white"
                size="lg" 
                onClick={handleFinish}
                >
                <CheckCircle className="mr-2 h-5 w-5" />
                Finish Game
                </Button>

                <button 
                  onClick={async () => {
                      if (confirm("Are you sure you want to DELETE this game forever? This cannot be undone.")) {
                          const { deleteGame } = useStore.getState();
                          await deleteGame(game.id);
                          router.push("/game/new");
                      }
                  }}
                  className="w-full text-center text-xs text-red-400 hover:text-red-600 hover:bg-red-50 py-2 rounded transition-colors"
                >
                    Delete Game
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
