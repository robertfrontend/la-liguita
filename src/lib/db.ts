import { db } from "./firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  setDoc,
  addDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  collectionGroup,
  limit
} from "firebase/firestore";
import type { 
  Player, 
  Game, 
  League, 
  Sport, 
  GameStats, 
  UserProfile, 
  Tournament, 
  PlayByPlayEvent, 
  TournamentTeam, 
  TournamentPlayer, 
  Referee,
  TournamentGame
} from "./types";

// Collections
const TOURNAMENTS_COLLECTION = "tournaments";
const LEAGUES_COLLECTION = "leagues";
const PLAYERS_SUBCOLLECTION = "players";
const GAMES_SUBCOLLECTION = "games";
const TEAMS_SUBCOLLECTION = "teams";
const PLAY_BY_PLAY_SUBCOLLECTION = "playByPlay";
const REFEREES_SUBCOLLECTION = "referees";

// --- User Profile ---

export const subscribeToUserProfile = (uid: string, callback: (profile: UserProfile | null) => void) => {
  const docRef = doc(db, "users", uid);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback({ uid: snap.id, ...snap.data() } as UserProfile);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("DEBUG: Error in subscribeToUserProfile:", error.code, error.message);
  });
};

export const createUserProfile = async (uid: string, email?: string, displayName?: string) => {
  const docRef = doc(db, "users", uid);
  
  const profileData = {
    uid,
    isPro: false,
    email: email || "",
    displayName: displayName || "",
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, profileData, { merge: true });
    const snap = await getDoc(docRef);
    return { uid: snap.id, ...snap.data() } as UserProfile;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error("DEBUG: Error in createUserProfile (write):", err?.code, err?.message);
    return { uid, isPro: false, email, displayName } as UserProfile;
  }
};

// --- Leagues ---

export const createLeague = async (name: string, ownerId: string, sport: Sport) => {
  const newLeague = {
    name,
    ownerId,
    sport,
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(collection(db, LEAGUES_COLLECTION), newLeague);
  return { id: docRef.id, ...newLeague };
};

export const deleteLeagueFromDb = async (leagueId: string) => {
  const leagueRef = doc(db, LEAGUES_COLLECTION, leagueId);
  
  // 1. Delete players subcollection
  const playersSnap = await getDocs(collection(db, LEAGUES_COLLECTION, leagueId, PLAYERS_SUBCOLLECTION));
  const deletePlayers = playersSnap.docs.map(d => deleteDoc(d.ref));
  
  // 2. Delete games subcollection
  const gamesSnap = await getDocs(collection(db, LEAGUES_COLLECTION, leagueId, GAMES_SUBCOLLECTION));
  const deleteGames = gamesSnap.docs.map(d => deleteDoc(d.ref));
  
  // Wait for all subcollection items to be deleted
  await Promise.all([...deletePlayers, ...deleteGames]);
  
  // 3. Delete the league document itself
  await deleteDoc(leagueRef);
};

export const subscribeToLeagues = (userId: string, callback: (leagues: League[]) => void) => {
  if (!userId) return () => {};
  const q = query(collection(db, LEAGUES_COLLECTION), where("ownerId", "==", userId));
  return onSnapshot(q, (snapshot) => {
    const leagues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League));
    callback(leagues);
  }, (error) => {
    console.error("Firestore error in subscribeToLeagues:", error.code, error.message);
    callback([]); // Return empty to allow UI to render
  });
};

export const getLeague = async (leagueId: string) => {
  const docRef = doc(db, LEAGUES_COLLECTION, leagueId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as League;
  }
  return null;
};

export const subscribeToLeague = (leagueId: string, callback: (league: League | null) => void) => {
    const docRef = doc(db, LEAGUES_COLLECTION, leagueId);
    return onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
            callback({ id: snap.id, ...snap.data() } as League);
        } else {
            callback(null);
        }
    });
};

// --- Players ---

export const subscribeToPlayers = (leagueId: string, callback: (players: Player[]) => void) => {
  const q = query(collection(db, LEAGUES_COLLECTION, leagueId, PLAYERS_SUBCOLLECTION), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
    callback(players);
  }, (error) => {
    console.error("DEBUG: Error in subscribeToPlayers:", error.code, error.message);
  });
};

