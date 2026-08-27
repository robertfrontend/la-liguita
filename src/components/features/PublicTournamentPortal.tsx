"use client";

import { useEffect, useState } from "react";
import { Tournament, TournamentGame, TournamentTeam } from "@/types/tournament";
import { 
  subscribeToTournament, 
  subscribeToTournamentGames, 
  subscribeToTournamentTeams 
} from "@/lib/db";
import { 
  Trophy, 
  Calendar, 
  Users, 
  BarChart3, 
  Share2, 
  Flame, 
  Sparkles, 
  Activity,
  CheckCircle,
  ExternalLink
} from "lucide-react";

export function PublicTournamentPortal({ tournamentId }: { tournamentId: string }) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [games, setGames] = useState<TournamentGame[]>([]);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"standings" | "games" | "stats" | "teams">("standings");

  useEffect(() => {
    if (!tournamentId) return;

    const unsubTournament = subscribeToTournament(tournamentId, (t) => {
      setTournament(t);
    });

    const unsubGames = subscribeToTournamentGames(tournamentId, (gList) => {
      setGames(gList);
    });

    const unsubTeams = subscribeToTournamentTeams(tournamentId, (tList) => {
      setTeams(tList);
      setLoading(false);
    });

    return () => {
      unsubTournament();
      unsubGames();
      unsubTeams();
    };
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Cargando portal del torneo...
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-xl font-bold text-white mb-2">Torneo no encontrado</h1>
        <p className="text-xs text-zinc-400">El torneo solicitado no existe o el enlace es incorrecto.</p>
      </div>
    );
  }

  const isPro = tournament.tier === "pro";
  const isBasketball = tournament.sport === "basketball";

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: tournament.name,
        text: `Sigue en vivo los resultados de ${tournament.name} en La Liguita 🏀`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("¡Enlace copiado al portapapeles!");
    }
  };

  const sortedTeams = [...teams].sort((a, b) => {
    const diffWins = b.wins - a.wins;
    if (diffWins !== 0) return diffWins;
    return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased pb-20">
      {/* Banner / Header del Torneo */}
      <header className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800/80 pt-8 pb-6 px-4 md:px-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                {isBasketball ? "🏀 Baloncesto" : "⚽ Fútbol"}
              </span>
              {isPro && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 shadow-sm">
                  <Sparkles size={10} className="fill-current" /> PRO FIBA
                </span>
              )}
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg transition border border-zinc-700/60"
            >
              <Share2 size={13} />
              <span>Compartir</span>
            </button>
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {tournament.name}
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 mt-1 font-medium">
              {tournament.organizationName || "Competición Oficial"} • Temporada 2026
            </p>
          </div>

          {/* Tabs de Navegación Pública */}
          <div className="flex gap-2 border-b border-zinc-800 pt-4 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("standings")}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
                activeTab === "standings"
                  ? "border-orange-500 text-orange-400"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              Posiciones
            </button>

            <button
              onClick={() => setActiveTab("games")}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
                activeTab === "games"
                  ? "border-orange-500 text-orange-400"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              Partidos & Resultados ({games.length})
            </button>

            {isPro && (
              <button
                onClick={() => setActiveTab("stats")}
                className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
                  activeTab === "stats"
                    ? "border-orange-500 text-orange-400"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                Líderes & Stats PRO
              </button>
            )}

            <button
              onClick={() => setActiveTab("teams")}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
                activeTab === "teams"
                  ? "border-orange-500 text-orange-400"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              Equipos ({teams.length})
            </button>
          </div>
        </div>
      </header>

      {/* Contenido según Tab */}
      <main className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Tab Posiciones */}
        {activeTab === "standings" && (
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Equipo</th>
                    <th className="py-3.5 px-4 text-center">PJ</th>
                    <th className="py-3.5 px-4 text-center">G</th>
                    <th className="py-3.5 px-4 text-center">P</th>
                    <th className="py-3.5 px-4 text-center">PF</th>
                    <th className="py-3.5 px-4 text-center">PC</th>
                    <th className="py-3.5 px-4 text-center">DIF</th>
                    <th className="py-3.5 px-4 text-center">% Victorias</th>
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
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-black text-orange-400 border border-zinc-700">
                            {team.shortName || team.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span>{team.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-zinc-300">{gamesPlayed}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-green-400">{team.wins}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-red-400">{team.losses}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-zinc-400">{team.pointsFor}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-zinc-400">{team.pointsAgainst}</td>
                        <td className={`py-3.5 px-4 text-center font-mono font-bold ${
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

        {/* Tab Partidos */}
        {activeTab === "games" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {games.map((game) => (
              <div key={game.id} className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
                <div className="flex justify-between items-center text-xs text-zinc-400 mb-3">
                  <span className="font-bold uppercase tracking-wider">{game.roundName}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    game.isFinished ? "bg-zinc-800 text-zinc-300" : "bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse"
                  }`}>
                    {game.isFinished ? "Finalizado" : "En Vivo"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-4 border-y border-zinc-800/60 my-2">
                  <div className="flex-1 text-center">
                    <h4 className="font-bold text-white text-base truncate">{game.teamAName}</h4>
                    <span className="text-3xl font-black text-orange-400 font-mono mt-1 block">{game.scoreA}</span>
                  </div>

                  <span className="text-zinc-600 font-black italic px-4">VS</span>

                  <div className="flex-1 text-center">
                    <h4 className="font-bold text-white text-base truncate">{game.teamBName}</h4>
                    <span className="text-3xl font-black text-blue-400 font-mono mt-1 block">{game.scoreB}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 text-xs text-zinc-500">
                  <span>{new Date(game.date).toLocaleDateString()}</span>
                  <span className="text-[11px] text-zinc-400">Marcador Oficial</span>
                </div>
              </div>
            ))}

            {games.length === 0 && (
              <div className="col-span-full py-16 text-center text-zinc-500 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                No hay partidos programados todavía.
              </div>
            )}
          </div>
        )}

        {/* Tab Estadísticas PRO */}
        {activeTab === "stats" && isPro && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
                <div className="text-xs text-zinc-400 uppercase font-bold mb-1">Máximo Anotador</div>
                <div className="text-2xl font-black text-orange-400">28.4 PPG</div>
                <div className="text-xs font-bold text-white mt-1">Carlos Rodríguez (#10)</div>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
                <div className="text-xs text-zinc-400 uppercase font-bold mb-1">Líder Asistencias</div>
                <div className="text-2xl font-black text-blue-400">9.2 APG</div>
                <div className="text-xs font-bold text-white mt-1">Manuel Santos (#7)</div>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
                <div className="text-xs text-zinc-400 uppercase font-bold mb-1">Líder Rebotes</div>
                <div className="text-2xl font-black text-green-400">12.8 RPG</div>
                <div className="text-xs font-bold text-white mt-1">José Peguero (#15)</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Equipos */}
        {activeTab === "teams" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div key={team.id} className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-orange-400 text-lg border border-zinc-700">
                  {team.shortName || team.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">{team.name}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{team.wins}G - {team.losses}P</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
