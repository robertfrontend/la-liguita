"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { isSuperAdmin } from "@/lib/auth-helpers";
import { User as UserIcon, ShieldCheck, LogOut, Globe, Lock } from "lucide-react";

export function TopNav() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const superAdmin = isSuperAdmin(user);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 h-14 flex items-center justify-between px-5 transition-colors">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-xs shadow-sm shadow-blue-600/25">
            L
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black tracking-tight text-white uppercase">
              La Liguita
            </span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hidden sm:inline">
              Sports Platform
            </span>
          </div>
        </Link>
      </div>

      {/* Acciones del Usuario & Idioma */}
      <div className="flex items-center gap-2.5">
        {isMounted && (
          <button
            onClick={() => setLanguage(language === "en" ? "es" : "en")}
            className="h-8 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-mono text-[11px] font-bold transition flex items-center gap-1"
            title={t("nav.switchLanguage")}
          >
            <Globe size={13} className="text-zinc-500" />
            <span>{language.toUpperCase()}</span>
          </button>
        )}

        {user ? (
          <div className="flex items-center gap-2">
            {superAdmin && (
              <Link 
                href="/superadmin"
                className="h-8 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider transition hidden sm:inline-flex items-center gap-1.5"
                title="Consola Super Administrador"
              >
                <ShieldCheck size={13} className="text-emerald-400" />
                <span>Super Admin</span>
              </Link>
            )}

            {/* User Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 text-xs font-bold overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || <UserIcon size={14} />}</span>
                )}
              </div>

              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-zinc-200 leading-tight truncate max-w-[140px]">
                  {user.displayName || user.email?.split("@")[0]}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[140px]">
                  {superAdmin ? "Super Administrador" : "Organizador"}
                </div>
              </div>

              <button 
                onClick={() => {
                  if(confirm(t("common.logout"))) logout();
                }}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition"
                title="Cerrar Sesión"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        ) : (
          <Link 
            href="/admin" 
            className="h-8 px-3 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800 rounded-lg transition flex items-center gap-1.5"
            title="Acceso restringido para organizadores con PIN"
          >
            <Lock size={12} className="text-zinc-500" />
            <span>Acceso Organizador</span>
          </Link>
        )}
      </div>
    </header>
  );
}
