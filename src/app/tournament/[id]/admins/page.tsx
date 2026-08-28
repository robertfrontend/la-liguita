"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Tournament } from "@/types/tournament";
import { subscribeToTournament, updateTournamentInDb, revokeAdminTournamentAccess } from "@/lib/db";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  isSuperAdmin, 
  createAdminAccountWithCredentials, 
  resolveLoginIdentifier,
  sendAdminPasswordReset 
} from "@/lib/auth-helpers";
import { 
  UserCheck, 
  UserPlus, 
  Trash2, 
  Mail, 
  ShieldCheck, 
  Copy, 
  Check, 
  KeyRound, 
  Lock, 
  User, 
  Users,
  Info,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  Search,
  X,
  Send,
  ShieldAlert
} from "lucide-react";

export default function TournamentAdminsPage() {
  const params = useParams();
  const tournamentId = params?.id as string;
  const { user } = useAuth();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [method, setMethod] = useState<"credentials" | "email">("credentials");
  
  // Campos para crear credenciales (Usuario + Contraseña)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminName, setAdminName] = useState("");

  // Campo para correo directo
  const [newEmail, setNewEmail] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdCredentialsAlert, setCreatedCredentialsAlert] = useState<{ username: string; pass: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Buscador de administradores en la lista
  const [searchQuery, setSearchQuery] = useState("");

  // Modal de Detalle de Administrador
  const [selectedAdminEmail, setSelectedAdminEmail] = useState<string | null>(null);
  const [detailSuccessMsg, setDetailSuccessMsg] = useState<string | null>(null);
  const [detailErrorMsg, setDetailErrorMsg] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [copiedLoginLink, setCopiedLoginLink] = useState(false);

  const superAdmin = isSuperAdmin(user);

  useEffect(() => {
    if (!tournamentId) return;
    const unsub = subscribeToTournament(tournamentId, (t) => {
      setTournament(t);
    });
    return () => unsub();
  }, [tournamentId]);

  if (!tournament) {
    return <div className="p-8 text-center text-zinc-500">Cargando administradores del torneo...</div>;
  }

  const currentAdmins = tournament.adminEmails || [];

  // Filtrado de administradores en la lista
  const filteredAdmins = currentAdmins.filter((email) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const isSystemUser = email.endsWith("@laliguita.com");
    const displayUsername = isSystemUser ? email.replace("@laliguita.com", "") : email;
    return displayUsername.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  // Crear usuario con credenciales (Usuario + Contraseña)
  const handleCreateWithCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreatedCredentialsAlert(null);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
    if (!cleanUsername || cleanUsername.length < 3) {
      setError("El nombre de usuario debe tener al menos 3 caracteres alfanuméricos.");
      return;
    }
    if (!password || password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Crea la cuenta en Firebase Auth
      const resolvedEmail = await createAdminAccountWithCredentials(
        cleanUsername, 
        password, 
        adminName.trim() || `Admin ${tournament.name}`
      );

      // Asocia el correo al torneo en Firestore
      if (!currentAdmins.map(e => e.toLowerCase()).includes(resolvedEmail.toLowerCase())) {
        const updatedAdmins = [...currentAdmins, resolvedEmail.toLowerCase()];
        await updateTournamentInDb(tournamentId, {
          adminEmails: updatedAdmins,
        });
      }

      setCreatedCredentialsAlert({ username: cleanUsername, pass: password });
      setUsername("");
      setPassword("");
      setAdminName("");
    } catch (err: any) {
      console.error("Error al crear credenciales de administrador:", err);
      if (err.code === "auth/email-already-in-use") {
        setError(`El usuario "${cleanUsername}" ya existe. Puedes asignarlo por su correo.`);
      } else {
        setError(err.message || "Error al crear la cuenta de administrador.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Asignar por correo electrónico directo
  const handleAddByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Por favor ingresa un correo electrónico válido.");
      return;
    }

    if (currentAdmins.map(e => e.toLowerCase()).includes(cleanEmail)) {
      setError("Este correo ya está registrado como administrador de este torneo.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const updatedAdmins = [...currentAdmins, cleanEmail];
      await updateTournamentInDb(tournamentId, {
        adminEmails: updatedAdmins,
      });
      setNewEmail("");
    } catch (err) {
      console.error("Error al agregar admin:", err);
      setError("Error al guardar en Firestore.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (emailToRemove: string) => {
    if (confirm(`¿Estás seguro de revocar el acceso de administrador a "${emailToRemove}" en este torneo?`)) {
      await revokeAdminTournamentAccess(tournamentId, emailToRemove);
      if (selectedAdminEmail === emailToRemove) {
        setSelectedAdminEmail(null);
      }
    }
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/login`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenDetail = (email: string) => {
    setSelectedAdminEmail(email);
    setDetailSuccessMsg(null);
    setDetailErrorMsg(null);
  };

  const handleSendResetPassword = async (email: string) => {
    setIsSendingReset(true);
    setDetailSuccessMsg(null);
    setDetailErrorMsg(null);

    try {
      const res = await sendAdminPasswordReset(email);
      if (res.success) {
        setDetailSuccessMsg(res.message);
      } else {
        setDetailErrorMsg(res.message);
      }
    } catch (err: any) {
      setDetailErrorMsg(err?.message || "Error al enviar el enlace.");
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl font-sans pb-16">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <UserCheck className="text-emerald-500" />
              <span>Administradores del Torneo</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {currentAdmins.length} Activo(s)
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Gestiona los permisos de organizadores, crea usuarios con contraseña y administra accesos para <strong>{tournament.name}</strong>.
          </p>
        </div>

        <button
          onClick={handleCopyInviteLink}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition border border-zinc-700 shrink-0 shadow-sm"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          <span>{copied ? "¡Link de Login Copiado!" : "Copiar Link de Acceso"}</span>
        </button>
      </div>

      {/* Alerta de credenciales recién creadas para compartir */}
      {createdCredentialsAlert && (
        <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
            <Check size={18} />
            <span>¡Cuenta de Administrador Creada Exitosamente!</span>
          </div>
          <p className="text-xs text-zinc-300">
            Comparte estas credenciales con el organizador para que pueda iniciar sesión de inmediato en el sistema:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950 p-3.5 rounded-xl font-mono text-xs border border-zinc-800">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Usuario:</span>
              <span className="text-white font-bold">{createdCredentialsAlert.username}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Contraseña:</span>
              <span className="text-emerald-400 font-bold">{createdCredentialsAlert.pass}</span>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de Alta de Administradores */}
      <div className="bg-zinc-900/70 p-6 rounded-2xl border border-zinc-800/80 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserPlus size={16} className="text-emerald-400" />
            <span>Agregar Administrador al Torneo</span>
          </h3>

          {/* Selector de Método */}
          <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setMethod("credentials")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                method === "credentials"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <KeyRound size={13} />
              <span>Usuario & Contraseña</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod("email")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                method === "email"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Mail size={13} />
              <span>Por Correo</span>
            </button>
          </div>
        </div>

        {/* Método 1: Crear con Usuario y Contraseña */}
        {method === "credentials" && (
          <form onSubmit={handleCreateWithCredentials} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Nombre / Rol</label>
                <input
                  type="text"
                  placeholder="Ej: Mesa Técnica TBS"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Usuario Único *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
                  <input
                    type="text"
                    placeholder="ej: tbs_peravia"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Contraseña Inicial *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
                  <input
                    type="text"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !username.trim() || !password.trim()}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-xl transition shadow-lg shadow-emerald-600/20"
              >
                {isSubmitting ? "Creando Credenciales..." : "Crear y Asignar Cuenta"}
              </button>
            </div>
          </form>
        )}

        {/* Método 2: Asignar por Correo Existente */}
        {method === "email" && (
          <form onSubmit={handleAddByEmail} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="email"
                placeholder="organizador.existente@gmail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newEmail.trim()}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-xl transition shadow-lg shadow-emerald-600/20 shrink-0"
            >
              {isSubmitting ? "Guardando..." : "Asignar Correo"}
            </button>
          </form>
        )}

        {error && (
          <p className="text-red-400 text-xs font-semibold">{error}</p>
        )}
      </div>

      {/* LISTA ESTRUCTURADA DE ADMINISTRADORES */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl space-y-0">
        {/* Barra de Filtro de la Lista */}
        <div className="p-4 bg-zinc-950/80 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="font-bold text-xs text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Users size={15} className="text-emerald-400" />
            <span>Lista de Administradores con Acceso</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
            <input
              type="text"
              placeholder="Buscar en la lista..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Tabla Lista de Administradores */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-950/40 border-b border-zinc-800 text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                <th className="py-3.5 px-5">Administrador / Login</th>
                <th className="py-3.5 px-4">Método de Acceso</th>
                <th className="py-3.5 px-4 text-center">Permisos</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {/* Propietario / Super Admin */}
              <tr className="bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05] transition">
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-2">
                        <span>Super Administrador Maestro</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Owner
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono">robert02frontend@gmail.com</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Control Absoluto
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="text-[11px] font-bold text-emerald-400 font-mono">Total / Global</span>
                </td>
                <td className="py-3.5 px-5 text-right">
                  <span className="text-[11px] text-zinc-500 italic">Propietario</span>
                </td>
              </tr>

              {/* Administradores Delegados */}
              {filteredAdmins.map((email) => {
                const isSystemUser = email.endsWith("@laliguita.com");
                const displayUsername = isSystemUser ? email.replace("@laliguita.com", "") : email;

                return (
                  <tr key={email} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                          {isSystemUser ? <KeyRound size={15} className="text-emerald-400" /> : <UserCheck size={15} className="text-blue-400" />}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs font-mono">
                            {displayUsername}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono truncate max-w-xs">
                            {email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {isSystemUser ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                          <Lock size={10} className="text-emerald-400" />
                          <span>Usuario & Clave</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                          <Mail size={10} className="text-blue-400" />
                          <span>Correo Directo</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Acceso Activo
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botón Ver Detalles */}
                        <button
                          onClick={() => handleOpenDetail(email)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
                        >
                          <SlidersHorizontal size={13} />
                          <span>Ver Detalles</span>
                        </button>

                        {/* Botón Restablecer Clave Rápido */}
                        <button
                          onClick={() => handleSendResetPassword(email)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition border border-zinc-700"
                          title="Enviar correo para restablecer contraseña"
                        >
                          <KeyRound size={14} />
                        </button>

                        {/* Botón Revocar Acceso */}
                        <button
                          onClick={() => handleRemoveAdmin(email)}
                          className="p-1.5 bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition border border-zinc-700/60"
                          title="Revocar acceso a este torneo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAdmins.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500 text-xs italic">
                    No se encontraron administradores registrados en este torneo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL DETALLE DE ADMINISTRADOR EN ESTE TORNEO */}
      {/* ============================================================ */}
      {selectedAdminEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                  <UserCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Detalle del Administrador</h3>
                  <p className="text-xs text-emerald-400 font-mono font-bold mt-0.5">
                    {selectedAdminEmail.endsWith("@laliguita.com")
                      ? selectedAdminEmail.replace("@laliguita.com", "")
                      : selectedAdminEmail}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAdminEmail(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mensajes */}
            {detailSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
                <Check size={16} />
                <span>{detailSuccessMsg}</span>
              </div>
            )}
            {detailErrorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
                <ShieldAlert size={16} />
                <span>{detailErrorMsg}</span>
              </div>
            )}

            {/* Datos de Acceso */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Torneo Asignado:</span>
                <span className="font-bold text-white">{tournament.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Correo / Identificador:</span>
                <span className="font-mono text-zinc-200">{selectedAdminEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Tipo de Cuenta:</span>
                <span className="font-bold text-emerald-400">
                  {selectedAdminEmail.endsWith("@laliguita.com") ? "Usuario & Contraseña" : "Correo Directo"}
                </span>
              </div>
            </div>

            {/* Gestión de Contraseña */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={14} className="text-emerald-400" />
                <span>Restablecer o Cambiar Contraseña</span>
              </h4>
              <p className="text-xs text-zinc-400">
                Envía un correo de recuperación seguro para que el organizador actualice su contraseña.
              </p>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSendResetPassword(selectedAdminEmail)}
                  disabled={isSendingReset}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-zinc-700 shadow-sm"
                >
                  <Send size={13} className="text-emerald-400" />
                  <span>{isSendingReset ? "Enviando enlace..." : "Enviar Enlace de Cambio de Clave"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const loginUrl = `${window.location.origin}/login`;
                    navigator.clipboard.writeText(loginUrl);
                    setCopiedLoginLink(true);
                    setTimeout(() => setCopiedLoginLink(false), 2000);
                  }}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-zinc-800"
                >
                  {copiedLoginLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedLoginLink ? "¡Link Copiado!" : "Copiar Link de Login"}</span>
                </button>
              </div>
            </div>

            {/* Zona de Revocación */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleRemoveAdmin(selectedAdminEmail)}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Revocar Acceso a este Torneo</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAdminEmail(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
