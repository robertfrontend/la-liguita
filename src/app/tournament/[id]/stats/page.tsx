"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Tournament } from "@/types/tournament";
import { subscribeToTournament } from "@/lib/db";
import { BarChart3, Sparkles, TrendingUp, Award, Zap, Shield, Flame } from "lucide-react";

export default function TournamentStatsPage() {
  const params = useParams();
  const tournamentId = params?.id as string;
  const [tournament, setTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    if (!tournamentId) return;
    const unsub = subscribeToTournament(tournamentId, setTournament);
    return () => unsub();
  }, [tournamentId]);

  const isPro = tournament?.tier === "pro";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Estadísticas Avanzadas</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 shadow-sm">
              PRO FIBA/NBA Box Score
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Métricas de eficiencia, rebotes ofensivos/defensivos, efectividad de tiros de campo (2PT, 3PT, TL) y +/-.
          </p>
        </div>
      </div>

      {/* Top Performers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-bold uppercase tracking-wider">Líder Anotador</span>
            <Flame size={16} className="text-orange-500" />
          </div>
          <div className="text-2xl font-black text-white">28.4 <span className="text-xs font-normal text-zinc-400">PPG</span></div>
          <div className="text-xs text-orange-400 font-bold mt-1">Carlos Rodríguez (#10)</div>
          <div className="text-[11px] text-zinc-500">Club Los Cajuilitos</div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-bold uppercase tracking-wider">Líder Asistencias</span>
            <Award size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-white">9.2 <span className="text-xs font-normal text-zinc-400">APG</span></div>
          <div className="text-xs text-blue-400 font-bold mt-1">Manuel Santos (#7)</div>
          <div className="text-[11px] text-zinc-500">Club Santa Rosa</div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-bold uppercase tracking-wider">Líder Rebotes</span>
            <Shield size={16} className="text-green-500" />
          </div>
          <div className="text-2xl font-black text-white">12.8 <span className="text-xs font-normal text-zinc-400">RPG</span></div>
          <div className="text-xs text-green-400 font-bold mt-1">José Peguero (#15)</div>
          <div className="text-[11px] text-zinc-500">Club Pueblo Arriba</div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-bold uppercase tracking-wider">Mayor Eficiencia</span>
            <Sparkles size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-white">32.6 <span className="text-xs font-normal text-zinc-400">EFF</span></div>
          <div className="text-xs text-amber-400 font-bold mt-1">Carlos Rodríguez (#10)</div>
          <div className="text-[11px] text-zinc-500">Club Los Cajuilitos</div>
        </div>
      </div>

      {/* Tabla Box Score Completa */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="font-bold text-white text-sm">Tabla General de Jugadores (Box Score PRO)</h3>
          <span className="text-xs text-zinc-400">Filtrar por Jornada / Acumulado</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-950/90 text-[10px] font-black uppercase text-zinc-400 tracking-wider border-b border-zinc-800">
                <th className="py-3 px-4">Jugador</th>
                <th className="py-3 px-4">Equipo</th>
                <th className="py-3 px-3 text-center">PTS</th>
                <th className="py-3 px-3 text-center">AST</th>
                <th className="py-3 px-3 text-center">REB (O/D)</th>
                <th className="py-3 px-3 text-center">ROB</th>
                <th className="py-3 px-3 text-center">BLK</th>
                <th className="py-3 px-3 text-center">2PT (M/A)</th>
                <th className="py-3 px-3 text-center">3PT (M/A)</th>
                <th className="py-3 px-3 text-center">TL (M/A)</th>
                <th className="py-3 px-3 text-center">PER</th>
                <th className="py-3 px-3 text-center">EFF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              <tr className="hover:bg-zinc-800/30 transition">
                <td className="py-3.5 px-4 font-sans font-bold text-white">Carlos Rodríguez (#10)</td>
                <td className="py-3.5 px-4 font-sans text-zinc-400">Los Cajuilitos</td>
                <td className="py-3.5 px-3 text-center font-bold text-orange-400">28</td>
                <td className="py-3.5 px-3 text-center text-zinc-300">6</td>
                <td className="py-3.5 px-3 text-center text-zinc-300">8 (3/5)</td>
                <td className="py-3.5 px-3 text-center text-zinc-300">3</td>
                <td className="py-3.5 px-3 text-center text-zinc-300">1</td>
                <td className="py-3.5 px-3 text-center text-zinc-400">8/12 (66%)</td>
                <td className="py-3.5 px-3 text-center text-zinc-400">3/6 (50%)</td>
                <td className="py-3.5 px-3 text-center text-zinc-400">3/4 (75%)</td>
                <td className="py-3.5 px-3 text-center text-red-400">2</td>
                <td className="py-3.5 px-3 text-center font-bold text-amber-400">+34</td>
              </tr>
              <tr className="hover:bg-zinc-800/30 transition">
                <td className="py-3.5 px-4 font-sans font-bold text-white">Manuel Santos (#7)</td>
                <td className="py-3.5 px-4 font-sans text-zinc-400">Santa Rosa</td>
                <td className="py-3.5 px-3 text-center font-bold text-orange-400">19</td>
                <td className="py-3.5 px-3 text-center text-zinc-300">11</td>
                <td className="py-3.5 px-3 text-center text-zinc-300">4 (1/3)</td>
                <td className="py-3.5 px-3 text-center text-zinc-300">4</td>
                <td className="py-3.5 px-3 text-center text-zinc-300">0</td>
                <td className="py-3.5 px-3 text-center text-zinc-400">5/8 (62%)</td>
                <td className="py-3.5 px-3 text-center text-zinc-400">2/5 (40%)</td>
                <td className="py-3.5 px-3 text-center text-zinc-400">3/3 (100%)</td>
                <td className="py-3.5 px-3 text-center text-red-400">3</td>
                <td className="py-3.5 px-3 text-center font-bold text-amber-400">+28</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
