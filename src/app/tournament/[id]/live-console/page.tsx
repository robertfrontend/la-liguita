"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PlayByPlayEvent, TournamentGame } from "@/types/tournament";
import { subscribeToTournamentGames, addPlayByPlayEventInDb, subscribeToPlayByPlay } from "@/lib/db";
import { Activity, Clock, Play, Pause, RefreshCw, Send, CheckCircle, ShieldAlert } from "lucide-react";

export default function LiveConsolePage() {
  const params = useParams();
  const tournamentId = params?.id as string;

  const [games, setGames] = useState<TournamentGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [events, setEvents] = useState<PlayByPlayEvent[]>([]);
  const [clock, setClock] = useState("10:00");
  const [isRunning, setIsRunning] = useState(false);
  const [period, setPeriod] = useState(1);

  // Cargar partidos
  useEffect(() => {
    if (!tournamentId) return;
    const unsub = subscribeToTournamentGames(tournamentId, (gList) => {
      setGames(gList);
      if (gList.length > 0 && !selectedGameId) {
        setSelectedGameId(gList[0].id);
      }
    });
    return () => unsub();
  }, [tournamentId, selectedGameId]);

  // Cargar eventos play-by-play
  useEffect(() => {
    if (!tournamentId || !selectedGameId) return;
    const unsub = subscribeToPlayByPlay(tournamentId, selectedGameId, setEvents);
    return () => unsub();
  }, [tournamentId, selectedGameId]);

  const activeGame = games.find((g) => g.id === selectedGameId);

  const handleRegisterEvent = async (team: "A" | "B", type: PlayByPlayEvent["type"], desc: string) => {
    if (!tournamentId || !selectedGameId || !activeGame) return;

    const deltaA = type === "3pt_made" ? 3 : type === "2pt_made" ? 2 : type === "ft_made" ? 1 : 0;
    const deltaB = type === "3pt_made" ? 3 : type === "2pt_made" ? 2 : type === "ft_made" ? 1 : 0;

    const teamId = team === "A" ? activeGame.teamAId : activeGame.teamBId;
    const teamName = team === "A" ? activeGame.teamAName : activeGame.teamBName;

    await addPlayByPlayEventInDb(tournamentId, selectedGameId, {
      gameId: selectedGameId,
      period,
      gameClock: clock,
      teamId,
      type,
      description: `${teamName}: ${desc}`,
      scoreA: activeGame.scoreA + (team === "A" ? deltaA : 0),
      scoreB: activeGame.scoreB + (team === "B" ? deltaB : 0),
      timestamp: new Date().toISOString(),
      createdBy: "Mesa Oficial",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Consola */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Activity className="text-orange-500" />
              Consola de Mesa Técnica Live (Play-by-Play)
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
              EN VIVO
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Registro oficial de jugada por jugada para transmisión en vivo y actas digitales de la liga.
          </p>
        </div>

        {/* Selector de Partido */}
        {games.length > 0 && (
          <select
            value={selectedGameId || ""}
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-orange-500"
          >
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.teamAName} vs {g.teamBName} ({g.roundName})
              </option>
            ))}
          </select>
        )}
      </div>

      {activeGame ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de Marcador & Acciones Rápidas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score & Reloj */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase">Periodo:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((p) => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold ${
                          period === p ? "bg-orange-500 text-zinc-950 font-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        Q{p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reloj Digital */}
                <div className="flex items-center gap-3">
                  <div className="bg-black/60 px-4 py-1.5 rounded-lg border border-zinc-800 font-mono text-2xl font-black text-orange-400 tracking-wider">
                    {clock}
                  </div>
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    className={`p-2 rounded-lg ${
                      isRunning ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {isRunning ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                </div>
              </div>

              {/* Marcadores */}
              <div className="grid grid-cols-2 gap-8 text-center">
                {/* Equipo A */}
                <div className="space-y-4">
                  <h3 className="font-bold text-white text-lg truncate">{activeGame.teamAName}</h3>
                  <div className="text-6xl font-black font-mono text-orange-400 tracking-tighter">
                    {activeGame.scoreA}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRegisterEvent("A", "3pt_made", "Triple anotado (+3) 🎯")}
                      className="py-2.5 bg-zinc-800 hover:bg-orange-500 hover:text-zinc-950 rounded-xl font-bold text-xs text-white transition border border-zinc-700/60"
                    >
                      +3 Triple
                    </button>
                    <button
                      onClick={() => handleRegisterEvent("A", "2pt_made", "Doble anotado (+2) 🏀")}
                      className="py-2.5 bg-zinc-800 hover:bg-orange-500 hover:text-zinc-950 rounded-xl font-bold text-xs text-white transition border border-zinc-700/60"
                    >
                      +2 Doble
                    </button>
                    <button
                      onClick={() => handleRegisterEvent("A", "ft_made", "Tiro Libre anotado (+1)")}
                      className="py-2.5 bg-zinc-800 hover:bg-orange-500 hover:text-zinc-950 rounded-xl font-bold text-xs text-white transition border border-zinc-700/60"
                    >
                      +1 Tiro Libre
                    </button>
                    <button
                      onClick={() => handleRegisterEvent("A", "foul_personal", "Falta personal señalada ⚠️")}
                      className="py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold text-xs border border-red-500/30 transition"
                    >
                      +1 Falta
                    </button>
                  </div>
                </div>

                {/* Equipo B */}
                <div className="space-y-4">
                  <h3 className="font-bold text-white text-lg truncate">{activeGame.teamBName}</h3>
                  <div className="text-6xl font-black font-mono text-blue-400 tracking-tighter">
                    {activeGame.scoreB}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRegisterEvent("B", "3pt_made", "Triple anotado (+3) 🎯")}
                      className="py-2.5 bg-zinc-800 hover:bg-blue-500 hover:text-white rounded-xl font-bold text-xs text-white transition border border-zinc-700/60"
                    >
                      +3 Triple
                    </button>
                    <button
                      onClick={() => handleRegisterEvent("B", "2pt_made", "Doble anotado (+2) 🏀")}
                      className="py-2.5 bg-zinc-800 hover:bg-blue-500 hover:text-white rounded-xl font-bold text-xs text-white transition border border-zinc-700/60"
                    >
                      +2 Doble
                    </button>
                    <button
                      onClick={() => handleRegisterEvent("B", "ft_made", "Tiro Libre anotado (+1)")}
                      className="py-2.5 bg-zinc-800 hover:bg-blue-500 hover:text-white rounded-xl font-bold text-xs text-white transition border border-zinc-700/60"
                    >
                      +1 Tiro Libre
                    </button>
                    <button
                      onClick={() => handleRegisterEvent("B", "foul_personal", "Falta personal señalada ⚠️")}
                      className="py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold text-xs border border-red-500/30 transition"
                    >
                      +1 Falta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feed de Jugadas en Vivo (Play-by-Play Feed) */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl flex flex-col h-[520px]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-sm">Registro Cronológico (Feed)</h3>
              <span className="text-[10px] text-zinc-500 font-mono">{events.length} Eventos</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 text-xs space-y-1"
                >
                  <div className="flex justify-between items-center text-[10px] text-zinc-400">
                    <span className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
                      Q{ev.period} {ev.gameClock}
                    </span>
                    <span className="font-mono font-bold text-orange-400">
                      {ev.scoreA} - {ev.scoreB}
                    </span>
                  </div>
                  <p className="font-semibold text-zinc-200">{ev.description}</p>
                </div>
              ))}

              {events.length === 0 && (
                <div className="h-full flex items-center justify-center text-center text-xs text-zinc-500">
                  Sin eventos registrados aún. Presiona los botones de acción para comenzar el acta en vivo.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-zinc-500 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
          No hay partidos disponibles para transmitir en vivo.
        </div>
      )}
    </div>
  );
}