export const addPlayerToDb = async (leagueId: string, name: string) => {
  const newPlayer = {
    name,
    gamesPlayed: 0,
    wins: 0,
    totalPoints: 0,
    totalAssists: 0,
    avatar: name.slice(0, 2).toUpperCase(),
  };
  const docRef = await addDoc(collection(db, LEAGUES_COLLECTION, leagueId, PLAYERS_SUBCOLLECTION), newPlayer);
  return { id: docRef.id, ...newPlayer };
};

export const deletePlayerFromDb = async (leagueId: string, playerId: string) => {
  const playerRef = doc(db, LEAGUES_COLLECTION, leagueId, PLAYERS_SUBCOLLECTION, playerId);
  await deleteDoc(playerRef);
};

export const updatePlayerStatsInDb = async (leagueId: string, player: Player) => {
  const playerRef = doc(db, LEAGUES_COLLECTION, leagueId, PLAYERS_SUBCOLLECTION, player.id);
  await updateDoc(playerRef, {
    gamesPlayed: player.gamesPlayed,
    wins: player.wins,
    totalPoints: player.totalPoints,
    totalAssists: player.totalAssists,
  });
};

// --- Games ---

export const subscribeToHistory = (leagueId: string, callback: (games: Game[]) => void) => {
  const q = query(collection(db, LEAGUES_COLLECTION, leagueId, GAMES_SUBCOLLECTION), where("isFinished", "==", true));
  return onSnapshot(q, (snapshot) => {
    const games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
    games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(games);
  }, (error) => {
    console.error("DEBUG: Error in subscribeToHistory:", error.code, error.message);
  });
};

export const subscribeToActiveGame = (leagueId: string, callback: (game: Game | null) => void) => {
  const q = query(
    collection(db, LEAGUES_COLLECTION, leagueId, GAMES_SUBCOLLECTION), 
    where("isFinished", "==", false)
  );
  
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
    } else {
      const games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
      games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(games[0]);
    }
  }, (error) => {
    console.error("DEBUG: Error in subscribeToActiveGame:", error.code, error.message);
  });
};

export const createGameInDb = async (leagueId: string, teamA: string[], teamB: string[], teamAName: string = "Team A", teamBName: string = "Team B") => {
  // Get league to know the sport
  const league = await getLeague(leagueId);
  const sport = league?.sport || 'basketball';

  const newGame = {
    date: new Date().toISOString(),
    teamA,
    teamB,
    teamAName,
    teamBName,
    playerStats: {}, 
    scoreA: 0,
    scoreB: 0,
    isFinished: false,
    leagueId,
    sport,
  };
  
  console.log("Creating game in DB:", newGame);
  
  const stats: Record<string, GameStats> = {};
  [...teamA, ...teamB].forEach(pid => {
    stats[pid] = { points: 0, assists: 0 };
  });
  newGame.playerStats = stats;

  const docRef = await addDoc(collection(db, LEAGUES_COLLECTION, leagueId, GAMES_SUBCOLLECTION), newGame);
  
  // Store the ID in the document so we can query it globally via collectionGroup
  await updateDoc(docRef, { id: docRef.id });

  return { id: docRef.id, ...newGame };
};

export const updateGameInDb = async (leagueId: string, gameId: string, updates: Partial<Game>) => {
  console.log(`Updating game ${gameId} in league ${leagueId} with:`, updates);
  const gameRef = doc(db, LEAGUES_COLLECTION, leagueId, GAMES_SUBCOLLECTION, gameId);
  await updateDoc(gameRef, updates);
};

