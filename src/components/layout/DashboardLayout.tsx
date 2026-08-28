"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import { canAdminTournament, isSuperAdmin } from "@/lib/auth-helpers";
import { Tournament } from "@/types/tournament";
import { 
  Trophy, 
  Users, 
  Calendar, 
  BarChart3, 
  ShieldAlert, 
  Video, 
  Activity, 
  Settings, 
  Award, 
  ChevronRight, 
  Sparkles, 
  Loader2,
  ExternalLink,
  Flame,
  ArrowLeft,
  Lock,
  UserCheck,
  Building2,
  Layers,
  ChevronDown,
  Menu,
  X,
  ShieldCheck
} from "lucide-react";
import { SetupReminderBanner } from "@/components/features/SetupReminderBanner";

interface NavItem {
  label: string;
  shortLabel?: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  proOnly?: boolean;
  badge?: string;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const params = useParams();
  const pathname = usePathname();
  const tournamentId = (params?.id || params?.tournamentId) as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!tournamentId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, "tournaments", tournamentId);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setTournament({ id: snap.id, ...snap.data() } as Tournament);
        } else {
          setError("El torneo especificado no existe o fue eliminado.");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error al obtener torneo:", err);
        setError("Error de permisos o conexión al cargar el torneo.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tournamentId]);

  // Cerrar el menú móvil automáticamente al navegar
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          <p className="text-xs font-semibold text-zinc-400">Cargando panel de gestión...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 p-6 text-center text-white">
        <ShieldAlert className="h-10 w-10 text-red-500 mb-3" />
        <h2 className="text-lg font-bold">{error || "Torneo no encontrado"}</h2>
        <Link 
          href="/" 
          className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold transition"
        >
          Volver al Portal
        </Link>
      </div>
    );
  }

  const hasAdminAccess = canAdminTournament(user, tournament);

  if (!hasAdminAccess) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 p-6 text-center text-white">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
          <Lock size={28} />
        </div>
        <h2 className="text-xl font-bold">Acceso Administrativo Restringido</h2>
        <p className="text-xs text-zinc-400 max-w-md mt-2 leading-relaxed">
          Tu cuenta ({user?.email || "Sin sesión"}) no está autorizada para administrar <strong>{tournament.name}</strong>.
        </p>
        <div className="flex gap-3 mt-6">
          <Link
            href={`/t/${tournament.slug || tournament.id}`}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
          >
            Ver Portal Público
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition"
          >
            Volver al Panel Principal
          </Link>
        </div>
      </div>
    );
  }

  const isPro = tournament.tier === 'pro';

  // Navegación Modular Profesional
  const coreNav: NavItem[] = [
    { label: "Partidos & Calendario", shortLabel: "Partidos", href: `/tournament/${tournamentId}/games`, icon: Calendar },
    { label: "Actas & Box Score", shortLabel: "Box Score", href: `/tournament/${tournamentId}/boxscore`, icon: Layers },
    { label: "Equipos & Plantillas", shortLabel: "Equipos", href: `/tournament/${tournamentId}/teams`, icon: Users },
    { label: "Tabla de Posiciones", shortLabel: "Posiciones", href: `/tournament/${tournamentId}/standings`, icon: Trophy },
    { label: "Administradores", shortLabel: "Admins", href: `/tournament/${tournamentId}/admins`, icon: UserCheck },
  ];

  const proNav: NavItem[] = [
    { label: "Rosters & Carnets", shortLabel: "Rosters", href: `/tournament/${tournamentId}/rosters`, icon: Award, proOnly: true },
    { label: "Estadísticas Oficiales", shortLabel: "Estadísticas", href: `/tournament/${tournamentId}/stats`, icon: BarChart3, proOnly: true, badge: "PRO" },
    { label: "Cuerpo Arbitral", shortLabel: "Árbitros", href: `/tournament/${tournamentId}/referees`, icon: ShieldAlert, proOnly: true },
    { label: "Video & Transmisión", shortLabel: "Media", href: `/tournament/${tournamentId}/media`, icon: Video, proOnly: true },
  ];

  const allNavItems: NavItem[] = [
    ...coreNav, 
    ...(isPro ? proNav : []), 
    { label: "Configuración", shortLabel: "Ajustes", href: `/tournament/${tournamentId}/settings`, icon: Settings }
  ];

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] bg-zinc-950 text-zinc-100 antialiased font-sans selection:bg-emerald-500/30">
      {/* ============================================================ */}
      {/* 1. SIDEBAR DESKTOP PROFESIONAL (SOLO PANTALLAS GRANDES) */}
      {/* ============================================================ */}
      <aside className="hidden lg:flex w-64 border-r border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl flex-col justify-between shrink-0">
        <div>
          {/* Header del Torneo */}
          <div className="p-4 border-b border-zinc-800/80 space-y-2">
            <Link 
              href="/" 
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-white transition"
            >
              <ArrowLeft size={13} />
              <span>Volver a Mis Torneos</span>
            </Link>

            <div className="pt-1 flex items-center gap-3">
              {tournament.logoUrl ? (
                <div className="w-9 h-9 rounded-lg bg-zinc-950 border border-zinc-800 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  <img src={tournament.logoUrl} alt={tournament.name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-emerald-400 text-xs shrink-0">
                  {tournament.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider truncate">
                    {tournament.organizationName || "Organización"}
                  </span>

                  {isPro ? (
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      PRO
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Amateur
                    </span>
                  )}
                </div>

                <h2 className="text-xs font-bold text-white truncate leading-tight">
                  {tournament.name}
                </h2>
              </div>
            </div>
          </div>

          {/* Menú de Navegación por Categorías */}
          <div className="p-3 space-y-4">
            {/* Categoría 1: Competición */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Operaciones del Torneo
              </div>
              <nav className="space-y-0.5 mt-1">
                {coreNav.map((item) => {
                  const isActive = pathname === item.href || (item.href !== `/tournament/${tournamentId}` && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                        isActive
                          ? "bg-zinc-800/90 text-white border-l-2 border-l-emerald-500 border border-zinc-700 font-bold shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={15} className={isActive ? "text-emerald-400" : "text-zinc-500"} />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Categoría 2: Módulo Profesional */}
            {isPro && (
              <div>
                <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Mesa Técnica & Stats</span>
                  <span className="text-[9px] text-emerald-400 font-bold">PRO</span>
                </div>
                <nav className="space-y-0.5 mt-1">
                  {proNav.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                          isActive
                            ? "bg-zinc-800/90 text-white border-l-2 border-l-emerald-500 border border-zinc-700 font-bold shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={15} className={isActive ? "text-emerald-400" : "text-zinc-500"} />
                          <span>{item.label}</span>
                        </div>

                        {item.badge && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Footer del Sidebar con Configuración */}
        <div className="p-3 border-t border-zinc-800/80">
          <Link
            href={`/tournament/${tournamentId}/settings`}
            className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition ${
              pathname.includes("/settings")
                ? "bg-zinc-800/90 text-white font-bold border border-zinc-700"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings size={15} className={pathname.includes("/settings") ? "text-emerald-400" : "text-zinc-500"} />
              <span>Configuración del Torneo</span>
            </div>
            <ChevronRight size={13} className="text-zinc-600" />
          </Link>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. DRAWER MÓVIL (MENÚ DESPLEGABLE COMPLETO EN PANTALLAS PEQUEÑAS) */}
      {/* ============================================================ */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-in fade-in">
          {/* Backdrop oscuro */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Panel Lateral Deslizante */}
          <div className="relative w-4/5 max-w-xs bg-zinc-950 border-r border-zinc-800 h-full flex flex-col justify-between p-5 z-10 shadow-2xl overflow-y-auto">
            <div className="space-y-5">
              {/* Header Drawer */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-3 min-w-0">
                  {tournament.logoUrl ? (
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      <img src={tournament.logoUrl} alt={tournament.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-emerald-400 text-sm shrink-0">
                      {tournament.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm truncate">{tournament.name}</h3>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                      {isPro ? "Plan PRO FIBA" : "Plan Amateur"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Enlace Volver */}
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white"
              >
                <ArrowLeft size={14} className="text-emerald-400" />
                <span>Volver a Mis Torneos</span>
              </Link>

              {/* Lista Completa de Navegación Móvil */}
              <nav className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Módulos de Gestión
                </div>
                {allNavItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== `/tournament/${tournamentId}` && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/25"
                          : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={16} className={isActive ? "text-white" : "text-zinc-400"} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-zinc-900 text-emerald-400 border border-zinc-800">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Footer Drawer con Enlace Público */}
            <div className="pt-4 border-t border-zinc-800/80">
              <Link
                href={`/t/${tournament.slug || tournament.id}`}
                target="_blank"
                className="w-full py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white rounded-xl text-xs font-bold border border-zinc-800 transition flex items-center justify-center gap-2"
              >
                <ExternalLink size={14} className="text-emerald-400" />
                <span>Ver Portal Público</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. CONTENIDO PRINCIPAL & CABECERA RESPONSIVE */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Cabecera Superior (Mobile + Desktop) */}
        <header className="h-14 border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Botón Hamburguesa Móvil */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition flex items-center justify-center shrink-0"
              aria-label="Abrir Menú de Navegación"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumbs / Título del Torneo */}
            <div className="flex items-center gap-2 text-xs text-zinc-400 min-w-0">
              <span className="text-zinc-500 font-medium hidden sm:inline">Torneo</span>
              <ChevronRight size={12} className="text-zinc-700 hidden sm:inline" />
              <span className="font-bold text-white truncate max-w-[160px] sm:max-w-xs md:max-w-md">
                {tournament.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/t/${tournament.slug || tournament.id}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold border border-zinc-800 transition shrink-0"
            >
              <span className="hidden sm:inline">Portal Fan</span>
              <ExternalLink size={13} className="text-emerald-400" />
            </Link>
          </div>
        </header>

        {/* Barra Rápida Horizontal Deslizable para Móviles (Sticky Quick Tabs) */}
        <div className="lg:hidden bg-zinc-950/95 border-b border-zinc-800/80 px-2 py-2 overflow-x-auto no-scrollbar flex items-center gap-1.5 sticky top-14 z-30 backdrop-blur-md">
          {allNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== `/tournament/${tournamentId}` && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800/80"
                }`}
              >
                <Icon size={13} className={isActive ? "text-white" : "text-zinc-400"} />
                <span>{item.shortLabel || item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Área de Trabajo con Padding Adaptativo */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {!pathname.includes("/onboarding") && (
            <SetupReminderBanner tournament={tournament} />
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
