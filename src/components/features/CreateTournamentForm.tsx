"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { TournamentTier, Sport } from "@/types/tournament";
import { provisionConfiguredTournament } from "@/lib/tournament-generator";
import { describePlanLimit } from "@/lib/db";
import { 
  Trophy, 
  Sparkles, 
  ArrowRight, 
  Loader2,
  Zap,
  Sliders,
  Check,
  ShieldCheck,
  Users,
  Calendar
} from "lucide-react";

export function CreateTournamentForm() {
  const router = useRouter();
  const { user } = useAuth();

  const [creationMode, setCreationMode] = useState<"auto" | "manual">("auto");
  const [tier, setTier] = useState<TournamentTier>("pro");
  const [sport, setSport] = useState<Sport>("basketball");
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");

  // Opciones de auto-generación
  const [numberOfTeams, setNumberOfTeams] = useState<number>(8);
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(8);
  const [theme, setTheme] = useState<"dominican" | "nba" | "cities">("dominican");
  const [autoGenerateSchedule, setAutoGenerateSchedule] = useState<boolean>(true);

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

    if (creationMode === "auto" && numberOfTeams > 8) {
      setError("El plan Gratis incluye hasta 8 equipos. Elige 8 para crear la liga y mejora a Liga Pro para sumar más.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (creationMode === "auto") {
        const tournamentId = await provisionConfiguredTournament({
          tournamentName: name.trim(),
          organizationName: organizationName.trim() || "Liga Oficial",
          sport,
          tier,
          organizerEmail: user.email || "admin@laliguita.com",
          ownerId: user.uid,
          numberOfTeams,
          playersPerTeam,
          theme,
          autoGenerateSchedule,
        });

        router.push(`/tournament/${tournamentId}/games`);
      } else {
        const tournamentId = await provisionConfiguredTournament({
          tournamentName: name.trim(),
          organizationName: organizationName.trim() || "Liga Oficial",
          sport,
          tier,
          organizerEmail: user.email || "admin@laliguita.com",
          ownerId: user.uid,
          numberOfTeams: 0,
          playersPerTeam: 0,
          theme: "dominican",
          autoGenerateSchedule: false,
        });

        router.push(`/tournament/${tournamentId}/onboarding`);
      }
    } catch (err: unknown) {
      console.error("Error al crear el torneo:", err);
      setError(describePlanLimit(err) || "Ocurrió un error al registrar el torneo en Firestore.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-10 px-4 font-sans">
      {/* Encabezado */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3 border border-emerald-500/20">
          <Sparkles size={14} /> Creación y Provisión de Torneos
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          Configura tu Nueva Competición
        </h1>
        <p className="text-zinc-400 text-xs md:text-sm mt-2 max-w-lg mx-auto">
          Crea un torneo en blanco o genera instantáneamente todos los equipos, plantillas y partidos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-zinc-900/60 p-6 md:p-8 rounded-3xl border border-zinc-800 shadow-2xl">
        {/* Selector de Modo */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-zinc-950 rounded-2xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setCreationMode("auto")}
            className={`py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              creationMode === "auto"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Zap size={15} className={creationMode === "auto" ? "fill-current" : ""} />
            <span>Auto-Generador de Equipos & Jugadores</span>
          </button>

          <button
            type="button"
            onClick={() => setCreationMode("manual")}
            className={`py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              creationMode === "manual"
                ? "bg-zinc-800 text-white border border-zinc-700 font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sliders size={15} />
            <span>Configuración Manual Paso a Paso</span>
          </button>
        </div>

        {/* Panel de Auto-Provisioning */}
        {creationMode === "auto" && (
          <div className="bg-zinc-950/90 p-6 rounded-2xl border border-emerald-500/30 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Zap size={14} />
                  <span>Motor de Auto-Provisión</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Genera la liga completa lista para jugar sin ingresar datos manuales uno a uno.
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800">
                1-Click Provisioning
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Número de Equipos
                </label>
                <select
                  value={numberOfTeams}
                  onChange={(e) => setNumberOfTeams(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value={4}>4 Equipos (Cuadrangular)</option>
                  <option value={6}>6 Equipos</option>
                  <option value={8}>8 Equipos (plan Gratis)</option>
                  <option value={10}>10 Equipos (Liga Pro)</option>
                  <option value={12}>12 Equipos (Liga Pro)</option>
                  <option value={16}>16 Equipos (Liga Pro)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Jugadores por Equipo
                </label>
                <select
                  value={playersPerTeam}
                  onChange={(e) => setPlayersPerTeam(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value={5}>5 Jugadores (Quinteto Inicial)</option>
                  <option value={8}>8 Jugadores (Roster Ágil)</option>
                  <option value={10}>10 Jugadores (Roster Oficial)</option>
                  <option value={12}>12 Jugadores (Plantilla Completa FIBA)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Estilo y Nombres de Clubes
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="dominican">Torneo Superior Tradicional (Pueblo Nuevo, Cajuilitos, San Lázaro...)</option>
                  <option value="nba">Franquicias Pro (Lakers, Celtics, Warriors, Bulls...)</option>
                  <option value="cities">Ciudades / Provincias (Baní Titans, Santo Domingo Lions...)</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 pt-6">
                <input
                  type="checkbox"
                  id="autoSchedulePage"
                  checked={autoGenerateSchedule}
                  onChange={(e) => setAutoGenerateSchedule(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-zinc-900 border-zinc-700 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="autoSchedulePage" className="text-xs font-bold text-zinc-200 cursor-pointer">
                  Generar Calendario de Partidos Oficial (Jornadas)
                </label>
              </div>
            </div>

            <div className="text-xs text-zinc-400 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
              <span>Se crearán automáticamente:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {numberOfTeams} Equipos • {numberOfTeams * playersPerTeam} Jugadores
              </span>
            </div>
          </div>
        )}

        {/* Nivel y Disciplina */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Nivel de Operación (Tier)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTier("amateur")}
                className={`p-3.5 rounded-xl border text-left transition ${
                  tier === "amateur"
                    ? "border-zinc-300 bg-zinc-800 text-white font-bold"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div className="font-bold text-xs">Amateur</div>
                <div className="text-[10px] text-zinc-400 mt-1">Marcador básico y tabla</div>
              </button>

              <button
                type="button"
                onClick={() => setTier("pro")}
                className={`p-3.5 rounded-xl border text-left transition ${
                  tier === "pro"
                    ? "border-emerald-500 bg-emerald-500/10 text-white font-bold"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 text-emerald-400">
                  <Sparkles size={13} />
                  <span>PRO FIBA</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">Play-by-play y stats</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Disciplina Deportiva
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSport("basketball")}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  sport === "basketball"
                    ? "border-emerald-500 bg-emerald-500/10 text-white font-bold"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <span>Baloncesto / Basketball</span>
              </button>
              <button
                type="button"
                onClick={() => setSport("soccer")}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  sport === "soccer"
                    ? "border-blue-500 bg-blue-500/10 text-white font-bold"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <span>Fútbol / Soccer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Datos Básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Nombre Oficial del Torneo *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Torneo Superior TBS 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Organización / Club Anfitrión
            </label>
            <input
              type="text"
              placeholder="Ej: Asociación de Baloncesto Oficial"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Botón de Envío */}
        <div className="flex justify-end pt-4 border-t border-zinc-800">
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/25 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{creationMode === "auto" ? "Generando equipos y calendario..." : "Creando torneo..."}</span>
              </>
            ) : (
              <>
                <span>{creationMode === "auto" ? "Generar Torneo Completo" : "Crear y Configurar"}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