export const deleteGameFromDb = async (leagueId: string, gameId: string) => {
  const gameRef = doc(db, LEAGUES_COLLECTION, leagueId, GAMES_SUBCOLLECTION, gameId);
  const gameSnap = await getDoc(gameRef);
  
  if (!gameSnap.exists()) return;
  
  const game = { id: gameSnap.id, ...gameSnap.data() } as Game;
  
  // Revert player stats only if the game was finished
  if (game.isFinished) {
    const playerIds = [...game.teamA, ...game.teamB];
    const updates = playerIds.map(async (pid) => {
        const playerRef = doc(db, LEAGUES_COLLECTION, leagueId, PLAYERS_SUBCOLLECTION, pid);
        const playerSnap = await getDoc(playerRef);
        
        if (playerSnap.exists()) {
            const player = playerSnap.data() as Player;
            const gameStats = game.playerStats[pid] || { points: 0, assists: 0 };
            
            const isTeamA = game.teamA.includes(pid);
            const isTeamB = game.teamB.includes(pid);
            const won = (isTeamA && game.winner === 'A') || (isTeamB && game.winner === 'B');
            
            await updateDoc(playerRef, {
                gamesPlayed: Math.max(0, player.gamesPlayed - 1),
                wins: won ? Math.max(0, player.wins - 1) : player.wins,
                totalPoints: Math.max(0, player.totalPoints - gameStats.points),
                totalAssists: Math.max(0, player.totalAssists - gameStats.assists),
            });
        }
    });
    await Promise.all(updates);
  }
  
  await deleteDoc(gameRef);
};

// Use Collection Group for viewing a shared game by ID without knowing the league?
// Or just require leagueId in context. Ideally we want shareable links.
// For now, let's assume we can pass leagueId if we know it, or find it.
// Actually, `subscribeToGame` is best implemented with matching leagueId.
export const subscribeToGame = (leagueId: string, gameId: string, callback: (game: Game | null) => void) => {
  if (!leagueId || !gameId) {
      console.warn("subscribeToGame called with missing args", { leagueId, gameId });
      callback(null);
      return () => {};
  }
  const docRef = doc(db, LEAGUES_COLLECTION, leagueId, GAMES_SUBCOLLECTION, gameId);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as Game);
    } else {
      callback(null);
    }
  }, (error) => {
      console.error("Error subscribing to game:", error);
      callback(null);
  });
};

export const subscribeToGameGlobally = (gameId: string, callback: (game: Game | null) => void) => {
  if (!gameId) {
      console.warn("subscribeToGameGlobally called with undefined gameId");
      callback(null);
      return () => {};
  }
  
  // Query by 'id' field instead of documentId() to avoid "Invalid document path" error for collectionGroup
  // Note: This requires an index on 'id' for the 'games' collection group.
  const q = query(
      collectionGroup(db, GAMES_SUBCOLLECTION), 
      where("id", "==", gameId) 
  );
  
  console.log(`Subscribing globally to game: ${gameId}`);

  return onSnapshot(q, (snapshot) => {
    console.log(`Global snapshot for ${gameId}: ${snapshot.size} docs found`);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      // Ensure we have a leagueId, extracting from path if necessary (leagues/{leagueId}/games/{gameId})
      const leagueId = data.leagueId || doc.ref.parent.parent?.id;
      
      callback({ id: doc.id, ...data, leagueId } as Game);
    } else {
      callback(null);
    }
  }, (error) => {
      console.error("Error subscribing to global game:", error);
      callback(null);
  });
};

// ==========================================
// --- TOURNAMENTS (Multi-Tier SaaS) ---
// ==========================================

export const slugify = (text: string): string => {
  return (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remover tildes y acentos
    .replace(/[^a-z0-9 -]/g, "") // Remover caracteres no alfanuméricos
    .replace(/\s+/g, "-") // Espacios a guiones
    .replace(/-+/g, "-") // Remover guiones duplicados
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

export const createTournamentInDb = async (tournamentData: Omit<Tournament, "id">) => {
  const cleanSlug = tournamentData.slug || slugify(tournamentData.name);
  const payload = {
    ...tournamentData,
    slug: cleanSlug,
  };
  const docRef = await addDoc(collection(db, TOURNAMENTS_COLLECTION), payload);
  return { id: docRef.id, ...payload } as Tournament;
};

export const getTournament = async (tournamentId: string): Promise<Tournament | null> => {
  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as Tournament;
  }
  return null;
};

export const subscribeToTournament = (tournamentId: string, callback: (tournament: Tournament | null) => void) => {
  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as Tournament);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error subscribing to tournament:", error);
    callback(null);
  });
};

