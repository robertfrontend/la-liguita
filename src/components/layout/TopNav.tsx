"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { User as UserIcon, ShieldCheck } from "lucide-react";

export function TopNav() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 h-16 flex items-center justify-between px-4 shadow-sm transition-colors duration-300">
      <Link href="/" className="text-xl font-black tracking-tight text-white z-10 relative flex items-center gap-2">
        <span>La <span className="text-orange-500">Liguita</span></span>
      </Link>

      <div className="flex items-center gap-3 z-10 relative">
        {isMounted && (
          <button
            onClick={() => setLanguage(language === "en" ? "es" : "en")}
            className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-400 font-bold text-xs hover:text-orange-500 hover:border-orange-500 transition-all duration-300 active:scale-95"
            title={t("nav.switchLanguage")}
          >
            {language.toUpperCase()}
          </button>
        )}

        {user ? (
          <div className="flex items-center gap-2">
            {user.email && (user.email.toLowerCase().includes("robert02frontend") || (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL && user.email.toLowerCase() === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL.toLowerCase())) && (
              <Link 
                href="/superadmin"
                className="px-3 py-1 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase tracking-wider transition hidden sm:inline-flex items-center gap-1.5"
                title="Panel de Super Administrador"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <span>Super Admin</span>
              </Link>
            )}

            <button 
              onClick={() => {
                if(confirm(t("common.logout"))) logout();
              }}
              className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-400 hover:text-orange-500 hover:border-orange-500 transition-colors overflow-hidden"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold">{user.displayName?.charAt(0).toUpperCase() || <UserIcon size={20} />}</span>
              )}
            </button>
          </div>
        ) : (
          <Link href="/login" className="px-4 py-2 text-sm font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full hover:bg-orange-500/20 transition-all">
            {isMounted ? t("common.getStarted") : "..."}
          </Link>
        )}
      </div>
    </header>
  );
}
