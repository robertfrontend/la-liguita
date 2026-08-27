"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { TournamentTeam, Tournament, TournamentGame } from "@/types/tournament";
import { subscribeToTournamentTeams, subscribeToTournament, subscribeToTournamentGames } from "@/lib/db";
import { Trophy, TrendingUp, Award } from "lucide-react";

export default function TournamentStandingsPage() {
  const params = useParams();
  const tournamentId = params?.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [games, setGames] = useState<TournamentGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournamentId) return;

    const unsubTournament = subscribeToTournament(tournamentId, (t) => {
      setTournament(t);
    });

    const unsubTeams = subscribeToTournamentTeams(tournamentId, (tList) => {
      setTeams(tList);
    });

    const unsubGames = subscribeToTournamentGames(tournamentId, (gList) => {
      setGames(gList);
      setLoading(false);
    });

    return () => {
      unsubTournament();
      unsubTeams();
      unsubGames();
    };
  }, [tournamentId]);

  const sortedTeams = useMemo(() => {
    const tableMap: Record<string, {
      id: string;
      name: string;
      shortName?: string;
      wins: number;
      losses: number;
      ties: number;
      pointsFor: number;
      pointsAgainst: number;
    }> = {};

    teams.forEach((t) => {
      tableMap[t.id] = {
        id: t.id,
        name: t.name,
        shortName: t.shortName,
        wins: t.wins || 0,
        losses: t.losses || 0,
        ties: 0,
        pointsFor: t.pointsFor || 0,
        pointsAgainst: t.pointsAgainst || 0,
      };
    });

    games.forEach((g) => {
      const isFin = g.isFinished || g.status === "finished";
      if (isFin) {
        let scoreA = Number(g.scoreA) || 0;
        let scoreB = Number(g.scoreB) || 0;

        if (scoreA === 0 && scoreB === 0 && g.playerStats) {
          Object.keys(g.playerStats).forEach((pId) => {
            const pts = Number((g.playerStats?.[pId] as any)?.points) || 0;
            // Si el jugador pertenece a teamA o teamB
            // Si no podemos determinar el teamId, se mantiene
          });
        }

        const tA = g.teamAId;
        const tB = g.teamBId;

        if (tableMap[tA]) {
          tableMap[tA].pointsFor += scoreA;
          tableMap[tA].pointsAgainst += scoreB;
          if (scoreA > scoreB) tableMap[tA].wins += 1;
          else if (scoreA < scoreB) tableMap[tA].losses += 1;
          else tableMap[tA].ties += 1;
        }

        if (tableMap[tB]) {
          tableMap[tB].pointsFor += scoreB;
          tableMap[tB].pointsAgainst += scoreA;
          if (scoreB > scoreA) tableMap[tB].wins += 1;
          else if (scoreB < scoreA) tableMap[tB].losses += 1;
          else tableMap[tB].ties += 1;
        }
      }
    });

    return Object.values(tableMap).sort((a, b) => {
      const diffWins = b.wins - a.wins;
      if (diffWins !== 0) return diffWins;
      const diffDiff = (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
      if (diffDiff !== 0) return diffDiff;
      return b.pointsFor - a.pointsFor;
    });
  }, [teams, games]);

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Trophy className="text-orange-400" />
          Tabla de Posiciones
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Clasificación oficial actualizada en tiempo real según victorias, derrotas y diferencia de puntos/goles.
        </p>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-black uppercase text-zinc-400 tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Equipo</th>
                <th className="py-3 px-4 text-center">PJ</th>
                <th className="py-3 px-4 text-center">G</th>
                <th className="py-3 px-4 text-center">P</th>
                <th className="py-3 px-4 text-center">PF</th>
                <th className="py-3 px-4 text-center">PC</th>
                <th className="py-3 px-4 text-center">DIF</th>
                <th className="py-3 px-4 text-center">% Victorias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {sortedTeams.map((team, idx) => {
                const gamesPlayed = team.wins + team.losses;
                const winRate = gamesPlayed > 0 ? Math.round((team.wins / gamesPlayed) * 100) : 0;
                const diff = team.pointsFor - team.pointsAgainst;

                return (
                  <tr key={team.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3.5 px-4 text-center font-black">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs ${
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
                    No hay equipos con estadísticas registradas todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
