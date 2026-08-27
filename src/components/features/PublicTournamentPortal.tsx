"use client";

import { useEffect, useState, useMemo } from "react";
import { Tournament, TournamentGame, TournamentPlayer, TournamentTeam } from "@/types/tournament";
import { 
  subscribeToTournamentBySlugOrId, 
  subscribeToTournamentGames, 
  subscribeToTournamentTeams,
  subscribeToTournamentPlayers
} from "@/lib/db";
import { 
  Trophy, 
  Calendar, 
  Users, 
  BarChart3, 
  Share2, 
  Clock,
  MapPin,
  Flame, 
  Sparkles, 
  Activity,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  X,
  Award,
  Layers,
  Search,
  Filter
} from "lucide-react";

export function PublicTournamentPortal({ tournamentId: tournamentSlugOrId }: { tournamentId: string }) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [games, setGames] = useState<TournamentGame[]>([]);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs al estilo Apple Sports
  const [activeTab, setActiveTab] = useState<"games" | "standings" | "leaders" | "teams">("games");
  
  // Filtros de calendario Apple Sports
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "finished" | "scheduled">("all");

  // Modal para ver Box Score detallado del partido
  const [selectedGameForModal, setSelectedGameForModal] = useState<TournamentGame | null>(null);

  // 1. Resolver el torneo por Slug o por ID
  useEffect(() => {
    if (!tournamentSlugOrId) return;

    const unsubTournament = subscribeToTournamentBySlugOrId(tournamentSlugOrId, (t) => {
      setTournament(t);
      if (!t) setLoading(false);
    });

    return () => {
      unsubTournament();
    };
  }, [tournamentSlugOrId]);

  // 2. Suscribirse a las subcolecciones utilizando el ID resuelto del torneo
  useEffect(() => {
    if (!tournament?.id) return;

    const unsubGames = subscribeToTournamentGames(tournament.id, (gList) => {
      setGames(gList);
    });

    const unsubTeams = subscribeToTournamentTeams(tournament.id, (tList) => {
      setTeams(tList);
    });

    const unsubPlayers = subscribeToTournamentPlayers(tournament.id, (pList) => {
      setPlayers(pList);
      setLoading(false);
    });

    return () => {
      unsubGames();
      unsubTeams();
      unsubPlayers();
    };
  }, [tournament?.id]);

  const roundsList = useMemo(() => {
    const rounds = new Set<string>();
    games.forEach((g) => {
      if (g.roundName) rounds.add(g.roundName);
    });
    return Array.from(rounds).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, "") || "0", 10);
      const numB = parseInt(b.replace(/\D/g, "") || "0", 10);
      if (numA > 0 && numB > 0 && numA !== numB) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });
  }, [games]);

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      const matchRound = selectedRoundFilter === "all" || g.roundName === selectedRoundFilter;
      const matchStatus = 
        statusFilter === "all" ||
        (statusFilter === "finished" && (g.isFinished || g.status === "finished")) ||
        (statusFilter === "scheduled" && !g.isFinished && g.status !== "finished");
      return matchRound && matchStatus;
    });
  }, [games, selectedRoundFilter, statusFilter]);

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      const diffWins = b.wins - a.wins;
      if (diffWins !== 0) return diffWins;
      return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
    });
  }, [teams]);

  // Líderes de Puntos Reales
  const topScorers = useMemo(() => {
    return [...players]
      .filter((p) => (p.totalPoints || 0) > 0 || (p.gamesPlayed || 0) > 0)
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
      .slice(0, 10);
  }, [players]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-zinc-400">Cargando portal deportivo...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center p-6 font-sans">
        <h1 className="text-xl font-bold text-white mb-2">Torneo no encontrado</h1>
        <p className="text-xs text-zinc-400">El torneo solicitado no existe o el enlace es incorrecto.</p>
      </div>
    );
  }

  const isPro = tournament.tier === "pro";
  const isBasketball = tournament.sport === "basketball";

  const handleShare = () => {
    const shareSlug = tournament.slug || tournament.id;
    const shareUrl = `${window.location.origin}/t/${shareSlug}`;

    if (navigator.share) {
      navigator.share({
        title: tournament.name,
        text: `Sigue los resultados y el calendario oficial de ${tournament.name} en La Liguita 🏀`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("¡Enlace oficial copiado al portapapeles!");
    }
  };

  // Función para obtener el MVP de un partido
  const getGameMVP = (game: TournamentGame) => {
    if (!game.playerStats) return null;
    const statsEntries = Object.entries(game.playerStats);
    if (statsEntries.length === 0) return null;

    let topPlayerId = "";
    let maxPoints = -1;

    statsEntries.forEach(([pId, stat]: [string, any]) => {
      const pts = stat.points || 0;
      if (pts > maxPoints) {
        maxPoints = pts;
        topPlayerId = pId;
      }
    });

    if (maxPoints <= 0 || !topPlayerId) return null;

    const player = players.find((p) => p.id === topPlayerId);
    const team = teams.find((t) => t.id === player?.teamId);

    return {
      name: player?.name || "Jugador",
      number: player?.number,
      points: maxPoints,
      teamName: team?.name || (player?.teamId === game.teamAId ? game.teamAName : game.teamBName)
    };
  };

  // Función para obtener los marcadores efectivos (con cálculo automático de puntos de jugadores si los totales vinieran en 0)
  const getGameEffectiveScores = (game: TournamentGame) => {
    let sA = Number(game.scoreA) || 0;
    let sB = Number(game.scoreB) || 0;

    if (sA === 0 || sB === 0) {
      if (game.playerStats) {
        let sumA = 0;
        let sumB = 0;
        Object.keys(game.playerStats).forEach((pId) => {
          const player = players.find((p) => p.id === pId);
          const pts = Number((game.playerStats?.[pId] as any)?.points) || 0;
          if (player?.teamId === game.teamAId) {
            sumA += pts;
          } else if (player?.teamId === game.teamBId) {
            sumB += pts;
          }
        });
        if (sA === 0 && sumA > 0) sA = sumA;
        if (sB === 0 && sumB > 0) sB = sumB;
      }
    }

    return { scoreA: sA, scoreB: sB };
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased font-sans pb-24 selection:bg-orange-500/30">
      {/* HEADER PRINCIPAL APPLE SPORTS STYLE */}
      <header className="bg-zinc-900/70 border-b border-zinc-800/80 backdrop-blur-xl sticky top-14 z-40">
        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-5 pb-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Logo Oficial o Avatar */}
              {tournament.logoUrl ? (
                <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 p-1.5 flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
                  <img src={tournament.logoUrl} alt={tournament.name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-orange-400 text-lg shrink-0 shadow-lg">
                  {tournament.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {tournament.organizationName || "Liga Oficial"}
                  </span>
                  {isPro && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
                      PRO
                    </span>
                  )}
                </div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
                  {tournament.name}
                </h1>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition border border-zinc-700/80 shrink-0"
              title="Compartir torneo"
            >
              <Share2 size={16} />
            </button>
          </div>

          {/* iOS Segmented Control Tabs */}
          <div className="p-1 bg-zinc-950/80 rounded-xl border border-zinc-800/90 grid grid-cols-4 gap-1">
            <button
              onClick={() => setActiveTab("games")}
              className={`py-2 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === "games"
                  ? "bg-zinc-800 text-white shadow-sm font-black"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Calendar size={13} className={activeTab === "games" ? "text-orange-400" : ""} />
              <span className="truncate">Calendario</span>
            </button>

            <button
              onClick={() => setActiveTab("standings")}
              className={`py-2 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === "standings"
                  ? "bg-zinc-800 text-white shadow-sm font-black"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Trophy size={13} className={activeTab === "standings" ? "text-orange-400" : ""} />
              <span className="truncate">Posiciones</span>
            </button>

            <button
              onClick={() => setActiveTab("leaders")}
              className={`py-2 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === "leaders"
                  ? "bg-zinc-800 text-white shadow-sm font-black"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Award size={13} className={activeTab === "leaders" ? "text-orange-400" : ""} />
              <span className="truncate">Líderes</span>
            </button>

            <button
              onClick={() => setActiveTab("teams")}
              className={`py-2 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === "teams"
                  ? "bg-zinc-800 text-white shadow-sm font-black"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Users size={13} className={activeTab === "teams" ? "text-orange-400" : ""} />
              <span className="truncate">Clubes</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-6 space-y-6">
        {/* ============================================================ */}
        {/* PESTAÑA 1: CALENDARIO & RESULTADOS (APPLE SPORTS SCOREBOARD) */}
        {/* ============================================================ */}
        {activeTab === "games" && (
          <div className="space-y-4">
            {/* Carrusel / Filtro de Jornadas estilo Apple Sports */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedRoundFilter("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedRoundFilter === "all"
                    ? "bg-orange-500 text-zinc-950 shadow-sm"
                    : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                }`}
              >
                Todos los Partidos ({games.length})
              </button>

              {roundsList.map((round) => (
                <button
                  key={round}
                  onClick={() => setSelectedRoundFilter(round)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                    selectedRoundFilter === round
                      ? "bg-orange-500 text-zinc-950 shadow-sm"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  {round}
                </button>
              ))}
            </div>

            {/* Grid de Tarjetas de Partido estilo Apple Sports */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGames.map((game) => {
                const isFinished = game.isFinished || game.status === "finished";
                const isLive = game.status === "live";
                const isScheduled = !isFinished && !isLive;

                const { scoreA, scoreB } = getGameEffectiveScores(game);

                const teamAWon = isFinished && scoreA > scoreB;
                const teamBWon = isFinished && scoreB > scoreA;

                const matchDate = new Date(game.date);
                const formattedDate = matchDate.toLocaleDateString("es-ES", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                });
                const formattedTime = matchDate.toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const teamA = teams.find((t) => t.id === game.teamAId);
                const teamB = teams.find((t) => t.id === game.teamBId);

                const mvp = isFinished ? getGameMVP(game) : null;

                return (
                  <div
                    key={game.id}
                    onClick={() => setSelectedGameForModal(game)}
                    className="bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-5 shadow-lg transition duration-200 cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    {/* Header de la Tarjeta */}
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-400 uppercase tracking-wider">{game.roundName || "Partido Oficial"}</span>
                        {game.venue && (
                          <span className="text-zinc-500 truncate max-w-[150px]">
                            • {game.venue}
                          </span>
                        )}
                      </div>

                      <div>
                        {isFinished && (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-bold uppercase tracking-wider text-[10px]">
                            FINAL
                          </span>
                        )}
                        {isLive && (
                          <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 font-black uppercase tracking-wider text-[10px] border border-red-500/30 animate-pulse">
                            EN VIVO
                          </span>
                        )}
                        {isScheduled && (
                          <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/25 font-bold uppercase tracking-wider text-[10px]">
                            Próximamente • {formattedDate} {formattedTime}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Fila Equipo A */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-xs text-orange-400 shrink-0">
                            {teamA?.shortName || game.teamAName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className={`text-sm truncate block ${
                              teamAWon ? "font-black text-white" : isFinished ? "text-zinc-400 font-semibold" : "font-bold text-zinc-200"
                            }`}>
                              {game.teamAName}
                            </span>
                            {teamA && (
                              <span className="text-[10px] font-mono text-zinc-500">
                                ({teamA.wins}-{teamA.losses})
                              </span>
                            )}
                          </div>
                        </div>

                        <span className={`text-2xl font-mono ${
                          teamAWon ? "font-black text-white" : isFinished ? "font-bold text-zinc-400" : "font-bold text-zinc-500"
                        }`}>
                          {isScheduled ? "-" : scoreA}
                        </span>
                      </div>

                      {/* Fila Equipo B */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-xs text-blue-400 shrink-0">
                            {teamB?.shortName || game.teamBName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className={`text-sm truncate block ${
                              teamBWon ? "font-black text-white" : isFinished ? "text-zinc-400 font-semibold" : "font-bold text-zinc-200"
                            }`}>
                              {game.teamBName}
                            </span>
                            {teamB && (
                              <span className="text-[10px] font-mono text-zinc-500">
                                ({teamB.wins}-{teamB.losses})
                              </span>
                            )}
                          </div>
                        </div>

                        <span className={`text-2xl font-mono ${
                          teamBWon ? "font-black text-white" : isFinished ? "font-bold text-zinc-400" : "font-bold text-zinc-500"
                        }`}>
                          {isScheduled ? "-" : scoreB}
                        </span>
                      </div>
                    </div>

                    {/* Barra Inferior Apple Sports: MVP del Partido */}
                    {mvp ? (
                      <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-amber-400 font-bold">⭐ MVP:</span>
                          <span className="font-bold text-zinc-200">{mvp.name}</span>
                          <span className="font-mono text-orange-400 font-black">({mvp.points} pts)</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 transition flex items-center gap-0.5">
                          <span>Box Score</span>
                          <ChevronRight size={12} />
                        </span>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{isFinished ? "Acta Oficial Cerrada" : "Encuentro Programado"}</span>
                        <span className="text-[10px] group-hover:text-zinc-300 transition flex items-center gap-0.5">
                          <span>Ver Ficha</span>
                          <ChevronRight size={12} />
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredGames.length === 0 && (
                <div className="col-span-full py-20 text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800 text-zinc-500">
                  No hay partidos registrados para esta selección.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PESTAÑA 2: TABLA DE POSICIONES */}
        {/* ============================================================ */}
        {activeTab === "standings" && (
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Trophy size={16} className="text-orange-500" />
                <span>Tabla General de Posiciones</span>
              </h2>
              <span className="text-xs font-mono text-zinc-500">Temporada 2026</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">Pos</th>
                    <th className="py-3 px-4">Equipo / Club</th>
                    <th className="py-3 px-3 text-center">PJ</th>
                    <th className="py-3 px-3 text-center font-bold text-green-400">G</th>
                    <th className="py-3 px-3 text-center font-bold text-red-400">P</th>
                    <th className="py-3 px-3 text-center">PF</th>
                    <th className="py-3 px-3 text-center">PC</th>
                    <th className="py-3 px-3 text-center font-bold">DIF</th>
                    <th className="py-3 px-4 text-center font-bold text-orange-400">% VIC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {sortedTeams.map((team, idx) => {
                    const gamesPlayed = team.wins + team.losses;
                    const winRate = gamesPlayed > 0 ? Math.round((team.wins / gamesPlayed) * 100) : 0;
                    const diff = team.pointsFor - team.pointsAgainst;

                    return (
                      <tr key={team.id} className="hover:bg-zinc-800/30 transition">
                        <td className="py-3.5 px-4 text-center font-black">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs ${
                            idx === 0 ? "bg-amber-400/20 text-amber-400 font-black border border-amber-400/30" :
                            idx === 1 ? "bg-zinc-300/20 text-zinc-300 font-bold" :
                            idx === 2 ? "bg-orange-500/20 text-orange-400 font-bold" :
                            "text-zinc-500"
                          }`}>
                            {idx + 1}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-black text-orange-400 border border-zinc-700 shrink-0">
                            {team.shortName || team.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="truncate">{team.name}</span>
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono text-zinc-300">{gamesPlayed}</td>
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-green-400">{team.wins}</td>
                        <td className="py-3.5 px-3 text-center font-mono text-red-400">{team.losses}</td>
                        <td className="py-3.5 px-3 text-center font-mono text-zinc-400">{team.pointsFor}</td>
                        <td className="py-3.5 px-3 text-center font-mono text-zinc-400">{team.pointsAgainst}</td>
                        <td className={`py-3.5 px-3 text-center font-mono font-bold ${
                          diff > 0 ? "text-green-400" : diff < 0 ? "text-red-400" : "text-zinc-500"
                        }`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-orange-400">
                          {winRate}%
                        </td>
                      </tr>
                    );
                  })}

                  {sortedTeams.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-zinc-500">
                        Aún no hay equipos o posiciones registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PESTAÑA 3: LÍDERES DE ESTADÍSTICAS */}
        {/* ============================================================ */}
        {activeTab === "leaders" && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Award size={15} className="text-orange-500" />
                  <span>Top 10 Máximos Anotadores del Torneo</span>
                </h3>
                <span className="text-[10px] font-mono text-zinc-500">Oficial</span>
              </div>

              <div className="divide-y divide-zinc-800/60">
                {topScorers.map((player, idx) => {
                  const team = teams.find((t) => t.id === player.teamId);
                  const ppg = (player.gamesPlayed || 0) > 0 
                    ? ((player.totalPoints || 0) / player.gamesPlayed).toFixed(1)
                    : (player.totalPoints || 0).toString();

                  return (
                    <div key={player.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <span className={`w-6 text-center font-black font-mono text-sm ${
                          idx === 0 ? "text-amber-400 font-black text-base" :
                          idx === 1 ? "text-zinc-300 font-bold" :
                          idx === 2 ? "text-orange-400 font-bold" :
                          "text-zinc-500"
                        }`}>
                          {idx + 1}
                        </span>

                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-bold text-xs text-orange-400 shrink-0">
                          #{player.number !== undefined ? player.number : "-"}
                        </div>

                        <div>
                          <div className="font-bold text-white text-sm">{player.name}</div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                            <span>{team?.name || "Club"}</span>
                            <span>•</span>
                            <span className="text-zinc-500">{player.position || "JUG"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black font-mono text-orange-400">{player.totalPoints || 0} PTS</div>
                        <div className="text-[10px] font-mono text-zinc-500">{ppg} PPG • {player.gamesPlayed || 0} PJ</div>
                      </div>
                    </div>
                  );
                })}

                {topScorers.length === 0 && (
                  <div className="py-12 text-center text-zinc-500 italic">
                    Aún no se han registrado puntos para calcular la tabla de líderes.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PESTAÑA 4: CLUBES & PLANTILLAS */}
        {/* ============================================================ */}
        {activeTab === "teams" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {teams.map((team) => {
              const roster = players.filter((p) => p.teamId === team.id);

              return (
                <div key={team.id} className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-orange-400 text-base border border-zinc-700 shrink-0">
                      {team.shortName || team.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-sm truncate">{team.name}</h3>
                      <p className="text-[11px] text-zinc-400 font-mono">
                        {team.wins}G - {team.losses}P • {roster.length} Jugadores
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Plantilla:</div>
                    <div className="flex flex-wrap gap-1">
                      {roster.slice(0, 5).map((p) => (
                        <span key={p.id} className="px-2 py-0.5 bg-zinc-950 rounded text-[10px] text-zinc-300 font-mono border border-zinc-800">
                          #{p.number} {p.name.split(" ")[0]}
                        </span>
                      ))}
                      {roster.length > 5 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-zinc-500 font-mono">
                          +{roster.length - 5} más
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL DETALLADO BOX SCORE AL TOCAR UN PARTIDO (APPLE SPORTS DRAWER) */}
      {selectedGameForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedGameForModal(null)}
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/80 hover:bg-zinc-700 transition"
            >
              <X size={18} />
            </button>

            {/* Header del Modal */}
            <div className="text-center pt-2 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 font-mono">
                {selectedGameForModal.roundName || "Partido Oficial"} • {selectedGameForModal.venue || "Cancha Principal"}
              </span>
              <div className="text-xs text-zinc-400 font-mono">
                {new Date(selectedGameForModal.date).toLocaleDateString("es-ES", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* Marcador Gigante */}
            {(() => {
              const { scoreA: modalScoreA, scoreB: modalScoreB } = getGameEffectiveScores(selectedGameForModal);
              return (
                <>
                  <div className="grid grid-cols-2 gap-4 py-4 bg-zinc-950 rounded-2xl border border-zinc-800/80 text-center items-center">
                    <div>
                      <h4 className="font-bold text-white text-base truncate px-2">{selectedGameForModal.teamAName}</h4>
                      <span className="text-5xl font-black font-mono text-orange-400 tracking-tight mt-1 block">
                        {modalScoreA}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-base truncate px-2">{selectedGameForModal.teamBName}</h4>
                      <span className="text-5xl font-black font-mono text-blue-400 tracking-tight mt-1 block">
                        {modalScoreB}
                      </span>
                    </div>
                  </div>

                  {/* Detalle de Anotadores por Jugador (Box Score) */}
                  {selectedGameForModal.playerStats && Object.keys(selectedGameForModal.playerStats).length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        Planilla Estadística del Partido
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Jugadores Equipo A */}
                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                          <div className="font-bold text-white text-xs border-b border-zinc-800 pb-1.5 flex items-center justify-between">
                            <span>{selectedGameForModal.teamAName}</span>
                            <span className="text-orange-400 font-mono font-bold">{modalScoreA} PTS</span>
                          </div>

                    <div className="space-y-1.5">
                      {players
                        .filter((p) => p.teamId === selectedGameForModal.teamAId && selectedGameForModal.playerStats?.[p.id])
                        .map((p) => {
                          const stat = selectedGameForModal.playerStats?.[p.id] as any;
                          return (
                            <div key={p.id} className="flex items-center justify-between text-xs py-1">
                              <span className="text-zinc-300">#{p.number} {p.name}</span>
                              <span className="font-mono font-bold text-orange-400">{stat.points || 0} pts</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Jugadores Equipo B */}
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <div className="font-bold text-white text-xs border-b border-zinc-800 pb-1.5 flex items-center justify-between">
                      <span>{selectedGameForModal.teamBName}</span>
                      <span className="text-blue-400">{selectedGameForModal.scoreB} PTS</span>
                    </div>

                    <div className="space-y-1.5">
                      {players
                        .filter((p) => p.teamId === selectedGameForModal.teamBId && selectedGameForModal.playerStats?.[p.id])
                        .map((p) => {
                          const stat = selectedGameForModal.playerStats?.[p.id] as any;
                          return (
                            <div key={p.id} className="flex items-center justify-between text-xs py-1">
                              <span className="text-zinc-300">#{p.number} {p.name}</span>
                              <span className="font-mono font-bold text-blue-400">{stat.points || 0} pts</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-zinc-500 italic bg-zinc-950 rounded-xl border border-zinc-800">
                Este partido no tiene estadísticas individuales detalladas de jugadores cargadas aún.
              </div>
            )}
            </>
            );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
