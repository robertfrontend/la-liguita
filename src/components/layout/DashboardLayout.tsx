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
  UserCheck
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

  // Escuchar el torneo en Firestore en tiempo real
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
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-sm font-medium text-zinc-400">Cargando panel de control...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 p-6 text-center text-white">
        <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">{error || "Torneo no encontrado"}</h2>
        <Link 
          href="/" 
          className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const hasAdminAccess = canAdminTournament(user, tournament);

  if (!hasAdminAccess) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 p-6 text-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-4">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-bold">Acceso de Administración Restringido</h2>
        <p className="text-sm text-zinc-400 max-w-md mt-2 leading-relaxed">
          Tu cuenta ({user?.email || "Sin sesión"}) no tiene permisos de administración sobre <strong>{tournament.name}</strong>.
        </p>
        <div className="flex gap-3 mt-6">
          <Link
            href={`/t/${tournament.id}`}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs rounded-xl transition"
          >
            Ir a la Vista Pública
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  const isPro = tournament.tier === 'pro';

  // Configuración de navegación condicional por Tier
  const baseNavigation: NavItem[] = [
    { label: "Partidos & Marcador", href: `/tournament/${tournamentId}/games`, icon: Calendar },
    { label: "Equipos", href: `/tournament/${tournamentId}/teams`, icon: Users },
    { label: "Tabla de Posiciones", href: `/tournament/${tournamentId}/standings`, icon: Trophy },
    { label: "Administradores", href: `/tournament/${tournamentId}/admins`, icon: UserCheck },
  ];

  const proNavigation: NavItem[] = [
    { label: "Rosters Oficiales", href: `/tournament/${tournamentId}/rosters`, icon: Award, proOnly: true },
    { label: "Estadísticas Avanzadas", href: `/tournament/${tournamentId}/stats`, icon: BarChart3, proOnly: true, badge: "PRO" },
    { label: "Play-by-Play Live", href: `/tournament/${tournamentId}/live-console`, icon: Activity, proOnly: true, badge: "LIVE" },
    { label: "Cuerpo Arbitral", href: `/tournament/${tournamentId}/referees`, icon: ShieldAlert, proOnly: true },
    { label: "Video Highlights", href: `/tournament/${tournamentId}/media`, icon: Video, proOnly: true },
  ];

  const currentNav = isPro ? [...baseNavigation, ...proNavigation] : baseNavigation;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      {/* Sidebar Desktop */}
      <aside className="w-72 border-r border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl flex flex-col justify-between shrink-0">
        <div>
          {/* Header del Torneo */}
          <div className="p-5 border-b border-zinc-800/80">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white mb-3 transition">
              <ArrowLeft size={14} /> Inicio
            </Link>
            
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                {tournament.sport === 'soccer' ? '⚽ Fútbol' : '🏀 Baloncesto'}
              </span>

              {/* Badge de Nivel */}
              {isPro ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 shadow-sm shadow-orange-500/20">
                  <Sparkles size={10} className="fill-current" /> PRO
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Amateur
                </span>
              )}
            </div>

            <h1 className="text-lg font-black text-white tracking-tight truncate leading-tight">
              {tournament.name}
            </h1>
            <p className="text-xs text-zinc-500 truncate mt-0.5">
              {tournament.organizationName || "Liga Local"}
            </p>
          </div>

          {/* Menú de Navegación */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-black text-zinc-500 uppercase tracking-wider">
              Menú Principal
            </div>

            {currentNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? isPro
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                        : "bg-zinc-800 text-white border border-zinc-700"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      isActive ? "bg-white/20 text-white" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer del Sidebar con Upsell o Configuración */}
        <div className="p-4 border-t border-zinc-800/80 space-y-3">
          {!isPro && (
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20">
              <div className="flex items-center gap-2 text-orange-400 font-bold text-xs mb-1">
                <Flame size={14} className="fill-current" />
                Desbloquea Estadísticas PRO
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-2.5">
                Play-by-play, tiros detallados y reportes estilo FIBA/NBA.
              </p>
              <Link 
                href={`/tournament/${tournamentId}/settings`}
                className="block text-center w-full py-1.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-xs rounded-lg transition shadow-sm"
              >
                Actualizar a PRO
              </Link>
            </div>
          )}

          <Link
            href={`/tournament/${tournamentId}/settings`}
            className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-lg transition"
          >
            <div className="flex items-center gap-2">
              <Settings size={16} />
              <span>Configuración</span>
            </div>
            <ChevronRight size={14} />
          </Link>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar Contextual */}
        <header className="h-16 border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-zinc-400">Torneo:</span>
            <span className="text-sm font-bold text-white bg-zinc-800/80 px-3 py-1 rounded-lg border border-zinc-700/50">
              {tournament.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/tournament/${tournamentId}/standings`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700/60 transition"
            >
              <span>Vista Pública</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </header>

        {/* Vista Inyectada */}
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
