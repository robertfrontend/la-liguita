"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tournament } from "@/types/tournament";
import { subscribeToAllTournaments, deleteTournamentFromDb, updateTournamentInDb } from "@/lib/db";
import { CreateTournamentModal } from "@/components/features/CreateTournamentModal";
import { 
  ShieldCheck, 
  Plus, 
  Trophy, 
  Flame, 
  Users, 
  Search, 
  ExternalLink, 
  Trash2, 
  Mail, 
  Building,
  Sparkles,
  ArrowUpRight,
  UserCheck,
  Globe,
  Edit3,
  X
} from "lucide-react";

export function SuperAdminDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tournaments" | "admins">("tournaments");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<"all" | "amateur" | "pro">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Modal para editar administradores
  const [editingAdminsTournament, setEditingAdminsTournament] = useState<Tournament | null>(null);
  const [adminEmailsInput, setAdminEmailsInput] = useState("");
  const [isSavingAdmins, setIsSavingAdmins] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAllTournaments((list) => {
      setTournaments(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDeleteTournament = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el torneo "${name}"? Esta acción borrará todos sus partidos, equipos y estadísticas.`)) {
      await deleteTournamentFromDb(id);
    }
  };

  const handleOpenEditAdmins = (t: Tournament) => {
    setEditingAdminsTournament(t);
    setAdminEmailsInput(t.adminEmails ? t.adminEmails.join(", ") : "");
  };

  const handleSaveAdmins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdminsTournament) return;

    const cleanEmails = adminEmailsInput
      .split(/[,\s]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0 && e.includes("@"));

    setIsSavingAdmins(true);
    await updateTournamentInDb(editingAdminsTournament.id, {
      adminEmails: cleanEmails,
    });
    setIsSavingAdmins(false);
    setEditingAdminsTournament(null);
  };

  const handleToggleTier = async (t: Tournament) => {
    const newTier = t.tier === "pro" ? "amateur" : "pro";
    if (confirm(`¿Cambiar el nivel del torneo "${t.name}" a ${newTier.toUpperCase()}?`)) {
      await updateTournamentInDb(t.id, { tier: newTier });
    }
  };

  // Filtrado
  const filteredTournaments = tournaments.filter((t) => {
    const matchesQuery = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.organizationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.adminEmails?.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTier = filterTier === "all" || t.tier === filterTier;
    return matchesQuery && matchesTier;
  });

  // Métricas
  const totalTournaments = tournaments.length;
  const proTournaments = tournaments.filter((t) => t.tier === "pro").length;
  const amateurTournaments = tournaments.filter((t) => t.tier === "amateur").length;
  
  // Mapa de Administradores -> Torneos asignados
  const adminDirectory: Record<string, Tournament[]> = {};
  tournaments.forEach((t) => {
    (t.adminEmails || []).forEach((email) => {
      const clean = email.trim().toLowerCase();
      if (!adminDirectory[clean]) {
        adminDirectory[clean] = [];
      }
      adminDirectory[clean].push(t);
    });
  });

  const totalUniqueAdmins = Object.keys(adminDirectory).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Principal con acentos en Azul Eléctrico */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900/60 p-6 md:p-8 rounded-3xl border border-blue-500/30 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10">
            <ShieldCheck size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Panel de Super Administrador
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
                robert02frontend
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Control maestro de torneos, asignación de permisos a organizadores y supervisión general.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/25 active:scale-[0.98] shrink-0"
        >
          <Plus size={18} />
          <span>Crear Nuevo Torneo</span>
        </button>
      </div>

      {/* Métricas con acentos azules limpios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl hover:border-blue-500/30 transition">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-bold uppercase tracking-wider">Total Torneos</span>
            <Trophy size={16} className="text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{totalTournaments}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Competencias registradas</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl hover:border-blue-500/30 transition">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-bold uppercase tracking-wider">Torneos PRO FIBA</span>
            <Flame size={16} className="text-blue-400" />
          </div>
          <div className="text-3xl font-black text-blue-400 font-mono">{proTournaments}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Con Box Score y Live</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl hover:border-blue-500/30 transition">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-bold uppercase tracking-wider">Liguitas Amateur</span>
            <Trophy size={16} className="text-zinc-400" />
          </div>
          <div className="text-3xl font-black text-zinc-200 font-mono">{amateurTournaments}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Nivel básico y casual</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl hover:border-blue-500/30 transition">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-bold uppercase tracking-wider">Organizadores Activos</span>
            <Users size={16} className="text-blue-400" />
          </div>
          <div className="text-3xl font-black text-blue-400 font-mono">{totalUniqueAdmins}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Emails con acceso asignado</p>
        </div>
      </div>

      {/* Tabs Principales */}
      <div className="flex gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab("tournaments")}
          className={`pb-2 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
            activeTab === "tournaments"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          Gestión de Torneos ({tournaments.length})
        </button>

        <button
          onClick={() => setActiveTab("admins")}
          className={`pb-2 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
            activeTab === "admins"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          Directorio de Administradores ({totalUniqueAdmins})
        </button>
      </div>

      {/* TAB 1: GESTIÓN DE TORNEOS */}
      {activeTab === "tournaments" && (
        <div className="space-y-4">
          {/* Buscador & Filtro de Tier */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Buscar por torneo, organizador o club..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-blue-500 placeholder:text-zinc-500"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              {(["all", "pro", "amateur"] as const).map((tierOption) => (
                <button
                  key={tierOption}
                  onClick={() => setFilterTier(tierOption)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                    filterTier === tierOption
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"
                  }`}
                >
                  {tierOption === "all" ? "Todos" : tierOption === "pro" ? "PRO" : "Amateur"}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Torneos */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                    <th className="py-4 px-6">Torneo / Organización</th>
                    <th className="py-4 px-3 text-center">Deporte</th>
                    <th className="py-4 px-3 text-center">Nivel (Tier)</th>
                    <th className="py-4 px-4">Administradores Asignados</th>
                    <th className="py-4 px-4 text-center">Fecha</th>
                    <th className="py-4 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {filteredTournaments.map((t) => {
                    const isPro = t.tier === "pro";
                    const admins = t.adminEmails || [];

                    return (
                      <tr key={t.id} className="hover:bg-zinc-800/30 transition">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-blue-400 text-sm">
                              {t.sport === "soccer" ? "⚽" : "🏀"}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{t.name}</div>
                              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                                <Building size={12} className="text-zinc-500" />
                                <span>{t.organizationName || "Liga Independiente"}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-3 text-center font-bold text-zinc-300 uppercase text-[10px]">
                          {t.sport === "soccer" ? "Fútbol" : "Baloncesto"}
                        </td>

                        <td className="py-4 px-3 text-center">
                          <button
                            onClick={() => handleToggleTier(t)}
                            title="Haz clic para cambiar Tier"
                            className="cursor-pointer transition hover:scale-105"
                          >
                            {isPro ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                <Sparkles size={10} className="fill-current" /> PRO
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                                Amateur
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Administradores Asignados */}
                        <td className="py-4 px-4 font-mono text-zinc-300">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-[260px]">
                            {admins.map((email) => {
                              const isSystemUser = email.endsWith("@laliguita.com");
                              const displayUser = isSystemUser ? email.replace("@laliguita.com", "") : email;

                              return (
                                <span
                                  key={email}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 rounded text-[11px] text-zinc-300 border border-zinc-700"
                                >
                                  <Mail size={10} className="text-blue-400" />
                                  <span className="truncate max-w-[120px]">{displayUser}</span>
                                </span>
                              );
                            })}

                            {admins.length === 0 && (
                              <span className="text-[11px] text-zinc-500 italic">Sin administradores</span>
                            )}

                            <button
                              onClick={() => handleOpenEditAdmins(t)}
                              className="p-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded transition border border-blue-500/20"
                              title="Modificar administradores"
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center font-mono text-zinc-500 text-[11px]">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/tournament/${t.id}/games`}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-sm"
                              title="Abrir Panel del Torneo"
                            >
                              <span>Entrar</span>
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

                            <button
                              onClick={() => handleDeleteTournament(t.id, t.name)}
                              className="p-1.5 bg-zinc-800/80 hover:bg-red-600/20 text-zinc-400 hover:text-red-400 rounded-lg transition border border-zinc-700/60"
                              title="Eliminar Torneo"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredTournaments.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-zinc-500">
                        No se encontraron torneos con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIRECTORIO DE ADMINISTRADORES */}
      {activeTab === "admins" && (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-xs text-zinc-400">
            Directorio consolidado de organizadores autorizados y sus torneos a cargo:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(adminDirectory).map(([email, assignedTournaments]) => {
              const isSystem = email.endsWith("@laliguita.com");
              const display = isSystem ? email.replace("@laliguita.com", "") : email;

              return (
                <div
                  key={email}
                  className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <UserCheck size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{display}</h4>
                          {isSystem && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-zinc-800 text-blue-400 border border-zinc-700">
                              Usuario
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {assignedTournaments.length} Torneo(s) Asignado(s)
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      {assignedTournaments.map((at) => (
                        <div
                          key={at.id}
                          className="flex items-center justify-between text-xs bg-zinc-950 p-2.5 rounded-lg border border-zinc-800"
                        >
                          <span className="font-medium text-zinc-200 truncate">{at.name}</span>
                          <Link
                            href={`/tournament/${at.id}/games`}
                            className="text-blue-400 hover:underline text-[11px] font-bold flex items-center gap-0.5"
                          >
                            <span>Panel</span>
                            <ArrowUpRight size={12} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {totalUniqueAdmins === 0 && (
              <div className="col-span-full py-16 text-center text-zinc-500 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                Aún no hay administradores asignados en ningún torneo.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Creación de Torneo */}
      <CreateTournamentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Modal Rápido para Editar Administradores */}
      {editingAdminsTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">Gestionar Administradores</h3>
                <p className="text-xs text-blue-400 font-bold mt-0.5">{editingAdminsTournament.name}</p>
              </div>
              <button
                onClick={() => setEditingAdminsTournament(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdmins} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Correos o Usuarios (Separados por coma)
                </label>
                <textarea
                  rows={3}
                  value={adminEmailsInput}
                  onChange={(e) => setAdminEmailsInput(e.target.value)}
                  placeholder="admin1@gmail.com, admin2@gmail.com"
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Estos usuarios tendrán acceso administrativo completo a este torneo.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAdminsTournament(null)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingAdmins}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-600/20"
                >
                  {isSavingAdmins ? "Guardando..." : "Guardar Permisos"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
