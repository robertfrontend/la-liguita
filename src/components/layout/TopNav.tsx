"use client";

import Link from "next/link";
import { User, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { LeagueSelector } from "@/components/features/LeagueSelector";

export function TopNav() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)] border-b border-[var(--border)] h-16 flex items-center justify-between px-4 shadow-sm transition-colors duration-300">
      <Link href="/" className="text-xl font-black tracking-tight text-[var(--foreground)] z-10 relative">
        La <span className="text-orange-500">Liguita</span>
      </Link>
      
      {user && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <LeagueSelector />
        </div>
      )}

      <div className="flex items-center gap-3 z-10 relative">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-[var(--secondary)] flex items-center justify-center border border-[var(--border)] text-[var(--muted)] hover:text-orange-500 hover:border-orange-500 transition-all duration-300 active:scale-95"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {user ? (
          <button 
            onClick={() => {
              if(confirm("Log out?")) logout();
            }}
            className="w-10 h-10 rounded-full bg-[var(--secondary)] flex items-center justify-center border border-[var(--border)] text-[var(--muted)] hover:text-orange-500 hover:border-orange-500 transition-colors overflow-hidden"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold">{user.displayName?.charAt(0).toUpperCase() || <User size={20} />}</span>
            )}
          </button>
        ) : (
          <Link href="/login" className="px-4 py-2 text-sm font-bold bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-all">
            Get Started
          </Link>
        )}
      </div>
    </header>
  );
}
