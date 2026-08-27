"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { TournamentTier, Sport } from "@/types/tournament";
import { provisionConfiguredTournament } from "@/lib/tournament-generator";
import { 
  X, 
  Trophy, 
  Sparkles, 
  Mail, 
  Building, 
  Loader2, 
  Check, 
  ShieldCheck,
  Zap,
  Users,
  Calendar,
  Sliders,
  KeyRound
} from "lucide-react";

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (tournamentId: string) => void;
}

export function CreateTournamentModal({ isOpen, onClose, onCreated }: CreateTournamentModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Modo de creación
  const [creationMode, setCreationMode] = useState<"auto" | "manual">("auto");

  // Parámetros Básicos
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [sport, setSport] = useState<Sport>("basketball");
  const [tier, setTier] = useState<TournamentTier>("pro");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [adminAccessCode, setAdminAccessCode] = useState<string>(() => `LGT-${Math.floor(1000 + Math.random() * 9000)}`);

  // Configuración del Auto-Provisioning
  const [numberOfTeams, setNumberOfTeams] = useState<number>(10);
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(8);
  const [theme, setTheme] = useState<"dominican" | "nba" | "cities">("dominican");
  const [autoGenerateSchedule, setAutoGenerateSchedule] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Por favor ingresa un nombre para el torneo.");
      return;
    }
    if (!organizerEmail.trim()) {
      setError("El email o usuario del organizador es obligatorio.");
      return;
    }
    if (!user) {
      setError("Debes estar autenticado como Super Admin.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (creationMode === "auto") {
        // Creación y provisión automática de torneo + equipos + jugadores + partidos
        const tournamentId = await provisionConfiguredTournament({
          tournamentName: name.trim(),
          organizationName: organizationName.trim() || "Liga Oficial",
          sport,
          tier,
          organizerEmail: organizerEmail.trim(),
          adminAccessCode: adminAccessCode.trim().toUpperCase(),
          ownerId: user.uid,
          numberOfTeams,
          playersPerTeam,
          theme,
          autoGenerateSchedule,
        });

        onClose();
        if (onCreated) {
          onCreated(tournamentId);
        } else {
          router.push(`/tournament/${tournamentId}/games`);
        }
      } else {
        // Creación manual sin auto-población
        const tournamentId = await provisionConfiguredTournament({
          tournamentName: name.trim(),
          organizationName: organizationName.trim() || "Liga Oficial",
          sport,
          tier,
          organizerEmail: organizerEmail.trim(),
          adminAccessCode: adminAccessCode.trim().toUpperCase(),
          ownerId: user.uid,
          numberOfTeams: 0,
          playersPerTeam: 0,
          theme: "dominican",
          autoGenerateSchedule: false,
        });

        onClose();
        if (onCreated) {
          onCreated(tournamentId);
        } else {
          router.push(`/tournament/${tournamentId}/games`);
        }
      }
    } catch (err: unknown) {
      console.error("Error al crear el torneo configurado:", err);
      setError("Error al crear el torneo en Firestore.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20 mb-2">
            <ShieldCheck size={13} />
            <span>Super Admin Suite</span>
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">Crear Torneo Configurable</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Genera torneos completos con equipos, jugadores y calendario auto-provisionados al instante.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Selector de Modo: Auto-Provisioning vs Manual */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setCreationMode("auto")}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                creationMode === "auto"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Zap size={14} className={creationMode === "auto" ? "fill-current" : ""} />
              <span>Auto-Generar Equipos & Jugadores</span>
            </button>

            <button
              type="button"
              onClick={() => setCreationMode("manual")}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                creationMode === "manual"
                  ? "bg-zinc-800 text-white border border-zinc-700"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Sliders size={14} />
              <span>Configuración Manual en Blanco</span>
            </button>
          </div>

          {/* Opciones de Auto-Generación si está en modo AUTO */}
          {creationMode === "auto" && (
            <div className="bg-zinc-950/80 p-4 rounded-xl border border-emerald-500/30 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Zap size={13} />
                  <span>Plantilla y Parámetros de Generación</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">1-Click Provisioning</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cantidad de Equipos */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Cantidad de Equipos
                  </label>
                  <select
                    value={numberOfTeams}
                    onChange={(e) => setNumberOfTeams(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value={4}>4 Equipos (Torneo Relámpago)</option>
                    <option value={6}>6 Equipos</option>
                    <option value={8}>8 Equipos</option>
                    <option value={10}>10 Equipos (Recomendado)</option>
                    <option value={12}>12 Equipos (Liga Superior)</option>
                    <option value={16}>16 Equipos (Gran Torneo)</option>
                  </select>
                </div>

                {/* Jugadores por Equipo */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Jugadores por Equipo
                  </label>
                  <select
                    value={playersPerTeam}
                    onChange={(e) => setPlayersPerTeam(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value={5}>5 Jugadores (Quinteto Inicial)</option>
                    <option value={8}>8 Jugadores (Roster Ágil)</option>
                    <option value={10}>10 Jugadores (Roster Oficial)</option>
                    <option value={12}>12 Jugadores (Plantilla Completa FIBA)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Estilo de Nombres */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Estilo y Nombres de Clubes
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="dominican">Torneo Superior Tradicional (Pueblo Nuevo, Cajuilitos, San Lázaro...)</option>
                    <option value="nba">Franquicias Pro (Lakers, Celtics, Warriors, Bulls...)</option>
                    <option value="cities">Ciudades / Provincias (Baní Titans, Santo Domingo Lions...)</option>
                  </select>
                </div>

                {/* Generar Calendario de Partidos */}
                <div className="flex items-center gap-2.5 pt-5">
                  <input
                    type="checkbox"
                    id="autoSchedule"
                    checked={autoGenerateSchedule}
                    onChange={(e) => setAutoGenerateSchedule(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-zinc-900 border-zinc-700 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="autoSchedule" className="text-xs font-bold text-zinc-200 cursor-pointer">
                    Generar Calendario de Partidos Automático
                  </label>
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
                ⚡ Se crearán automáticamente <strong>{numberOfTeams} equipos</strong> y <strong>{numberOfTeams * playersPerTeam} jugadores</strong> con nombres, números de dorsal y posiciones oficiales.
              </div>
            </div>
          )}

          {/* Información Básica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Nombre Oficial del Torneo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Torneo Superior Baní 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Organización / Entidad Anfitriona
              </label>
              <input
                type="text"
                placeholder="Ej: Asociación de Baloncesto de Baní"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Email Organizador & PIN de Acceso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Email o Usuario del Organizador *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
                <input
                  type="text"
                  required
                  placeholder="organizador@laliguita.com o usuario"
                  value={organizerEmail}
                  onChange={(e) => setOrganizerEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  PIN Único de Administración *
                </label>
                <button
                  type="button"
                  onClick={() => setAdminAccessCode(`LGT-${Math.floor(1000 + Math.random() * 9000)}`)}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold"
                >
                  Regenerar
                </button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" size={15} />
                <input
                  type="text"
                  required
                  placeholder="Ej: LGT-8492"
                  value={adminAccessCode}
                  onChange={(e) => setAdminAccessCode(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-950 border border-emerald-500/40 rounded-xl text-emerald-400 font-bold text-xs font-mono uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Nivel de Servicio (Tier) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTier("amateur")}
              className={`p-3 rounded-xl border text-left transition ${
                tier === "amateur"
                  ? "border-zinc-300 bg-zinc-800 text-white font-bold"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <div className="font-bold text-xs">Liguita Amateur</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Marcador básico y tabla</div>
            </button>

            <button
              type="button"
              onClick={() => setTier("pro")}
              className={`p-3 rounded-xl border text-left transition ${
                tier === "pro"
                  ? "border-emerald-500 bg-emerald-500/10 text-white font-bold"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <div className="font-bold text-xs flex items-center gap-1 text-emerald-400">
                <Sparkles size={13} />
                <span>Torneo PRO FIBA</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Play-by-play, stats y árbitros</div>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !organizerEmail.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/25 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{creationMode === "auto" ? "Generando equipos y jugadores..." : "Creando torneo..."}</span>
                </>
              ) : (
                <span>{creationMode === "auto" ? "Generar Torneo Completo" : "Crear Torneo"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
