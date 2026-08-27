"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { isSuperAdmin } from "@/lib/auth-helpers";
import { Tournament } from "@/types/tournament";
import { 
  subscribeToAllTournaments, 
  subscribeToAssignedTournaments, 
  deleteTournamentFromDb 
} from "@/lib/db";
import { CreateTournamentModal } from "@/components/features/CreateTournamentModal";
import { AdminGatekeeper } from "@/components/features/AdminGatekeeper";
import { 
  Trophy, 
  Calendar, 
  Users, 
  ShieldCheck, 
  Plus, 
  Search, 
  ExternalLink, 
  Trash2, 
  Sparkles, 
  Activity, 
  Building, 
  Mail, 
  Globe, 
  LogIn, 
  Clock, 
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Lock,
  Layers
} from "lucide-react";

type ActiveSection = "tournaments" | "games" | "teams" | "referees" | "public-portals";

export function AdminPortalDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>("tournaments");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<"all" | "amateur" | "pro">("all");
  const [filterSport, setFilterSport] = useState<"all" | "basketball" | "soccer">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const superAdmin = isSuperAdmin(user);

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
    const matchesSport = filterSport === "all" || t.sport === filterSport;
    return matchesSearch && matchesTier && matchesSport;
  });

  // Métricas
  const totalTournaments = tournaments.length;
  const proTournaments = tournaments.filter(t => t.tier === "pro").length;
  const amateurTournaments = tournaments.filter(t => t.tier === "amateur").length;
  const totalOrganizers = new Set(tournaments.flatMap(t => t.adminEmails || [])).size;

  // Si no está autenticado, mostramos el Gatekeeper protegido por PIN único
  if (!authLoading && !user) {
    return (
      <div className="py-8">
        <AdminGatekeeper
          title="Management Suite • Acceso Administrativo"
          subtitle="Para ingresar a la consola de gestión de torneos, introduce el Código o PIN Único proporcionado por el Super Administrador."
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] bg-zinc-950 text-zinc-100 antialiased font-sans selection:bg-emerald-500/30">
      {/* Sidebar de Navegación del SaaS */}
      <aside className="w-64 border-r border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl flex flex-col justify-between shrink-0 p-4">
        <div className="space-y-5">
          {/* Header del Perfil de Admin */}
          <div className={`p-3.5 rounded-xl border transition ${
            superAdmin 
              ? "bg-zinc-900/90 border-emerald-500/30 shadow-sm" 
              : "bg-zinc-900 border-zinc-800"
          }`}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-emerald-500/15 text-emerald-400">
                <ShieldCheck size={14} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                {superAdmin ? "Super Admin" : "Organizador"}
              </span>
            </div>
            <div className="text-xs font-bold text-white truncate">{user?.displayName || "Administrador"}</div>
            <div className="text-[10px] text-zinc-500 truncate font-mono">{user?.email}</div>

            {superAdmin && (
              <Link
                href="/superadmin"
                className="mt-2.5 w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase rounded-lg transition flex items-center justify-center gap-1 shadow-sm"
              >
                <span>Panel Super Admin</span>
                <ArrowUpRight size={12} />
              </Link>
            )}
          </div>

          {/* Menú de Módulos */}
          <nav className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Gestión Principal
            </div>

            <button
              onClick={() => setActiveSection("tournaments")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeSection === "tournaments"
                  ? "bg-zinc-800/90 text-white border-l-2 border-l-emerald-500 border border-zinc-700 font-bold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trophy size={15} className={activeSection === "tournaments" ? "text-emerald-400" : "text-zinc-500"} />
                <span>Torneos Asignados</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">{tournaments.length}</span>
            </button>

            <button
              onClick={() => setActiveSection("games")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeSection === "games"
                  ? "bg-zinc-800/90 text-white border-l-2 border-l-emerald-500 border border-zinc-700 font-bold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar size={15} className={activeSection === "games" ? "text-emerald-400" : "text-zinc-500"} />
                <span>Calendario de Partidos</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection("teams")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeSection === "teams"
                  ? "bg-zinc-800/90 text-white border-l-2 border-l-emerald-500 border border-zinc-700 font-bold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users size={15} className={activeSection === "teams" ? "text-emerald-400" : "text-zinc-500"} />
                <span>Equipos & Plantillas</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection("public-portals")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeSection === "public-portals"
                  ? "bg-zinc-800/90 text-white border-l-2 border-l-emerald-500 border border-zinc-700 font-bold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Globe size={15} className={activeSection === "public-portals" ? "text-emerald-400" : "text-zinc-500"} />
                <span>Portales Públicos</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="pt-3 border-t border-zinc-800/80">
          <div className="px-2 py-1 text-[10px] text-zinc-500 font-mono">
            La Liguita SaaS v2.4 • Producción
          </div>
        </div>
      </aside>

      {/* Contenido Principal de Operaciones */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 max-w-7xl">
        {/* Header Superior con Botón de Creación */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {activeSection === "tournaments" && "Directorio de Torneos"}
              {activeSection === "games" && "Calendario General de Partidos"}
              {activeSection === "teams" && "Directorio de Equipos"}
              {activeSection === "public-portals" && "Portales de Difusión Pública"}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Consola de supervisión y gestión operativa de ligas deportivas.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {superAdmin && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-sm"
              >
                <Plus size={16} />
                <span>Nuevo Torneo</span>
              </button>
            )}
          </div>
        </div>

        {/* Tarjetas KPI de Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 rounded-xl">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Torneos Activos</span>
              <Trophy size={14} className="text-zinc-500" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalTournaments}</div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 rounded-xl">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Nivel PRO FIBA</span>
              <Sparkles size={14} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{proTournaments}</div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 rounded-xl">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Nivel Amateur</span>
              <Activity size={14} className="text-zinc-500" />
            </div>
            <div className="text-2xl font-black text-zinc-300 font-mono">{amateurTournaments}</div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 rounded-xl">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Organizadores</span>
              <Users size={14} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{totalOrganizers}</div>
          </div>
        </div>

        {/* SECCIÓN: LISTA DE TORNEOS */}
        {activeSection === "tournaments" && (
          <div className="space-y-4">
            {/* Barra de Filtros & Búsqueda */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
                <input
                  type="text"
                  placeholder="Buscar torneo, organización o admin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 placeholder:text-zinc-500 font-medium"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={filterSport}
                  onChange={(e) => setFilterSport(e.target.value as any)}
                  className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none"
                >
                  <option value="all">Todas las Disciplinas</option>
                  <option value="basketball">Baloncesto</option>
                  <option value="soccer">Fútbol</option>
                </select>

                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value as any)}
                  className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none"
                >
                  <option value="all">Todos los Niveles</option>
                  <option value="pro">PRO FIBA</option>
                  <option value="amateur">Amateur</option>
                </select>
              </div>
            </div>

            {/* Tabla de Torneos */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                      <th className="py-3.5 px-5">Torneo / Organización</th>
                      <th className="py-3.5 px-3">Disciplina</th>
                      <th className="py-3.5 px-3 text-center">Nivel</th>
                      <th className="py-3.5 px-4">Administradores Autorizados</th>
                      <th className="py-3.5 px-4 text-center">Fecha</th>
                      <th className="py-3.5 px-5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-medium">
                    {filteredTournaments.map((t) => {
                      const isPro = t.tier === "pro";
                      const admins = t.adminEmails || [];

                      return (
                        <tr key={t.id} className="hover:bg-zinc-800/20 transition">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-emerald-400 text-xs">
                                {t.sport === "soccer" ? "FÚT" : "BAL"}
                              </div>
                              <div>
                                <div className="font-bold text-white text-sm">{t.name}</div>
                                <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                  <Building size={11} className="text-zinc-500" />
                                  <span>{t.organizationName || "Organización Oficial"}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-3 text-zinc-300 text-xs font-semibold">
                            {t.sport === "soccer" ? "Fútbol" : "Baloncesto"}
                          </td>

                          <td className="py-4 px-3 text-center">
                            {isPro ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                PRO
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
                                Amateur
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 font-mono text-zinc-300">
                            <div className="flex flex-wrap gap-1 max-w-[240px]">
                              {admins.map((email) => {
                                const display = email.endsWith("@laliguita.com")
                                  ? email.replace("@laliguita.com", "")
                                  : email;
                                return (
                                  <span
                                    key={email}
                                    className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-300 border border-zinc-700"
                                  >
                                    {display}
                                  </span>
                                );
                              })}
                              {admins.length === 0 && (
                                <span className="text-[11px] text-zinc-500 italic">Sin administradores</span>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-4 text-center font-mono text-zinc-500 text-[11px]">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </td>

                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/tournament/${t.id}/games`}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-sm"
                              >
                                <span>Administrar</span>
                                <ArrowUpRight size={13} />
                              </Link>

                              <Link
                                href={`/t/${t.slug || t.id}`}
                                target="_blank"
                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition border border-zinc-700"
                                title="Portal Público"
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

                    {filteredTournaments.length === 0 && !loadingTournaments && (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-zinc-500">
                          No se encontraron torneos registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN: CALENDARIO DE PARTIDOS GENERAL */}
        {activeSection === "games" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.map((t) => (
                <div key={t.id} className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                      {t.sport === "soccer" ? "Fútbol" : "Baloncesto"}
                    </span>
                    <h3 className="font-bold text-white text-base mt-0.5">{t.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1">{t.organizationName || "Oficial"}</p>
                  </div>

                  <Link
                    href={`/tournament/${t.id}/games`}
                    className="mt-4 w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Calendar size={14} />
                    <span>Ver Calendario de Partidos</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN: EQUIPOS GENERAL */}
        {activeSection === "teams" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.map((t) => (
                <div key={t.id} className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                      Plantillas y Clubes
                    </span>
                    <h3 className="font-bold text-white text-base mt-0.5">{t.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1">{t.organizationName || "Oficial"}</p>
                  </div>

                  <Link
                    href={`/tournament/${t.id}/teams`}
                    className="mt-4 w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Users size={14} />
                    <span>Gestionar Equipos & Jugadores</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN: PORTALES PÚBLICOS */}
        {activeSection === "public-portals" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.map((t) => (
                <div key={t.id} className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Portal Público</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20">
                        /t/{t.slug || t.id}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-base">{t.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1">Vista pública para fanáticos, jugadores y prensa.</p>
                  </div>

                  <Link
                    href={`/t/${t.slug || t.id}`}
                    target="_blank"
                    className="mt-4 w-full py-2 bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-blue-500/30"
                  >
                    <Globe size={14} />
                    <span>Abrir Portal en Vivo</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Creación de Torneo */}
      <CreateTournamentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
