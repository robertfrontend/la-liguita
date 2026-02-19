"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlayCircle, History, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

import { useState, useEffect } from "react";

export function BottomNav() {
  const pathname = usePathname();
  const activeGameStore = useStore((state) => state.activeGame);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeGame = isMounted ? activeGameStore : null;

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 pb-safe shadow-[0_-1px_3px_rgba(0,0,0,0.05)] transition-colors duration-300">
      <div className="flex justify-around items-center h-16">
        <Link
          href="/leaderboard"
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
            isActive("/leaderboard") ? "text-orange-500" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
          )}
        >
          <Trophy size={24} />
          <span className="text-xs font-medium">Stats</span>
        </Link>
        
        <Link
          href={activeGame ? `/game/${activeGame.id}` : "/game/new"}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
            pathname.startsWith("/game") ? "text-orange-500" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
          )}
        >
          <PlayCircle size={24} />
          <span className="text-xs font-medium">{activeGame ? "Live" : "New Game"}</span>
        </Link>

        <Link
          href="/history"
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
            isActive("/history") ? "text-orange-500" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
          )}
        >
          <History size={24} />
          <span className="text-xs font-medium">History</span>
        </Link>
      </div>
    </nav>
  );
}
