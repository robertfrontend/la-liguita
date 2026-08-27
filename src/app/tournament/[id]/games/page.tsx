"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TournamentGame, Tournament, TournamentTeam } from "@/types/tournament";
import { 
  subscribeToTournamentGames, 
  subscribeToTournament, 
  subscribeToTournamentTeams,
  createTournamentGameInDb 
} from "@/lib/db";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Calendar, 
  Plus, 
  Play, 
  Trophy, 
  Users, 
  ShieldAlert, 
  ArrowRight, 
  Clock, 
  MapPin, 
  Trash2, 
  Zap, 
  CheckCircle2, 
  Flame,
  Filter
} from "lucide-react";
import Link from "next/link";

export default function TournamentGamesPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params?.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [games, setGames] = useState<TournamentGame[]>([]);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Formulario
  const [isCreating, setIsCreating] = useState(false);
  const [createMode, setCreateMode] = useState<"scheduled" | "now">("scheduled");
  const [selectedTeamAId, setSelectedTeamAId] = useState("");
  const [selectedTeamBId, setSelectedTeamBId] = useState("");
  const [roundName, setRoundName] = useState("Jornada Regular");
  const [scheduledDateTime, setScheduledDateTime] = useState(() => {
    const now = new Date();
    now.setHours(19, 0, 0, 0); // Por defecto a las 7:00 PM
    return now.toISOString().slice(0, 16);
  });
  const [venue, setVenue] = useState("");

  // Filtro de partidos en la vista
  const [filterTab, setFilterTab] = useState<"all" | "scheduled" | "live" | "finished">("all");

  useEffect(() => {
    if (!tournamentId) return;

    const unsubTournament = subscribeToTournament(tournamentId, (t) => {
      setTournament(t);
    });

    const unsubTeams = subscribeToTournamentTeams(tournamentId, (tList) => {
      setTeams(tList);
      if (tList.length >= 2) {
        setSelectedTeamAId(tList[0].id);
        setSelectedTeamBId(tList[1].id);
      }
    });

    const unsubGames = subscribeToTournamentGames(tournamentId, (g) => {
      setGames(g);
      setLoading(false);
    });

    return () => {
      unsubTournament();
      unsubTeams();
      unsubGames();
    };
  }, [tournamentId]);

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament) return;

    if (teams.length < 2) {
      alert("Debes agregar al menos 2 equipos al torneo antes de programar un partido.");
      return;
    }

    if (selectedTeamAId === selectedTeamBId) {
      alert("Por favor selecciona dos equipos diferentes para el encuentro.");
      return;
    }

    const tA = teams.find(t => t.id === selectedTeamAId);
    const tB = teams.find(t => t.id === selectedTeamBId);

    const gameDate = createMode === "now" 
      ? new Date().toISOString() 
      : new Date(scheduledDateTime).toISOString();

    const newGameData = {
      tournamentId,
      roundName: roundName.trim() || "Jornada Regular",
      date: gameDate,
      venue: venue.trim() || undefined,
      teamAId: selectedTeamAId,
      teamBId: selectedTeamBId,
      teamAName: tA ? tA.name : "Equipo A",
      teamBName: tB ? tB.name : "Equipo B",
      scoreA: 0,
      scoreB: 0,
      isFinished: false,
      status: (createMode === "now" ? "live" : "scheduled") as 'scheduled' | 'live' | 'finished',
      sport: tournament.sport,
      playerStats: {},
    };

    const createdGame = await createTournamentGameInDb(tournamentId, newGameData);

    setIsCreating(false);

    // Si se eligió "Jugar Ahora Mismo", llevar directo a la consola de juego
    if (createMode === "now" && createdGame?.id) {
      if (tournament.tier === "pro") {
        router.push(`/tournament/${tournamentId}/live-console`);
      } else {
        router.push(`/game/${createdGame.id}`);
      }
    }
  };

  const handleDeleteGame = async (gameId: string, teamA: string, teamB: string) => {
    if (confirm(`¿Eliminar el partido "${teamA} vs ${teamB}" del calendario?`)) {
      await deleteDoc(doc(db, "tournaments", tournamentId, "games", gameId));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Cargando calendario de partidos...</div>;
  }

  const isPro = tournament?.tier === "pro";

  // Filtrado de partidos
  const filteredGames = games.filter((g) => {
    const isFinished = g.isFinished;
    const isLive = !isFinished && (g.scoreA > 0 || g.scoreB > 0 || g.status === "live");
    const isScheduled = !isFinished && !isLive;

    if (filterTab === "scheduled") return isScheduled;
    if (filterTab === "live") return isLive;
    if (filterTab === "finished") return isFinished;
    return true;
  });

  const scheduledCount = games.filter(g => !g.isFinished && !(g.scoreA > 0 || g.scoreB > 0 || g.status === "live")).length;
  const liveCount = games.filter(g => !g.isFinished && (g.scoreA > 0 || g.scoreB > 0 || g.status === "live")).length;
  const finishedCount = games.filter(g => g.isFinished).length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Calendar className="text-orange-500" />
              <span>Calendario & Partidos Oficiales</span>
            </h1>
            {isPro && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500/10 text-orange-400 border border-orange-500/20">
                PRO FIBA Live
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Programa fechas y horarios de cada jornada o inicia partidos en vivo de inmediato.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/tournament/${tournamentId}/teams`}
            className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-zinc-700"
          >
            <Users size={15} />
            <span>Equipos ({teams.length})</span>
          </Link>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs rounded-xl transition shadow-lg shadow-orange-500/20"
          >
            <Plus size={16} />
            <span>Programar Partido</span>
          </button>
        </div>
      </div>

      {/* Aviso si faltan equipos */}
      {teams.length < 2 && !isCreating && (
        <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h4 className="font-bold text-amber-300 text-sm">Paso Previo: Agrega los Equipos del Torneo</h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Para programar partidos oficiales, primero debes registrar al menos 2 equipos en este torneo.
              </p>
            </div>
          </div>

          <Link
            href={`/tournament/${tournamentId}/teams`}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1 shrink-0"
          >
            <span>Ir a Equipos</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Formulario de Programación de Partido */}
      {isCreating && (
        <form onSubmit={handleCreateGame} className="bg-zinc-900 p-6 rounded-2xl border border-orange-500/30 space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider">
              {createMode === "scheduled" ? "Programar Partido en Calendario" : "Iniciar Partido Ahora Mismo"}
            </h3>

            {/* Selector de Modo: Programado vs Ahora Mismo */}
            <div className="flex gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setCreateMode("scheduled")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  createMode === "scheduled"
                    ? "bg-orange-500 text-zinc-950 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Calendar size={13} />
                <span>Programar Fecha</span>
              </button>

              <button
                type="button"
                onClick={() => setCreateMode("now")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  createMode === "now"
                    ? "bg-orange-500 text-zinc-950 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Zap size={13} />
                <span>Jugar Ahora Mismo</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Equipo Local (A) *</label>
              <select
                value={selectedTeamAId}
                onChange={(e) => setSelectedTeamAId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-orange-500"
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.shortName || "EQU"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Equipo Visitante (B) *</label>
              <select
                value={selectedTeamBId}
                onChange={(e) => setSelectedTeamBId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-orange-500"
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.shortName || "EQU"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Jornada / Fase</label>
              <input
                type="text"
                placeholder="Ej: Jornada 1 / Semifinal"
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            {createMode === "scheduled" && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Fecha y Hora Programada *</label>
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Cancha / Sede (Opcional)</label>
              <input
                type="text"
                placeholder="Ej: Polideportivo Baní"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs rounded-xl transition shadow-md shadow-orange-500/20 flex items-center gap-1.5"
            >
              {createMode === "now" ? (
                <>
                  <Zap size={14} />
                  <span>Crear e Iniciar Ahora</span>
                </>
              ) : (
                <>
                  <Calendar size={14} />
                  <span>Programar Encuentro</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Pestañas de Filtro */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setFilterTab("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            filterTab === "all"
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <span>Todos ({games.length})</span>
        </button>

        <button
          onClick={() => setFilterTab("scheduled")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            filterTab === "scheduled"
              ? "bg-zinc-800 text-orange-400"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <span>Programados ({scheduledCount})</span>
        </button>

        <button
          onClick={() => setFilterTab("live")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            filterTab === "live"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <span>En Vivo ({liveCount})</span>
        </button>

        <button
          onClick={() => setFilterTab("finished")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            filterTab === "finished"
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <span>Finalizados ({finishedCount})</span>
        </button>
      </div>

      {/* Lista de Partidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGames.map((game) => {
          const isFinished = game.isFinished;
          const isLive = !isFinished && (game.scoreA > 0 || game.scoreB > 0 || game.status === "live");
          const isScheduled = !isFinished && !isLive;

          const gameDateObj = new Date(game.date);
          const formattedDate = gameDateObj.toLocaleDateString("es-ES", {
            weekday: "short",
            day: "numeric",
            month: "short",
          });
          const formattedTime = gameDateObj.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={game.id}
              className="bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700 p-5 rounded-2xl transition flex flex-col justify-between shadow-lg"
            >
              <div>
                {/* Header de la tarjeta con Jornada, Fecha y Estado */}
                <div className="flex items-center justify-between mb-3 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white uppercase tracking-wider">{game.roundName}</span>
                    {game.venue && (
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <MapPin size={11} className="text-orange-400" />
                        <span>{game.venue}</span>
                      </span>
                    )}
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isFinished 
                      ? "bg-zinc-800 text-zinc-300 border border-zinc-700" 
                      : isLive
                      ? "bg-green-500/15 text-green-400 border border-green-500/30 animate-pulse"
                      : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                  }`}>
                    {isFinished ? "Finalizado" : isLive ? "En Vivo" : "Programado"}
                  </span>
                </div>

                {/* Marcador / Enfrentamiento */}
                <div className="flex items-center justify-between py-4 border-y border-zinc-800/60 my-2">
                  <div className="flex-1 text-center">
                    <h4 className="font-bold text-white text-sm truncate">{game.teamAName}</h4>
                    <span className="text-3xl font-black text-orange-400 font-mono mt-1 block">
                      {isScheduled ? "-" : game.scoreA}
                    </span>
                  </div>

                  <span className="text-zinc-600 font-black italic px-4 text-xs">VS</span>

                  <div className="flex-1 text-center">
                    <h4 className="font-bold text-white text-sm truncate">{game.teamBName}</h4>
                    <span className="text-3xl font-black text-blue-400 font-mono mt-1 block">
                      {isScheduled ? "-" : game.scoreB}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer con Fecha Programada y Botones de Acción */}
              <div className="flex items-center justify-between pt-3 mt-2 text-xs flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
                  <Clock size={13} className="text-zinc-500" />
                  <span>{formattedDate} • {formattedTime}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDeleteGame(game.id, game.teamAName, game.teamBName)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition"
                    title="Eliminar partido"
                  >
                    <Trash2 size={13} />
                  </button>

                  <Link
                    href={`/tournament/${tournamentId}/live-console?gameId=${game.id}`}
                    className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold rounded-xl flex items-center gap-1.5 transition text-xs shadow-sm"
                  >
                    <Play size={12} className="fill-current" />
                    <span>{isFinished ? "Ver Acta / Marcador" : isLive ? "Mesa Técnica" : "Iniciar Partido"}</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {filteredGames.length === 0 && !isCreating && (
          <div className="col-span-full py-16 text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
            <Calendar className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="font-bold text-white text-base">No hay partidos en esta vista</h3>
            <p className="text-xs text-zinc-500 mt-1 mb-4">Programa encuentros para definir el calendario oficial.</p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs rounded-xl transition"
            >
              Programar Partido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
