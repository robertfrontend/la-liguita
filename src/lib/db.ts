import { db } from "./firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  collectionGroup
} from "firebase/firestore";
import type { Player, Game, League } from "./types";

// Collections
const LEAGUES_COLLECTION = "leagues";
const PLAYERS_SUBCOLLECTION = "players";
const GAMES_SUBCOLLECTION = "games";

// --- Leagues ---

export const createLeague = async (name: string, ownerId: string) => {
  const newLeague = {
    name,
    ownerId,
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(collection(db, LEAGUES_COLLECTION), newLeague);
  return { id: docRef.id, ...newLeague };
};

export const subscribeToLeagues = (userId: string, callback: (leagues: League[]) => void) => {
  // Query leagues where user is owner. 
  // Future: Also where user is a member? For now just owner.
  const q = query(collection(db, LEAGUES_COLLECTION), where("ownerId", "==", userId));
  return onSnapshot(q, (snapshot) => {
    const leagues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League));
    callback(leagues);
  }, (error) => {
    console.error("Error subscribing to leagues:", error);
  });
};

// --- Players ---

export const subscribeToPlayers = (leagueId: string, callback: (players: Player[]) => void) => {
  const q = query(collection(db, LEAGUES_COLLECTION, leagueId, PLAYERS_SUBCOLLECTION), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
    callback(players);
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
    console.error("Error subscribing to history:", error);
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
    console.error("Error subscribing to active game:", error);
  });
};

export const createGameInDb = async (leagueId: string, teamA: string[], teamB: string[]) => {
  const newGame = {
    date: new Date().toISOString(),
    teamA,
    teamB,
    playerStats: {}, 
    scoreA: 0,
    scoreB: 0,
    isFinished: false,
  };
  
  const stats: Record<string, any> = {};
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
  const gameRef = doc(db, LEAGUES_COLLECTION, leagueId, GAMES_SUBCOLLECTION, gameId);
  await updateDoc(gameRef, updates);
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
      callback({ id: doc.id, ...doc.data() } as Game);
    } else {
      callback(null);
    }
  }, (error) => {
      console.error("Error subscribing to global game:", error);
      callback(null);
  });
};