export const subscribeToTournamentBySlugOrId = (
  slugOrId: string,
  callback: (tournament: Tournament | null) => void
) => {
  if (!slugOrId) {
    callback(null);
    return () => {};
  }

  // 1. Escuchar por slug primero
  const qSlug = query(
    collection(db, TOURNAMENTS_COLLECTION),
    where("slug", "==", slugOrId.toLowerCase().trim()),
    limit(1)
  );

  let isUnsubscribed = false;
  let docUnsub: (() => void) | null = null;

  const slugUnsub = onSnapshot(qSlug, (snapshot) => {
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      callback({ ...docSnap.data(), id: docSnap.id } as Tournament);
    } else {
      // 2. Si no se encontró por slug, escuchar por ID de documento directo
      if (!docUnsub && !isUnsubscribed) {
        const docRef = doc(db, TOURNAMENTS_COLLECTION, slugOrId);
        docUnsub = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data() as Tournament;
            // Si no tiene slug asignado, auto-actualizar en background
            if (!data.slug && data.name) {
              const generatedSlug = slugify(data.name);
              updateDoc(docRef, { slug: generatedSlug }).catch(() => {});
            }
            callback({ ...data, id: snap.id } as Tournament);
          } else {
            callback(null);
          }
        }, (err) => {
          console.error("Error subscribing by ID:", err);
          callback(null);
        });
      }
    }
  }, (error) => {
    console.error("Error subscribing by slug:", error);
    callback(null);
  });

  return () => {
    isUnsubscribed = true;
    slugUnsub();
    if (docUnsub) docUnsub();
  };
};

export const subscribeToTournaments = (ownerId: string, callback: (tournaments: Tournament[]) => void) => {
  if (!ownerId) return () => {};
  const q = query(collection(db, TOURNAMENTS_COLLECTION), where("ownerId", "==", ownerId));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tournament));
    callback(list);
  }, (error) => {
    console.error("Error subscribing to tournaments:", error);
    callback([]);
  });
};

export const subscribeToAllTournaments = (callback: (tournaments: Tournament[]) => void) => {
  const q = query(collection(db, TOURNAMENTS_COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tournament));
    callback(list);
  }, (error) => {
    console.error("Error subscribing to all tournaments (Super Admin):", error);
    callback([]);
  });
};

export const subscribeToAssignedTournaments = (email: string, callback: (tournaments: Tournament[]) => void) => {
  if (!email) return () => {};
  const cleanEmail = email.trim().toLowerCase();
  const q = query(collection(db, TOURNAMENTS_COLLECTION), where("adminEmails", "array-contains", cleanEmail));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tournament));
    callback(list);
  }, (error) => {
    console.error("Error subscribing to assigned tournaments:", error);
    callback([]);
  });
};

export const updateTournamentInDb = async (tournamentId: string, updates: Partial<Tournament>) => {
  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
};

export const deleteTournamentFromDb = async (tournamentId: string) => {
  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  
  // Clean subcollections
  const teamsSnap = await getDocs(collection(db, TOURNAMENTS_COLLECTION, tournamentId, TEAMS_SUBCOLLECTION));
  const deleteTeams = teamsSnap.docs.map(d => deleteDoc(d.ref));
  
  const gamesSnap = await getDocs(collection(db, TOURNAMENTS_COLLECTION, tournamentId, GAMES_SUBCOLLECTION));
  const deleteGames = gamesSnap.docs.map(d => deleteDoc(d.ref));

  const playersSnap = await getDocs(collection(db, TOURNAMENTS_COLLECTION, tournamentId, PLAYERS_SUBCOLLECTION));
  const deletePlayers = playersSnap.docs.map(d => deleteDoc(d.ref));

  const refereesSnap = await getDocs(collection(db, TOURNAMENTS_COLLECTION, tournamentId, REFEREES_SUBCOLLECTION));
  const deleteReferees = refereesSnap.docs.map(d => deleteDoc(d.ref));

  await Promise.all([...deleteTeams, ...deleteGames, ...deletePlayers, ...deleteReferees]);
  await deleteDoc(docRef);
};

// --- Tournament Teams ---

