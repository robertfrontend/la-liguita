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
  collectionGroup
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

export const createTournamentInDb = async (tournamentData: Omit<Tournament, "id">) => {
  const docRef = await addDoc(collection(db, TOURNAMENTS_COLLECTION), tournamentData);
  return { id: docRef.id, ...tournamentData } as Tournament;
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

export const subscribeToTournamentGames = (tournamentId: string, callback: (games: TournamentGame[]) => void) => {
  const q = query(collection(db, TOURNAMENTS_COLLECTION, tournamentId, GAMES_SUBCOLLECTION));
  return onSnapshot(q, (snapshot) => {
    const games = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TournamentGame));
    games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(games);
  }, (error) => {
    console.error("Error in subscribeToTournamentGames:", error);
    callback([]);
  });
};

export const createTournamentGameInDb = async (tournamentId: string, gameData: Omit<TournamentGame, "id">) => {
  const docRef = await addDoc(collection(db, TOURNAMENTS_COLLECTION, tournamentId, GAMES_SUBCOLLECTION), gameData);
  return { id: docRef.id, ...gameData } as TournamentGame;
};

// --- Play-by-Play (PRO Tier) ---

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
    orderBy("timestamp", "asc")
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
