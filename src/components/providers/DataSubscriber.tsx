"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { 
  subscribeToPlayers, 
  subscribeToHistory, 
  subscribeToActiveGame, 
  subscribeToLeagues,
  subscribeToUserProfile
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

  const setUserProfile = useStore((state) => state.setUserProfile);
  const ensureUserProfile = useStore((state) => state.ensureUserProfile);

  // 1. Subscribe to User's Leagues and Profile
  useEffect(() => {
    if (!user) {
        setLeagues([]);
        setActiveLeague(null);
        setUserProfile(null);
        return;
    }

    // Ensure profile exists
    if (user.uid) {
        console.log("DEBUG: Ensuring profile for user:", user.uid);
        ensureUserProfile(user.uid, user.email || undefined, user.displayName || undefined);

        const unsubProfile = subscribeToUserProfile(user.uid, (profile) => {
            console.log("DEBUG: Profile update received:", profile ? "found" : "not found");
            setUserProfile(profile);
        });

        const unsubLeagues = subscribeToLeagues(user.uid, (fetchedLeagues) => {
          setLeagues(fetchedLeagues);
          
          const currentActive = useStore.getState().activeLeague;
          if (!currentActive && fetchedLeagues.length > 0) {
            setActiveLeague(fetchedLeagues[0]);
          } else if (currentActive && !fetchedLeagues.find(l => l.id === currentActive.id)) {
            setActiveLeague(fetchedLeagues.length > 0 ? fetchedLeagues[0] : null);
          }
        });

        return () => {
          unsubProfile();
          unsubLeagues();
        };
    }
  }, [user, setLeagues, setActiveLeague, setUserProfile, ensureUserProfile]);

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
