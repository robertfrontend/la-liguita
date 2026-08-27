"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import { TournamentTier, Sport } from "@/types/tournament";
import { 
  X, 
  Trophy, 
  Flame, 
  Sparkles, 
  Mail, 
  Building, 
  Loader2, 
  Check, 
  ShieldCheck,
  Activity
} from "lucide-react";

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (tournamentId: string) => void;
}

export function CreateTournamentModal({ isOpen, onClose, onCreated }: CreateTournamentModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [slug, setSlug] = useState("");
  const [sport, setSport] = useState<Sport>("basketball");
  const [tier, setTier] = useState<TournamentTier>("amateur");
  const [organizerEmail, setOrganizerEmail] = useState("");
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
      setError("El email del organizador es obligatorio.");
      return;
    }
    if (!user) {
      setError("Debes estar autenticado como Super Admin.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const cleanEmails = organizerEmail
        .split(/[,\s]+/)
        .map(e => e.trim().toLowerCase())
        .filter(e => e.length > 0 && e.includes('@'));

      if (cleanEmails.length === 0) {
        setError("Ingresa al menos un correo electrónico válido para el administrador.");
        setIsSubmitting(false);
        return;
      }

      const finalSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const tournamentDoc = {
        name: name.trim(),
        slug: `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`,
        sport,
        tier,
        ownerId: user.uid,
        adminEmails: cleanEmails,
        organizationName: organizationName.trim() || "Liga Oficial",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {
          maxTeams: tier === "pro" ? 32 : 12,
          playersPerTeam: sport === "basketball" ? 12 : 22,
          periodDurationMinutes: sport === "basketball" ? (tier === "pro" ? 10 : 8) : 45,
          totalPeriods: sport === "basketball" ? 4 : 2,
          allowOvertime: true,
          publicLeaderboard: true,
          trackPlayByPlay: tier === "pro",
          trackShotCharts: tier === "pro",
          enableRefereeAssignment: tier === "pro",
          enableVideoHighlights: tier === "pro",
        },
      };

      const docRef = await addDoc(collection(db, "tournaments"), tournamentDoc);

      onClose();
      if (onCreated) {
        onCreated(docRef.id);
      } else {
        router.push(`/tournament/${docRef.id}/onboarding`);
      }
    } catch (err: unknown) {
      console.error("Error al crear el torneo desde Super Admin:", err);
      setError("Error al registrar el torneo en Firestore.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
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

        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20 mb-2">
            <ShieldCheck size={13} />
            <span>Consola Administrativa</span>
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">Crear y Asignar Nuevo Torneo</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configura el nivel de servicio y asigna las credenciales de los organizadores oficiales.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Selector de Nivel (Tier) */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Nivel de Operación (Tier) *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTier("amateur")}
                className={`p-3.5 rounded-xl border text-left transition flex items-start justify-between ${
                  tier === "amateur"
                    ? "border-zinc-300 bg-zinc-800 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Trophy size={15} className="text-zinc-300" />
                    <span>Liguita Amateur</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">Marcador básico, tabla de posiciones y MVP rápido.</p>
                </div>
                {tier === "amateur" && <Check size={15} className="text-white shrink-0 mt-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => setTier("pro")}
                className={`p-3.5 rounded-xl border text-left transition flex items-start justify-between ${
                  tier === "pro"
                    ? "border-orange-500 bg-orange-500/10 text-white shadow-sm"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-orange-400">
                    <Sparkles size={15} />
                    <span>Torneo Profesional FIBA</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">Play-by-play en vivo, box score completo y árbitros.</p>
                </div>
                {tier === "pro" && <Check size={15} className="text-orange-400 shrink-0 mt-0.5" />}
              </button>
            </div>
          </div>

          {/* Disciplina */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Disciplina Deportiva *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSport("basketball")}
                className={`py-2 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  sport === "basketball"
                    ? "border-orange-500 bg-orange-500/10 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <span>Baloncesto / Basketball</span>
              </button>
              <button
                type="button"
                onClick={() => setSport("soccer")}
                className={`py-2 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  sport === "soccer"
                    ? "border-blue-500 bg-blue-500/10 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <span>Fútbol / Soccer</span>
              </button>
            </div>
          </div>

          {/* Nombre y Organización */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Nombre Oficial del Torneo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Torneo Superior TBS Peravia 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500 font-medium"
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
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500 font-medium"
              />
            </div>
          </div>

          {/* Email Organizador */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Email o Usuario del Organizador Encargado *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
              <input
                type="text"
                required
                placeholder="organizador@laliguita.com o usuario"
                value={organizerEmail}
                onChange={(e) => setOrganizerEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 font-mono">
              Este usuario tendrá control administrativo delegado sobre el torneo.
            </p>
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
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <span>Crear Torneo</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
