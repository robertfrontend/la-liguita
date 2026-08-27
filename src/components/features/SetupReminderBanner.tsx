"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tournament, TournamentTeam, TournamentGame } from "@/types/tournament";
import { subscribeToTournamentTeams, subscribeToTournamentGames } from "@/lib/db";
import { Sparkles, ArrowRight, X, AlertCircle, CheckCircle2 } from "lucide-react";

export function SetupReminderBanner({ tournament }: { tournament: Tournament }) {
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [games, setGames] = useState<TournamentGame[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournament.id) return;

    const unsubTeams = subscribeToTournamentTeams(tournament.id, (tList) => {
      setTeams(tList);
    });

    const unsubGames = subscribeToTournamentGames(tournament.id, (gList) => {
      setGames(gList);
      setLoading(false);
    });

    return () => {
      unsubTeams();
      unsubGames();
    };
  }, [tournament.id]);

  if (loading || isDismissed) return null;

  const needsTeams = teams.length < 2;
  const needsGames = games.length === 0;

  // Si ya tiene al menos 2 equipos y al menos 1 partido, la configuración esencial está lista
  if (!needsTeams && !needsGames) return null;

  return (
    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-zinc-900 border border-orange-500/30 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-orange-500/5 animate-in fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
          <Sparkles size={20} className="animate-pulse" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <span>Configuración Inicial del Torneo Pendiente</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-500 text-zinc-950">
              Paso a Paso
            </span>
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            {needsTeams && needsGames
              ? "Aún no has registrado equipos ni programado partidos en este torneo."
              : needsTeams
              ? "Debes registrar al menos 2 equipos para poder programar partidos oficiales."
              : "Tienes equipos registrados pero aún no has programado ningún encuentro."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
        <Link
          href={`/tournament/${tournament.id}/onboarding`}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-orange-500/20"
        >
          <span>Completar Paso a Paso</span>
          <ArrowRight size={14} />
        </Link>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          title="Ocultar por ahora"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
