"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Tournament } from "@/types/tournament";
import { subscribeToTournament, updateTournamentInDb } from "@/lib/db";
import { useAuth } from "@/components/providers/AuthProvider";
import { isSuperAdmin, createAdminAccountWithCredentials, resolveLoginIdentifier } from "@/lib/auth-helpers";
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
  Info,
  Sparkles,
  ArrowRight
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
    if (confirm(`¿Estás seguro de revocar el acceso de administrador a "${emailToRemove}"?`)) {
      const updatedAdmins = currentAdmins.filter(
        e => e.toLowerCase() !== emailToRemove.toLowerCase()
      );
      await updateTournamentInDb(tournamentId, {
        adminEmails: updatedAdmins,
      });
    }
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/login`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <UserCheck className="text-orange-500" />
              <span>Administradores del Torneo</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20">
              {currentAdmins.length} Activo(s)
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Gestiona los accesos y crea usuarios con contraseña para los organizadores de <strong>{tournament.name}</strong>.
          </p>
        </div>

        <button
          onClick={handleCopyInviteLink}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition border border-zinc-700 shrink-0"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          <span>{copied ? "¡Link de Login Copiado!" : "Copiar Link de Acceso"}</span>
        </button>
      </div>

      {/* Alerta de credenciales recién creadas para compartir */}
      {createdCredentialsAlert && (
        <div className="p-5 bg-green-500/10 border border-green-500/30 rounded-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-green-400 font-black text-sm">
            <Check size={18} />
            <span>¡Cuenta de Administrador Creada Exitosamente!</span>
          </div>
          <p className="text-xs text-zinc-300">
            Comparte estas credenciales con el organizador para que pueda iniciar sesión de inmediato:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950 p-3.5 rounded-xl font-mono text-xs border border-zinc-800">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Usuario:</span>
              <span className="text-white font-bold">{createdCredentialsAlert.username}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Contraseña:</span>
              <span className="text-orange-400 font-bold">{createdCredentialsAlert.pass}</span>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de Alta de Administradores */}
      <div className="bg-zinc-900/70 p-6 rounded-2xl border border-zinc-800/80 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserPlus size={16} className="text-orange-400" />
            <span>Agregar Administrador</span>
          </h3>

          {/* Selector de Método */}
          <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setMethod("credentials")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                method === "credentials"
                  ? "bg-orange-500 text-zinc-950 shadow-sm"
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
                  ? "bg-orange-500 text-zinc-950 shadow-sm"
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
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-orange-500"
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
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-orange-500"
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
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !username.trim() || !password.trim()}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-zinc-950 font-black text-xs rounded-xl transition shadow-lg shadow-orange-500/20"
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
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newEmail.trim()}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-zinc-950 font-black text-xs rounded-xl transition shadow-lg shadow-orange-500/20 shrink-0"
            >
              {isSubmitting ? "Guardando..." : "Asignar Correo"}
            </button>
          </form>
        )}

        {error && (
          <p className="text-red-400 text-xs font-semibold">{error}</p>
        )}
      </div>

      {/* Lista de Administradores Registrados */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-zinc-950/80 border-b border-zinc-800 font-bold text-xs text-zinc-300 uppercase tracking-wider">
          Usuarios con Permisos de Administración
        </div>

        <div className="divide-y divide-zinc-800/60">
          {/* Dueño / Super Admin */}
          <div className="p-4 flex items-center justify-between hover:bg-zinc-800/20 transition">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="font-bold text-white text-xs flex items-center gap-2">
                  <span>Super Administrador Maestro</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-orange-500 text-zinc-950">
                    robert02frontend
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500">Acceso global y control absoluto de la plataforma</div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Propietario</span>
          </div>

          {/* Administradores Delegados */}
          {currentAdmins.map((email) => {
            const isSystemUser = email.endsWith("@laliguita.com");
            const displayUsername = isSystemUser ? email.replace("@laliguita.com", "") : email;

            return (
              <div key={email} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                    {isSystemUser ? <KeyRound size={16} className="text-orange-400" /> : <UserCheck size={16} />}
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs font-mono flex items-center gap-2">
                      <span>{displayUsername}</span>
                      {isSystemUser && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Usuario & Contraseña
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {isSystemUser ? `Login: ${displayUsername}` : email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRemoveAdmin(email)}
                    className="p-2 bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition border border-zinc-700/60 text-xs flex items-center gap-1.5"
                    title="Revocar acceso"
                  >
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">Revocar</span>
                  </button>
                </div>
              </div>
            );
          })}

          {currentAdmins.length === 0 && (
            <div className="p-10 text-center text-zinc-500 text-xs">
              No hay administradores adicionales asignados. Solo el Super Admin tiene acceso actualmente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
