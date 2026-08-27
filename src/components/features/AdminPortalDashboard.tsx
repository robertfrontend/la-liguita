"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { isSuperAdmin, canAdminTournament } from "@/lib/auth-helpers";
import { Tournament, TournamentGame, TournamentTeam, Referee } from "@/types/tournament";
import { 
  subscribeToAllTournaments, 
  subscribeToAssignedTournaments, 
  deleteTournamentFromDb 
} from "@/lib/db";
import { CreateTournamentModal } from "@/components/features/CreateTournamentModal";
import { 
  Trophy, 
  Calendar, 
  Users, 
  ShieldCheck, 
  Award, 
  Settings, 
  Plus, 
  Search, 
  Play, 
  ExternalLink, 
  Trash2, 
  Flame, 
  Sparkles, 
  Activity, 
  Building, 
  Mail, 
  Share2, 
  ChevronRight, 
  Sliders, 
  UserCheck,
  BarChart3,
  Layers,
  Globe,
  LogIn,
  LogOut,
  Clock,
  ArrowUpRight
} from "lucide-react";

type ActiveSection = "tournaments" | "games" | "teams" | "referees" | "public-portals";

export function AdminPortalDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>("tournaments");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<"all" | "amateur" | "pro">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const superAdmin = isSuperAdmin(user);

  // Carga de torneos en tiempo real según rol
  useEffect(() => {
    if (authLoading) return;

    if (user && superAdmin) {
      const unsub = subscribeToAllTournaments((list) => {
        setTournaments(list);
        setLoadingTournaments(false);
      });
      return () => unsub();
    } else if (user && user.email) {
      const unsub = subscribeToAssignedTournaments(user.email, (list) => {
        setTournaments(list);
        setLoadingTournaments(false);
      });
      return () => unsub();
    } else {
      setTournaments([]);
      setLoadingTournaments(false);
    }
  }, [user, authLoading, superAdmin]);

  const handleDeleteTournament = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el torneo "${name}"? Esta acción eliminará permanentemente todos sus equipos, partidos y estadísticas.`)) {
      await deleteTournamentFromDb(id);
    }
  };

  // Filtrado
  const filteredTournaments = tournaments.filter((t) => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.organizationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.adminEmails?.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTier = filterTier === "all" || t.tier === filterTier;
    return matchesSearch && matchesTier;
  });

  // Métricas
  const totalTournaments = tournaments.length;
  const proTournaments = tournaments.filter(t => t.tier === "pro").length;
  const amateurTournaments = tournaments.filter(t => t.tier === "amateur").length;
  const totalOrganizers = new Set(tournaments.flatMap(t => t.adminEmails || [])).size;

  // Si no está autenticado, mostramos la pantalla de login institucional para administradores
  if (!authLoading && !user) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 bg-zinc-950 text-white">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mx-auto">
            <ShieldCheck size={36} />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              La Liguita • Panel Administrativo
            </h1>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Plataforma privada y cerrada para la gestión oficial de ligas, torneos y mesas técnicas.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 text-left text-xs space-y-2 text-zinc-400">
            <div className="flex items-center gap-2 font-bold text-zinc-200">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              Acceso Restringido
            </div>
            <p className="text-[11px] leading-normal text-zinc-400">
              Solo los Super Administradores y Organizadores con email autorizado pueden ingresar al sistema de gestión.
            </p>
          </div>

          <Link
            href="/login"
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <LogIn size={18} />
            <span>Iniciar Sesión como Administrador</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 antialiased">
      {/* Sidebar de Navegación del SaaS */}
      <aside className="w-64 border-r border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl flex flex-col justify-between shrink-0 p-4">
        <div className="space-y-6">
          {/* Header del Perfil de Admin */}
          <div className={`p-3.5 rounded-2xl border transition ${
            superAdmin 
              ? "bg-zinc-900/90 border-blue-500/30 shadow-lg shadow-blue-500/5" 
              : "bg-zinc-900 border-zinc-800"
          }`}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                superAdmin 
                  ? "bg-blue-500/10 border border-blue-500/30 text-blue-400" 
                  : "bg-orange-500/20 border border-orange-500/30 text-orange-400"
              }`}>
                <ShieldCheck size={16} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${
                superAdmin ? "text-blue-400" : "text-orange-400"
              }`}>
                {superAdmin ? "Super Admin" : "Organizador"}
              </span>
            </div>
            <div className="text-xs font-bold text-white truncate">{user?.displayName || "Administrador"}</div>
            <div className="text-[10px] text-zinc-400 truncate font-mono">{user?.email}</div>

            {superAdmin && (
              <Link
                href="/superadmin"
                className="mt-2.5 w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg transition flex items-center justify-center gap-1 shadow-sm"
              >
                <span>Panel Super Admin</span>
                <ArrowUpRight size={13} />
              </Link>
            )}
          </div>

          {/* Menú de Módulos */}
          <nav className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-black text-zinc-400 uppercase tracking-wider">
              Gestión de Torneos
            </div>

            <button
              onClick={() => setActiveSection("tournaments")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeSection === "tournaments"
                  ? "bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trophy size={16} />
                <span>Torneos & Ligas</span>
              </div>
              <span className="text-[10px] font-mono">{tournaments.length}</span>
            </button>

            <button
              onClick={() => setActiveSection("games")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeSection === "games"
                  ? "bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar size={16} />
                <span>Partidos & Live</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection("teams")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeSection === "teams"
                  ? "bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users size={16} />
                <span>Clubes & Equipos</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection("referees")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeSection === "referees"
                  ? "bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserCheck size={16} />
                <span>Cuerpo Arbitral</span>
              </div>
            </button>

            <div className="pt-4 px-3 py-1.5 text-[10px] font-black text-zinc-400 uppercase tracking-wider">
              Difusión & Fans
            </div>

            <button
              onClick={() => setActiveSection("public-portals")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeSection === "public-portals"
                  ? "bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Globe size={16} />
                <span>Portales Públicos</span>
              </div>
              <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">Fans</span>
            </button>
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="space-y-2 pt-4 border-t border-zinc-800/80">
          {superAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-zinc-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
            >
              <Plus size={16} />
              <span>Crear Nuevo Torneo</span>
            </button>
          )}

          <button
            onClick={() => {
              if (confirm("¿Deseas cerrar la sesión administrativa?")) logout();
            }}
            className="w-full py-2 text-xs font-bold text-zinc-400 hover:text-red-400 hover:bg-zinc-900 rounded-xl transition flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Área de Trabajo Principal */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-6xl space-y-6">
        {/* Top Header con Buscador y Métricas */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {activeSection === "tournaments" && "Torneos & Competiciones"}
                {activeSection === "games" && "Centro de Partidos & Mesas Técnicas"}
                {activeSection === "teams" && "Clubes & Equipos Registrados"}
                {activeSection === "referees" && "Cuerpo Arbitral & Colegiados"}
                {activeSection === "public-portals" && "Portales Públicos para Jugadores y Fanáticos"}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Panel de control maestro • La Liguita Sports SaaS
            </p>
          </div>

          {superAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-xs rounded-xl transition shadow-lg shadow-orange-500/20"
            >
              <Plus size={16} />
              <span>Nuevo Torneo</span>
            </button>
          )}
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-2xl">
            <div className="text-[10px] font-bold uppercase text-zinc-400">Total Torneos</div>
            <div className="text-2xl font-black text-white font-mono mt-1">{totalTournaments}</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-2xl">
            <div className="text-[10px] font-bold uppercase text-zinc-400">Torneos PRO FIBA</div>
            <div className="text-2xl font-black text-orange-400 font-mono mt-1">{proTournaments}</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-2xl">
            <div className="text-[10px] font-bold uppercase text-zinc-400">Liguitas Amateur</div>
            <div className="text-2xl font-black text-zinc-300 font-mono mt-1">{amateurTournaments}</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-2xl">
            <div className="text-[10px] font-bold uppercase text-zinc-400">Organizadores Asignados</div>
            <div className="text-2xl font-black text-blue-400 font-mono mt-1">{totalOrganizers}</div>
          </div>
        </div>

        {/* SECCIÓN 1: TORNEOS & COMPETICIONES */}
        {activeSection === "tournaments" && (
          <div className="space-y-4">
            {/* Barra de Filtros */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="text"
                  placeholder="Buscar torneo, organizador..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex gap-1.5 w-full sm:w-auto">
                {(["all", "pro", "amateur"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterTier(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                      filterTier === t
                        ? "bg-zinc-100 text-zinc-950"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"
                    }`}
                  >
                    {t === "all" ? "Todos" : t === "pro" ? "PRO" : "Amateur"}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabla de Torneos */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                    <th className="py-3.5 px-4">Torneo / Organización</th>
                    <th className="py-3.5 px-3 text-center">Deporte</th>
                    <th className="py-3.5 px-3 text-center">Nivel</th>
                    <th className="py-3.5 px-4">Organizador Asignado</th>
                    <th className="py-3.5 px-4 text-right">Panel / Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {filteredTournaments.map((t) => {
                    const isPro = t.tier === "pro";
                    const organizer = t.adminEmails?.[0] || "Sin asignar";

                    return (
                      <tr key={t.id} className="hover:bg-zinc-800/30 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-orange-400 text-sm">
                              {t.sport === "soccer" ? "⚽" : "🏀"}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{t.name}</div>
                              <div className="text-[11px] text-zinc-400">{t.organizationName || "Liga Oficial"}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center font-bold text-zinc-300 uppercase text-[10px]">
                          {t.sport === "soccer" ? "Fútbol" : "Baloncesto"}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          {isPro ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950">
                              <Sparkles size={10} className="fill-current" /> PRO
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                              Amateur
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-zinc-300">
                          <div className="flex items-center gap-1.5">
                            <Mail size={13} className="text-orange-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{organizer}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/tournament/${t.id}/games`}
                              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-sm"
                            >
                              <span>Administrar</span>
                              <ArrowUpRight size={14} />
                            </Link>

                            <Link
                              href={`/t/${t.id}`}
                              target="_blank"
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition border border-zinc-700"
                              title="Ver Portal Público"
                            >
                              <Globe size={14} />
                            </Link>

                            {superAdmin && (
                              <button
                                onClick={() => handleDeleteTournament(t.id, t.name)}
                                className="p-1.5 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition border border-zinc-700"
                                title="Eliminar Torneo"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredTournaments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-500">
                        No se encontraron torneos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECCIÓN 2: CENTRO DE PARTIDOS & MESAS TÉCNICAS */}
        {activeSection === "games" && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-400">
              Selecciona el torneo en el que deseas programar encuentros o iniciar la consola de mesa técnica en vivo:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournaments.map((t) => (
                <div key={t.id} className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                      <span className="font-bold uppercase">{t.sport === "soccer" ? "⚽ Fútbol" : "🏀 Baloncesto"}</span>
                      <span className="font-mono text-[10px]">{t.tier.toUpperCase()}</span>
                    </div>
                    <h4 className="font-bold text-white text-base">{t.name}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">{t.organizationName || "Organización"}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-800 flex gap-2">
                    <Link
                      href={`/tournament/${t.id}/games`}
                      className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-lg transition text-center"
                    >
                      Calendario de Juegos
                    </Link>
                    {t.tier === "pro" && (
                      <Link
                        href={`/tournament/${t.id}/live-console`}
                        className="py-2 px-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 font-bold text-xs rounded-lg transition flex items-center gap-1"
                      >
                        <Play size={12} className="fill-current" />
                        <span>Mesa Live</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN 3: CLUBES & EQUIPOS */}
        {activeSection === "teams" && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-400">
              Administración de clubes y delegaciones deportivas por torneo:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tournaments.map((t) => (
                <Link
                  key={t.id}
                  href={`/tournament/${t.id}/teams`}
                  className="bg-zinc-900/60 border border-zinc-800 hover:border-orange-500/50 p-5 rounded-2xl transition block group"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-orange-400 font-bold mb-3 group-hover:scale-105 transition">
                    <Users size={20} />
                  </div>
                  <h4 className="font-bold text-white text-sm truncate">{t.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1">Gestionar Equipos & Rosters →</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN 4: CUERPO ARBITRAL */}
        {activeSection === "referees" && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-400">
              Asignación y registro de jueces y oficiales de mesa técnica:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tournaments.map((t) => (
                <Link
                  key={t.id}
                  href={`/tournament/${t.id}/referees`}
                  className="bg-zinc-900/60 border border-zinc-800 hover:border-orange-500/50 p-5 rounded-2xl transition block group"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-orange-400 font-bold mb-3 group-hover:scale-105 transition">
                    <UserCheck size={20} />
                  </div>
                  <h4 className="font-bold text-white text-sm truncate">{t.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1">Control de Árbitros & Licencias →</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN 5: PORTALES PÚBLICOS */}
        {activeSection === "public-portals" && (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-xs text-zinc-400">
              Los siguientes enlaces son las páginas públicas abiertas (sin login) para que jugadores, directores técnicos y fanáticos sigan la clasificación y marcadores en vivo:
            </div>

            <div className="space-y-3">
              {tournaments.map((t) => (
                <div key={t.id} className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-white text-sm">{t.name}</h4>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">/t/{t.id}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/t/${t.id}`;
                        navigator.clipboard.writeText(url);
                        alert(`¡Enlace copiado!: ${url}`);
                      }}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5 border border-zinc-700"
                    >
                      <Share2 size={13} />
                      <span>Copiar Enlace</span>
                    </button>

                    <Link
                      href={`/t/${t.id}`}
                      target="_blank"
                      className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                    >
                      <span>Abrir Portal</span>
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Creación */}
      <CreateTournamentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
