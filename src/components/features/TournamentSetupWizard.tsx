"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tournament, TournamentTeam, TournamentTier } from "@/types/tournament";
import { 
  subscribeToTournament, 
  updateTournamentInDb, 
  subscribeToTournamentTeams, 
  addTournamentTeam 
} from "@/lib/db";
import { createAdminAccountWithCredentials } from "@/lib/auth-helpers";
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Plus, 
  KeyRound, 
  Sparkles, 
  SkipForward
} from "lucide-react";

export function TournamentSetupWizard({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();

  const [step, setStep] = useState<number>(1);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [loading, setLoading] = useState(true);

  // Paso 1: Configuración
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [tier, setTier] = useState<TournamentTier>("amateur");
  const [periodDuration, setPeriodDuration] = useState(10);
  const [totalPeriods, setTotalPeriods] = useState(4);

  // Paso 2: Administradores
  const [adminInput, setAdminInput] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [createdAdminAlert, setCreatedAdminAlert] = useState<{ u: string; p: string } | null>(null);

  // Paso 3: Equipos
  const [teamNameInput, setTeamNameInput] = useState("");
  const [teamShortNameInput, setTeamShortNameInput] = useState("");

  // Copiado
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!tournamentId) return;

    const unsubTournament = subscribeToTournament(tournamentId, (t) => {
      if (t) {
        setTournament(t);
        setName(t.name);
        setOrg(t.organizationName || "");
        setTier(t.tier);
        setPeriodDuration(t.settings.periodDurationMinutes);
        setTotalPeriods(t.settings.totalPeriods);
        setAdminInput(t.adminEmails ? t.adminEmails.join(", ") : "");
      }
      setLoading(false);
    });

    const unsubTeams = subscribeToTournamentTeams(tournamentId, (tList) => {
      setTeams(tList);
    });

    return () => {
      unsubTournament();
      unsubTeams();
    };
  }, [tournamentId]);

  if (loading || !tournament) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-zinc-500 text-sm">
        Cargando asistente de configuración...
      </div>
    );
  }

  // Guardar Paso 1
  const handleSaveStep1 = async () => {
    await updateTournamentInDb(tournamentId, {
      name: name.trim(),
      organizationName: org.trim(),
      tier,
      settings: {
        ...tournament.settings,
        periodDurationMinutes: periodDuration,
        totalPeriods,
        trackPlayByPlay: tier === "pro",
        enableRefereeAssignment: tier === "pro",
      },
    });
    setStep(2);
  };

  // Guardar Paso 2 (Admin)
  const handleCreateCredentialAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) return;

    try {
      const email = await createAdminAccountWithCredentials(newUsername, newPassword);
      const current = tournament.adminEmails || [];
      if (!current.includes(email)) {
        await updateTournamentInDb(tournamentId, {
          adminEmails: [...current, email],
        });
      }
      setCreatedAdminAlert({ u: newUsername, p: newPassword });
      setNewUsername("");
      setNewPassword("");
    } catch (err: any) {
      alert("Error al crear cuenta: " + err.message);
    }
  };

  const handleAddEmailAdmin = async () => {
    const clean = adminInput
      .split(/[,\s]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.includes("@"));

    await updateTournamentInDb(tournamentId, {
      adminEmails: clean,
    });
    setStep(3);
  };

  // Guardar Paso 3 (Agregar Equipo)
  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamNameInput.trim()) return;

    await addTournamentTeam(tournamentId, {
      name: teamNameInput.trim(),
      shortName: teamShortNameInput.trim().toUpperCase() || teamNameInput.substring(0, 3).toUpperCase(),
      playerIds: [],
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    });

    setTeamNameInput("");
    setTeamShortNameInput("");
  };

  const handleCopyLink = () => {
    const slug = tournament?.slug || tournamentId;
    const url = `${window.location.origin}/t/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-10 flex flex-col justify-between max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Header del Wizard */}
        <div>
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles size={14} /> Asistente de Configuración Inicial
            </span>
            <span className="text-xs font-mono text-zinc-500">Paso {step} de 4</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Configurar Torneo: {tournament.name}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Sigue estos 4 pasos rápidos para dejar tu torneo listo para competir y difundir.
          </p>

          {/* Barra de Progreso */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step >= i ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-zinc-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* PASO 1: INFORMACIÓN Y REGLAS */}
        {step === 1 && (
          <div className="bg-zinc-900/70 border border-zinc-800 p-6 md:p-8 rounded-3xl space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Parámetros del Torneo</h3>
                <p className="text-xs text-zinc-400">Verifica el nombre, organización y nivel de servicio.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Nombre del Torneo *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Organización / Club Anfitrión</label>
                  <input
                    type="text"
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    placeholder="Ej: ABASAP"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Nivel de Servicio (Tier)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTier("amateur")}
                    className={`p-3.5 rounded-xl border text-left transition ${
                      tier === "amateur"
                        ? "border-zinc-300 bg-zinc-800 text-white"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400"
                    }`}
                  >
                    <div className="font-bold text-xs">Liguita Amateur</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Marcador simple y rápido</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTier("pro")}
                    className={`p-3.5 rounded-xl border text-left transition ${
                      tier === "pro"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400"
                    }`}
                  >
                    <div className="font-bold text-xs">Torneo PRO FIBA</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Box score completo y play-by-play</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-800">
              <button
                onClick={handleSaveStep1}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2"
              >
                <span>Siguiente: Administradores</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: ADMINISTRADORES */}
        {step === 2 && (
          <div className="bg-zinc-900/70 border border-zinc-800 p-6 md:p-8 rounded-3xl space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Administradores del Torneo</h3>
                <p className="text-xs text-zinc-400">Asigna qué personas pueden gestionar este torneo.</p>
              </div>
            </div>

            {/* Crear Credencial Rápida */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <KeyRound size={14} />
                <span>Opción Rápida: Crear Usuario & Contraseña</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Usuario (ej: admin_peravia)"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Contraseña (mín 6 carácteres)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleCreateCredentialAdmin}
                disabled={!newUsername.trim() || !newPassword.trim()}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition"
              >
                Crear Cuenta de Organizador
              </button>

              {createdAdminAlert && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400">
                  ¡Cuenta creada!: Usuario: <strong>{createdAdminAlert.u}</strong> | Contraseña: <strong>{createdAdminAlert.p}</strong>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                O ingresa Correos Electrónicos (Separados por coma):
              </label>
              <textarea
                rows={2}
                value={adminInput}
                onChange={(e) => setAdminInput(e.target.value)}
                placeholder="organizador1@gmail.com, organizador2@gmail.com"
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Atrás</span>
              </button>

              <button
                onClick={handleAddEmailAdmin}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2"
              >
                <span>Siguiente: Equipos</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: EQUIPOS PARTICIPANTES */}
        {step === 3 && (
          <div className="bg-zinc-900/70 border border-zinc-800 p-6 md:p-8 rounded-3xl space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Equipos Participantes</h3>
                <p className="text-xs text-zinc-400">Registra los equipos que competirán en el torneo.</p>
              </div>
            </div>

            {/* Formulario Agregar Equipo */}
            <form onSubmit={handleAddTeam} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Nombre del Equipo (ej: Los Cajuilitos)"
                    value={teamNameInput}
                    onChange={(e) => setTeamNameInput(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Siglas (ej: CAJ)"
                    maxLength={4}
                    value={teamShortNameInput}
                    onChange={(e) => setTeamShortNameInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Agregar a la Lista</span>
              </button>
            </form>

            {/* Lista de Equipos Agregados */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-400 uppercase">Equipos Registrados ({teams.length})</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {teams.map((t) => (
                  <div key={t.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 text-emerald-400 font-bold text-xs flex items-center justify-center">
                      {t.shortName || t.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-bold text-xs text-white truncate">{t.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Atrás</span>
              </button>

              <button
                onClick={() => setStep(4)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2"
              >
                <span>Finalizar Configuración</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: LISTO & DIFUSIÓN */}
        {step === 4 && (
          <div className="bg-zinc-900/70 border border-zinc-800 p-6 md:p-8 rounded-3xl space-y-6 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <Check size={36} />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">¡Torneo Configurado con Éxito!</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                El torneo <strong>{tournament.name}</strong> está listo. Ahora podrás programar el calendario oficial de partidos con sus fechas correspondientes.
              </p>
            </div>

            {/* Enlace Público */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 max-w-md mx-auto text-left space-y-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase">Enlace Público para Fanáticos:</span>
              <div className="flex items-center justify-between gap-2 bg-zinc-900 p-2.5 rounded-xl text-xs font-mono">
                <span className="text-emerald-400 truncate">/t/{tournament.slug || tournament.id}</span>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition shrink-0"
                >
                  {copied ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={() => router.push(`/tournament/${tournament.id}/games`)}
                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl transition shadow-xl shadow-emerald-600/20 flex items-center gap-2"
              >
                <span>Abrir Calendario de Partidos</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Botón Inferior: Saltar Configuración Manual */}
      <div className="pt-10 pb-4 text-center border-t border-zinc-900">
        <button
          onClick={() => router.push(`/tournament/${tournament.id}/games`)}
          className="text-xs text-zinc-500 hover:text-zinc-300 font-semibold transition flex items-center gap-1.5 mx-auto"
        >
          <SkipForward size={14} />
          <span>Saltar asistente y configurar manualmente</span>
        </button>
      </div>
    </div>
  );
}
