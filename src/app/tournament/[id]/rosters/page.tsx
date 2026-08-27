"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Tournament, TournamentPlayer, TournamentTeam } from "@/types/tournament";
import { 
  subscribeToTournament, 
  subscribeToTournamentPlayers, 
  subscribeToTournamentTeams,
  addTournamentPlayerInDb,
  deleteTournamentPlayerFromDb
} from "@/lib/db";
import { Award, UserCheck, Shield, Plus, Search, Trash2, User, Hash } from "lucide-react";

export default function TournamentRostersPage() {
  const params = useParams();
  const tournamentId = params?.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all");

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [number, setNumber] = useState("");
  const [position, setPosition] = useState("Base");

  useEffect(() => {
    if (!tournamentId) return;

    const unsubT = subscribeToTournament(tournamentId, (t) => setTournament(t));
    const unsubP = subscribeToTournamentPlayers(tournamentId, (pList) => {
      setPlayers(pList);
      setLoading(false);
    });
    const unsubTeams = subscribeToTournamentTeams(tournamentId, (tList) => {
      setTeams(tList);
      if (tList.length > 0 && !selectedTeamId) {
        setSelectedTeamId(tList[0].id);
      }
    });

    return () => {
      unsubT();
      unsubP();
      unsubTeams();
    };
  }, [tournamentId]);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedTeamId) return;

    const num = parseInt(number, 10);

    await addTournamentPlayerInDb(tournamentId, {
      tournamentId,
      teamId: selectedTeamId,
      name: name.trim(),
      number: isNaN(num) ? undefined : num,
      position,
      isRegisteredPro: true,
      gamesPlayed: 0,
      totalPoints: 0,
      totalAssists: 0,
    });

    setName("");
    setNumber("");
    setIsAdding(false);
  };

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (confirm(`¿Eliminar al jugador "${playerName}" del registro oficial?`)) {
      await deleteTournamentPlayerFromDb(tournamentId, playerId);
    }
  };

  const filteredPlayers = players.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.number !== undefined && p.number.toString().includes(searchQuery));
    const matchesTeam = selectedTeamFilter === "all" || p.teamId === selectedTeamFilter;
    return matchesSearch && matchesTeam;
  });

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Cargando carnets y rosters...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Award className="text-orange-500" />
              <span>Rosters & Carnets Oficiales PRO</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 shadow-sm">
              {players.length} Registrados
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Control de elegibilidad de jugadores, números de dorsal y plantillas oficiales.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          disabled={teams.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-xl transition shadow-lg shadow-orange-500/20"
        >
          <Plus size={16} />
          <span>Inscribir Jugador</span>
        </button>
      </div>

      {/* Formulario */}
      {isAdding && (
        <form onSubmit={handleAddPlayer} className="bg-zinc-900 p-6 rounded-2xl border border-orange-500/30 space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider">Inscripción de Jugador</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Nombre Completo *</label>
              <input
                type="text"
                placeholder="Ej: Manuel Santos"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Equipo Asignado *</label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-orange-500"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Dorsal</label>
              <input
                type="number"
                placeholder="Ej: 7"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Posición</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-orange-500"
              >
                <option value="Base">Base / Armador</option>
                <option value="Escolta">Escolta</option>
                <option value="Alero">Alero</option>
                <option value="Ala-Pívot">Ala-Pívot</option>
                <option value="Pívot">Pívot</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs rounded-xl"
            >
              Guardar Ficha
            </button>
          </div>
        </form>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre o dorsal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none"
          >
            <option value="all">Todos los Equipos</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Jugadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredPlayers.map((player) => {
          const team = teams.find(t => t.id === player.teamId);

          return (
            <div key={player.id} className="bg-zinc-900/70 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-black text-orange-400 text-sm">
                  {player.number !== undefined ? `#${player.number}` : "-"}
                </div>
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-1">
                    <span>{player.name}</span>
                    <UserCheck size={13} className="text-green-400 shrink-0" />
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {player.position || "Jugador"} • <span className="text-zinc-300 font-semibold">{team?.name || "Sin Equipo"}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDeletePlayer(player.id, player.name)}
                className="p-1.5 text-zinc-500 hover:text-red-400 transition rounded-lg"
                title="Eliminar jugador"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}

        {filteredPlayers.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-zinc-500 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
            No se encontraron jugadores registrados.
          </div>
        )}
      </div>
    </div>
  );
}
