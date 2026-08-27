"use client";

import { useEffect, useState, useRef } from "react";
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
  Check
} from "lucide-react";
import Link from "next/link";

export default function LiveConsolePage() {
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

  // Jugador seleccionado para atribuir la canasta (opcional)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  // Cargar partidos
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

  // Registrar Anotación o Falta
  const handleScoreEvent = async (
    team: "A" | "B",
    pointsDelta: number,
    type: PlayByPlayEvent["type"],
    actionLabel: string
  ) => {
    if (!tournamentId || !selectedGameId || !activeGame) return;

    const currentScoreA = activeGame.scoreA || 0;
    const currentScoreB = activeGame.scoreB || 0;

    const newScoreA = team === "A" ? Math.max(0, currentScoreA + pointsDelta) : currentScoreA;
    const newScoreB = team === "B" ? Math.max(0, currentScoreB + pointsDelta) : currentScoreB;

    const teamId = team === "A" ? activeGame.teamAId : activeGame.teamBId;
    const teamName = team === "A" ? activeGame.teamAName : activeGame.teamBName;

    // Buscar si hay jugador seleccionado
    const player = players.find((p) => p.id === selectedPlayerId);
    const playerText = player ? ` (#${player.number || "-"} ${player.name})` : "";

    const desc = `${actionLabel}${playerText} • Marcador: ${newScoreA} - ${newScoreB}`;

    await recordTournamentScoreEventInDb(
      tournamentId,
      selectedGameId,
      {
        gameId: selectedGameId,
        period,
        gameClock: formatClock(clockSeconds),
        teamId,
        playerId: selectedPlayerId || undefined,
        type,
        description: `${teamName}: ${desc}`,
        scoreA: newScoreA,
        scoreB: newScoreB,
        timestamp: new Date().toISOString(),
        createdBy: "Mesa Técnica Oficial",
      },
      newScoreA,
      newScoreB,
      period,
      formatClock(clockSeconds)
    );

    setSelectedPlayerId(null);
  };

  // Revertir / Eliminar Jugada
  const handleDeleteEvent = async (evt: PlayByPlayEvent) => {
    if (!tournamentId || !selectedGameId || !activeGame) return;
    if (!confirm("¿Deseas revertir esta jugada?")) return;

    // Determinar puntos a revertir
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

    await deletePlayByPlayEventInDb(tournamentId, selectedGameId, evt.id, revertScoreA, revertScoreB);
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
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* Header Consola */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Activity className="text-orange-500" />
              <span>Mesa Técnica Oficial • Live Console</span>
            </h1>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              activeGame?.isFinished
                ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                : "bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse"
            }`}>
              {activeGame?.isFinished ? "Finalizado" : "En Vivo"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Registro oficial de puntuación, faltas y tiempos para actas digitales y transmisión en directo.
          </p>
        </div>

        {/* Selector de Partido */}
        {games.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 hidden sm:inline">Partido:</span>
            <select
              value={selectedGameId || ""}
              onChange={(e) => setSelectedGameId(e.target.value)}
              className="px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-orange-500"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Principal: Marcador, Reloj y Botones de Anotación */}
          <div className="lg:col-span-2 space-y-6">
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
                          period === p ? "bg-orange-500 text-zinc-950 font-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        Q{p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPeriod(5)}
                      className={`px-2 h-7 rounded-lg text-xs font-bold transition ${
                        period === 5 ? "bg-orange-500 text-zinc-950 font-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      OT
                    </button>
                  </div>
                </div>

                {/* Reloj Digital */}
                <div className="flex items-center gap-2">
                  <div className="bg-black px-4 py-1.5 rounded-xl border border-zinc-800 font-mono text-2xl font-black text-orange-400 tracking-wider">
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
              </div>

              {/* Marcadores de Ambos Equipos */}
              <div className="grid grid-cols-2 gap-6 text-center">
                {/* EQUIPO A */}
                <div className="bg-zinc-950/60 p-5 rounded-2xl border border-zinc-800/80 space-y-4">
                  <h3 className="font-bold text-white text-base truncate">{activeGame.teamAName}</h3>
                  <div className="text-6xl font-black font-mono text-orange-400 tracking-tight">
                    {activeGame.scoreA}
                  </div>

                  {/* Botonera de Anotación Equipo A */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => handleScoreEvent("A", 3, "3pt_made", "Triple anotado (+3)")}
                      className="py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-zinc-950 font-black text-sm rounded-xl transition shadow-md shadow-orange-500/20"
                    >
                      +3 Triple
                    </button>
                    <button
                      onClick={() => handleScoreEvent("A", 2, "2pt_made", "Doble anotado (+2)")}
                      className="py-3 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-bold text-sm rounded-xl transition border border-zinc-700"
                    >
                      +2 Doble
                    </button>
                    <button
                      onClick={() => handleScoreEvent("A", 1, "ft_made", "Tiro Libre anotado (+1)")}
                      className="py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 font-bold text-xs rounded-xl transition border border-zinc-700"
                    >
                      +1 Libre
                    </button>
                    <button
                      onClick={() => handleScoreEvent("A", -1, "substitution", "Corrección de marcador (-1)")}
                      className="py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs rounded-xl transition border border-zinc-800"
                      title="Corregir un punto en caso de error"
                    >
                      -1 Corregir
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleScoreEvent("A", 0, "foul_personal", "Falta Personal cometida")}
                      className="py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs rounded-xl border border-red-500/20 transition"
                    >
                      + Falta
                    </button>
                    <button
                      onClick={() => handleScoreEvent("A", 0, "timeout", "Tiempo Fuera solicitado")}
                      className="py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition"
                    >
                      Tiempo
                    </button>
                  </div>
                </div>

                {/* EQUIPO B */}
                <div className="bg-zinc-950/60 p-5 rounded-2xl border border-zinc-800/80 space-y-4">
                  <h3 className="font-bold text-white text-base truncate">{activeGame.teamBName}</h3>
                  <div className="text-6xl font-black font-mono text-blue-400 tracking-tight">
                    {activeGame.scoreB}
                  </div>

                  {/* Botonera de Anotación Equipo B */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => handleScoreEvent("B", 3, "3pt_made", "Triple anotado (+3)")}
                      className="py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-sm rounded-xl transition shadow-md shadow-blue-600/20"
                    >
                      +3 Triple
                    </button>
                    <button
                      onClick={() => handleScoreEvent("B", 2, "2pt_made", "Doble anotado (+2)")}
                      className="py-3 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-bold text-sm rounded-xl transition border border-zinc-700"
                    >
                      +2 Doble
                    </button>
                    <button
                      onClick={() => handleScoreEvent("B", 1, "ft_made", "Tiro Libre anotado (+1)")}
                      className="py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 font-bold text-xs rounded-xl transition border border-zinc-700"
                    >
                      +1 Libre
                    </button>
                    <button
                      onClick={() => handleScoreEvent("B", -1, "substitution", "Corrección de marcador (-1)")}
                      className="py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs rounded-xl transition border border-zinc-800"
                      title="Corregir un punto en caso de error"
                    >
                      -1 Corregir
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleScoreEvent("B", 0, "foul_personal", "Falta Personal cometida")}
                      className="py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs rounded-xl border border-red-500/20 transition"
                    >
                      + Falta
                    </button>
                    <button
                      onClick={() => handleScoreEvent("B", 0, "timeout", "Tiempo Fuera solicitado")}
                      className="py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition"
                    >
                      Tiempo
                    </button>
                  </div>
                </div>
              </div>

              {/* Botón Finalizar Partido Oficial */}
              <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                <span className="text-xs text-zinc-500">
                  {activeGame.isFinished ? "Partido cerrado y oficializado." : "Encuentro en desarrollo."}
                </span>

                {!activeGame.isFinished ? (
                  <button
                    onClick={handleFinishGame}
                    disabled={isFinishing}
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md"
                  >
                    <Check size={16} />
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
          </div>

          {/* Columna Lateral: Feed de Jugadas en Vivo (Play-by-Play) */}
          <div className="space-y-4">
            <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl flex flex-col h-[600px]">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity size={14} className="text-orange-500" />
                  <span>Acta de Jugadas ({events.length})</span>
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">En tiempo real</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {events.map((evt) => {
                  const isTeamA = evt.teamId === activeGame.teamAId;

                  return (
                    <div
                      key={evt.id}
                      className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 text-xs flex items-center justify-between gap-2 hover:border-zinc-700 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isTeamA ? "bg-orange-500" : "bg-blue-500"}`} />
                        <div className="min-w-0">
                          <div className="font-bold text-white leading-tight truncate">{evt.description}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            Q{evt.period} • {evt.gameClock} • {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteEvent(evt)}
                        className="p-1 text-zinc-600 hover:text-red-400 rounded transition shrink-0"
                        title="Revertir esta acción"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}

                {events.length === 0 && (
                  <div className="py-20 text-center text-xs text-zinc-500 italic">
                    Aún no se han registrado jugadas en este partido.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
          <ShieldAlert className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-bold text-white">No hay partidos disponibles</h3>
          <p className="text-xs text-zinc-500 mt-1 mb-4">Primero programa un partido en el calendario para iniciar la mesa técnica.</p>
          <Link
            href={`/tournament/${tournamentId}/games`}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs rounded-xl transition"
          >
            Ir a Programar Partidos
          </Link>
        </div>
      )}
    </div>
  );
}
