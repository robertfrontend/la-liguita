"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { LeagueSelector } from "@/components/features/LeagueSelector";
import { Moon as MoonIcon, Sun as SunIcon, User as UserIcon } from "lucide-react";

export function TopNav() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        {isMounted && (
          <>
            <button
              onClick={() => setLanguage(language === "en" ? "es" : "en")}
              className="w-10 h-10 rounded-full bg-[var(--secondary)] flex items-center justify-center border border-[var(--border)] text-[var(--muted)] font-bold text-xs hover:text-primary hover:border-primary transition-all duration-300 active:scale-95"
              title={t("nav.switchLanguage")}
            >
              {language.toUpperCase()}
            </button>

            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full bg-[var(--secondary)] flex items-center justify-center border border-[var(--border)] text-[var(--muted)] hover:text-orange-500 hover:border-orange-500 transition-all duration-300 active:scale-95"
              title={theme === 'dark' ? t("nav.lightMode") : t("nav.darkMode")}
            >
              {theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
            </button>
          </>
        )}

        {user ? (
          <button 
            onClick={() => {
              if(confirm(t("common.logout"))) logout();
            }}
            className="w-10 h-10 rounded-full bg-[var(--secondary)] flex items-center justify-center border border-[var(--border)] text-[var(--muted)] hover:text-orange-500 hover:border-orange-500 transition-colors overflow-hidden"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold">{user.displayName?.charAt(0).toUpperCase() || <UserIcon size={20} />}</span>
            )}
          </button>
        ) : (
          <Link href="/login" className="px-4 py-2 text-sm font-bold bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-all">
            {isMounted ? t("common.getStarted") : "..."}
          </Link>
        )}
      </div>
    </header>
  );
}
