"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tournament } from "@/types/tournament";
import { 
  subscribeToAllTournaments, 
  deleteTournamentFromDb, 
  updateTournamentInDb,
  regenerateTournamentAccessCode,
  generateAdminAccessCode
} from "@/lib/db";
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
  X,
  KeyRound,
  Copy,
  Check,
  RefreshCw
} from "lucide-react";

export function SuperAdminDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tournaments" | "admins" | "pins">("tournaments");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<"all" | "amateur" | "pro">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  // Modal para editar administradores
  const [editingAdminsTournament, setEditingAdminsTournament] = useState<Tournament | null>(null);
  const [adminEmailsInput, setAdminEmailsInput] = useState("");
  const [adminPinInput, setAdminPinInput] = useState("");
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

  const handleCopyInviteLink = (t: Tournament) => {
    const pin = t.adminAccessCode || "LGT-0000";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteLink = `${origin}/admin?pin=${pin}`;

    navigator.clipboard.writeText(inviteLink);
    setCopiedPinId(t.id);
    setTimeout(() => {
      setCopiedPinId(null);
    }, 2000);
  };

  const handleRegeneratePin = async (t: Tournament) => {
    if (confirm(`¿Regenerar un nuevo PIN de acceso para "${t.name}"? El PIN anterior quedará invalidado.`)) {
      const newPin = await regenerateTournamentAccessCode(t.id);
      alert(`Nuevo PIN generado exitosamente: ${newPin}`);
    }
  };

  const handleOpenEditAdmins = (t: Tournament) => {
    setEditingAdminsTournament(t);
    setAdminEmailsInput(t.adminEmails ? t.adminEmails.join(", ") : "");
    setAdminPinInput(t.adminAccessCode || `LGT-${Math.floor(1000 + Math.random() * 9000)}`);
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
      adminAccessCode: adminPinInput.trim().toUpperCase() || generateAdminAccessCode(),
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-10 space-y-8 max-w-7xl mx-auto selection:bg-emerald-500/30">
      {/* Header Principal con acentos en Verde Esmeralda Ejecutivo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900/60 p-6 md:p-8 rounded-3xl border border-emerald-500/30 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <ShieldCheck size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Panel de Super Administrador
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
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
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-600/25 active:scale-[0.98] shrink-0"
        >
          <Plus size={18} />
          <span>Crear Nuevo Torneo</span>
        </button>
      </div>

      {/* Métricas con acentos esmeralda limpios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-bold uppercase tracking-wider">Total Torneos</span>
            <Trophy size={16} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{totalTournaments}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Competencias registradas</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-bold uppercase tracking-wider">Torneos PRO FIBA</span>
            <Flame size={16} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">{proTournaments}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Con Box Score y Live</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-bold uppercase tracking-wider">Liguitas Amateur</span>
            <Trophy size={16} className="text-zinc-400" />
          </div>
          <div className="text-3xl font-black text-zinc-200 font-mono">{amateurTournaments}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Nivel básico y casual</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-bold uppercase tracking-wider">Organizadores Activos</span>
            <Users size={16} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">{totalUniqueAdmins}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Emails con acceso asignado</p>
        </div>
      </div>

      {/* Tabs Principales */}
      <div className="flex gap-2 border-b border-zinc-800 pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab("tournaments")}
          className={`pb-2 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
            activeTab === "tournaments"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          Gestión de Torneos ({tournaments.length})
        </button>

        <button
          onClick={() => setActiveTab("pins")}
          className={`pb-2 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center gap-1.5 ${
            activeTab === "pins"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <KeyRound size={14} />
          <span>Códigos & PINs de Acceso ({tournaments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("admins")}
          className={`pb-2 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
            activeTab === "admins"
              ? "border-emerald-500 text-emerald-400"
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
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-emerald-500 placeholder:text-zinc-500"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              {(["all", "pro", "amateur"] as const).map((tierOption) => (
                <button
                  key={tierOption}
                  onClick={() => setFilterTier(tierOption)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                    filterTier === tierOption
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
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
                    <th className="py-4 px-4">PIN de Acceso</th>
                    <th className="py-4 px-4">Administradores Asignados</th>
                    <th className="py-4 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {filteredTournaments.map((t) => {
                    const isPro = t.tier === "pro";
                    const admins = t.adminEmails || [];
                    const pin = t.adminAccessCode || `LGT-${t.id.slice(0, 4).toUpperCase()}`;
                    const isCopied = copiedPinId === t.id;

                    return (
                      <tr key={t.id} className="hover:bg-zinc-800/30 transition">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-emerald-400 text-sm">
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
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <Sparkles size={10} className="fill-current" /> PRO
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                                Amateur
                              </span>
                            )}
                          </button>
                        </td>

                        {/* PIN de Acceso */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-zinc-950 border border-emerald-500/30 rounded-lg text-emerald-400 font-mono font-bold text-xs tracking-wider">
                              {pin}
                            </span>
                            <button
                              onClick={() => handleCopyInviteLink(t)}
                              className={`p-1.5 rounded-lg border transition ${
                                isCopied
                                  ? "bg-emerald-500 text-zinc-950 border-emerald-500 font-bold"
                                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
                              }`}
                              title="Copiar Link de Administración con PIN"
                            >
                              {isCopied ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                          </div>
                        </td>

                        {/* Administradores Asignados */}
                        <td className="py-4 px-4 font-mono text-zinc-300">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-[220px]">
                            {admins.map((email) => {
                              const isSystemUser = email.endsWith("@laliguita.com");
                              const displayUser = isSystemUser ? email.replace("@laliguita.com", "") : email;

                              return (
                                <span
                                  key={email}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 rounded text-[11px] text-zinc-300 border border-zinc-700"
                                >
                                  <Mail size={10} className="text-emerald-400" />
                                  <span className="truncate max-w-[100px]">{displayUser}</span>
                                </span>
                              );
                            })}

                            {admins.length === 0 && (
                              <span className="text-[11px] text-zinc-500 italic">Sin administradores</span>
                            )}

                            <button
                              onClick={() => handleOpenEditAdmins(t)}
                              className="p-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded transition border border-emerald-500/20"
                              title="Modificar administradores o PIN"
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/tournament/${t.id}/games`}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-sm"
                              title="Abrir Panel del Torneo"
                            >
                              <span>Entrar</span>
                              <ArrowUpRight size={14} />
                            </Link>

                            <Link
                              href={`/t/${t.slug || t.id}`}
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

      {/* TAB 2: CÓDIGOS & PINS DE ACCESO */}
      {activeTab === "pins" && (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-xs text-zinc-400 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <span className="font-bold text-white">Gestión de PINs de Invitación Administrativa:</span>
              <p className="mt-0.5">Comparte el enlace de acceso o el PIN con los organizadores para que puedan ingresar a su torneo asignado.</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Plus size={14} />
              <span>Crear Nuevo Torneo con PIN</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((t) => {
              const pin = t.adminAccessCode || `LGT-${t.id.slice(0, 4).toUpperCase()}`;
              const isCopied = copiedPinId === t.id;
              const adminCount = (t.adminEmails || []).length;

              return (
                <div
                  key={t.id}
                  className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                          <span>{t.sport === "soccer" ? "⚽ Fútbol" : "🏀 Baloncesto"}</span>
                          <span>•</span>
                          <span>{t.tier.toUpperCase()}</span>
                        </div>
                        <h3 className="font-bold text-white text-base truncate mt-0.5">{t.name}</h3>
                        <p className="text-xs text-zinc-400 truncate">{t.organizationName || "Liga Oficial"}</p>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                        Activo
                      </span>
                    </div>

                    {/* Tarjeta del PIN */}
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1.5">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Código / PIN Único</span>
                        <button
                          onClick={() => handleRegeneratePin(t)}
                          className="text-[10px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition"
                          title="Regenerar PIN"
                        >
                          <RefreshCw size={10} />
                          <span>Regenerar</span>
                        </button>
                      </div>

                      <div className="text-xl font-black font-mono tracking-widest text-emerald-400">
                        {pin}
                      </div>

                      <div className="text-[10px] text-zinc-500">
                        {adminCount > 0 
                          ? `${adminCount} organizador(es) vinculado(s)`
                          : "Pendiente de primer ingreso por el organizador"}
                      </div>
                    </div>
                  </div>

                  {/* Acciones del PIN */}
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2">
                    <button
                      onClick={() => handleCopyInviteLink(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isCopied
                          ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check size={14} />
                          <span>¡Enlace Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copiar Link de Acceso</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={`/admin?pin=${pin}`}
                      target="_blank"
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition border border-zinc-700"
                      title="Probar Acceso con este PIN"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}

            {tournaments.length === 0 && (
              <div className="col-span-full py-16 text-center text-zinc-500 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                No hay torneos registrados actualmente.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DIRECTORIO DE ADMINISTRADORES */}
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
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <UserCheck size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{display}</h4>
                          {isSystem && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-zinc-800 text-emerald-400 border border-zinc-700">
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
                            className="text-emerald-400 hover:underline text-[11px] font-bold flex items-center gap-0.5"
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

      {/* Modal Rápido para Editar Administradores & PIN */}
      {editingAdminsTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">Gestionar Permisos & PIN</h3>
                <p className="text-xs text-emerald-400 font-bold mt-0.5">{editingAdminsTournament.name}</p>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-300">
                    PIN Único de Administración
                  </label>
                  <button
                    type="button"
                    onClick={() => setAdminPinInput(`LGT-${Math.floor(1000 + Math.random() * 9000)}`)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold"
                  >
                    Generar Nuevo
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" size={15} />
                  <input
                    type="text"
                    required
                    placeholder="Ej: LGT-8492"
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-950 border border-emerald-500/40 rounded-xl text-emerald-400 font-bold text-xs font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Correos o Usuarios Asignados (Separados por coma)
                </label>
                <textarea
                  rows={3}
                  value={adminEmailsInput}
                  onChange={(e) => setAdminEmailsInput(e.target.value)}
                  placeholder="admin1@gmail.com, organizador@laliguita.com"
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Los usuarios que ingresen este PIN o inicien sesión con estos correos tendrán acceso de gestión.
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20"
                >
                  {isSavingAdmins ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
