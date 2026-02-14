"use client";

import Link from "next/link";
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { LeagueSelector } from "@/components/features/LeagueSelector";

export function TopNav() {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-zinc-200 h-16 flex items-center justify-between px-4 shadow-sm">
      <Link href="/" className="text-xl font-black tracking-tight text-zinc-900">
        La <span className="text-orange-500">Liguita</span>
      </Link>
      
      {user ? (
        <div className="flex items-center gap-3">
          <LeagueSelector />
          <button 
            onClick={() => {
              if(confirm("Log out?")) logout();
            }}
            className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200 text-zinc-500 hover:text-orange-500 hover:border-orange-500 transition-colors overflow-hidden"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold">{user.displayName?.charAt(0).toUpperCase() || <User size={20} />}</span>
            )}
          </button>
        </div>
      ) : (
        <Link href="/login" className="px-4 py-2 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors">
          Login
        </Link>
      )}
    </header>
  );
}