export const subscribeToTournamentTeams = (tournamentId: string, callback: (teams: TournamentTeam[]) => void) => {
  const q = query(collection(db, TOURNAMENTS_COLLECTION, tournamentId, TEAMS_SUBCOLLECTION), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const teams = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TournamentTeam));
    callback(teams);
  }, (error) => {
    console.error("Error in subscribeToTournamentTeams:", error);
    callback([]);
  });
};

export const addTournamentTeam = async (tournamentId: string, teamData: Omit<TournamentTeam, "id">) => {
  const docRef = await addDoc(collection(db, TOURNAMENTS_COLLECTION, tournamentId, TEAMS_SUBCOLLECTION), teamData);
  return { id: docRef.id, ...teamData } as TournamentTeam;
};

// --- Tournament Games ---

export const sortTournamentGames = (games: TournamentGame[]): TournamentGame[] => {
  return [...games].sort((a, b) => {
    // 1. Extraer número de jornada si existe (ej: "Jornada 1" vs "Jornada 2")
    const numA = parseInt(a.roundName?.replace(/\D/g, "") || "0", 10);
    const numB = parseInt(b.roundName?.replace(/\D/g, "") || "0", 10);

    if (numA > 0 && numB > 0 && numA !== numB) {
      return numA - numB;
    }

    // 2. Orden cronológico ascendente (partidos iniciales / Jornada 1 primero)
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return timeA - timeB;
  });
};

export const subscribeToTournamentGames = (tournamentId: string, callback: (games: TournamentGame[]) => void) => {
  const q = query(collection(db, TOURNAMENTS_COLLECTION, tournamentId, GAMES_SUBCOLLECTION));
  return onSnapshot(q, (snapshot) => {
    const rawGames = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TournamentGame));
    const sorted = sortTournamentGames(rawGames);
    callback(sorted);
  }, (error) => {
    console.error("Error in subscribeToTournamentGames:", error);
    callback([]);
  });
};

export const createTournamentGameInDb = async (tournamentId: string, gameData: Omit<TournamentGame, "id">) => {
  const docRef = await addDoc(collection(db, TOURNAMENTS_COLLECTION, tournamentId, GAMES_SUBCOLLECTION), gameData);
  return { id: docRef.id, ...gameData } as TournamentGame;
};

export const updateTournamentGameInDb = async (tournamentId: string, gameId: string, updates: Partial<TournamentGame>) => {
  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId, GAMES_SUBCOLLECTION, gameId);
  await updateDoc(docRef, updates);
};

export const deleteTournamentGameInDb = async (tournamentId: string, gameId: string) => {
  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId, GAMES_SUBCOLLECTION, gameId);
  await deleteDoc(docRef);
};

// Función auxiliar para eliminar campos con valor `undefined` (incompatibles con Firestore)
export function cleanFirestoreObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned as Partial<T>;
}

// --- Play-by-Play & Live Scoring (Technical Table) ---

export const recordTournamentScoreEventInDb = async (
  tournamentId: string,
  gameId: string,
  eventData: Omit<PlayByPlayEvent, "id">,
  newScoreA: number,
  newScoreB: number,
  period?: number,
  gameClock?: string,
  updatedPlayerStats?: Record<string, any>
) => {
  const sanitizedEvent = cleanFirestoreObject(eventData);

  // 1. Guardar evento en la subcolección playByPlay
  const eventRef = await addDoc(
    collection(db, TOURNAMENTS_COLLECTION, tournamentId, GAMES_SUBCOLLECTION, gameId, PLAY_BY_PLAY_SUBCOLLECTION),
    sanitizedEvent
  );

  // 2. Actualizar inmediatamente el marcador en el documento del partido
  const gameRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId, GAMES_SUBCOLLECTION, gameId);
  const updates: Record<string, any> = {
    scoreA: Math.max(0, newScoreA),
    scoreB: Math.max(0, newScoreB),
    status: "live",
    currentPeriod: period || 1,
    timeRemaining: gameClock || "10:00",
  };

  if (updatedPlayerStats) {
    updates.playerStats = updatedPlayerStats;
  }

  await updateDoc(gameRef, updates);

  return { id: eventRef.id, ...sanitizedEvent } as PlayByPlayEvent;
};

