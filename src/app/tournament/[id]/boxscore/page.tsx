"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { TournamentGame, TournamentPlayer, TournamentTeam } from "@/types/tournament";
import { 
  subscribeToTournamentGames, 
  subscribeToTournamentPlayers,
  subscribeToTournamentTeams,
  savePostMatchBoxScoreInDb
} from "@/lib/db";
import { 
  FileSpreadsheet, 
  Trophy, 
  Calendar, 
  Users, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Check
} from "lucide-react";
import Link from "next/link";

interface PlayerStatRow {
  points: number;
  fouls: number;
  assists: number;
  rebounds: number;
}

export default function PostMatchBoxScorePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tournamentId = params?.id as string;
  const initialGameId = searchParams.get("gameId");

  const [games, setGames] = useState<TournamentGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(initialGameId);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);

  // Estados del Formulario del Partido
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [roundName, setRoundName] = useState<string>("Jornada 1");
  const [date, setDate] = useState<string>("");
  const [venue, setVenue] = useState<string>("");

  // Mapa de estadísticas por jugador: { [playerId]: { points, fouls, assists, rebounds } }
  const [playerStatsMap, setPlayerStatsMap] = useState<Record<string, PlayerStatRow>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Carga reactiva de datos
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

  const activeGame = games.find((g) => g.id === selectedGameId);

  // Sincronizar el formulario cuando cambia el partido seleccionado
  useEffect(() => {
    if (!activeGame) return;

    setScoreA(activeGame.scoreA || 0);
    setScoreB(activeGame.scoreB || 0);
    setRoundName(activeGame.roundName || "Jornada 1");
    setDate(activeGame.date ? activeGame.date.slice(0, 16) : "");
    setVenue(activeGame.venue || "");

    // Inicializar mapa de estadísticas con las existentes o en 0
    const initialMap: Record<string, PlayerStatRow> = {};
    const gameStats = activeGame.playerStats || {};

    players.forEach((p) => {
      const existing = gameStats[p.id] as any;
      initialMap[p.id] = {
        points: existing?.points || 0,
        fouls: existing?.fouls || existing?.personalFouls || 0,
        assists: existing?.assists || 0,
        rebounds: existing?.rebounds || existing?.totalRebounds || 0,
      };
    });

    setPlayerStatsMap(initialMap);
  }, [activeGame, players]);

  // Manejo de cambios en los inputs de los jugadores
  const handlePlayerStatChange = (playerId: string, field: keyof PlayerStatRow, value: number) => {
    setPlayerStatsMap((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: Math.max(0, isNaN(value) ? 0 : value),
      },
    }));
  };

  const teamAPlayers = useMemo(() => {
    return players.filter((p) => p.teamId === activeGame?.teamAId);
  }, [players, activeGame?.teamAId]);

  const teamBPlayers = useMemo(() => {
    return players.filter((p) => p.teamId === activeGame?.teamBId);
  }, [players, activeGame?.teamBId]);

  // Sumatorias en tiempo real de los puntos cargados en la planilla
  const sumPointsA = useMemo(() => {
    return teamAPlayers.reduce((acc, p) => acc + (playerStatsMap[p.id]?.points || 0), 0);
  }, [teamAPlayers, playerStatsMap]);

  const sumPointsB = useMemo(() => {
    return teamBPlayers.reduce((acc, p) => acc + (playerStatsMap[p.id]?.points || 0), 0);
  }, [teamBPlayers, playerStatsMap]);

  // Guardar Acta Oficial
  const handleSaveBoxScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournamentId || !selectedGameId || !activeGame) return;

    setIsSaving(true);

    try {
      await savePostMatchBoxScoreInDb(tournamentId, selectedGameId, {
        scoreA: Number(scoreA),
        scoreB: Number(scoreB),
        teamAId: activeGame.teamAId,
        teamBId: activeGame.teamBId,
        roundName,
        date: date ? new Date(date).toISOString() : activeGame.date,
        venue,
        playerStats: playerStatsMap,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Error al guardar box score:", err);
      alert("Ocurrió un error al guardar el acta post-partido.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans pb-16">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="text-orange-500" />
              <span>Actas & Box Score Post-Partido</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
              Oficial
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Registra el marcador final y la planilla estadística individual de cada jugador al concluir el encuentro.
          </p>
        </div>

        {/* Selector de Partido */}
        {games.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 hidden sm:inline">Partido:</span>
            <select
              value={selectedGameId || ""}
              onChange={(e) => setSelectedGameId(e.target.value)}
              className="px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-orange-500"
            >
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.teamAName} vs {g.teamBName} ({g.roundName}) {g.isFinished ? "[Finalizado]" : "[Pendiente]"}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeGame ? (
        <form onSubmit={handleSaveBoxScore} className="space-y-6">
          {/* MÓDULO 1: MARCADOR FINAL & DATOS DEL ENCUENTRO */}
          <div className="bg-zinc-900/70 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Trophy size={14} className="text-orange-500" />
                <span>Marcador Final Oficial</span>
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                activeGame.isFinished ? "bg-green-500/15 text-green-400 border border-green-500/30 font-bold" : "bg-zinc-800 text-zinc-400"
              }`}>
                {activeGame.isFinished ? "Acta Guardada / Finalizado" : "En Espera de Resultados"}
              </span>
            </div>

            {/* Puntuación de Equipos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* EQUIPO A */}
              <div className="bg-zinc-950/80 p-5 rounded-2xl border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-zinc-400 truncate">Equipo Local</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                </div>
                <h4 className="text-lg font-black text-white truncate">{activeGame.teamAName}</h4>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Puntos Totales Anotados *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={scoreA}
                    onChange={(e) => setScoreA(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-2xl font-black font-mono text-orange-400 focus:outline-none focus:border-orange-500 text-center"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-zinc-400">
                  <span>Suma planilla jugadores:</span>
                  <span className={`font-bold ${sumPointsA === Number(scoreA) ? "text-green-400" : "text-amber-400"}`}>
                    {sumPointsA} pts {sumPointsA === Number(scoreA) ? "✓" : `(Diferencia: ${Number(scoreA) - sumPointsA})`}
                  </span>
                </div>
              </div>

              {/* EQUIPO B */}
              <div className="bg-zinc-950/80 p-5 rounded-2xl border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-zinc-400 truncate">Equipo Visitante</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                </div>
                <h4 className="text-lg font-black text-white truncate">{activeGame.teamBName}</h4>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Puntos Totales Anotados *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={scoreB}
                    onChange={(e) => setScoreB(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-2xl font-black font-mono text-blue-400 focus:outline-none focus:border-blue-500 text-center"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-zinc-400">
                  <span>Suma planilla jugadores:</span>
                  <span className={`font-bold ${sumPointsB === Number(scoreB) ? "text-green-400" : "text-amber-400"}`}>
                    {sumPointsB} pts {sumPointsB === Number(scoreB) ? "✓" : `(Diferencia: ${Number(scoreB) - sumPointsB})`}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadatos del Partido */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-800">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Fase / Jornada</label>
                <input
                  type="text"
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  placeholder="Ej: Jornada 1"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Fecha y Hora</label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Cancha / Sede</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Ej: Polideportivo Baní"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* MÓDULO 2: PLANILLA ESTADÍSTICA DE JUGADORES (EQUIPO A) */}
          <div className="bg-zinc-900/70 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500" />
                <h3 className="font-bold text-white text-sm">
                  Planilla Individual • {activeGame.teamAName}
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                Total Jugadores: <strong>{teamAPlayers.length}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                    <th className="py-2.5 px-3 w-14 text-center">#</th>
                    <th className="py-2.5 px-3">Jugador</th>
                    <th className="py-2.5 px-3 w-20 text-center">Pos</th>
                    <th className="py-2.5 px-3 w-28 text-center font-bold text-orange-400">Puntos (PTS)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Faltas (FLT)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Asistencias (AST)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Rebotes (REB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {teamAPlayers.map((p) => {
                    const stat = playerStatsMap[p.id] || { points: 0, fouls: 0, assists: 0, rebounds: 0 };

                    return (
                      <tr key={p.id} className="hover:bg-zinc-800/20 transition">
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-orange-400">
                          #{p.number !== undefined ? p.number : "-"}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white">
                          {p.name}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-zinc-400 text-[11px]">
                          {p.position || "JUG"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={stat.points || ""}
                            onChange={(e) => handlePlayerStatChange(p.id, "points", parseInt(e.target.value) || 0)}
                            className="w-20 px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono font-bold text-xs text-center focus:outline-none focus:border-orange-500"
                            placeholder="0"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="5"
                            value={stat.fouls || ""}
                            onChange={(e) => handlePlayerStatChange(p.id, "fouls", parseInt(e.target.value) || 0)}
                            className="w-16 px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 font-mono text-xs text-center focus:outline-none focus:border-orange-500"
                            placeholder="0"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={stat.assists || ""}
                            onChange={(e) => handlePlayerStatChange(p.id, "assists", parseInt(e.target.value) || 0)}
                            className="w-16 px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 font-mono text-xs text-center focus:outline-none focus:border-orange-500"
                            placeholder="0"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={stat.rebounds || ""}
                            onChange={(e) => handlePlayerStatChange(p.id, "rebounds", parseInt(e.target.value) || 0)}
                            className="w-16 px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 font-mono text-xs text-center focus:outline-none focus:border-orange-500"
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {teamAPlayers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500 italic">
                        No hay jugadores registrados en este equipo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MÓDULO 3: PLANILLA ESTADÍSTICA DE JUGADORES (EQUIPO B) */}
          <div className="bg-zinc-900/70 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <h3 className="font-bold text-white text-sm">
                  Planilla Individual • {activeGame.teamBName}
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                Total Jugadores: <strong>{teamBPlayers.length}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                    <th className="py-2.5 px-3 w-14 text-center">#</th>
                    <th className="py-2.5 px-3">Jugador</th>
                    <th className="py-2.5 px-3 w-20 text-center">Pos</th>
                    <th className="py-2.5 px-3 w-28 text-center font-bold text-blue-400">Puntos (PTS)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Faltas (FLT)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Asistencias (AST)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Rebotes (REB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {teamBPlayers.map((p) => {
                    const stat = playerStatsMap[p.id] || { points: 0, fouls: 0, assists: 0, rebounds: 0 };

                    return (
                      <tr key={p.id} className="hover:bg-zinc-800/20 transition">
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-400">
                          #{p.number !== undefined ? p.number : "-"}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white">
                          {p.name}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-zinc-400 text-[11px]">
                          {p.position || "JUG"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={stat.points || ""}
                            onChange={(e) => handlePlayerStatChange(p.id, "points", parseInt(e.target.value) || 0)}
                            className="w-20 px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono font-bold text-xs text-center focus:outline-none focus:border-blue-500"
                            placeholder="0"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="5"
                            value={stat.fouls || ""}
                            onChange={(e) => handlePlayerStatChange(p.id, "fouls", parseInt(e.target.value) || 0)}
                            className="w-16 px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 font-mono text-xs text-center focus:outline-none focus:border-blue-500"
                            placeholder="0"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={stat.assists || ""}
                            onChange={(e) => handlePlayerStatChange(p.id, "assists", parseInt(e.target.value) || 0)}
                            className="w-16 px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 font-mono text-xs text-center focus:outline-none focus:border-blue-500"
                            placeholder="0"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={stat.rebounds || ""}
                            onChange={(e) => handlePlayerStatChange(p.id, "rebounds", parseInt(e.target.value) || 0)}
                            className="w-16 px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 font-mono text-xs text-center focus:outline-none focus:border-blue-500"
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {teamBPlayers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500 italic">
                        No hay jugadores registrados en este equipo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* BOTÓN PRINCIPAL DE GUARDADO */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl sticky bottom-4 shadow-2xl backdrop-blur-md">
            <div className="text-xs text-zinc-400">
              Al guardar, se oficializará el resultado y se actualizarán automáticamente la <strong>Tabla de Posiciones</strong> y los <strong>Líderes de Estadísticas</strong>.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {saveSuccess && (
                <span className="text-xs font-bold text-green-400 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 size={16} />
                  <span>¡Acta y estadísticas guardadas con éxito!</span>
                </span>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-8 py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-50 text-zinc-950 font-black text-xs rounded-xl transition shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
              >
                <Save size={15} />
                <span>{isSaving ? "Guardando Acta y Estadísticas..." : "Guardar Acta Oficial"}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="py-20 text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
          <AlertCircle className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-bold text-white">No hay partidos registrados</h3>
          <p className="text-xs text-zinc-500 mt-1 mb-4">Primero crea partidos en el calendario para poder cargar sus actas.</p>
          <Link
            href={`/tournament/${tournamentId}/games`}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs rounded-xl transition"
          >
            Ir a Partidos & Calendario
          </Link>
        </div>
      )}
    </div>
  );
}
