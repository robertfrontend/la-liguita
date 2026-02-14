"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { 
  subscribeToPlayers, 
  subscribeToHistory, 
  subscribeToActiveGame, 
  subscribeToLeagues 
} from "@/lib/db";
import { useAuth } from "@/components/providers/AuthProvider";

export function DataSubscriber() {
  const { user } = useAuth();
  
  const setPlayers = useStore((state) => state.setPlayers);
  const setHistory = useStore((state) => state.setHistory);
  const setActiveGame = useStore((state) => state.setActiveGame);
  
  const setLeagues = useStore((state) => state.setLeagues);
  const setActiveLeague = useStore((state) => state.setActiveLeague);
  const activeLeague = useStore((state) => state.activeLeague);
  const leagues = useStore((state) => state.leagues); // To check for available leagues

  // 1. Subscribe to User's Leagues
  useEffect(() => {
    if (!user) {
        setLeagues([]);
        setActiveLeague(null);
        return;
    }

    const unsubLeagues = subscribeToLeagues(user.uid, (fetchedLeagues) => {
      setLeagues(fetchedLeagues);
      
      // Auto-select first league if none selected and available
      // Using a functional update approach or just relying on current render state is tricky with effects.
      // But here we have access to 'activeLeague' from closure scope which might be stale if strict dependency not used.
      // However, we can use useStore.getState() if needed, but dependency array is cleaner.
      // The issue: if we put activeLeague in deps, this effect re-runs on activeLeague change, re-subscribing to leagues?
      // No, we only want to subscribe to leagues when USER changes.
      // Inside the callback, we can check the STORE state directly via useStore.getState() to avoid dependency loop.
      
      const currentActive = useStore.getState().activeLeague;
      if (!currentActive && fetchedLeagues.length > 0) {
        setActiveLeague(fetchedLeagues[0]);
      } else if (currentActive && !fetchedLeagues.find(l => l.id === currentActive.id)) {
        // Active league was deleted or lost access?
        setActiveLeague(fetchedLeagues.length > 0 ? fetchedLeagues[0] : null);
      }
    });

    return () => {
      unsubLeagues();
    };
  }, [user, setLeagues, setActiveLeague]);

  // 2. Subscribe to League Data (Players, History, ActiveGame)
  useEffect(() => {
    if (!activeLeague) {
        setPlayers([]);
        setHistory([]);
        setActiveGame(null);
        return;
    }

    // Subscribe to data for this specific league
    const unsubPlayers = subscribeToPlayers(activeLeague.id, (players) => {
      setPlayers(players);
    });

    const unsubHistory = subscribeToHistory(activeLeague.id, (history) => {
      setHistory(history);
    });
    
    const unsubActiveGame = subscribeToActiveGame(activeLeague.id, (game) => {
      setActiveGame(game);
    });

    return () => {
      unsubPlayers();
      unsubHistory();
      unsubActiveGame();
    };
  }, [activeLeague, setPlayers, setHistory, setActiveGame]);

  return null;
}