export const finishTournamentGameInDb = async (
  tournamentId: string,
  gameId: string,
  teamAId: string,
  teamBId: string,
  scoreA: number,
  scoreB: number
) => {
  const isDraw = scoreA === scoreB;
  const winnerTeamId = isDraw ? null : scoreA > scoreB ? teamAId : teamBId;

  // 1. Marcar partido como finalizado
  const gameRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId, GAMES_SUBCOLLECTION, gameId);
  await updateDoc(gameRef, {
    scoreA,
    scoreB,
    isFinished: true,
    status: "finished",
    winnerTeamId,
  });

  // 2. Actualizar estadísticas de equipos en la tabla de posiciones
  try {
    const teamARef = doc(db, TOURNAMENTS_COLLECTION, tournamentId, TEAMS_SUBCOLLECTION, teamAId);
    const teamBRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId, TEAMS_SUBCOLLECTION, teamBId);

    const [snapA, snapB] = await Promise.all([getDoc(teamARef), getDoc(teamBRef)]);

    if (snapA.exists()) {
      const dataA = snapA.data() as TournamentTeam;
      const won = scoreA > scoreB;
      await updateDoc(teamARef, {
        wins: (dataA.wins || 0) + (won ? 1 : 0),
        losses: (dataA.losses || 0) + (!won && !isDraw ? 1 : 0),
        pointsFor: (dataA.pointsFor || 0) + scoreA,
        pointsAgainst: (dataA.pointsAgainst || 0) + scoreB,
      });
    }

    if (snapB.exists()) {
      const dataB = snapB.data() as TournamentTeam;
      const won = scoreB > scoreA;
      await updateDoc(teamBRef, {
        wins: (dataB.wins || 0) + (won ? 1 : 0),
        losses: (dataB.losses || 0) + (!won && !isDraw ? 1 : 0),
        pointsFor: (dataB.pointsFor || 0) + scoreB,
        pointsAgainst: (dataB.pointsAgainst || 0) + scoreA,
      });
    }
  } catch (err) {
    console.error("Error al actualizar tabla de posiciones de equipos:", err);
  }
};

export const savePostMatchBoxScoreInDb = async (
  tournamentId: string,
  gameId: string,
  data: {
    scoreA: number;
    scoreB: number;
    teamAId: string;
    teamBId: string;
    roundName?: string;
    date?: string;
    venue?: string;
    playerStats: Record<string, { points: number; fouls?: number; assists?: number; rebounds?: number }>;
  }
) => {
  const { scoreA, scoreB, teamAId, teamBId, roundName, date, venue, playerStats } = data;

  // Si los scores vienen en 0 pero se ingresaron puntos a los jugadores, calcular automáticamente
  let effectiveScoreA = Number(scoreA) || 0;
  let effectiveScoreB = Number(scoreB) || 0;

  if (effectiveScoreA === 0 || effectiveScoreB === 0) {
    const playersSnap = await getDocs(collection(db, TOURNAMENTS_COLLECTION, tournamentId, PLAYERS_SUBCOLLECTION));
    const playersList = playersSnap.docs.map(d => ({ id: d.id, ...d.data() } as TournamentPlayer));

    let sumA = 0;
    let sumB = 0;

    Object.keys(playerStats || {}).forEach(pId => {
      const p = playersList.find(player => player.id === pId);
      const pts = Number(playerStats[pId]?.points) || 0;
      if (p?.teamId === teamAId) {
        sumA += pts;
      } else if (p?.teamId === teamBId) {
        sumB += pts;
      }
    });

    if (effectiveScoreA === 0 && sumA > 0) effectiveScoreA = sumA;
    if (effectiveScoreB === 0 && sumB > 0) effectiveScoreB = sumB;
  }

  const isDraw = effectiveScoreA === effectiveScoreB;
  const winnerTeamId = isDraw ? null : effectiveScoreA > effectiveScoreB ? teamAId : teamBId;

  // 1. Actualizar el partido como finalizado con su box score completo
  const gameRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId, GAMES_SUBCOLLECTION, gameId);
  const updates: Record<string, any> = {
    scoreA: Math.max(0, effectiveScoreA),
    scoreB: Math.max(0, effectiveScoreB),
    isFinished: true,
    status: "finished",
    winnerTeamId,
    playerStats: cleanFirestoreObject(playerStats),
  };
  if (roundName) updates.roundName = roundName;
  if (date) updates.date = date;
  if (venue) updates.venue = venue;

  await updateDoc(gameRef, updates);

  // 2. Recalcular la tabla de posiciones completa de todos los partidos finalizados
  await recalculateTournamentStandings(tournamentId);

  // 3. Recalcular las estadísticas acumuladas de todos los jugadores
  await recalculatePlayerCumulativeStats(tournamentId);
};

