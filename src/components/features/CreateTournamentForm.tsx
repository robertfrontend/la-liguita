"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import { TournamentTier, Sport } from "@/types/tournament";
import { 
  Trophy, 
  Flame, 
  Check, 
  Sparkles, 
  ArrowRight, 
  Loader2 
} from "lucide-react";

export function CreateTournamentForm() {
  const router = useRouter();
  const { user } = useAuth();

  const [tier, setTier] = useState<TournamentTier>("amateur");
  const [sport, setSport] = useState<Sport>("basketball");
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Por favor ingresa un nombre para el torneo.");
      return;
    }
    if (!user) {
      setError("Debes estar autenticado para crear un torneo.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const newTournamentData = {
        name: name.trim(),
        slug: `${slug}-${Math.random().toString(36).substring(2, 7)}`,
        organizationName: organizationName.trim() || "Organización Independiente",
        sport,
        tier,
        ownerId: user.uid,
        status: "draft",
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

      const docRef = await addDoc(collection(db, "tournaments"), newTournamentData);

      // Redirigir al Asistente de Configuración Paso a Paso
      router.push(`/tournament/${docRef.id}/onboarding`);
    } catch (err: unknown) {
      console.error("Error al crear el torneo:", err);
      setError("Ocurrió un error al registrar el torneo en Firestore.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-10 px-4">
      {/* Encabezado */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-wider mb-3 border border-orange-500/20">
          <Sparkles size={14} /> Creación de Torneos y Ligas
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          Configura tu Nueva Competición
        </h1>
        <p className="text-zinc-400 text-sm md:text-base mt-2 max-w-lg mx-auto">
          Elige el nivel de complejidad adecuado: desde una liguita de fin de semana hasta un torneo federado oficial.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Selector de Deporte */}
        <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl">
          <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">
            1. Selecciona la Disciplina Deportiva
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSport("basketball")}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 font-bold transition-all ${
                sport === "basketball"
                  ? "border-orange-500 bg-orange-500/10 text-white shadow-lg shadow-orange-500/10"
                  : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <span className="text-2xl">🏀</span>
              <span className="text-base">Baloncesto / Basketball</span>
            </button>

            <button
              type="button"
              onClick={() => setSport("soccer")}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 font-bold transition-all ${
                sport === "soccer"
                  ? "border-green-500 bg-green-500/10 text-white shadow-lg shadow-green-500/10"
                  : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <span className="text-2xl">⚽</span>
              <span className="text-base">Fútbol / Soccer</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Selector (Tier Amateur vs PRO) */}
        <div>
          <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">
            2. Elige el Nivel de Servicio (Tier)
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Amateur */}
            <div
              onClick={() => setTier("amateur")}
              className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all flex flex-col justify-between ${
                tier === "amateur"
                  ? "border-zinc-300 bg-zinc-900 text-white shadow-xl shadow-white/5 ring-2 ring-zinc-400/20"
                  : "border-zinc-800/80 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-zinc-800 text-zinc-200">
                    <Trophy size={24} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    Gratuito / Casual
                  </span>
                </div>

                <h3 className="text-xl font-black text-white mb-1">Liguita Amateur</h3>
                <p className="text-xs text-zinc-400 mb-6">
                  Ideal para torneos de barrio, retas callejeras y ligas casuales entre amigos.
                </p>

                <ul className="space-y-3 text-xs text-zinc-300">
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-zinc-400 shrink-0" />
                    <span>Marcador en vivo simplificado (Puntos y Faltas)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-zinc-400 shrink-0" />
                    <span>Tabla de posiciones y clasificación general</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-zinc-400 shrink-0" />
                    <span>Algoritmo de MVP rápido por partido</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-zinc-400 shrink-0" />
                    <span>Enlaces públicos compartibles al instante</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-300">Totalmente Gratis</span>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                  tier === "amateur" ? "bg-white text-zinc-950 font-black" : "bg-zinc-800 text-zinc-400"
                }`}>
                  {tier === "amateur" ? "Seleccionado" : "Seleccionar"}
                </span>
              </div>
            </div>

            {/* Card Profesional */}
            <div
              onClick={() => setTier("pro")}
              className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all flex flex-col justify-between overflow-hidden ${
                tier === "pro"
                  ? "border-orange-500 bg-gradient-to-b from-orange-950/20 via-zinc-900 to-zinc-900 text-white shadow-2xl shadow-orange-500/10 ring-2 ring-orange-500/40"
                  : "border-zinc-800/80 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {/* Ribbon Superior */}
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-l from-orange-500 to-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider py-1 px-4 rounded-bl-xl shadow-md">
                  Recomendado para Torneos Oficiales
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    <Flame size={24} />
                  </div>
                </div>

                <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
                  Torneo Profesional <Sparkles size={16} className="text-orange-400" />
                </h3>
                <p className="text-xs text-zinc-400 mb-6">
                  Para ligas federadas, torneos superiores y eventos con cobertura profesional (ej. TBS Peravia).
                </p>

                <ul className="space-y-3 text-xs text-zinc-200">
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-orange-400 shrink-0" />
                    <span><strong>Play-by-Play en vivo:</strong> Registro jugada por jugada con reloj</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-orange-400 shrink-0" />
                    <span><strong>Stats Completas:</strong> Asistencias, rebotes (Off/Def), bloqueos, robos, % de tiro</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-orange-400 shrink-0" />
                    <span><strong>Rosters y Carnets Oficiales</strong> con foto y dorsal</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-orange-400 shrink-0" />
                    <span><strong>Gestión de Árbitros y Mesa Técnica</strong> con roles y permisos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-orange-400 shrink-0" />
                    <span><strong>Video Highlights y Transmisión en Vivo</strong></span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-orange-500/20 flex items-center justify-between">
                <div>
                  <span className="text-lg font-black text-orange-400">$19</span>
                  <span className="text-xs text-zinc-400"> / torneo o temporada</span>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                  tier === "pro" ? "bg-orange-500 text-zinc-950 font-black shadow-md shadow-orange-500/20" : "bg-zinc-800 text-zinc-400"
                }`}>
                  {tier === "pro" ? "Seleccionado" : "Seleccionar"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Datos Básicos */}
        <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl space-y-4">
          <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">
            3. Información General
          </label>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Nombre del Torneo / Liga *</label>
            <input
              type="text"
              placeholder="Ej: Torneo de Baloncesto Superior TBS Peravia 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition font-medium text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Organización o Club Anfitrión (Opcional)</label>
            <input
              type="text"
              placeholder="Ej: Asociación de Baloncesto de Baní"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition font-medium text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Botón de Acción Principal */}
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-black text-base rounded-xl transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Creando Torneo...</span>
            </>
          ) : (
            <>
              <span>Crear {tier === "pro" ? "Torneo Profesional" : "Liguita Amateur"}</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
