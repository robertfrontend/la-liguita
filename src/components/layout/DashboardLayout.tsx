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
  ChevronDown
} from "lucide-react";
import { SetupReminderBanner } from "@/components/features/SetupReminderBanner";

interface NavItem {
  label: string;
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

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
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
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-4">
          <Lock size={28} />
        </div>
        <h2 className="text-xl font-bold">Acceso Administrativo Restringido</h2>
        <p className="text-xs text-zinc-400 max-w-md mt-2 leading-relaxed">
          Tu cuenta ({user?.email || "Sin sesión"}) no está autorizada para administrar <strong>{tournament.name}</strong>.
        </p>
        <div className="flex gap-3 mt-6">
          <Link
            href={`/t/${tournament.id}`}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs rounded-xl transition"
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
    { label: "Partidos & Calendario", href: `/tournament/${tournamentId}/games`, icon: Calendar },
    { label: "Equipos & Plantillas", href: `/tournament/${tournamentId}/teams`, icon: Users },
    { label: "Tabla de Posiciones", href: `/tournament/${tournamentId}/standings`, icon: Trophy },
    { label: "Administradores", href: `/tournament/${tournamentId}/admins`, icon: UserCheck },
  ];

  const proNav: NavItem[] = [
    { label: "Rosters & Carnets Oficiales", href: `/tournament/${tournamentId}/rosters`, icon: Award, proOnly: true },
    { label: "Estadísticas Oficiales", href: `/tournament/${tournamentId}/stats`, icon: BarChart3, proOnly: true, badge: "PRO" },
    { label: "Mesa Técnica Live", href: `/tournament/${tournamentId}/live-console`, icon: Activity, proOnly: true, badge: "LIVE" },
    { label: "Cuerpo Arbitral", href: `/tournament/${tournamentId}/referees`, icon: ShieldAlert, proOnly: true },
    { label: "Video & Transmisión", href: `/tournament/${tournamentId}/media`, icon: Video, proOnly: true },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] bg-zinc-950 text-zinc-100 antialiased font-sans">
      {/* Sidebar Desktop Profesional */}
      <aside className="w-64 border-r border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl flex flex-col justify-between shrink-0">
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

            <div className="pt-1">
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider truncate">
                  {tournament.organizationName || "Organización Oficial"}
                </span>

                {isPro ? (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
                    PRO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Amateur
                  </span>
                )}
              </div>

              <h2 className="text-sm font-black text-white truncate leading-tight">
                {tournament.name}
              </h2>
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
                          ? "bg-zinc-800 text-white border border-zinc-700 font-bold"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={15} className={isActive ? "text-orange-400" : "text-zinc-500"} />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Categoría 2: Módulo Profesional */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>Mesa Técnica & Stats</span>
                {isPro && <span className="text-[9px] text-orange-400 font-bold">PRO</span>}
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
                          ? "bg-zinc-800 text-white border border-zinc-700 font-bold"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={15} className={isActive ? "text-orange-400" : "text-zinc-500"} />
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
          </div>
        </div>

        {/* Footer del Sidebar con Configuración */}
        <div className="p-3 border-t border-zinc-800/80">
          <Link
            href={`/tournament/${tournamentId}/settings`}
            className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition"
          >
            <div className="flex items-center gap-2">
              <Settings size={15} className="text-zinc-500" />
              <span>Configuración del Torneo</span>
            </div>
            <ChevronRight size={13} className="text-zinc-600" />
          </Link>
        </div>
      </aside>

      {/* Contenido Principal con Barra Superior Contextual */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra Superior con Breadcrumbs */}
        <header className="h-12 border-b border-zinc-800/80 bg-zinc-900/30 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="text-zinc-400 font-medium">Torneo</span>
            <ChevronRight size={12} className="text-zinc-600" />
            <span className="font-bold text-white">{tournament.name}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/t/${tournamentId}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold border border-zinc-800 transition"
            >
              <span>Portal Público</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </header>

        {/* Área de Trabajo */}
        <main className="flex-1 p-6 overflow-y-auto">
          {!pathname.includes("/onboarding") && (
            <SetupReminderBanner tournament={tournament} />
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