export const recalculateTournamentStandings = async (tournamentId: string) => {
  const gamesSnap = await getDocs(collection(db, TOURNAMENTS_COLLECTION, tournamentId, GAMES_SUBCOLLECTION));
  const teamsSnap = await getDocs(collection(db, TOURNAMENTS_COLLECTION, tournamentId, TEAMS_SUBCOLLECTION));

  const statsMap: Record<string, { wins: number; losses: number; ties: number; pointsFor: number; pointsAgainst: number }> = {};

  teamsSnap.docs.forEach((d) => {
    statsMap[d.id] = { wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 };
  });

  gamesSnap.docs.forEach((d) => {
    const g = d.data() as TournamentGame;
    if (g.isFinished || g.status === "finished") {
      const sA = g.scoreA || 0;
      const sB = g.scoreB || 0;
      const tA = g.teamAId;
      const tB = g.teamBId;

      if (statsMap[tA]) {
        statsMap[tA].pointsFor += sA;
        statsMap[tA].pointsAgainst += sB;
        if (sA > sB) statsMap[tA].wins += 1;
        else if (sA < sB) statsMap[tA].losses += 1;
        else statsMap[tA].ties += 1;
      }

      if (statsMap[tB]) {
        statsMap[tB].pointsFor += sB;
        statsMap[tB].pointsAgainst += sA;
        if (sB > sA) statsMap[tB].wins += 1;
        else if (sB < sA) statsMap[tB].losses += 1;
        else statsMap[tB].ties += 1;
      }
    }
  });

  const updatePromises = Object.keys(statsMap).map((teamId) => {
    const teamRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId, TEAMS_SUBCOLLECTION, teamId);
    return updateDoc(teamRef, statsMap[teamId]);
  });

  await Promise.all(updatePromises);
};

export const recalculatePlayerCumulativeStats = async (tournamentId: string) => {
  const gamesSnap = await getDocs(collection(db, TOURNAMENTS_COLLECTION, tournamentId, GAMES_SUBCOLLECTION));
  const playersSnap = await getDocs(collection(db, TOURNAMENTS_COLLECTION, tournamentId, PLAYERS_SUBCOLLECTION));

  const playerStatsAccumulator: Record<string, { gamesPlayed: number; totalPoints: number; totalAssists: number; totalFouls: number; totalRebounds: number }> = {};

  playersSnap.docs.forEach((d) => {
    playerStatsAccumulator[d.id] = { gamesPlayed: 0, totalPoints: 0, totalAssists: 0, totalFouls: 0, totalRebounds: 0 };
  });

  gamesSnap.docs.forEach((d) => {
    const g = d.data() as TournamentGame;
    if ((g.isFinished || g.status === "finished") && g.playerStats) {
      Object.keys(g.playerStats).forEach((pId) => {
        const pStat = g.playerStats[pId] as any;
        if (playerStatsAccumulator[pId]) {
          playerStatsAccumulator[pId].gamesPlayed += 1;
          playerStatsAccumulator[pId].totalPoints += pStat.points || 0;
          playerStatsAccumulator[pId].totalAssists += pStat.assists || 0;
          playerStatsAccumulator[pId].totalFouls += pStat.fouls || pStat.personalFouls || 0;
          playerStatsAccumulator[pId].totalRebounds += pStat.totalRebounds || pStat.rebounds || 0;
        }
      });
    }
  });

  const updatePromises = Object.keys(playerStatsAccumulator).map((pId) => {
    const pRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId, PLAYERS_SUBCOLLECTION, pId);
    return updateDoc(pRef, playerStatsAccumulator[pId]);
  });

  await Promise.all(updatePromises);
};

