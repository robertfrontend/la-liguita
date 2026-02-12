import { db } from "./firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from "firebase/firestore";
import type { Player, Game } from "./types";

// Collections
const PLAYERS_COLLECTION = "players";
const GAMES_COLLECTION = "games";

// --- Players ---

export const subscribeToPlayers = (callback: (players: Player[]) => void) => {
  const q = query(collection(db, PLAYERS_COLLECTION), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
    callback(players);
  });
};

export const addPlayerToDb = async (name: string) => {
  const newPlayer = {
    name,
    gamesPlayed: 0,
    wins: 0,
    totalPoints: 0,
    totalAssists: 0,
    avatar: name.slice(0, 2).toUpperCase(),
  };
  // Use addDoc to let Firestore generate ID, or allow custom IDs if needed.
  // The current store uses uuid. We can rely on Firestore IDs or stick to uuid.
  // Let's use Firestore IDs for simplicity in future.
  const docRef = await addDoc(collection(db, PLAYERS_COLLECTION), newPlayer);
  return { id: docRef.id, ...newPlayer };
};

export const updatePlayerStatsInDb = async (player: Player) => {
  const playerRef = doc(db, PLAYERS_COLLECTION, player.id);
  await updateDoc(playerRef, {
    gamesPlayed: player.gamesPlayed,
    wins: player.wins,
    totalPoints: player.totalPoints,
    totalAssists: player.totalAssists,
  });
};

// --- Games ---

export const subscribeToHistory = (callback: (games: Game[]) => void) => {
  const q = query(collection(db, GAMES_COLLECTION), where("isFinished", "==", true), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
    callback(games);
  });
};

// For active game, we can check if there's any game with isFinished = false?
// Or we can treat active game as local-first for latency, then save?
// The user wants "all data in Firebase". So we should sync active game too.
// This allows multiple people to watch the score live!
export const subscribeToActiveGame = (callback: (game: Game | null) => void) => {
  // Assuming only one active game for simplicity for now, or we filter by recent?
  // Let's query for the most recent unfinished game.
  const q = query(
    collection(db, GAMES_COLLECTION), 
    where("isFinished", "==", false), 
    orderBy("date", "desc"), 
    // limit(1) // Firestore doesn't like limiting on snapshot sometimes with multiple potential matches, but let's try.
  );
  
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
    } else {
      const doc = snapshot.docs[0];
      callback({ id: doc.id, ...doc.data() } as Game);
    }
  });
};

export const createGameInDb = async (teamA: string[], teamB: string[]) => {
  const newGame = {
    date: new Date().toISOString(),
    teamA,
    teamB,
    playerStats: {}, 
    scoreA: 0,
    scoreB: 0,
    isFinished: false,
  };
  
  // Initialize stats object properly
  const stats: Record<string, any> = {};
  [...teamA, ...teamB].forEach(pid => {
    stats[pid] = { points: 0, assists: 0 };
  });
  newGame.playerStats = stats;

  const docRef = await addDoc(collection(db, GAMES_COLLECTION), newGame);
  return { id: docRef.id, ...newGame };
};

export const updateGameInDb = async (gameId: string, updates: Partial<Game>) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  await updateDoc(gameRef, updates);
};
