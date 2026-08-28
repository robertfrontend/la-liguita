"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Award,
  Users,
  Radio,
  Flame,
  CheckCircle2,
  AlertCircle,
  Video,
  ExternalLink,
  ChevronRight,
  Shield,
  Activity,
  UserCheck
} from "lucide-react";
import {
  subscribeToTournamentBySlugOrId,
  subscribeToTournamentGames,
  subscribeToTournamentTeams,
  subscribeToTournamentPlayers,
  subscribeToPlayByPlay,
  subscribeToReferees
} from "@/lib/db";
import {
  Tournament,
  TournamentGame,
  TournamentTeam,
  TournamentPlayer,
  Referee,
  PlayByPlayEvent,
  AmateurGameStats,
  ProGameStats
} from "@/types/tournament";

interface PublicGameDetailProps {
  tournamentSlugOrId: string;
  gameId: string;
}

export function PublicGameDetail({ tournamentSlugOrId, gameId }: PublicGameDetailProps) {
  const router = useRouter();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [games, setGames] = useState<TournamentGame[]>([]);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [referees, setReferees] = useState<Referee[]>([]);
  const [events, setEvents] = useState<PlayByPlayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Tabs de navegación interna de la página
  const [activeTab, setActiveTab] = useState<"boxscore" | "playbyplay" | "comparison" | "rosters">("boxscore");
  const [selectedQuarterFilter, setSelectedQuarterFilter] = useState<number | "all">("all");

  // 1. Suscripción al Torneo por Slug o por ID
  useEffect(() => {
    if (!tournamentSlugOrId) return;

    const unsubTournament = subscribeToTournamentBySlugOrId(tournamentSlugOrId, (t) => {
      setTournament(t);
      if (!t) setLoading(false);
    });

    return () => unsubTournament();
  }, [tournamentSlugOrId]);

  // 2. Suscripción a datos del torneo cuando se resuelve el ID
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

    const unsubReferees = subscribeToReferees(tournament.id, (rList: any) => {
      setReferees(rList);
    });

    return () => {
      unsubGames();
      unsubTeams();
      unsubPlayers();
      unsubReferees();
    };
  }, [tournament?.id]);

  // 3. Suscripción a los eventos jugada a jugada (Play-by-Play) en tiempo real
  useEffect(() => {
    if (!tournament?.id || !gameId) return;

    const unsubPlayByPlay = subscribeToPlayByPlay(tournament.id, gameId, (evtList) => {
      setEvents(evtList);
    });

    return () => unsubPlayByPlay();
  }, [tournament?.id, gameId]);

  // Identificar el partido actual
  const game = useMemo(() => {
    return games.find((g) => g.id === gameId) || null;
  }, [games, gameId]);

  const teamA = useMemo(() => {
    return teams.find((t) => t.id === game?.teamAId) || null;
  }, [teams, game?.teamAId]);

  const teamB = useMemo(() => {
    return teams.find((t) => t.id === game?.teamBId) || null;
  }, [teams, game?.teamBId]);

  const teamAPlayers = useMemo(() => {
    return players.filter((p) => p.teamId === game?.teamAId);
  }, [players, game?.teamAId]);

  const teamBPlayers = useMemo(() => {
    return players.filter((p) => p.teamId === game?.teamBId);
  }, [players, game?.teamBId]);

  // Cálculo de marcadores efectivos
  const effectiveScores = useMemo(() => {
    if (!game) return { scoreA: 0, scoreB: 0 };
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
  }, [game, players]);

  // Cálculo de parciales por cuarto a partir de eventos play-by-play
  const quarterScores = useMemo(() => {
    const map: Record<number, { scoreA: number; scoreB: number }> = {
      1: { scoreA: 0, scoreB: 0 },
      2: { scoreA: 0, scoreB: 0 },
      3: { scoreA: 0, scoreB: 0 },
      4: { scoreA: 0, scoreB: 0 },
    };

    events.forEach((evt) => {
      const q = evt.period || 1;
      if (!map[q]) {
        map[q] = { scoreA: 0, scoreB: 0 };
      }
      let pts = 0;
      if (evt.type === "3pt_made") pts = 3;
      else if (evt.type === "2pt_made") pts = 2;
      else if (evt.type === "ft_made") pts = 1;

      if (evt.teamId === game?.teamAId) {
        map[q].scoreA += pts;
      } else if (evt.teamId === game?.teamBId) {
        map[q].scoreB += pts;
      }
    });

    return map;
  }, [events, game?.teamAId, game?.teamBId]);

  // Cálculo del MVP del partido
  const mvp = useMemo(() => {
    if (!game || !game.playerStats) return null;
    let bestPlayerId: string | null = null;
    let bestEff = -1;

    Object.entries(game.playerStats).forEach(([pId, rawStats]) => {
      const stats = rawStats as any;
      const pts = Number(stats.points) || 0;
      const ast = Number(stats.assists) || 0;
      const reb = Number(stats.rebounds) || 0;
      const fls = Number(stats.fouls) || 0;

      const eff = (pts * 1.5) + (ast * 1.2) + (reb * 1.0) - (fls * 0.5);
      if (eff > bestEff && pts > 0) {
        bestEff = eff;
        bestPlayerId = pId;
      }
    });

    if (!bestPlayerId) return null;
    const bestPlayer = players.find((pl) => pl.id === bestPlayerId);
    if (!bestPlayer) return null;

    const stats = (game.playerStats[bestPlayer.id] || {}) as any;
    return {
      player: bestPlayer,
      points: Number(stats.points) || 0,
      assists: Number(stats.assists) || 0,
      rebounds: Number(stats.rebounds) || 0,
      fouls: Number(stats.fouls) || 0,
    };
  }, [game, players]);

  // Líderes individuales de cada equipo
  const teamLeaders = useMemo(() => {
    interface LeaderInfo {
      player: TournamentPlayer;
      points: number;
      assists: number;
      rebounds: number;
    }

    if (!game || !game.playerStats) return { teamATop: null as LeaderInfo | null, teamBTop: null as LeaderInfo | null };

    let topA: LeaderInfo | null = null;
    let topB: LeaderInfo | null = null;

    teamAPlayers.forEach((p) => {
      const st = (game.playerStats[p.id] || {}) as any;
      const pts = Number(st.points) || 0;
      if (!topA || pts > topA.points) {
        topA = { player: p, points: pts, assists: Number(st.assists) || 0, rebounds: Number(st.rebounds) || 0 };
      }
    });

    teamBPlayers.forEach((p) => {
      const st = (game.playerStats[p.id] || {}) as any;
      const pts = Number(st.points) || 0;
      if (!topB || pts > topB.points) {
        topB = { player: p, points: pts, assists: Number(st.assists) || 0, rebounds: Number(st.rebounds) || 0 };
      }
    });

    return { teamATop: topA, teamBTop: topB };
  }, [game, teamAPlayers, teamBPlayers]);

  // Árbitros del partido
  const assignedReferees = useMemo(() => {
    if (!game?.refereeIds) return [];
    return referees.filter((r) => game.refereeIds?.includes(r.id));
  }, [referees, game?.refereeIds]);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${game?.teamAName} vs ${game?.teamBName} | ${tournament?.name || ""}`,
          text: `${game?.teamAName} vs ${game?.teamBName} - ${tournament?.name || ""}`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const formatMatchDateTime = (dateString: string) => {
    try {
      const d = new Date(dateString);
      const fullDate = d.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const timeStr = d.toLocaleTimeString("es-ES", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return { fullDate, timeStr };
    } catch {
      return { fullDate: dateString, timeStr: "" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-zinc-400">Cargando detalles del partido...</p>
      </div>
    );
  }

  if (!tournament || !game) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle size={48} className="text-zinc-600" />
        <h2 className="text-xl font-black">Partido No Encontrado</h2>
        <p className="text-sm text-zinc-400 max-w-sm">
          No pudimos localizar la información de este partido o el enlace ha cambiado.
        </p>
        <Link
          href={`/t/${tournamentSlugOrId}`}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition"
        >
          Volver al Torneo
        </Link>
      </div>
    );
  }

  const isFinished = game.isFinished || game.status === "finished";
  const isLive = game.status === "live";
  const isScheduled = !isFinished && !isLive;
  const { scoreA, scoreB } = effectiveScores;
  const teamAWon = isFinished && scoreA > scoreB;
  const teamBWon = isFinished && scoreB > scoreA;
  const { fullDate, timeStr } = formatMatchDateTime(game.date);

  const filteredEvents = events.filter((e) => {
    if (selectedQuarterFilter === "all") return true;
    return (e.period || 1) === selectedQuarterFilter;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased font-sans pb-24 selection:bg-blue-500/30">
      {/* BARRA SUPERIOR DE NAVEGACIÓN */}
      <header className="bg-zinc-900/80 border-b border-zinc-800/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href={`/t/${tournament.slug || tournament.id}`}
            className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition" />
            <span className="truncate max-w-[200px] sm:max-w-xs">{tournament.name}</span>
          </Link>

          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-black uppercase tracking-wider animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                En Vivo
              </span>
            )}
            {isFinished && (
              <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-bold uppercase tracking-wider">
                Finalizado
              </span>
            )}
            {isScheduled && (
              <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
                Programado
              </span>
            )}

            <button
              onClick={handleShare}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition border border-zinc-700/80"
              title="Compartir partido"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-6 space-y-6">
        {/* ============================================================ */}
        {/* HERO SCOREBOARD PRINCIPAL (APPLE SPORTS STYLE GIGANTE) */}
        {/* ============================================================ */}
        <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6">
          {/* Header de Metadatos del Partido */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-400 border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 font-bold uppercase tracking-wider border border-blue-500/20">
                {game.roundName || "Partido Oficial"}
              </span>
              {game.venue && (
                <span className="flex items-center gap-1 text-zinc-300">
                  <MapPin size={13} className="text-zinc-500" />
                  <span>{game.venue}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Calendar size={13} className="text-zinc-500" />
                <span className="capitalize">{fullDate}</span>
              </span>
              {timeStr && (
                <span className="flex items-center gap-1 text-zinc-400">
                  <Clock size={13} className="text-zinc-500" />
                  <span>{timeStr}</span>
                </span>
              )}
            </div>
          </div>

          {/* Gran Tablero Central */}
          <div className="grid grid-cols-3 items-center gap-4 py-2">
            {/* Equipo A */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-zinc-950 border border-zinc-800 p-2 flex items-center justify-center shadow-lg overflow-hidden">
                {teamA?.logo || (teamA as any)?.logoUrl || tournament.logoUrl ? (
                  <img src={teamA?.logo || (teamA as any)?.logoUrl || tournament.logoUrl} alt={game.teamAName} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xl md:text-2xl font-black text-blue-400">
                    {teamA?.shortName || game.teamAName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-base md:text-xl font-black text-white tracking-tight leading-tight">
                  {game.teamAName}
                </h2>
                {teamA && (
                  <span className="text-xs font-mono text-zinc-500">
                    ({teamA.wins}G - {teamA.losses}P)
                  </span>
                )}
              </div>
            </div>

            {/* Marcador Central */}
            <div className="flex flex-col items-center justify-center text-center">
              {isScheduled ? (
                <div className="space-y-1.5">
                  <span className="text-3xl md:text-5xl font-black font-mono text-zinc-600 tracking-tighter">
                    VS
                  </span>
                  <div className="text-[11px] font-mono text-blue-400 font-bold bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    {timeStr || "Por Iniciar"}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-3 md:gap-5">
                    <span
                      className={`text-4xl md:text-6xl font-black font-mono tracking-tighter ${
                        teamAWon ? "text-white scale-105 transition" : "text-zinc-400"
                      }`}
                    >
                      {scoreA}
                    </span>
                    <span className="text-2xl md:text-4xl font-mono text-zinc-700 font-light">-</span>
                    <span
                      className={`text-4xl md:text-6xl font-black font-mono tracking-tighter ${
                        teamBWon ? "text-white scale-105 transition" : "text-zinc-400"
                      }`}
                    >
                      {scoreB}
                    </span>
                  </div>
                  {isLive && (
                    <div className="text-[11px] font-mono text-red-400 font-bold flex items-center justify-center gap-1.5 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span>Cuarto {game.currentPeriod || 1} • En Progreso</span>
                    </div>
                  )}
                  {isFinished && (
                    <div className="text-[11px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
                      Marcador Final
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Equipo B */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-zinc-950 border border-zinc-800 p-2 flex items-center justify-center shadow-lg overflow-hidden">
                {teamB?.logo || (teamB as any)?.logoUrl || tournament.logoUrl ? (
                  <img src={teamB?.logo || (teamB as any)?.logoUrl || tournament.logoUrl} alt={game.teamBName} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xl md:text-2xl font-black text-indigo-400">
                    {teamB?.shortName || game.teamBName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-base md:text-xl font-black text-white tracking-tight leading-tight">
                  {game.teamBName}
                </h2>
                {teamB && (
                  <span className="text-xs font-mono text-zinc-500">
                    ({teamB.wins}G - {teamB.losses}P)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabla de Parciales por Cuartos si hay eventos */}
          {events.length > 0 && !isScheduled && (
            <div className="pt-4 border-t border-zinc-800/80">
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs font-mono">
                  <thead>
                    <tr className="text-zinc-500 border-b border-zinc-800">
                      <th className="text-left py-1.5 font-bold uppercase text-[10px] text-zinc-400">Equipo</th>
                      <th className="py-1.5 px-3">Q1</th>
                      <th className="py-1.5 px-3">Q2</th>
                      <th className="py-1.5 px-3">Q3</th>
                      <th className="py-1.5 px-3">Q4</th>
                      <th className="py-1.5 px-3 font-bold text-white">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    <tr>
                      <td className="text-left py-2 font-bold text-white truncate max-w-[120px]">{game.teamAName}</td>
                      <td className="py-2 text-zinc-400">{quarterScores[1]?.scoreA || 0}</td>
                      <td className="py-2 text-zinc-400">{quarterScores[2]?.scoreA || 0}</td>
                      <td className="py-2 text-zinc-400">{quarterScores[3]?.scoreA || 0}</td>
                      <td className="py-2 text-zinc-400">{quarterScores[4]?.scoreA || 0}</td>
                      <td className="py-2 font-black text-blue-400">{scoreA}</td>
                    </tr>
                    <tr>
                      <td className="text-left py-2 font-bold text-white truncate max-w-[120px]">{game.teamBName}</td>
                      <td className="py-2 text-zinc-400">{quarterScores[1]?.scoreB || 0}</td>
                      <td className="py-2 text-zinc-400">{quarterScores[2]?.scoreB || 0}</td>
                      <td className="py-2 text-zinc-400">{quarterScores[3]?.scoreB || 0}</td>
                      <td className="py-2 text-zinc-400">{quarterScores[4]?.scoreB || 0}</td>
                      <td className="py-2 font-black text-indigo-400">{scoreB}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Árbitros Asignados */}
          {assignedReferees.length > 0 && (
            <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-zinc-500">
                <Shield size={12} className="text-zinc-500" />
                Cuerpo Arbitral:
              </span>
              <div className="flex items-center gap-2">
                {assignedReferees.map((ref) => (
                  <span key={ref.id} className="px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 font-mono text-[11px] border border-zinc-800">
                    {ref.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* CARD DESTACADA: MVP DEL PARTIDO */}
        {/* ============================================================ */}
        {mvp && isFinished && (
          <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/30 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-xl shrink-0">
                #{mvp.player.number || "⭐"}
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-0.5">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-black text-[10px] uppercase tracking-wider border border-amber-500/30">
                    ⭐ MVP del Partido
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {mvp.player.teamId === game.teamAId ? game.teamAName : game.teamBName}
                  </span>
                </div>
                <h3 className="text-lg font-black text-white tracking-tight">{mvp.player.name}</h3>
              </div>
            </div>

            {/* Estadísticas del MVP */}
            <div className="flex items-center gap-4 bg-zinc-950/80 px-4 py-2.5 rounded-2xl border border-zinc-800/80 font-mono">
              <div className="text-center">
                <span className="text-xl font-black text-amber-400">{mvp.points}</span>
                <span className="block text-[9px] uppercase text-zinc-500 font-bold">PTS</span>
              </div>
              <div className="w-px h-7 bg-zinc-800" />
              <div className="text-center">
                <span className="text-xl font-black text-blue-400">{mvp.assists}</span>
                <span className="block text-[9px] uppercase text-zinc-500 font-bold">AST</span>
              </div>
              <div className="w-px h-7 bg-zinc-800" />
              <div className="text-center">
                <span className="text-xl font-black text-emerald-400">{mvp.rebounds}</span>
                <span className="block text-[9px] uppercase text-zinc-500 font-bold">REB</span>
              </div>
              <div className="w-px h-7 bg-zinc-800" />
              <div className="text-center">
                <span className="text-xl font-black text-zinc-400">{mvp.fouls}</span>
                <span className="block text-[9px] uppercase text-zinc-500 font-bold">FLS</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TRANSMISIÓN EN VIVO / STREAM SI EXISTE */}
        {/* ============================================================ */}
        {game.streamUrl && (
          <div className="bg-zinc-900/80 border border-zinc-800 p-4 md:p-5 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
                <Video size={20} />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Transmisión del Encuentro</h4>
                <p className="text-xs text-zinc-400">Sigue la cobertura audiovisual en vivo o en diferido.</p>
              </div>
            </div>

            <a
              href={game.streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0"
            >
              <span>Ver Transmisión</span>
              <ExternalLink size={13} />
            </a>
          </div>
        )}

        {/* ============================================================ */}
        {/* NAVEGACIÓN POR PESTAÑAS (SEGMENTED CONTROL) */}
        {/* ============================================================ */}
        <div className="p-1 bg-zinc-950/90 rounded-2xl border border-zinc-800/90 grid grid-cols-4 gap-1">
          <button
            onClick={() => setActiveTab("boxscore")}
            className={`py-2.5 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "boxscore"
                ? "bg-zinc-800 text-white shadow font-black"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Activity size={14} className={activeTab === "boxscore" ? "text-blue-400" : ""} />
            <span className="truncate">Box Score</span>
          </button>

          <button
            onClick={() => setActiveTab("playbyplay")}
            className={`py-2.5 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "playbyplay"
                ? "bg-zinc-800 text-white shadow font-black"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Flame size={14} className={activeTab === "playbyplay" ? "text-blue-400" : ""} />
            <span className="truncate">Jugadas ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("comparison")}
            className={`py-2.5 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "comparison"
                ? "bg-zinc-800 text-white shadow font-black"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Trophy size={14} className={activeTab === "comparison" ? "text-blue-400" : ""} />
            <span className="truncate">Líderes</span>
          </button>

          <button
            onClick={() => setActiveTab("rosters")}
            className={`py-2.5 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "rosters"
                ? "bg-zinc-800 text-white shadow font-black"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Users size={14} className={activeTab === "rosters" ? "text-blue-400" : ""} />
            <span className="truncate">Plantillas</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* PESTAÑA 1: BOX SCORE (PLANILLA ESTADÍSTICA COMPLETA) */}
        {/* ============================================================ */}
        {activeTab === "boxscore" && (
          <div className="space-y-6">
            {/* Box Score Equipo A */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg">
              <div className="bg-zinc-900 px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-blue-400">
                    {teamA?.shortName || game.teamAName.slice(0, 2).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-white text-sm">{game.teamAName}</h3>
                </div>
                <span className="text-sm font-mono font-black text-blue-400">{scoreA} PUNTOS</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-zinc-500 bg-zinc-950/60 border-b border-zinc-800 uppercase text-[10px]">
                      <th className="py-2.5 px-4 font-bold text-zinc-400">#</th>
                      <th className="py-2.5 px-4 font-bold text-zinc-400">Jugador</th>
                      <th className="py-2.5 px-3 text-right font-black text-blue-400">PTS</th>
                      <th className="py-2.5 px-3 text-right">AST</th>
                      <th className="py-2.5 px-3 text-right">REB</th>
                      <th className="py-2.5 px-3 text-right">FLS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {teamAPlayers.map((p) => {
                      const stat = (game.playerStats?.[p.id] || {}) as any;
                      const pts = Number(stat.points) || 0;
                      const ast = Number(stat.assists) || 0;
                      const reb = Number(stat.rebounds) || 0;
                      const fls = Number(stat.fouls) || 0;

                      return (
                        <tr key={p.id} className="hover:bg-zinc-800/40 transition">
                          <td className="py-2.5 px-4 text-zinc-400">#{p.number || "-"}</td>
                          <td className="py-2.5 px-4 font-sans font-bold text-zinc-200">
                            {p.name}
                            {mvp?.player.id === p.id && (
                              <span className="ml-1.5 text-amber-400 font-normal text-[10px]">⭐ MVP</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-blue-400">{pts}</td>
                          <td className="py-2.5 px-3 text-right text-zinc-400">{ast}</td>
                          <td className="py-2.5 px-3 text-right text-zinc-400">{reb}</td>
                          <td className="py-2.5 px-3 text-right text-zinc-400">{fls}</td>
                        </tr>
                      );
                    })}

                    {teamAPlayers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-zinc-500 italic">
                          No hay jugadores registrados para este equipo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-950/80 font-bold border-t border-zinc-800">
                      <td colSpan={2} className="py-3 px-4 text-white font-sans uppercase text-[11px]">
                        Totales del Equipo
                      </td>
                      <td className="py-3 px-3 text-right text-blue-400 font-black">{scoreA}</td>
                      <td className="py-3 px-3 text-right text-zinc-400">
                        {teamAPlayers.reduce((acc, p) => acc + (Number((game.playerStats?.[p.id] as any)?.assists) || 0), 0)}
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-400">
                        {teamAPlayers.reduce((acc, p) => acc + (Number((game.playerStats?.[p.id] as any)?.rebounds) || 0), 0)}
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-400">
                        {teamAPlayers.reduce((acc, p) => acc + (Number((game.playerStats?.[p.id] as any)?.fouls) || 0), 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Box Score Equipo B */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg">
              <div className="bg-zinc-900 px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-indigo-400">
                    {teamB?.shortName || game.teamBName.slice(0, 2).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-white text-sm">{game.teamBName}</h3>
                </div>
                <span className="text-sm font-mono font-black text-indigo-400">{scoreB} PUNTOS</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-zinc-500 bg-zinc-950/60 border-b border-zinc-800 uppercase text-[10px]">
                      <th className="py-2.5 px-4 font-bold text-zinc-400">#</th>
                      <th className="py-2.5 px-4 font-bold text-zinc-400">Jugador</th>
                      <th className="py-2.5 px-3 text-right font-black text-indigo-400">PTS</th>
                      <th className="py-2.5 px-3 text-right">AST</th>
                      <th className="py-2.5 px-3 text-right">REB</th>
                      <th className="py-2.5 px-3 text-right">FLS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {teamBPlayers.map((p) => {
                      const stat = (game.playerStats?.[p.id] || {}) as any;
                      const pts = Number(stat.points) || 0;
                      const ast = Number(stat.assists) || 0;
                      const reb = Number(stat.rebounds) || 0;
                      const fls = Number(stat.fouls) || 0;

                      return (
                        <tr key={p.id} className="hover:bg-zinc-800/40 transition">
                          <td className="py-2.5 px-4 text-zinc-400">#{p.number || "-"}</td>
                          <td className="py-2.5 px-4 font-sans font-bold text-zinc-200">
                            {p.name}
                            {mvp?.player.id === p.id && (
                              <span className="ml-1.5 text-amber-400 font-normal text-[10px]">⭐ MVP</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-indigo-400">{pts}</td>
                          <td className="py-2.5 px-3 text-right text-zinc-400">{ast}</td>
                          <td className="py-2.5 px-3 text-right text-zinc-400">{reb}</td>
                          <td className="py-2.5 px-3 text-right text-zinc-400">{fls}</td>
                        </tr>
                      );
                    })}

                    {teamBPlayers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-zinc-500 italic">
                          No hay jugadores registrados para este equipo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-950/80 font-bold border-t border-zinc-800">
                      <td colSpan={2} className="py-3 px-4 text-white font-sans uppercase text-[11px]">
                        Totales del Equipo
                      </td>
                      <td className="py-3 px-3 text-right text-indigo-400 font-black">{scoreB}</td>
                      <td className="py-3 px-3 text-right text-zinc-400">
                        {teamBPlayers.reduce((acc, p) => acc + (Number((game.playerStats?.[p.id] as any)?.assists) || 0), 0)}
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-400">
                        {teamBPlayers.reduce((acc, p) => acc + (Number((game.playerStats?.[p.id] as any)?.rebounds) || 0), 0)}
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-400">
                        {teamBPlayers.reduce((acc, p) => acc + (Number((game.playerStats?.[p.id] as any)?.fouls) || 0), 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PESTAÑA 2: JUGADA A JUGADA (PLAY-BY-PLAY EN VIVO) */}
        {/* ============================================================ */}
        {activeTab === "playbyplay" && (
          <div className="space-y-4">
            {/* Filtros de Cuartos */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedQuarterFilter("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedQuarterFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                }`}
              >
                Todas las Jugadas ({events.length})
              </button>
              {[1, 2, 3, 4].map((q) => (
                <button
                  key={q}
                  onClick={() => setSelectedQuarterFilter(q)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                    selectedQuarterFilter === q
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  Cuarto {q}
                </button>
              ))}
            </div>

            {/* Feed de Eventos */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 md:p-6 shadow-lg space-y-3">
              {filteredEvents.map((evt) => {
                const isTeamA = evt.teamId === game.teamAId;
                const playerObj = evt.playerId ? players.find((p) => p.id === evt.playerId) : null;
                const isPoint3 = evt.type === "3pt_made";
                const isPoint2 = evt.type === "2pt_made";
                const isPoint1 = evt.type === "ft_made";
                const isPointEvent = isPoint3 || isPoint2 || isPoint1;
                const pointsVal = isPoint3 ? 3 : isPoint2 ? 2 : isPoint1 ? 1 : 0;

                return (
                  <div
                    key={evt.id}
                    className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800/80 flex items-center justify-between gap-4 hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isTeamA
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                            : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                        }`}
                      >
                        {isTeamA ? (teamA?.shortName || "LOC") : (teamB?.shortName || "VIS")}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white truncate">
                            {playerObj ? `#${playerObj.number || ""} ${playerObj.name}` : (isTeamA ? game.teamAName : game.teamBName)}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            Q{evt.period || 1} • {evt.gameClock || evt.timestamp || ""}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 truncate">
                          {evt.description || (isPointEvent ? `Anotación de +${pointsVal} puntos` : "Evento del partido")}
                        </p>
                      </div>
                    </div>

                    {/* Marcador al momento */}
                    <div className="text-right shrink-0 font-mono">
                      {isPointEvent ? (
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded ${
                            isTeamA ? "bg-blue-500/20 text-blue-400" : "bg-indigo-500/20 text-indigo-400"
                          }`}
                        >
                          +{pointsVal} PTS
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">
                          {evt.type.replace("_", " ")}
                        </span>
                      )}
                      {evt.scoreA !== undefined && evt.scoreB !== undefined && (
                        <span className="block text-[11px] text-zinc-400 font-bold mt-1">
                          {evt.scoreA} - {evt.scoreB}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredEvents.length === 0 && (
                <div className="py-12 text-center text-zinc-500 text-xs italic">
                  No se registraron jugadas para el filtro seleccionado.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PESTAÑA 3: LÍDERES & COMPARATIVA */}
        {/* ============================================================ */}
        {activeTab === "comparison" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Líder Anotador Equipo A */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  🏀
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Máximo Anotador: {game.teamAName}</h4>
                  <p className="text-xs text-zinc-400">Líder ofensivo en este encuentro.</p>
                </div>
              </div>

              {teamLeaders.teamATop ? (
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-zinc-500">#{teamLeaders.teamATop.player.number}</span>
                    <h5 className="font-bold text-white text-base">{teamLeaders.teamATop.player.name}</h5>
                    <p className="text-xs text-zinc-400 font-mono">
                      {teamLeaders.teamATop.assists} Asistencias • {teamLeaders.teamATop.rebounds} Rebotes
                    </p>
                  </div>
                  <span className="text-3xl font-black font-mono text-blue-400">
                    {teamLeaders.teamATop.points} <span className="text-xs text-zinc-500 font-normal">PTS</span>
                  </span>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No hay anotadores registrados aún.</p>
              )}
            </div>

            {/* Líder Anotador Equipo B */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                  🏀
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Máximo Anotador: {game.teamBName}</h4>
                  <p className="text-xs text-zinc-400">Líder ofensivo en este encuentro.</p>
                </div>
              </div>

              {teamLeaders.teamBTop ? (
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-zinc-500">#{teamLeaders.teamBTop.player.number}</span>
                    <h5 className="font-bold text-white text-base">{teamLeaders.teamBTop.player.name}</h5>
                    <p className="text-xs text-zinc-400 font-mono">
                      {teamLeaders.teamBTop.assists} Asistencias • {teamLeaders.teamBTop.rebounds} Rebotes
                    </p>
                  </div>
                  <span className="text-3xl font-black font-mono text-indigo-400">
                    {teamLeaders.teamBTop.points} <span className="text-xs text-zinc-500 font-normal">PTS</span>
                  </span>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No hay anotadores registrados aún.</p>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PESTAÑA 4: ROSTERS / PLANTILLAS COMPLETAS */}
        {/* ============================================================ */}
        {activeTab === "rosters" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Roster Equipo A */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-blue-400 overflow-hidden shrink-0">
                  {teamA?.logo || (teamA as any)?.logoUrl || tournament.logoUrl ? (
                    <img src={teamA?.logo || (teamA as any)?.logoUrl || tournament.logoUrl} alt={game.teamAName} className="w-full h-full object-contain p-0.5" />
                  ) : (
                    <span>{teamA?.shortName || game.teamAName.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{game.teamAName}</h4>
                  <span className="text-xs font-mono text-zinc-400">{teamAPlayers.length} Jugadores Inscritos</span>
                </div>
              </div>

              <div className="space-y-2">
                {teamAPlayers.map((p) => (
                  <div key={p.id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-blue-400">
                        #{p.number || "-"}
                      </span>
                      <span className="font-bold text-xs text-white">{p.name}</span>
                    </div>
                    {p.position && (
                      <span className="text-[10px] font-mono text-zinc-500 uppercase px-2 py-0.5 bg-zinc-900 rounded">
                        {p.position}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Roster Equipo B */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-indigo-400 overflow-hidden shrink-0">
                  {teamB?.logo || (teamB as any)?.logoUrl || tournament.logoUrl ? (
                    <img src={teamB?.logo || (teamB as any)?.logoUrl || tournament.logoUrl} alt={game.teamBName} className="w-full h-full object-contain p-0.5" />
                  ) : (
                    <span>{teamB?.shortName || game.teamBName.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{game.teamBName}</h4>
                  <span className="text-xs font-mono text-zinc-400">{teamBPlayers.length} Jugadores Inscritos</span>
                </div>
              </div>

              <div className="space-y-2">
                {teamBPlayers.map((p) => (
                  <div key={p.id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-indigo-400">
                        #{p.number || "-"}
                      </span>
                      <span className="font-bold text-xs text-white">{p.name}</span>
                    </div>
                    {p.position && (
                      <span className="text-[10px] font-mono text-zinc-500 uppercase px-2 py-0.5 bg-zinc-900 rounded">
                        {p.position}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