export const deletePlayByPlayEventInDb = async (
  tournamentId: string,
  gameId: string,
  eventId: string,
  revertScoreA?: number,
  revertScoreB?: number
) => {
  const eventRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId, GAMES_SUBCOLLECTION, gameId, PLAY_BY_PLAY_SUBCOLLECTION, eventId);
  await deleteDoc(eventRef);

  if (revertScoreA !== undefined && revertScoreB !== undefined) {
    const gameRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId, GAMES_SUBCOLLECTION, gameId);
    await updateDoc(gameRef, {
      scoreA: Math.max(0, revertScoreA),
      scoreB: Math.max(0, revertScoreB),
    });
  }
};

export const addPlayByPlayEventInDb = async (tournamentId: string, gameId: string, eventData: Omit<PlayByPlayEvent, "id">) => {
  const docRef = await addDoc(
    collection(db, TOURNAMENTS_COLLECTION, tournamentId, GAMES_SUBCOLLECTION, gameId, PLAY_BY_PLAY_SUBCOLLECTION),
    eventData
  );
  return { id: docRef.id, ...eventData } as PlayByPlayEvent;
};

export const subscribeToPlayByPlay = (tournamentId: string, gameId: string, callback: (events: PlayByPlayEvent[]) => void) => {
  const q = query(
    collection(db, TOURNAMENTS_COLLECTION, tournamentId, GAMES_SUBCOLLECTION, gameId, PLAY_BY_PLAY_SUBCOLLECTION),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PlayByPlayEvent));
    callback(events);
  }, (error) => {
    console.error("Error in subscribeToPlayByPlay:", error);
    callback([]);
  });
};

export const updateTournamentTeamInDb = async (tournamentId: string, teamId: string, updates: Partial<TournamentTeam>) => {
  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId, TEAMS_SUBCOLLECTION, teamId);
  await updateDoc(docRef, updates);
};

export const deleteTournamentTeamFromDb = async (tournamentId: string, teamId: string) => {
  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId, TEAMS_SUBCOLLECTION, teamId);
  await deleteDoc(docRef);
};

// --- Tournament Players ---

export const subscribeToTournamentPlayers = (tournamentId: string, callback: (players: TournamentPlayer[]) => void) => {
  const q = query(collection(db, TOURNAMENTS_COLLECTION, tournamentId, PLAYERS_SUBCOLLECTION), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const players = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TournamentPlayer));
    callback(players);
  }, (error) => {
    console.error("Error in subscribeToTournamentPlayers:", error);
    callback([]);
  });
};

export const addTournamentPlayerInDb = async (tournamentId: string, playerData: Omit<TournamentPlayer, "id">) => {
  const docRef = await addDoc(collection(db, TOURNAMENTS_COLLECTION, tournamentId, PLAYERS_SUBCOLLECTION), playerData);
  return { id: docRef.id, ...playerData } as TournamentPlayer;
};

export const updateTournamentPlayerInDb = async (tournamentId: string, playerId: string, updates: Partial<TournamentPlayer>) => {
  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId, PLAYERS_SUBCOLLECTION, playerId);
  await updateDoc(docRef, updates);
};

export const deleteTournamentPlayerFromDb = async (tournamentId: string, playerId: string) => {
  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId, PLAYERS_SUBCOLLECTION, playerId);
  await deleteDoc(docRef);
};

// --- Referees (PRO Tier) ---

export const subscribeToReferees = (tournamentId: string, callback: (referees: Referee[]) => void) => {
  const q = query(collection(db, TOURNAMENTS_COLLECTION, tournamentId, REFEREES_SUBCOLLECTION));
  return onSnapshot(q, (snapshot) => {
    const referees = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Referee));
    callback(referees);
  }, (error) => {
    console.error("Error in subscribeToReferees:", error);
    callback([]);
  });
};

export const addRefereeToDb = async (tournamentId: string, refData: Omit<Referee, "id">) => {
  const docRef = await addDoc(collection(db, TOURNAMENTS_COLLECTION, tournamentId, REFEREES_SUBCOLLECTION), refData);
  return { id: docRef.id, ...refData } as Referee;
};
