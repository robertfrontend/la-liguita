"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { subscribeToPlayers, subscribeToHistory, subscribeToActiveGame } from "@/lib/db";
import { useAuth } from "@/components/providers/AuthProvider";

export function DataSubscriber() {
  const { user } = useAuth();
  const setPlayers = useStore((state) => state.setPlayers);
  const setHistory = useStore((state) => state.setHistory);
  const setActiveGame = useStore((state) => state.setActiveGame);

  useEffect(() => {
    // Only subscribe if we have a user (or even if we don't, if it's public?)
    // User requested "closed platform" so probably only if user exists.
    if (!user) {
        // Optional: clear store if logged out
        return;
    }

    const unsubPlayers = subscribeToPlayers((players) => {
      setPlayers(players);
    });

    const unsubHistory = subscribeToHistory((history) => {
      setHistory(history);
    });
    
    const unsubActiveGame = subscribeToActiveGame((game) => {
      // Logic: Only update active game if it exists. 
      // If we are locally creating one, we should be careful not to overwrite with null immediately before the write hits?
      // But adding a doc is fast.
      // We'll trust the DB as source of truth.
      setActiveGame(game);
    });

    return () => {
      unsubPlayers();
      unsubHistory();
      unsubActiveGame();
    };
  }, [user, setPlayers, setHistory, setActiveGame]);

  return null;
}
