"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Referee } from "@/types/tournament";
import { subscribeToReferees, addRefereeToDb } from "@/lib/db";
import { ShieldAlert, Plus, UserCheck, Award } from "lucide-react";

export default function TournamentRefereesPage() {
  const params = useParams();
  const tournamentId = params?.id as string;

  const [referees, setReferees] = useState<Referee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [license, setLicense] = useState("");

  useEffect(() => {
    if (!tournamentId) return;
    const unsub = subscribeToReferees(tournamentId, (rList) => {
      setReferees(rList);
      setLoading(false);
    });
    return () => unsub();
  }, [tournamentId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addRefereeToDb(tournamentId, {
      tournamentId,
      name: name.trim(),
      licenseNumber: license.trim() || `FIBA-${Math.floor(1000 + Math.random() * 9000)}`,
      role: "head_referee",
      assignedGamesCount: 0,
    });

    setName("");
    setLicense("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="text-orange-500" />
              Cuerpo Arbitral y Mesa Técnica
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 shadow-sm">
              PRO
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Asignación de colegiados, control de licencias arbitrales y evaluación de desempeño por partido.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-sm rounded-xl transition shadow-lg shadow-orange-500/20"
        >
          <Plus size={18} />
          <span>Registrar Árbitro</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-zinc-900 p-6 rounded-2xl border border-orange-500/30 space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider">Nuevo Árbitro / Oficial</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Nombre Completo *</label>
              <input
                type="text"
                placeholder="Ej: Lic. Ramón Bautista"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Licencia o Matrícula</label>
              <input
                type="text"
                placeholder="Ej: FIBA-DOM-2026"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs rounded-lg"
            >
              Guardar Árbitro
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {referees.map((ref) => (
          <div key={ref.id} className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-orange-400 border border-zinc-700">
              <UserCheck size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">{ref.name}</h4>
              <p className="text-xs text-zinc-400">{ref.licenseNumber || "Licencia Nacional"}</p>
              <span className="text-[10px] text-zinc-500">{ref.assignedGamesCount || 0} Partidos arbitrados</span>
            </div>
          </div>
        ))}

        {referees.length === 0 && !isAdding && (
          <div className="col-span-full py-16 text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
            <ShieldAlert className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="font-bold text-white">No hay árbitros registrados</h3>
            <p className="text-xs text-zinc-500 mt-1 mb-4">Registra los jueces que impartirán justicia en el torneo.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white rounded-lg transition"
            >
              Registrar Primer Árbitro
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
