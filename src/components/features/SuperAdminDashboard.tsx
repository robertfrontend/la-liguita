"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tournament } from "@/types/tournament";
import { 
  subscribeToAllTournaments, 
  deleteTournamentFromDb, 
  updateTournamentInDb,
  regenerateTournamentAccessCode,
  generateAdminAccessCode,
  updateAdminAssignedTournaments,
  revokeAdminTournamentAccess,
  grantAdminTournamentAccess
} from "@/lib/db";
import { 
  sendAdminPasswordReset, 
  createAdminAccountWithCredentials, 
  resolveLoginIdentifier 
} from "@/lib/auth-helpers";
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
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Lock,
  User,
  ShieldAlert,
  Calendar,
  Layers,
  ChevronRight,
  Send
} from "lucide-react";

export function SuperAdminDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tournaments" | "admins" | "pins">("tournaments");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<"all" | "amateur" | "pro">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  // Modal para editar administradores & PIN de un torneo específico
  const [editingAdminsTournament, setEditingAdminsTournament] = useState<Tournament | null>(null);
  const [adminEmailsInput, setAdminEmailsInput] = useState("");
  const [adminPinInput, setAdminPinInput] = useState("");
  const [isSavingAdmins, setIsSavingAdmins] = useState(false);

  // Buscador específico para la lista de administradores
  const [adminSearchQuery, setAdminSearchQuery] = useState("");

  // Modal de Detalle de un Administrador Seleccionado
  const [selectedAdminEmail, setSelectedAdminEmail] = useState<string | null>(null);
  const [selectedAdminTournaments, setSelectedAdminTournaments] = useState<string[]>([]);
  const [isSavingAdminDetail, setIsSavingAdminDetail] = useState(false);
  const [adminDetailSuccessMsg, setAdminDetailSuccessMsg] = useState<string | null>(null);
  const [adminDetailErrorMsg, setAdminDetailErrorMsg] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [copiedAdminLink, setCopiedAdminLink] = useState(false);

  // Modal para Crear Nuevo Administrador Global
  const [isCreateAdminModalOpen, setIsCreateAdminModalOpen] = useState(false);
  const [newAdminMethod, setNewAdminMethod] = useState<"credentials" | "email">("credentials");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminTournamentIds, setNewAdminTournamentIds] = useState<string[]>([]);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [createAdminAlert, setCreateAdminAlert] = useState<{ username: string; pass: string } | null>(null);
  const [createAdminError, setCreateAdminError] = useState<string | null>(null);

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

  // Filtrado de Torneos
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

  // Filtrado de la Lista de Administradores
  const filteredAdminList = Object.entries(adminDirectory).filter(([email, assignedList]) => {
    const q = adminSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const isSystem = email.endsWith("@laliguita.com");
    const display = isSystem ? email.replace("@laliguita.com", "") : email;
    return (
      display.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      assignedList.some(t => t.name.toLowerCase().includes(q))
    );
  });

  // Abrir Modal de Detalle de un Administrador
  const handleOpenAdminDetail = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = cleanEmail.replace("@laliguita.com", "");
    setSelectedAdminEmail(cleanEmail);
    setAdminDetailSuccessMsg(null);
    setAdminDetailErrorMsg(null);

    // Obtener los IDs de torneos donde este admin ya está asignado
    const assignedIds = tournaments
      .filter(t => (t.adminEmails || []).map(e => e.trim().toLowerCase()).some(e => e === cleanEmail || e === cleanUsername))
      .map(t => t.id);

    setSelectedAdminTournaments(assignedIds);
  };

  // Guardar Cambios de Torneos Asignados al Administrador
  const handleSaveAdminDetail = async () => {
    if (!selectedAdminEmail) return;
    setIsSavingAdminDetail(true);
    setAdminDetailSuccessMsg(null);
    setAdminDetailErrorMsg(null);

    try {
      await updateAdminAssignedTournaments(selectedAdminEmail, selectedAdminTournaments, tournaments);
      setAdminDetailSuccessMsg("¡Permisos y accesos actualizados correctamente!");
      setTimeout(() => setAdminDetailSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("Error guardando permisos de admin:", err);
      setAdminDetailErrorMsg(err?.message || "Ocurrió un error al guardar los permisos.");
    } finally {
      setIsSavingAdminDetail(false);
    }
  };

  // Enviar Restablecimiento de Contraseña para el Administrador
  const handleSendPasswordReset = async (email: string) => {
    setIsSendingReset(true);
    setAdminDetailSuccessMsg(null);
    setAdminDetailErrorMsg(null);

    try {
      const res = await sendAdminPasswordReset(email);
      if (res.success) {
        setAdminDetailSuccessMsg(res.message);
      } else {
        setAdminDetailErrorMsg(res.message);
      }
    } catch (err: any) {
      setAdminDetailErrorMsg(err?.message || "Error al enviar el enlace de recuperación.");
    } finally {
      setIsSendingReset(false);
    }
  };

  // Revocar acceso completo del Administrador
  const handleRevokeAllAdminAccess = async (email: string) => {
    if (confirm(`¿Estás seguro de revocar todo acceso y eliminar a "${email}" de todos los torneos?`)) {
      setIsSavingAdminDetail(true);
      await updateAdminAssignedTournaments(email, [], tournaments);
      setIsSavingAdminDetail(false);
      setSelectedAdminEmail(null);
    }
  };

  // Crear Nuevo Administrador
  const handleCreateNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateAdminError(null);
    setCreateAdminAlert(null);

    let finalEmail = "";

    if (newAdminMethod === "credentials") {
      const cleanUser = newAdminUsername.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
      if (!cleanUser || cleanUser.length < 3) {
        setCreateAdminError("El usuario debe tener al menos 3 caracteres alfanuméricos.");
        return;
      }
      if (!newAdminPassword || newAdminPassword.length < 6) {
        setCreateAdminError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }

      setIsCreatingAdmin(true);

      try {
        finalEmail = await createAdminAccountWithCredentials(
          cleanUser, 
          newAdminPassword, 
          newAdminName.trim() || `Admin ${cleanUser}`
        );
        setCreateAdminAlert({ username: cleanUser, pass: newAdminPassword });
      } catch (err: any) {
        console.error("Error creando admin:", err);
        if (err.code === "auth/email-already-in-use") {
          finalEmail = resolveLoginIdentifier(cleanUser);
        } else {
          setCreateAdminError(err.message || "Error al crear cuenta.");
          setIsCreatingAdmin(false);
          return;
        }
      }
    } else {
      const cleanEmail = newAdminEmail.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        setCreateAdminError("Por favor ingresa un correo válido.");
        return;
      }
      finalEmail = cleanEmail;
      setIsCreatingAdmin(true);
    }

    // Asignar a los torneos seleccionados
    if (finalEmail && newAdminTournamentIds.length > 0) {
      await updateAdminAssignedTournaments(finalEmail, newAdminTournamentIds, tournaments);
    }

    setIsCreatingAdmin(false);

    if (newAdminMethod === "email") {
      setIsCreateAdminModalOpen(false);
      setNewAdminEmail("");
      setNewAdminTournamentIds([]);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-10 space-y-8 max-w-7xl mx-auto selection:bg-emerald-500/30">
      {/* Header Principal */}
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
              Control maestro de torneos, directorio de organizadores, permisos y gestión de contraseñas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateAdminModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition border border-zinc-700 shadow-md"
          >
            <KeyRound size={16} className="text-emerald-400" />
            <span>Nuevo Administrador</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/25 active:scale-[0.98] shrink-0"
          >
            <Plus size={16} />
            <span>Crear Torneo</span>
          </button>
        </div>
      </div>

      {/* Métricas */}
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
            <Globe size={16} className="text-zinc-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{amateurTournaments}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Versión simplificada</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-bold uppercase tracking-wider">Administradores</span>
            <UserCheck size={16} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">{totalUniqueAdmins}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Usuarios con permisos</p>
        </div>
      </div>

      {/* Selector de Pestañas Principales */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab("tournaments")}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
            activeTab === "tournaments"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <Trophy size={16} />
          <span>Torneos & Ligas ({tournaments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("admins")}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
            activeTab === "admins"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <UserCheck size={16} />
          <span>Directorio de Administradores ({totalUniqueAdmins})</span>
        </button>

        <button
          onClick={() => setActiveTab("pins")}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
            activeTab === "pins"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <KeyRound size={16} />
          <span>Códigos PIN de Acceso</span>
        </button>
      </div>

      {/* TAB 1: TORNEOS & LIGAS */}
      {activeTab === "tournaments" && (
        <div className="space-y-6">
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Buscar torneo por nombre, organización o admin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterTier("all")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                  filterTier === "all" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Todos ({totalTournaments})
              </button>
              <button
                onClick={() => setFilterTier("pro")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  filterTier === "pro" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Flame size={13} />
                <span>PRO ({proTournaments})</span>
              </button>
              <button
                onClick={() => setFilterTier("amateur")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                  filterTier === "amateur" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Amateur ({amateurTournaments})
              </button>
            </div>
          </div>

          {/* Grilla de Torneos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTournaments.map((t) => {
              const isPro = t.tier === "pro";
              const adminCount = t.adminEmails ? t.adminEmails.length : 0;
              const isCopied = copiedPinId === t.id;
              const pin = t.adminAccessCode || `LGT-${t.id.slice(0, 4).toUpperCase()}`;

              return (
                <div
                  key={t.id}
                  className="bg-zinc-900/60 border border-zinc-800/80 hover:border-emerald-500/30 rounded-3xl p-6 transition flex flex-col justify-between space-y-5 group shadow-lg"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-black text-emerald-400 text-base shrink-0 overflow-hidden shadow-inner">
                          {t.logoUrl ? (
                            <img src={t.logoUrl} alt={t.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <span>{t.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base leading-tight group-hover:text-emerald-400 transition">
                            {t.name}
                          </h3>
                          <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Building size={12} className="text-zinc-500" />
                            <span>{t.organizationName || "Organización Independiente"}</span>
                          </p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isPro 
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      }`}>
                        {isPro ? "PRO FIBA" : "Amateur"}
                      </span>
                    </div>

                    {/* PIN Rápido & Admins */}
                    <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 text-[11px]">PIN Admin:</span>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-400">
                          <span>{pin}</span>
                          <button
                            onClick={() => handleCopyInviteLink(t)}
                            className="p-1 hover:text-white text-zinc-500 transition"
                            title="Copiar PIN"
                          >
                            {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 text-[11px]">Organizadores:</span>
                        <span className="font-mono text-zinc-300 font-bold">{adminCount} asignado(s)</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones del Torneo */}
                  <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/tournament/${t.id}/games`}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        <span>Panel Admin</span>
                        <ArrowUpRight size={14} />
                      </Link>

                      <Link
                        href={`/t/${t.slug || t.id}`}
                        target="_blank"
                        className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-zinc-700"
                      >
                        <span>Portal Fan</span>
                        <ExternalLink size={13} />
                      </Link>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1">
                      <button
                        onClick={() => handleOpenEditAdmins(t)}
                        className="text-[11px] text-zinc-400 hover:text-emerald-400 font-bold flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-zinc-800 transition"
                      >
                        <SlidersHorizontal size={12} />
                        <span>Permisos / PIN</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleTier(t)}
                          className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono py-1 px-1.5 rounded hover:bg-zinc-800"
                          title="Cambiar Tier (Amateur / Pro)"
                        >
                          Tier
                        </button>
                        <button
                          onClick={() => handleDeleteTournament(t.id, t.name)}
                          className="text-zinc-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition"
                          title="Eliminar torneo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DIRECTORIO DE ADMINISTRADORES (EN FORMATO LISTA ESTRUCTURADA) */}
      {activeTab === "admins" && (
        <div className="space-y-5">
          {/* Barra de Búsqueda y Botón de Nuevo Administrador */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Buscar administrador por nombre de usuario, correo o torneo..."
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-zinc-400 font-mono hidden md:inline">
                {filteredAdminList.length} de {totalUniqueAdmins} administradores
              </span>
              <button
                onClick={() => setIsCreateAdminModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 shrink-0"
              >
                <Plus size={14} />
                <span>Agregar Administrador</span>
              </button>
            </div>
          </div>

          {/* LISTA ESTRUCTURADA DE ADMINISTRADORES */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                    <th className="py-3.5 px-5">Administrador / Usuario</th>
                    <th className="py-3.5 px-4">Tipo de Cuenta</th>
                    <th className="py-3.5 px-4">Torneos Asignados</th>
                    <th className="py-3.5 px-4 text-center">Estado</th>
                    <th className="py-3.5 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {/* Fila Fija: Super Admin */}
                  <tr className="bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06] transition">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <div className="font-black text-white text-sm flex items-center gap-2">
                            <span>robert02frontend</span>
                            <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Owner
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono">robert02frontend@gmail.com</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Super Admin Maestro
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        Acceso Total ({tournaments.length} Torneos)
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Global
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <span className="text-[11px] text-zinc-500 italic">Control Maestro</span>
                    </td>
                  </tr>

                  {/* Filas Dinámicas de Administradores */}
                  {filteredAdminList.map(([email, assignedTournaments]) => {
                    const isSystem = email.endsWith("@laliguita.com");
                    const display = isSystem ? email.replace("@laliguita.com", "") : email;

                    return (
                      <tr key={email} className="hover:bg-zinc-800/30 transition">
                        {/* Usuario / Email */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-300 shrink-0 shadow-sm">
                              {isSystem ? <KeyRound size={16} className="text-emerald-400" /> : <UserCheck size={16} className="text-blue-400" />}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm font-mono flex items-center gap-2">
                                <span>{display}</span>
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono truncate max-w-xs">
                                {email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tipo de Cuenta */}
                        <td className="py-4 px-4">
                          {isSystem ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                              <Lock size={10} className="text-emerald-400" />
                              <span>Usuario & Clave</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                              <Mail size={10} className="text-blue-400" />
                              <span>Correo Directo</span>
                            </span>
                          )}
                        </td>

                        {/* Torneos Asignados */}
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1.5 max-w-sm">
                            {assignedTournaments.slice(0, 2).map((t) => (
                              <Link
                                key={t.id}
                                href={`/tournament/${t.id}/games`}
                                className="px-2 py-0.5 rounded-md bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] font-medium transition flex items-center gap-1"
                              >
                                <span className="truncate max-w-[120px]">{t.name}</span>
                                <ArrowUpRight size={10} className="text-emerald-400" />
                              </Link>
                            ))}
                            {assignedTournaments.length > 2 && (
                              <span className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
                                +{assignedTournaments.length - 2} más
                              </span>
                            )}
                            {assignedTournaments.length === 0 && (
                              <span className="text-[11px] text-zinc-500 italic">Sin torneos</span>
                            )}
                          </div>
                        </td>

                        {/* Estado */}
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Activo
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Botón Ver Detalles / Gestionar */}
                            <button
                              onClick={() => handleOpenAdminDetail(email)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
                            >
                              <SlidersHorizontal size={13} />
                              <span>Ver Detalles</span>
                            </button>

                            {/* Botón Restablecer Clave */}
                            <button
                              onClick={() => handleSendPasswordReset(email)}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition border border-zinc-700"
                              title="Enviar enlace de restablecimiento de contraseña"
                            >
                              <KeyRound size={14} />
                            </button>

                            {/* Botón Revocar Acceso */}
                            <button
                              onClick={() => handleRevokeAllAdminAccess(email)}
                              className="p-1.5 bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition border border-zinc-700/60"
                              title="Revocar acceso de todos los torneos"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredAdminList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-500 italic">
                        No se encontraron administradores con ese término de búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CÓDIGOS PIN DE ACCESO */}
      {activeTab === "pins" && (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-xs text-zinc-400 flex items-center justify-between">
            <span>Lista de PINs únicos generados para cada torneo:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((t) => {
              const pin = t.adminAccessCode || `LGT-${t.id.slice(0, 4).toUpperCase()}`;
              const isCopied = copiedPinId === t.id;
              const adminCount = t.adminEmails ? t.adminEmails.length : 0;

              return (
                <div
                  key={t.id}
                  className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-black text-emerald-400 shrink-0">
                        {t.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm truncate">{t.name}</h4>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {t.tier === "pro" ? "PRO FIBA" : "Amateur"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>PIN Oficial:</span>
                        <button
                          onClick={() => handleRegeneratePin(t)}
                          className="text-[10px] text-zinc-500 hover:text-emerald-400 flex items-center gap-1"
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
                          : "Pendiente de primer ingreso"}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2">
                    <button
                      onClick={() => handleCopyInviteLink(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isCopied
                          ? "bg-emerald-500 text-zinc-950"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                      }`}
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{isCopied ? "¡Copiado!" : "Copiar Enlace Directo"}</span>
                    </button>

                    <Link
                      href={`/admin?pin=${pin}`}
                      target="_blank"
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition border border-zinc-700"
                      title="Probar Acceso"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DETALLADO DE ADMINISTRADOR (VER DETALLES, CAMBIAR CLAVE, PERMISOS) */}
      {/* ============================================================ */}
      {selectedAdminEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg">
                  <UserCheck size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Detalles del Administrador
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-emerald-400 font-bold">
                      {selectedAdminEmail.endsWith("@laliguita.com")
                        ? selectedAdminEmail.replace("@laliguita.com", "")
                        : selectedAdminEmail}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="font-mono text-xs text-zinc-400">
                      {selectedAdminEmail}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedAdminEmail(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Alertas de Éxito / Error */}
            {adminDetailSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
                <Check size={16} />
                <span>{adminDetailSuccessMsg}</span>
              </div>
            )}
            {adminDetailErrorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
                <ShieldAlert size={16} />
                <span>{adminDetailErrorMsg}</span>
              </div>
            )}

            {/* SECCIÓN 1: GESTIÓN DE ACCESO A TORNEOS (DAR / QUITAR ACCESO) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy size={14} className="text-emerald-400" />
                  <span>Torneos Autorizados ({selectedAdminTournaments.length} de {tournaments.length})</span>
                </h4>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAdminTournaments(tournaments.map(t => t.id))}
                    className="text-[11px] font-bold text-emerald-400 hover:underline"
                  >
                    Dar Acceso a Todos
                  </button>
                  <span className="text-zinc-600">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedAdminTournaments([])}
                    className="text-[11px] font-bold text-zinc-400 hover:text-red-400"
                  >
                    Quitar Todos
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 border border-zinc-800 rounded-2xl bg-zinc-950">
                {tournaments.map((t) => {
                  const isChecked = selectedAdminTournaments.includes(t.id);

                  return (
                    <label
                      key={t.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                        isChecked
                          ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                          : "bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAdminTournaments([...selectedAdminTournaments, t.id]);
                          } else {
                            setSelectedAdminTournaments(selectedAdminTournaments.filter(id => id !== t.id));
                          }
                        }}
                        className="rounded border-zinc-700 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs truncate">{t.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {t.tier === "pro" ? "PRO FIBA" : "Amateur"}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveAdminDetail}
                  disabled={isSavingAdminDetail}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>{isSavingAdminDetail ? "Guardando Accesos..." : "Guardar Permisos de Torneos"}</span>
                </button>
              </div>
            </div>

            {/* SECCIÓN 2: SEGURIDAD & CONTRASEÑA */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={14} className="text-emerald-400" />
                <span>Seguridad & Restablecimiento de Contraseña</span>
              </h4>
              <p className="text-xs text-zinc-400">
                Puedes enviar un enlace oficial para que el usuario configure o actualice su contraseña de acceso.
              </p>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleSendPasswordReset(selectedAdminEmail)}
                  disabled={isSendingReset}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 border border-zinc-700"
                >
                  <Send size={13} className="text-emerald-400" />
                  <span>{isSendingReset ? "Enviando..." : "Enviar Enlace de Restablecimiento"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const loginUrl = `${window.location.origin}/login`;
                    navigator.clipboard.writeText(loginUrl);
                    setCopiedAdminLink(true);
                    setTimeout(() => setCopiedAdminLink(false), 2000);
                  }}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-zinc-800"
                >
                  {copiedAdminLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedAdminLink ? "¡Link de Login Copiado!" : "Copiar Link de Login"}</span>
                </button>
              </div>
            </div>

            {/* SECCIÓN 3: ZONA DE REVOCACIÓN */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleRevokeAllAdminAccess(selectedAdminEmail)}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Revocar Todo Acceso a la Plataforma</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAdminEmail(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL CREAR NUEVO ADMINISTRADOR (USUARIO/CLAVE O CORREO) */}
      {/* ============================================================ */}
      {isCreateAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl p-6 md:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <UserCheck size={18} className="text-emerald-400" />
                  <span>Crear Nuevo Administrador</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Genera una cuenta con contraseña o asigna por correo electrónico.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreateAdminModalOpen(false);
                  setCreateAdminAlert(null);
                  setCreateAdminError(null);
                }}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {createAdminAlert && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Check size={16} />
                  <span>¡Cuenta Creada Exitosamente!</span>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-3 rounded-xl font-mono text-xs">
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase block">Usuario:</span>
                    <span className="text-white font-bold">{createAdminAlert.username}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase block">Contraseña:</span>
                    <span className="text-emerald-400 font-bold">{createAdminAlert.pass}</span>
                  </div>
                </div>
              </div>
            )}

            {createAdminError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">
                {createAdminError}
              </div>
            )}

            {/* Selector de Método */}
            <div className="flex gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setNewAdminMethod("credentials")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  newAdminMethod === "credentials"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <KeyRound size={13} />
                <span>Usuario & Contraseña</span>
              </button>
              <button
                type="button"
                onClick={() => setNewAdminMethod("email")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  newAdminMethod === "email"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Mail size={13} />
                <span>Por Correo Existente</span>
              </button>
            </div>

            <form onSubmit={handleCreateNewAdmin} className="space-y-4">
              {newAdminMethod === "credentials" ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Nombre / Rol</label>
                    <input
                      type="text"
                      placeholder="Ej: Mesa Técnica"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Usuario *</label>
                    <input
                      type="text"
                      placeholder="ej: mesa_tbs"
                      value={newAdminUsername}
                      onChange={(e) => setNewAdminUsername(e.target.value.toLowerCase().trim())}
                      required
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Contraseña *</label>
                    <input
                      type="text"
                      placeholder="Mínimo 6 chars"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    placeholder="organizador@gmail.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Selector de Torneos a Asignar */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Asignar a los siguientes Torneos ({newAdminTournamentIds.length} seleccionados):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-zinc-950 rounded-xl border border-zinc-800">
                  {tournaments.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newAdminTournamentIds.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewAdminTournamentIds([...newAdminTournamentIds, t.id]);
                          } else {
                            setNewAdminTournamentIds(newAdminTournamentIds.filter(id => id !== t.id));
                          }
                        }}
                        className="rounded border-zinc-700 text-emerald-600"
                      />
                      <span className="truncate">{t.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateAdminModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAdmin}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20"
                >
                  {isCreatingAdmin ? "Creando..." : "Crear Administrador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Creación de Torneo */}
      <CreateTournamentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Modal Rápido para Editar Administradores & PIN de un Torneo */}
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
                  Los usuarios que tengan estos correos asignados tendrán acceso de gestión.
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
