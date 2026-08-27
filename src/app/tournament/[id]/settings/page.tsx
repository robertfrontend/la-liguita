"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tournament, TournamentTier } from "@/types/tournament";
import { subscribeToTournament, updateTournamentInDb, deleteTournamentFromDb } from "@/lib/db";
import { Settings, Sparkles, Trash2, Check, Save } from "lucide-react";

export default function TournamentSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params?.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [adminEmailsStr, setAdminEmailsStr] = useState("");
  const [tier, setTier] = useState<TournamentTier>("amateur");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!tournamentId) return;
    const unsub = subscribeToTournament(tournamentId, (t) => {
      if (t) {
        setTournament(t);
        setName(t.name);
        setOrg(t.organizationName || "");
        setAdminEmailsStr(t.adminEmails ? t.adminEmails.join(", ") : "");
        setTier(t.tier);
      }
    });
    return () => unsub();
  }, [tournamentId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournamentId || !name.trim()) return;

    const cleanEmails = adminEmailsStr
      .split(/[,\s]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0 && e.includes('@'));

    setIsSaving(true);
    await updateTournamentInDb(tournamentId, {
      name: name.trim(),
      organizationName: org.trim(),
      adminEmails: cleanEmails,
      tier,
    });
    setIsSaving(false);
    alert("¡Configuración actualizada con éxito!");
  };

  const handleDelete = async () => {
    if (confirm("¿Estás seguro de que deseas eliminar este torneo y todos sus datos asociados? Esta acción no se puede deshacer.")) {
      await deleteTournamentFromDb(tournamentId);
      router.push("/");
    }
  };

  if (!tournament) return <div className="p-8 text-center text-zinc-500">Cargando configuración...</div>;

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Settings className="text-orange-500" />
          Configuración del Torneo
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Ajusta los parámetros generales, cambia el nivel de servicio (Tier) o administra la competición.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80">
        <div>
          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Nombre del Torneo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Organización / Club</label>
          <input
            type="text"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Administradores Asignados (Emails)</label>
          <input
            type="text"
            value={adminEmailsStr}
            onChange={(e) => setAdminEmailsStr(e.target.value)}
            placeholder="admin1@gmail.com, admin2@gmail.com"
            className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
          />
          <p className="text-[11px] text-zinc-500 mt-1">Correos electrónicos separados por coma con acceso administrativo a este torneo.</p>
        </div>

        {/* Selector de Nivel (Tier Upgrade / Switch) */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Nivel de Servicio (Tier)</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTier("amateur")}
              className={`p-4 rounded-xl border-2 text-left transition ${
                tier === "amateur"
                  ? "border-zinc-300 bg-zinc-900 text-white"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <div className="font-bold text-sm">Amateur</div>
              <div className="text-xs text-zinc-500 mt-1">Estadísticas básicas y flujo ágil</div>
            </button>

            <button
              type="button"
              onClick={() => setTier("pro")}
              className={`p-4 rounded-xl border-2 text-left transition ${
                tier === "pro"
                  ? "border-orange-500 bg-orange-500/10 text-white"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <div className="font-bold text-sm flex items-center gap-1.5 text-orange-400">
                <Sparkles size={14} /> Profesional PRO
              </div>
              <div className="text-xs text-zinc-400 mt-1">Play-by-play, árbitros y box score avanzado</div>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 font-bold text-zinc-950 text-sm rounded-xl transition flex items-center gap-2"
        >
          <Save size={16} />
          <span>{isSaving ? "Guardando..." : "Guardar Cambios"}</span>
        </button>
      </form>

      {/* Zona de Peligro */}
      <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl">
        <h3 className="font-bold text-red-400 text-sm mb-1">Zona de Peligro</h3>
        <p className="text-xs text-zinc-400 mb-4">Eliminar este torneo borrará de forma permanente todos los partidos, equipos y estadísticas asociadas.</p>
        <button
          type="button"
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-2"
        >
          <Trash2 size={14} />
          <span>Eliminar Torneo</span>
        </button>
      </div>
    </div>
  );
}
