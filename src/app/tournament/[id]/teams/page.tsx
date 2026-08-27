"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TournamentTeam, TournamentPlayer } from "@/types/tournament";
import { 
  subscribeToTournamentTeams, 
  addTournamentTeam, 
  deleteTournamentTeamFromDb,
  subscribeToTournamentPlayers,
  addTournamentPlayerInDb,
  deleteTournamentPlayerFromDb
} from "@/lib/db";
import { 
  Users, 
  Plus, 
  Shield, 
  Trophy, 
  Trash2, 
  UserPlus, 
  User, 
  Hash, 
  ChevronDown, 
  ChevronUp,
  Award,
  Sparkles
} from "lucide-react";

export default function TournamentTeamsPage() {
  const params = useParams();
  const tournamentId = params?.id as string;

  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario Crear Equipo
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [shortName, setShortName] = useState("");

  // Equipo seleccionado para expandir jugadores
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  // Formulario Agregar Jugador a un Equipo
  const [isAddingPlayerToTeamId, setIsAddingPlayerToTeamId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [playerNumber, setPlayerNumber] = useState("");
  const [playerPosition, setPlayerPosition] = useState("Base");

  useEffect(() => {
    if (!tournamentId) return;

    const unsubTeams = subscribeToTournamentTeams(tournamentId, (tList) => {
      setTeams(tList);
      setLoading(false);
    });

    const unsubPlayers = subscribeToTournamentPlayers(tournamentId, (pList) => {
      setPlayers(pList);
    });

    return () => {
      unsubTeams();
      unsubPlayers();
    };
  }, [tournamentId]);

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    await addTournamentTeam(tournamentId, {
      name: teamName.trim(),
      shortName: shortName.trim().toUpperCase() || teamName.substring(0, 3).toUpperCase(),
      playerIds: [],
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    });

    setTeamName("");
    setShortName("");
    setIsAddingTeam(false);
  };

  const handleDeleteTeam = async (teamId: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el equipo "${name}"?`)) {
      await deleteTournamentTeamFromDb(tournamentId, teamId);
    }
  };

  const handleAddPlayer = async (teamId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    const num = parseInt(playerNumber, 10);

    await addTournamentPlayerInDb(tournamentId, {
      tournamentId,
      teamId,
      name: playerName.trim(),
      number: isNaN(num) ? undefined : num,
      position: playerPosition,
      isRegisteredPro: true,
      gamesPlayed: 0,
      totalPoints: 0,
      totalAssists: 0,
    });

    setPlayerName("");
    setPlayerNumber("");
    setIsAddingPlayerToTeamId(null);
  };

  const handleDeletePlayer = async (playerId: string, name: string) => {
    if (confirm(`¿Eliminar al jugador "${name}" de este equipo?`)) {
      await deleteTournamentPlayerFromDb(tournamentId, playerId);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Cargando equipos del torneo...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="text-orange-500" />
            <span>Equipos & Plantillas</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Crea los equipos participantes y registra a sus jugadores con su respectivo dorsal y posición.
          </p>
        </div>

        <button
          onClick={() => setIsAddingTeam(!isAddingTeam)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs rounded-xl transition shadow-lg shadow-orange-500/20"
        >
          <Plus size={16} />
          <span>Crear Nuevo Equipo</span>
        </button>
      </div>

      {/* Formulario Crear Equipo */}
      {isAddingTeam && (
        <form onSubmit={handleAddTeam} className="bg-zinc-900 p-6 rounded-2xl border border-orange-500/30 space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider">Nuevo Equipo Participante</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Nombre del Equipo/Club *</label>
              <input
                type="text"
                placeholder="Ej: Los Cajuilitos"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Abreviatura / Siglas (3 letras)</label>
              <input
                type="text"
                placeholder="Ej: CAJ"
                maxLength={4}
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs uppercase focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingTeam(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs rounded-xl"
            >
              Guardar Equipo
            </button>
          </div>
        </form>
      )}

      {/* Lista de Equipos con Acordeón de Jugadores */}
      <div className="space-y-4">
        {teams.map((team) => {
          const teamPlayers = players.filter(p => p.teamId === team.id);
          const isExpanded = expandedTeamId === team.id;
          const isAddingPlayer = isAddingPlayerToTeamId === team.id;

          return (
            <div key={team.id} className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-lg transition">
              {/* Barra Principal del Equipo */}
              <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-orange-400 border border-zinc-700 text-base">
                    {team.shortName || team.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">{team.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5 font-mono">
                      <span>{teamPlayers.length} Jugadores Registrados</span>
                      <span>•</span>
                      <span>{team.wins}G - {team.losses}P</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setExpandedTeamId(isExpanded ? null : team.id);
                      setIsAddingPlayerToTeamId(null);
                    }}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5 border border-zinc-700"
                  >
                    <span>{isExpanded ? "Ocultar Plantilla" : "Ver Jugadores"}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  <button
                    onClick={() => handleDeleteTeam(team.id, team.name)}
                    className="p-2 bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition border border-zinc-700"
                    title="Eliminar equipo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Sección Expandida: Plantilla de Jugadores */}
              {isExpanded && (
                <div className="bg-zinc-950/80 border-t border-zinc-800/80 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <User size={14} className="text-orange-400" />
                      <span>Roster de {team.name} ({teamPlayers.length})</span>
                    </h4>

                    <button
                      onClick={() => setIsAddingPlayerToTeamId(isAddingPlayer ? null : team.id)}
                      className="px-3 py-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold rounded-lg transition flex items-center gap-1"
                    >
                      <UserPlus size={13} />
                      <span>Agregar Jugador</span>
                    </button>
                  </div>

                  {/* Formulario Agregar Jugador */}
                  {isAddingPlayer && (
                    <form onSubmit={(e) => handleAddPlayer(team.id, e)} className="bg-zinc-900 p-4 rounded-xl border border-orange-500/20 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Nombre Completo *</label>
                          <input
                            type="text"
                            placeholder="Ej: Carlos Rodríguez"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            required
                            className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Número de Dorsal</label>
                          <input
                            type="number"
                            placeholder="Ej: 10"
                            value={playerNumber}
                            onChange={(e) => setPlayerNumber(e.target.value)}
                            className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Posición</label>
                          <select
                            value={playerPosition}
                            onChange={(e) => setPlayerPosition(e.target.value)}
                            className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-orange-500"
                          >
                            <option value="Base">Base / Armador</option>
                            <option value="Escolta">Escolta</option>
                            <option value="Alero">Alero</option>
                            <option value="Ala-Pívot">Ala-Pívot</option>
                            <option value="Pívot">Pívot / Centro</option>
                            <option value="Delantero">Delantero (Fútbol)</option>
                            <option value="Mediocampista">Mediocampista</option>
                            <option value="Defensa">Defensa</option>
                            <option value="Portero">Portero</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingPlayerToTeamId(null)}
                          className="px-3 py-1 text-xs text-zinc-400 hover:text-white"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs rounded-lg"
                        >
                          Guardar Jugador
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Lista de Jugadores de este Equipo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {teamPlayers.map((player) => (
                      <div key={player.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-black text-orange-400 text-xs">
                            {player.number !== undefined ? `#${player.number}` : "-"}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white leading-tight">{player.name}</div>
                            <div className="text-[10px] text-zinc-400">{player.position || "Jugador"}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeletePlayer(player.id, player.name)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 transition"
                          title="Eliminar jugador"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}

                    {teamPlayers.length === 0 && !isAddingPlayer && (
                      <div className="col-span-full py-6 text-center text-xs text-zinc-500 italic">
                        Este equipo no tiene jugadores registrados todavía.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {teams.length === 0 && !isAddingTeam && (
          <div className="py-16 text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
            <Users className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="font-bold text-white text-base">No hay equipos registrados</h3>
            <p className="text-xs text-zinc-500 mt-1 mb-4">Añade los equipos que competirán en este torneo.</p>
            <button
              onClick={() => setIsAddingTeam(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs rounded-xl transition"
            >
              Añadir Primer Equipo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
