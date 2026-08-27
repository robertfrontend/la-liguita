"use client";

import { useEffect, useState, useMemo } from "react";
import { Tournament } from "@/types/tournament";
import { subscribeToAllTournaments } from "@/lib/db";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  Trophy, 
  Calendar, 
  Users, 
  ArrowRight, 
  Search, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  ChevronRight,
  ExternalLink,
  Lock,
  Layers,
  Activity
} from "lucide-react";
import Link from "next/link";

export function PublicTournamentDirectory() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sportFilter, setSportFilter] = useState<"all" | "basketball" | "soccer">("all");

  useEffect(() => {
    const unsub = subscribeToAllTournaments((list) => {
      setTournaments(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      const matchesSearch = 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.organizationName || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSport = sportFilter === "all" || t.sport === sportFilter;

      return matchesSearch && matchesSport;
    });
  }, [tournaments, searchQuery, sportFilter]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-24 selection:bg-blue-500/30">
      {/* HEADER PRINCIPAL / HERO */}
      <header className="border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900/80 via-zinc-950/90 to-zinc-950 pt-10 pb-8 px-4 md:px-8 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Top Line con Acceso Administrativo si el usuario está logueado */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Portal Público Oficial • Temporada 2026
              </span>
            </div>

            {user ? (
              <Link
                href="/superadmin"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white rounded-xl text-xs font-bold border border-zinc-800 transition shadow-sm"
              >
                <Lock size={12} className="text-emerald-400" />
                <span>Panel Administrativo</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-bold border border-zinc-800 transition"
              >
                <span>Acceso Organizadores</span>
              </Link>
            )}
          </div>

          {/* Título Principal */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Torneos & Competiciones
            </h1>
            <p className="text-sm md:text-base text-zinc-400 max-w-2xl font-medium">
              Sigue en vivo los resultados, actas oficiales, calendario de partidos y tabla de posiciones de todas las ligas deportivas.
            </p>
          </div>

          {/* Barra de Búsqueda y Filtro de Deporte */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Buscar torneo o liga por nombre u organización..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="flex gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 shrink-0">
              <button
                onClick={() => setSportFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  sportFilter === "all" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Todos ({tournaments.length})
              </button>
              <button
                onClick={() => setSportFilter("basketball")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  sportFilter === "basketball" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>🏀 Baloncesto</span>
              </button>
              <button
                onClick={() => setSportFilter("soccer")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  sportFilter === "soccer" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>⚽ Fútbol</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* LISTADO DE TORNEOS TIPO CARD FULL-WIDTH (UNO DEBAJO DE OTRO) */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 pt-8 space-y-4">
        {loading ? (
          <div className="py-24 text-center text-zinc-500 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-xs font-semibold">Cargando competiciones disponibles...</p>
          </div>
        ) : filteredTournaments.length > 0 ? (
          filteredTournaments.map((t) => {
            const isBasketball = t.sport === "basketball";
            const isPro = t.tier === "pro";
            const publicUrl = `/t/${t.slug || t.id}`;

            return (
              <div
                key={t.id}
                className="w-full bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700/90 rounded-3xl p-6 transition duration-200 shadow-xl group relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                {/* Acento de Luz Sutil */}
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 to-indigo-600 opacity-80 group-hover:opacity-100 transition" />

                {/* Sección Izquierda: Escudo/Logo e Información Principal */}
                <div className="flex items-start md:items-center gap-5 min-w-0 flex-1 pl-2">
                  {/* Escudo / Logo */}
                  {t.logoUrl ? (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-zinc-950 border border-zinc-800 p-2 flex items-center justify-center shrink-0 shadow-lg overflow-hidden group-hover:border-zinc-700 transition">
                      <img src={t.logoUrl} alt={t.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-zinc-800/90 border border-zinc-700/80 flex items-center justify-center font-black text-blue-400 text-2xl shrink-0 shadow-lg group-hover:border-blue-500/50 transition">
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Metadatos y Título */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    {/* Tags Superiores */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {t.organizationName || "Competición Oficial"}
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {isBasketball ? "🏀 Baloncesto" : "⚽ Fútbol"}
                      </span>

                      {isPro && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          PRO FIBA
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>En Disputa</span>
                      </span>
                    </div>

                    {/* Nombre del Torneo */}
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight truncate group-hover:text-blue-400 transition">
                      {t.name}
                    </h2>

                    {/* Fila de Características */}
                    <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono pt-0.5 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Users size={13} className="text-blue-400" />
                        <span>{t.settings?.maxTeams || 8} Equipos</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-zinc-500" />
                        <span>Temporada 2026</span>
                      </span>
                      <span>•</span>
                      <span className="text-zinc-500">
                        /t/{t.slug || t.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sección Derecha: Botón de Acción Principal */}
                <div className="w-full md:w-auto shrink-0 pl-2 md:pl-0 pt-2 md:pt-0">
                  <Link
                    href={publicUrl}
                    className="w-full md:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs rounded-2xl transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 group/btn"
                  >
                    <span>Ver Calendario & Posiciones</span>
                    <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800 p-8 space-y-3">
            <Trophy className="h-12 w-12 text-zinc-600 mx-auto" />
            <h3 className="font-bold text-white text-lg">No se encontraron torneos</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              No hay competiciones que coincidan con los filtros de búsqueda actuales.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
