"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { TournamentTeam, TournamentPlayer } from "@/types/tournament";
import { 
  subscribeToTournamentTeams, 
  addTournamentTeam, 
  updateTournamentTeamInDb,
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
  Sparkles,
  Upload,
  Image as ImageIcon,
  Pencil,
  X,
  Check
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
  const [teamLogo, setTeamLogo] = useState("");
  const createFileInputRef = useRef<HTMLInputElement>(null);

  // Modal / Formulario Editar Equipo
  const [editingTeam, setEditingTeam] = useState<TournamentTeam | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editShortName, setEditShortName] = useState("");
  const [editTeamLogo, setEditTeamLogo] = useState("");
  const editFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen es demasiado pesada. Sube una imagen menor a 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        if (isEdit) {
          setEditTeamLogo(reader.result);
        } else {
          setTeamLogo(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    await addTournamentTeam(tournamentId, {
      name: teamName.trim(),
      shortName: shortName.trim().toUpperCase() || teamName.substring(0, 3).toUpperCase(),
      logo: teamLogo.trim() || undefined,
      playerIds: [],
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    });

    setTeamName("");
    setShortName("");
    setTeamLogo("");
    setIsAddingTeam(false);
  };

  const openEditTeam = (team: TournamentTeam) => {
    setEditingTeam(team);
    setEditTeamName(team.name);
    setEditShortName(team.shortName || "");
    setEditTeamLogo(team.logo || (team as any).logoUrl || "");
  };

  const handleSaveEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || !editTeamName.trim()) return;

    await updateTournamentTeamInDb(tournamentId, editingTeam.id, {
      name: editTeamName.trim(),
      shortName: editShortName.trim().toUpperCase() || editTeamName.substring(0, 3).toUpperCase(),
      logo: editTeamLogo.trim() || undefined,
    });

    setEditingTeam(null);
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
            <Users className="text-emerald-400" />
            <span>Equipos & Plantillas</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Crea los equipos participantes con su logotipo oficial y gestiona la plantilla de jugadores.
          </p>
        </div>

        <button
          onClick={() => setIsAddingTeam(!isAddingTeam)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/25"
        >
          <Plus size={16} />
          <span>Crear Nuevo Equipo</span>
        </button>
      </div>

      {/* Formulario Crear Equipo */}
      {isAddingTeam && (
        <form onSubmit={handleAddTeam} className="bg-zinc-900 p-6 rounded-2xl border border-emerald-500/30 space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Nuevo Equipo Participante</h3>
            <button
              type="button"
              onClick={() => setIsAddingTeam(false)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Nombre del Equipo/Club *</label>
              <input
                type="text"
                placeholder="Ej: Los Cajuilitos"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Abreviatura / Siglas (3 letras)</label>
              <input
                type="text"
                placeholder="Ej: CAJ"
                maxLength={4}
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs uppercase focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Selector y Carga de Logo del Equipo */}
          <div className="space-y-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
            <label className="block text-xs font-semibold text-zinc-300">
              Logotipo / Escudo del Equipo (Opcional)
            </label>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Preview del Logo */}
              <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 relative group shadow-inner">
                {teamLogo ? (
                  <>
                    <img src={teamLogo} alt="Logo Preview" className="w-full h-full object-contain p-1.5" />
                    <button
                      type="button"
                      onClick={() => setTeamLogo("")}
                      className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-red-400"
                      title="Eliminar logo"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <ImageIcon size={24} className="text-zinc-600" />
                )}
              </div>

              {/* Botón de subida y campo URL */}
              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={createFileInputRef}
                    onChange={(e) => handleLogoUpload(e, false)}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => createFileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-zinc-700"
                  >
                    <Upload size={14} className="text-emerald-400" />
                    <span>Subir Imagen</span>
                  </button>
                  <span className="text-[11px] text-zinc-500">o pega un link directo:</span>
                </div>

                <input
                  type="url"
                  placeholder="https://ejemplo.com/logo-equipo.png"
                  value={teamLogo}
                  onChange={(e) => setTeamLogo(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600"
                />
              </div>
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20"
            >
              Guardar Equipo
            </button>
          </div>
        </form>
      )}

      {/* Modal Editar Equipo */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Pencil size={15} className="text-emerald-400" />
                <span>Editar Equipo: {editingTeam.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditTeam} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Nombre del Equipo *</label>
                  <input
                    type="text"
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Abreviatura / Siglas</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={editShortName}
                    onChange={(e) => setEditShortName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Selector y Carga de Logo del Equipo */}
              <div className="space-y-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
                <label className="block text-xs font-semibold text-zinc-300">
                  Logotipo / Escudo del Equipo
                </label>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 relative group shadow-inner">
                    {editTeamLogo ? (
                      <>
                        <img src={editTeamLogo} alt="Logo Preview" className="w-full h-full object-contain p-1.5" />
                        <button
                          type="button"
                          onClick={() => setEditTeamLogo("")}
                          className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-red-400"
                          title="Eliminar logo"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <ImageIcon size={24} className="text-zinc-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={editFileInputRef}
                        onChange={(e) => handleLogoUpload(e, true)}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-zinc-700"
                      >
                        <Upload size={14} className="text-emerald-400" />
                        <span>Subir Imagen</span>
                      </button>
                      <span className="text-[11px] text-zinc-500">o ingresa link:</span>
                    </div>

                    <input
                      type="url"
                      placeholder="https://ejemplo.com/logo.png"
                      value={editTeamLogo}
                      onChange={(e) => setEditTeamLogo(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Equipos con Acordeón de Jugadores */}
      <div className="space-y-4">
        {teams.map((team) => {
          const teamPlayers = players.filter(p => p.teamId === team.id);
          const isExpanded = expandedTeamId === team.id;
          const isAddingPlayer = isAddingPlayerToTeamId === team.id;
          const teamLogoDisplay = team.logo || (team as any).logoUrl;

          return (
            <div key={team.id} className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-lg transition">
              {/* Barra Principal del Equipo */}
              <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                    {teamLogoDisplay ? (
                      <img
                        src={teamLogoDisplay}
                        alt={team.name}
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : (
                      <span className="font-black text-emerald-400 text-sm">
                        {team.shortName || team.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
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
                    onClick={() => openEditTeam(team)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition border border-zinc-700"
                    title="Editar equipo y logo"
                  >
                    <Pencil size={14} />
                  </button>

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
                      <User size={14} className="text-emerald-400" />
                      <span>Roster de {team.name} ({teamPlayers.length})</span>
                    </h4>

                    <button
                      onClick={() => setIsAddingPlayerToTeamId(isAddingPlayer ? null : team.id)}
                      className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-lg transition flex items-center gap-1"
                    >
                      <UserPlus size={13} />
                      <span>Agregar Jugador</span>
                    </button>
                  </div>

                  {/* Formulario Agregar Jugador */}
                  {isAddingPlayer && (
                    <form onSubmit={(e) => handleAddPlayer(team.id, e)} className="bg-zinc-900 p-4 rounded-xl border border-emerald-500/20 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Nombre Completo *</label>
                          <input
                            type="text"
                            placeholder="Ej: Carlos Rodríguez"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            required
                            className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Número de Dorsal</label>
                          <input
                            type="number"
                            placeholder="Ej: 10"
                            value={playerNumber}
                            onChange={(e) => setPlayerNumber(e.target.value)}
                            className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Posición</label>
                          <select
                            value={playerPosition}
                            onChange={(e) => setPlayerPosition(e.target.value)}
                            className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
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
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm"
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
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-black text-emerald-400 text-xs">
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20"
            >
              Añadir Primer Equipo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
