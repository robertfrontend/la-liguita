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
  Globe, 
  Building, 
  Loader2, 
  Check, 
  ArrowRight,
  ShieldCheck
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
  const [slug, setSlug] = useState("");
  const [sport, setSport] = useState<Sport>("basketball");
  const [tier, setTier] = useState<TournamentTier>("amateur");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-generar slug al escribir el nombre si el usuario no lo modificó manualmente
  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del torneo es obligatorio.");
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
        ownerId: user.uid, // Creado por el Super Admin
        adminEmails: cleanEmails, // Asignado a los administradores de la liga
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
          <X size={20} />
        </button>

        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 uppercase tracking-widest bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20 mb-2">
            <ShieldCheck size={14} /> Panel Super Admin
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">Crear y Asignar Nuevo Torneo</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Configura el nivel de servicio y asigna el email del organizador que administrará la liga.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selector de Nivel (Tier) */}
          <div>
            <label className="block text-xs font-black text-zinc-400 uppercase tracking-wider mb-2">
              Nivel de Servicio (Tier) *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTier("amateur")}
                className={`p-3.5 rounded-xl border-2 text-left transition flex items-start justify-between ${
                  tier === "amateur"
                    ? "border-zinc-300 bg-zinc-800/80 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Trophy size={16} className="text-zinc-300" />
                    <span>Liguita Amateur</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">Stats rápidas, marcador simple y sin costo.</p>
                </div>
                {tier === "amateur" && <Check size={16} className="text-white shrink-0 mt-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => setTier("pro")}
                className={`p-3.5 rounded-xl border-2 text-left transition flex items-start justify-between ${
                  tier === "pro"
                    ? "border-orange-500 bg-orange-500/10 text-white shadow-lg shadow-orange-500/10"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-orange-400">
                    <Flame size={16} />
                    <span>Torneo Profesional</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">Play-by-play, box score completo y árbitros.</p>
                </div>
                {tier === "pro" && <Check size={16} className="text-orange-400 shrink-0 mt-0.5" />}
              </button>
            </div>
          </div>

          {/* Deporte */}
          <div>
            <label className="block text-xs font-black text-zinc-400 uppercase tracking-wider mb-2">
              Disciplina Deportiva *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSport("basketball")}
                className={`py-2.5 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition ${
                  sport === "basketball"
                    ? "border-orange-500 bg-orange-500/10 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400"
                }`}
              >
                <span>🏀</span> Baloncesto
              </button>
              <button
                type="button"
                onClick={() => setSport("soccer")}
                className={`py-2.5 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition ${
                  sport === "soccer"
                    ? "border-green-500 bg-green-500/10 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400"
                }`}
              >
                <span>⚽</span> Fútbol
              </button>
            </div>
          </div>

          {/* Nombre y Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">Nombre del Torneo *</label>
              <input
                type="text"
                placeholder="Ej: TBS Peravia 2026"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Globe size={14} className="text-zinc-400" />
                <span>Slug (URL Pública)</span>
              </label>
              <input
                type="text"
                placeholder="ej: tbs-peravia-2026"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Email(s) del Organizador / Administradores */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Mail size={14} className="text-orange-400" />
              <span>Administradores de la Liga (Emails) *</span>
            </label>
            <input
              type="text"
              placeholder="organizador1@gmail.com, organizador2@gmail.com"
              value={organizerEmail}
              onChange={(e) => setOrganizerEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Puedes ingresar uno o varios correos separados por coma. Estos usuarios tendrán acceso completo de administración para gestionar partidos, equipos y marcador.
            </p>
          </div>

          {/* Club / Organización */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Building size={14} className="text-zinc-400" />
              <span>Organización / Club Anfitrión</span>
            </label>
            <input
              type="text"
              placeholder="Ej: ABASAP / Club Baní"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !organizerEmail.trim()}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-zinc-950 font-black text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-orange-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <span>Crear y Asignar</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
