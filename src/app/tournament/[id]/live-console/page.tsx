"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { PlayByPlayEvent, TournamentGame, TournamentPlayer, TournamentTeam } from "@/types/tournament";
import { 
  subscribeToTournamentGames, 
  recordTournamentScoreEventInDb, 
  subscribeToPlayByPlay,
  subscribeToTournamentPlayers,
  subscribeToTournamentTeams,
  finishTournamentGameInDb,
  deletePlayByPlayEventInDb,
  updateTournamentGameInDb
} from "@/lib/db";
import { 
  Activity, 
  Clock, 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  ShieldAlert, 
  ArrowLeft,
  Trash2,
  Users,
  Minus,
  Plus,
  AlertTriangle,
  RotateCcw,
  Check,
  Award,
  Zap,
  Loader2
} from "lucide-react";
import Link from "next/link";

export default function LiveConsolePage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-zinc-500 flex items-center justify-center gap-2">
        <Loader2 className="animate-spin text-emerald-500" size={18} />
        <span>Cargando mesa técnica en vivo...</span>
      </div>
    }>
      <LiveConsoleContent />
    </Suspense>
  );
}

function LiveConsoleContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tournamentId = params?.id as string;
  const initialGameId = searchParams.get("gameId");

  const [games, setGames] = useState<TournamentGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(initialGameId);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [events, setEvents] = useState<PlayByPlayEvent[]>([]);

  // Reloj de Juego
  const [clockSeconds, setClockSeconds] = useState(600); // 10:00 por defecto
  const [isRunning, setIsRunning] = useState(false);
  const [period, setPeriod] = useState(1);

  const [isFinishing, setIsFinishing] = useState(false);

  // Cargar partidos, jugadores y equipos
  useEffect(() => {
    if (!tournamentId) return;

    const unsubGames = subscribeToTournamentGames(tournamentId, (gList) => {
      setGames(gList);
      if (gList.length > 0 && !selectedGameId) {
        setSelectedGameId(initialGameId || gList[0].id);
      }
    });

    const unsubPlayers = subscribeToTournamentPlayers(tournamentId, (pList) => {
      setPlayers(pList);
    });

    const unsubTeams = subscribeToTournamentTeams(tournamentId, (tList) => {
      setTeams(tList);
    });

    return () => {
      unsubGames();
      unsubPlayers();
      unsubTeams();
    };
  }, [tournamentId, selectedGameId, initialGameId]);

  // Cargar eventos del partido seleccionado
  useEffect(() => {
    if (!tournamentId || !selectedGameId) return;
    const unsub = subscribeToPlayByPlay(tournamentId, selectedGameId, (evtList) => {
      setEvents(evtList);
    });
    return () => unsub();
  }, [tournamentId, selectedGameId]);

  // Manejo del Reloj Digital
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && clockSeconds > 0) {
      interval = setInterval(() => {
        setClockSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, clockSeconds]);

  const formatClock = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const activeGame = games.find((g) => g.id === selectedGameId);

  // Registrar Anotación o Falta para un Jugador o para el Equipo
  const handleScoreEvent = async (
    team: "A" | "B",
    pointsDelta: number,
    type: PlayByPlayEvent["type"],
    actionLabel: string,
    player?: TournamentPlayer
  ) => {
    if (!tournamentId || !selectedGameId || !activeGame) return;

    const currentScoreA = activeGame.scoreA || 0;
    const currentScoreB = activeGame.scoreB || 0;

    const newScoreA = team === "A" ? Math.max(0, currentScoreA + pointsDelta) : currentScoreA;
    const newScoreB = team === "B" ? Math.max(0, currentScoreB + pointsDelta) : currentScoreB;

    const teamId = team === "A" ? activeGame.teamAId : activeGame.teamBId;
    const teamName = team === "A" ? activeGame.teamAName : activeGame.teamBName;

    const playerText = player ? ` (#${player.number !== undefined ? player.number : "-"} ${player.name})` : "";
    const desc = `${actionLabel}${playerText} • Marcador: ${newScoreA} - ${newScoreB}`;

    // Actualizar playerStats del partido
    const currentStats = activeGame.playerStats || {};
    let updatedPlayerStats = { ...currentStats };

    if (player) {
      const pStat = updatedPlayerStats[player.id] || { points: 0, fouls: 0, assists: 0 };
      const currentPts = pStat.points || 0;
      const currentFouls = pStat.fouls || 0;

      updatedPlayerStats[player.id] = {
        ...pStat,
        points: Math.max(0, currentPts + pointsDelta),
        fouls: type === "foul_personal" ? currentFouls + 1 : currentFouls,
      };
    }

    const eventPayload: any = {
      gameId: selectedGameId,
      period,
      gameClock: formatClock(clockSeconds),
      teamId,
      type,
      description: `${teamName}: ${desc}`,
      scoreA: newScoreA,
      scoreB: newScoreB,
      timestamp: new Date().toISOString(),
      createdBy: "Mesa Técnica Oficial",
    };

    if (player) {
      eventPayload.playerId = player.id;
    }

    try {
      await recordTournamentScoreEventInDb(
        tournamentId,
        selectedGameId,
        eventPayload,
        newScoreA,
        newScoreB,
        period,
        formatClock(clockSeconds),
        updatedPlayerStats
      );
    } catch (err) {
      console.error("Error al registrar anotación en mesa técnica:", err);
      alert("Hubo un problema al guardar la anotación en Firestore.");
    }
  };

  // Revertir / Eliminar Jugada
  const handleDeleteEvent = async (evt: PlayByPlayEvent) => {
    if (!tournamentId || !selectedGameId || !activeGame) return;
    if (!confirm("¿Deseas revertir esta jugada?")) return;

    let deltaA = 0;
    let deltaB = 0;
    if (evt.teamId === activeGame.teamAId) {
      if (evt.type === "3pt_made") deltaA = 3;
      if (evt.type === "2pt_made") deltaA = 2;
      if (evt.type === "ft_made") deltaA = 1;
    } else {
      if (evt.type === "3pt_made") deltaB = 3;
      if (evt.type === "2pt_made") deltaB = 2;
      if (evt.type === "ft_made") deltaB = 1;
    }

    const revertScoreA = Math.max(0, activeGame.scoreA - deltaA);
    const revertScoreB = Math.max(0, activeGame.scoreB - deltaB);

    // Revertir stats del jugador si aplica
    let updatedPlayerStats = activeGame.playerStats;
    if (evt.playerId && activeGame.playerStats?.[evt.playerId]) {
      const pStat = activeGame.playerStats[evt.playerId];
      const ptsToSubtract = deltaA > 0 ? deltaA : deltaB;
      updatedPlayerStats = {
        ...activeGame.playerStats,
        [evt.playerId]: {
          ...pStat,
          points: Math.max(0, (pStat.points || 0) - ptsToSubtract),
          fouls: evt.type === "foul_personal" ? Math.max(0, (pStat.fouls || 0) - 1) : (pStat.fouls || 0),
        }
      };
    }

    await deletePlayByPlayEventInDb(tournamentId, selectedGameId, evt.id, revertScoreA, revertScoreB);
    if (updatedPlayerStats) {
      await updateTournamentGameInDb(tournamentId, selectedGameId, { playerStats: updatedPlayerStats });
    }
  };

  // Finalizar Partido Oficial
  const handleFinishGame = async () => {
    if (!tournamentId || !selectedGameId || !activeGame) return;
    if (!confirm(`¿Confirmar finalización del partido?\nResultado Oficial: ${activeGame.teamAName} ${activeGame.scoreA} - ${activeGame.scoreB} ${activeGame.teamBName}`)) {
      return;
    }

    setIsFinishing(true);
    await finishTournamentGameInDb(
      tournamentId,
      selectedGameId,
      activeGame.teamAId,
      activeGame.teamBId,
      activeGame.scoreA,
      activeGame.scoreB
    );
    setIsFinishing(false);
    alert("¡Partido finalizado con éxito! La tabla de posiciones ha sido actualizada.");
  };

  const teamAPlayers = players.filter((p) => p.teamId === activeGame?.teamAId);
  const teamBPlayers = players.filter((p) => p.teamId === activeGame?.teamBId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header Consola */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Activity className="text-emerald-500" />
              <span>Mesa Técnica Oficial • Live Console</span>
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              activeGame?.isFinished
                ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                : "bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse"
            }`}>
              {activeGame?.isFinished ? "Finalizado" : "En Vivo"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Haz clic en los botones de cada jugador para registrar automáticamente sus puntos, triples, dobles y faltas.
          </p>
        </div>

        {/* Selector de Partido */}
        {games.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 hidden sm:inline">Partido:</span>
            <select
              value={selectedGameId || ""}
              onChange={(e) => setSelectedGameId(e.target.value)}
              className="px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
            >
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.teamAName} vs {g.teamBName} ({g.roundName}) {g.isFinished ? "[Final]" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeGame ? (
        <div className="space-y-6">
          {/* Tablero Principal & Reloj Digital */}
          <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-6">
            {/* Barra de Control de Periodo y Reloj */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Periodo:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                        period === p ? "bg-emerald-600 text-white font-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      Q{p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPeriod(5)}
                    className={`px-2 h-7 rounded-lg text-xs font-bold transition ${
                      period === 5 ? "bg-emerald-600 text-white font-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    OT
                  </button>
                </div>
              </div>

              {/* Reloj Digital */}
              <div className="flex items-center gap-2">
                <div className="bg-black px-4 py-1.5 rounded-xl border border-zinc-800 font-mono text-2xl font-black text-emerald-400 tracking-wider">
                  {formatClock(clockSeconds)}
                </div>
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`p-2 rounded-xl transition ${
                    isRunning ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30"
                  }`}
                  title={isRunning ? "Pausar Reloj" : "Iniciar Reloj"}
                >
                  {isRunning ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button
                  onClick={() => {
                    setIsRunning(false);
                    setClockSeconds(600);
                  }}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl transition"
                  title="Reiniciar a 10:00"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              {/* Botón Finalizar Partido Oficial */}
              <div>
                {!activeGame.isFinished ? (
                  <button
                    onClick={handleFinishGame}
                    disabled={isFinishing}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md"
                  >
                    <Check size={15} />
                    <span>{isFinishing ? "Cerrando acta..." : "Finalizar Partido Oficial"}</span>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      if (!selectedGameId) return;
                      if (confirm("¿Reabrir este partido para continuar anotando?")) {
                        await updateTournamentGameInDb(tournamentId, selectedGameId, { isFinished: false, status: "live" });
                      }
                    }}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition"
                  >
                    Reabrir Partido
                  </button>
                )}
              </div>
            </div>

            {/* Marcadores Superiores */}
            <div className="grid grid-cols-2 gap-6 text-center">
              <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider truncate mb-1">
                  {activeGame.teamAName}
                </div>
                <div className="text-5xl font-black font-mono text-emerald-400 tracking-tight">
                  {activeGame.scoreA}
                </div>
              </div>

              <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider truncate mb-1">
                  {activeGame.teamBName}
                </div>
                <div className="text-5xl font-black font-mono text-blue-400 tracking-tight">
                  {activeGame.scoreB}
                </div>
              </div>
            </div>
          </div>

          {/* LISTADOS DE JUGADORES CON BOTONERA DE ANOTACIÓN AUTOMÁTICA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ROSTER EQUIPO A */}
            <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <h3 className="font-black text-white text-base truncate">{activeGame.teamAName}</h3>
                </div>
                <span className="text-xs font-bold font-mono text-emerald-400">{activeGame.scoreA} PTS</span>
              </div>

              {/* Lista de Jugadores Equipo A */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {teamAPlayers.map((p) => {
                  const stat = activeGame.playerStats?.[p.id];
                  const points = stat?.points || 0;
                  const fouls = stat?.fouls || 0;

                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 flex items-center justify-between gap-3 hover:border-zinc-700 transition"
                    >
                      {/* Info Jugador */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-black text-xs flex items-center justify-center shrink-0">
                          #{p.number !== undefined ? p.number : "-"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white text-xs truncate leading-tight">{p.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                            <span className="text-zinc-500">{p.position || "JUG"}</span>
                            <span className="text-emerald-400 font-bold">{points} pts</span>
                            <span className={`${fouls >= 5 ? "text-red-400 font-bold animate-pulse" : fouls >= 4 ? "text-amber-400" : "text-zinc-500"}`}>
                              {fouls} flt
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botones de Anotación Rápida por Jugador */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleScoreEvent("A", 3, "3pt_made", "Triple anotado (+3)", p)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs rounded-lg transition shadow-sm"
                          title={`+3 Triple para ${p.name}`}
                        >
                          +3
                        </button>
                        <button
                          onClick={() => handleScoreEvent("A", 2, "2pt_made", "Doble anotado (+2)", p)}
                          className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-bold text-xs rounded-lg transition border border-zinc-700"
                          title={`+2 Doble para ${p.name}`}
                        >
                          +2
                        </button>
                        <button
                          onClick={() => handleScoreEvent("A", 1, "ft_made", "Tiro Libre anotado (+1)", p)}
                          className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 font-bold text-xs rounded-lg transition border border-zinc-700"
                          title={`+1 Libre para ${p.name}`}
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleScoreEvent("A", 0, "foul_personal", "Falta Personal cometida", p)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-bold transition border ${
                            fouls >= 4 
                              ? "bg-red-500/20 text-red-400 border-red-500/40" 
                              : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800"
                          }`}
                          title={`Registrar falta para ${p.name}`}
                        >
                          +F
                        </button>
                      </div>
                    </div>
                  );
                })}

                {teamAPlayers.length === 0 && (
                  <div className="py-8 text-center text-xs text-zinc-500 italic bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800">
                    No hay jugadores registrados en {activeGame.teamAName}.
                  </div>
                )}
              </div>

              {/* Botones de Anotación de Equipo General */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase text-zinc-500">Puntos de Equipo / General:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleScoreEvent("A", 3, "3pt_made", "Triple de equipo (+3)")}
                    className="px-2 py-1 bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-300 font-bold text-[11px] rounded-lg transition"
                  >
                    +3
                  </button>
                  <button
                    onClick={() => handleScoreEvent("A", 2, "2pt_made", "Doble de equipo (+2)")}
                    className="px-2 py-1 bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-300 font-bold text-[11px] rounded-lg transition"
                  >
                    +2
                  </button>
                  <button
                    onClick={() => handleScoreEvent("A", 1, "ft_made", "Tiro Libre de equipo (+1)")}
                    className="px-2 py-1 bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-300 font-bold text-[11px] rounded-lg transition"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => handleScoreEvent("A", -1, "substitution", "Corrección de marcador (-1)")}
                    className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white font-bold text-[11px] rounded-lg transition border border-zinc-800"
                    title="Restar 1 punto por corrección"
                  >
                    -1
                  </button>
                </div>
              </div>
            </div>

            {/* ROSTER EQUIPO B */}
            <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <h3 className="font-black text-white text-base truncate">{activeGame.teamBName}</h3>
                </div>
                <span className="text-xs font-bold font-mono text-blue-400">{activeGame.scoreB} PTS</span>
              </div>

              {/* Lista de Jugadores Equipo B */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {teamBPlayers.map((p) => {
                  const stat = activeGame.playerStats?.[p.id];
                  const points = stat?.points || 0;
                  const fouls = stat?.fouls || 0;

                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 flex items-center justify-between gap-3 hover:border-zinc-700 transition"
                    >
                      {/* Info Jugador */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono font-black text-xs flex items-center justify-center shrink-0">
                          #{p.number !== undefined ? p.number : "-"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white text-xs truncate leading-tight">{p.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                            <span className="text-zinc-500">{p.position || "JUG"}</span>
                            <span className="text-blue-400 font-bold">{points} pts</span>
                            <span className={`${fouls >= 5 ? "text-red-400 font-bold animate-pulse" : fouls >= 4 ? "text-amber-400" : "text-zinc-500"}`}>
                              {fouls} flt
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botones de Anotación Rápida por Jugador */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleScoreEvent("B", 3, "3pt_made", "Triple anotado (+3)", p)}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs rounded-lg transition shadow-sm"
                          title={`+3 Triple para ${p.name}`}
                        >
                          +3
                        </button>
                        <button
                          onClick={() => handleScoreEvent("B", 2, "2pt_made", "Doble anotado (+2)", p)}
                          className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-bold text-xs rounded-lg transition border border-zinc-700"
                          title={`+2 Doble para ${p.name}`}
                        >
                          +2
                        </button>
                        <button
                          onClick={() => handleScoreEvent("B", 1, "ft_made", "Tiro Libre anotado (+1)", p)}
                          className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 font-bold text-xs rounded-lg transition border border-zinc-700"
                          title={`+1 Libre para ${p.name}`}
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleScoreEvent("B", 0, "foul_personal", "Falta Personal cometida", p)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-bold transition border ${
                            fouls >= 4 
                              ? "bg-red-500/20 text-red-400 border-red-500/40" 
                              : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800"
                          }`}
                          title={`Registrar falta para ${p.name}`}
                        >
                          +F
                        </button>
                      </div>
                    </div>
                  );
                })}

                {teamBPlayers.length === 0 && (
                  <div className="py-8 text-center text-xs text-zinc-500 italic bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800">
                    No hay jugadores registrados en {activeGame.teamBName}.
                  </div>
                )}
              </div>

              {/* Botones de Anotación de Equipo General */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase text-zinc-500">Puntos de Equipo / General:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleScoreEvent("B", 3, "3pt_made", "Triple de equipo (+3)")}
                    className="px-2 py-1 bg-zinc-800 hover:bg-blue-600 hover:text-white text-zinc-300 font-bold text-[11px] rounded-lg transition"
                  >
                    +3
                  </button>
                  <button
                    onClick={() => handleScoreEvent("B", 2, "2pt_made", "Doble de equipo (+2)")}
                    className="px-2 py-1 bg-zinc-800 hover:bg-blue-600 hover:text-white text-zinc-300 font-bold text-[11px] rounded-lg transition"
                  >
                    +2
                  </button>
                  <button
                    onClick={() => handleScoreEvent("B", 1, "ft_made", "Tiro Libre de equipo (+1)")}
                    className="px-2 py-1 bg-zinc-800 hover:bg-blue-600 hover:text-white text-zinc-300 font-bold text-[11px] rounded-lg transition"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => handleScoreEvent("B", -1, "substitution", "Corrección de marcador (-1)")}
                    className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white font-bold text-[11px] rounded-lg transition border border-zinc-800"
                    title="Restar 1 punto por corrección"
                  >
                    -1
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* HISTORIAL PLAY-BY-PLAY (ACTA EN VIVO) */}
          <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-emerald-500" />
                <span>Acta de Jugadas en Directo ({events.length})</span>
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">Sincronización instantánea</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {events.map((evt) => {
                const isTeamA = evt.teamId === activeGame.teamAId;

                return (
                  <div
                    key={evt.id}
                    className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 text-xs flex items-center justify-between gap-2 hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isTeamA ? "bg-emerald-500" : "bg-blue-500"}`} />
                      <div className="min-w-0">
                        <div className="font-bold text-white leading-tight truncate">{evt.description}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          Q{evt.period} • {evt.gameClock} • {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteEvent(evt)}
                      className="p-1 text-zinc-600 hover:text-red-400 rounded transition shrink-0"
                      title="Revertir esta jugada"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}

              {events.length === 0 && (
                <div className="col-span-full py-12 text-center text-xs text-zinc-500 italic">
                  Aún no se han registrado jugadas en este partido. Presiona los botones de los jugadores para comenzar.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
          <ShieldAlert className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-bold text-white">No hay partidos seleccionados</h3>
          <p className="text-xs text-zinc-500 mt-1 mb-4">Selecciona un partido del menú superior o programa uno nuevo.</p>
          <Link
            href={`/tournament/${tournamentId}/games`}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
          >
            Ir al Calendario de Partidos
          </Link>
        </div>
      )}
    </div>
  );
}
