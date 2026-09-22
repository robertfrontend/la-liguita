"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Lock,
  Megaphone,
  MonitorSmartphone,
  Search,
  Trophy,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { TopNav } from "@/components/layout/TopNav";
import { subscribeToAllTournaments } from "@/lib/db";
import { Tournament } from "@/types/tournament";

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const filterButtonBase =
  "min-h-11 rounded-full border px-4 py-2 text-xs font-bold transition motion-reduce:transition-none";

const portalFeatures = [
  {
    icon: MonitorSmartphone,
    title: "Portal público listo para compartir",
    description:
      "Cada torneo tiene una página clara para que equipos, jugadores y público consulten la información oficial sin depender de capturas.",
  },
  {
    icon: CalendarDays,
    title: "Fixture y calendario ordenados",
    description:
      "Mostrá partidos, fechas y próximos cruces con una presentación consistente para toda la competencia.",
  },
  {
    icon: BarChart3,
    title: "Resultados y posiciones actualizadas",
    description:
      "Centralizá marcador, tabla e historial para que la liga se vea seria desde el primer partido.",
  },
];

const workflowSteps = [
  "Creá el torneo",
  "Configurá equipos",
  "Publicá el portal",
  "Actualizá resultados",
];

export function RouteAwareAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  return (
    <>
      {!isHomepage && <TopNav />}
      <main className={`min-h-screen ${isHomepage ? "" : "pt-16"}`}>{children}</main>
    </>
  );
}

export function PublicTournamentDirectory() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sportFilter, setSportFilter] = useState<"all" | "basketball" | "soccer">("all");

  useEffect(() => {
    const unsub = subscribeToAllTournaments((list) => {
      setTournaments(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      const name = t?.name || "";
      const org = t?.organizationName || "";
      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSport = sportFilter === "all" || (t?.sport || "basketball") === sportFilter;

      return matchesSearch && matchesSport;
    });
  }, [tournaments, searchQuery, sportFilter]);

  const basketballCount = tournaments.filter((t) => (t?.sport || "basketball") === "basketball").length;
  const soccerCount = tournaments.filter((t) => t?.sport === "soccer").length;
  const proCount = tournaments.filter((t) => t?.tier === "pro").length;

  return (
    <div className="min-h-screen overflow-hidden bg-[#0b0805] text-white antialiased selection:bg-orange-400/30">
      <header className="absolute inset-x-0 top-0 z-30">
        <nav className="mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12" aria-label="Navegación principal">
          <Link href="/" className={`inline-flex items-center gap-3 ${focusRing}`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/10 text-sm font-black text-white shadow-lg backdrop-blur-md">
              LL
            </div>
            <div>
              <p className="text-xl font-semibold tracking-tight text-white drop-shadow-sm">La Liguita</p>
              <p className="hidden text-[10px] font-bold uppercase tracking-[0.32em] text-white/60 sm:block">Portal deportivo</p>
            </div>
          </Link>

          <div className="hidden items-center gap-10 text-sm font-semibold text-white/85 md:flex">
            <Link href="#portal" className={`transition hover:text-orange-300 motion-reduce:transition-none ${focusRing}`}>Portal</Link>
            <Link href="#como-funciona" className={`transition hover:text-orange-300 motion-reduce:transition-none ${focusRing}`}>Cómo funciona</Link>
            <Link href="#torneos-activos" className={`transition hover:text-orange-300 motion-reduce:transition-none ${focusRing}`}>Torneos</Link>
            {user && (
              <Link href="/superadmin" className={`inline-flex items-center gap-2 transition hover:text-orange-300 motion-reduce:transition-none ${focusRing}`}>
                <Lock size={15} aria-hidden="true" />
                Admin
              </Link>
            )}
          </div>

          <Link
            href="/tournament/new"
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-400 px-5 py-3 text-sm font-black text-zinc-950 shadow-xl shadow-orange-400/20 transition hover:bg-orange-300 motion-reduce:transition-none sm:px-7 ${focusRing}`}
          >
            Crear torneo
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <div>
        <section className="relative flex min-h-[920px] items-center justify-center px-4 py-28 sm:px-6 lg:min-h-screen lg:px-8" aria-labelledby="homepage-title">
          <div aria-hidden="true" className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(249,115,22,0.22),transparent_28%),linear-gradient(180deg,rgba(11,8,5,0.24)_0%,rgba(11,8,5,0.66)_42%,rgba(11,8,5,0.94)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.06)_0_1px,transparent_1px_18%),linear-gradient(90deg,rgba(255,255,255,0.04)_0_1px,transparent_1px_80px)] opacity-35" />
            <div className="absolute inset-x-[-10%] bottom-0 h-[70%] origin-bottom scale-x-125 rounded-t-[50%] border-t border-white/20 bg-[linear-gradient(180deg,rgba(69,38,18,0.9),rgba(18,10,6,0.98))] shadow-[inset_0_40px_120px_rgba(255,255,255,0.06)]" />
            <div className="absolute bottom-[7%] left-1/2 h-[55%] w-[78%] -translate-x-1/2 skew-y-[-5deg] rounded-[2.5rem] border border-white/35 bg-[linear-gradient(90deg,transparent_49.5%,rgba(255,255,255,0.42)_49.5%_50.5%,transparent_50.5%),linear-gradient(0deg,transparent_48%,rgba(255,255,255,0.22)_48%_52%,transparent_52%)] opacity-70" />
            <div className="absolute bottom-[15%] left-[12%] h-44 w-44 rounded-full bg-orange-400/12 blur-3xl" />
            <div className="absolute bottom-[20%] right-[10%] h-56 w-56 rounded-full bg-orange-200/10 blur-3xl" />
            <div className="absolute inset-0 bg-black/25" />
          </div>

          <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center text-center">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md ring-1 ring-white/20">
              <span className="flex -space-x-2" aria-hidden="true">
                <span className="h-8 w-8 rounded-full border-2 border-white bg-orange-400" />
                <span className="h-8 w-8 rounded-full border-2 border-white bg-orange-300" />
                <span className="h-8 w-8 rounded-full border-2 border-white bg-zinc-200" />
              </span>
              +{Math.max(tournaments.length, 12)} competencias organizadas
            </div>

            <h1 id="homepage-title" className="text-balance text-5xl font-light leading-[0.98] tracking-[-0.065em] text-white drop-shadow-2xl sm:text-6xl md:text-7xl lg:text-8xl">
              Organizá con <span className="font-serif italic tracking-[-0.04em] text-orange-400">presencia.</span>
              <br />
              Elevá tu liga.
            </h1>

            <p className="mt-8 max-w-2xl text-balance text-xl font-medium leading-8 text-white/82 drop-shadow md:text-2xl md:leading-10">
              Creá torneos, publicá fixtures y compartí un portal público profesional para equipos, jugadores y público.
            </p>

            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/tournament/new"
                className={`inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-orange-400 px-8 py-4 text-base font-black text-zinc-950 shadow-2xl shadow-orange-400/20 transition hover:-translate-y-0.5 hover:bg-orange-300 motion-reduce:transform-none motion-reduce:transition-none ${focusRing}`}
              >
                Crear torneo
                <ArrowRight size={20} aria-hidden="true" />
              </Link>
              <Link
                href="#torneos-activos"
                className={`inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-white/25 bg-white/10 px-8 py-4 text-base font-bold text-white shadow-2xl backdrop-blur-md transition hover:bg-white/16 motion-reduce:transition-none ${focusRing}`}
              >
                Ver torneos activos
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section id="portal" className="relative border-y border-white/10 bg-[#0b0805]" aria-labelledby="portal-value-title">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8 lg:py-20">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-400">Portal público</p>
              <h2 id="portal-value-title" className="mt-4 text-4xl font-light tracking-[-0.05em] text-white sm:text-5xl">
                Menos planillas sueltas. Más liga.
              </h2>
              <p className="mt-5 text-base font-medium leading-7 text-white/65">
                La información oficial vive en un solo lugar, con una presentación preparada para compartir antes, durante y después de cada fecha.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {portalFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur-md">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-orange-400/30 bg-orange-400/10 text-orange-400">
                      <Icon size={22} aria-hidden="true" />
                    </div>
                    <h3 className="mt-6 text-xl font-semibold tracking-tight text-white">{feature.title}</h3>
                    <p className="mt-3 text-sm font-medium leading-6 text-white/62">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20" aria-labelledby="workflow-title">
          <div className="grid gap-8 rounded-[2.5rem] border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-black/25 backdrop-blur-md lg:grid-cols-[minmax(0,1fr)_420px] lg:p-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-orange-400">
                <ClipboardList size={14} aria-hidden="true" />
                Autoservicio para organizadores
              </div>
              <h2 id="workflow-title" className="mt-5 text-4xl font-light tracking-[-0.05em] text-white sm:text-5xl">
                Tu competencia puede verse profesional hoy.
              </h2>
              <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-white/65">
                Creás el torneo, cargás la estructura y compartís el portal. La Liguita se encarga de que fixture, resultados y tablas se lean con claridad.
              </p>
              <Link
                href="/tournament/new"
                className={`mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-400 px-6 py-3 text-sm font-black text-zinc-950 transition hover:bg-orange-300 motion-reduce:transition-none ${focusRing}`}
              >
                Crear torneo ahora
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>

            <ol className="grid gap-3">
              {workflowSteps.map((step, index) => (
                <li key={step} className="flex items-center gap-4 rounded-full border border-white/10 bg-black/25 p-3 pr-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-400 text-sm font-black text-zinc-950">
                    {index + 1}
                  </span>
                  <span className="text-sm font-black uppercase tracking-wider text-white">{step}</span>
                  <CheckCircle2 className="ml-auto text-orange-400" size={18} aria-hidden="true" />
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="torneos-activos" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20" aria-labelledby="tournament-list-heading">
          <div className="mb-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white/75">
                <Megaphone size={14} className="text-orange-400" aria-hidden="true" />
                Torneos activos
              </div>
              <h2 id="tournament-list-heading" className="mt-5 text-4xl font-light tracking-[-0.05em] text-white sm:text-5xl">
                Mirá cómo se presentan las competencias.
              </h2>
              <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-white/62">
                El directorio público sigue disponible para encontrar torneos, consultar portales y validar la experiencia que reciben jugadores y público.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wider text-white/75" aria-label="Resumen de deportes disponibles">
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">Básquet: {basketballCount}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">Fútbol: {soccerCount}</span>
                <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1.5 text-orange-400">Pro: {proCount}</span>
              </div>
            </div>
            {!loading && (
              <p className="text-xs font-bold uppercase tracking-wider text-white/45" role="status" aria-live="polite">
                Mostrando {filteredTournaments.length} de {tournaments.length}
              </p>
            )}
          </div>

          <section aria-labelledby="directory-controls-heading" className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur-md sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <h3 id="directory-controls-heading" className="text-xs font-black uppercase tracking-wider text-white/55">
                  Buscar torneo
                </h3>
                <label htmlFor="tournament-search" className="mt-3 block text-sm font-bold text-white">
                  Torneo u organización
                </label>
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" />
                  <input
                    id="tournament-search"
                    type="search"
                    placeholder="Ej: Liga Metropolitana o Club Norte"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`h-12 w-full rounded-full border border-white/10 bg-black/25 pl-11 pr-4 text-base font-semibold text-white placeholder:text-white/35 transition hover:border-white/20 motion-reduce:transition-none ${focusRing}`}
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-white">Deporte</p>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="Filtrar torneos por deporte">
                  <button
                    type="button"
                    onClick={() => setSportFilter("all")}
                    aria-pressed={sportFilter === "all"}
                    className={`${filterButtonBase} ${focusRing} ${
                      sportFilter === "all"
                        ? "border-orange-400 bg-orange-400 text-zinc-950 shadow-sm shadow-orange-400/20"
                        : "border-white/10 bg-black/25 text-white/65 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setSportFilter("basketball")}
                    aria-pressed={sportFilter === "basketball"}
                    className={`${filterButtonBase} ${focusRing} ${
                      sportFilter === "basketball"
                        ? "border-orange-400 bg-orange-400 text-zinc-950 shadow-sm shadow-orange-400/20"
                        : "border-white/10 bg-black/25 text-white/65 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    Básquet
                  </button>
                  <button
                    type="button"
                    onClick={() => setSportFilter("soccer")}
                    aria-pressed={sportFilter === "soccer"}
                    className={`${filterButtonBase} ${focusRing} ${
                      sportFilter === "soccer"
                        ? "border-orange-400 bg-orange-400 text-zinc-950 shadow-sm shadow-orange-400/20"
                        : "border-white/10 bg-black/25 text-white/65 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    Fútbol
                  </button>
                </div>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] px-6 py-16 text-center" role="status" aria-live="polite">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-orange-400 border-t-transparent motion-reduce:animate-none" aria-hidden="true" />
              <p className="mt-4 text-xs font-semibold text-white/55">Cargando torneos disponibles...</p>
            </div>
          ) : filteredTournaments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredTournaments.map((t) => {
                const isBasketball = (t.sport || "basketball") === "basketball";
                const isPro = t.tier === "pro";
                const tournamentName = t.name || "Torneo Oficial";
                const tournamentSlug = t.slug || t.id;
                const publicUrl = `/t/${tournamentSlug}`;

                return (
                  <Link
                    key={t.id}
                    href={publicUrl}
                    className={`group block rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/15 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-orange-400/40 hover:bg-white/[0.09] motion-reduce:transform-none motion-reduce:transition-none ${focusRing}`}
                  >
                    <article className="flex min-h-[278px] h-full flex-col" aria-labelledby={`tournament-${t.id}-title`}>
                      <div className="flex items-start justify-between gap-4">
                        {t.logoUrl ? (
                          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-black/35 p-1.5 shadow-inner">
                            <Image src={t.logoUrl} alt={`${tournamentName} logo`} fill sizes="56px" className="object-contain p-1.5" unoptimized />
                          </div>
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-orange-400/20 bg-orange-400/10 text-lg font-black text-orange-400">
                            {tournamentName.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="flex flex-wrap justify-end gap-2 text-[10px] font-black uppercase tracking-wider">
                          <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-white/70">
                            {isBasketball ? "Básquet" : "Fútbol"}
                          </span>
                          {isPro && (
                            <span className="rounded-full border border-orange-400/30 bg-orange-400/10 px-2.5 py-1 text-orange-400">
                              Pro
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 min-w-0">
                        <p className="truncate text-[11px] font-bold uppercase tracking-wider text-white/40">
                          {t.organizationName || "Competencia oficial"}
                        </p>
                        <h3
                          id={`tournament-${t.id}-title`}
                          className="mt-1 text-xl font-semibold leading-tight tracking-tight text-white transition group-hover:text-orange-300 motion-reduce:transition-none"
                        >
                          {tournamentName}
                        </h3>
                      </div>

                      <dl className="mt-5 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-3">
                          <dt className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                            <Users size={14} aria-hidden="true" />
                            Cupos
                          </dt>
                          <dd className="mt-2 font-black text-white">{t.settings?.maxTeams || 8} equipos</dd>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-3">
                          <dt className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                            <CalendarDays size={14} aria-hidden="true" />
                            Temporada
                          </dt>
                          <dd className="mt-2 font-black text-white">2026</dd>
                        </div>
                      </dl>

                      <div className="mt-auto flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                        <span className="inline-flex items-center gap-2 text-xs font-bold text-white/55">
                          <Trophy size={15} className="text-orange-400" aria-hidden="true" />
                          Portal público
                        </span>
                        <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-orange-400 px-3 py-2 text-xs font-black text-zinc-950 shadow-sm shadow-orange-400/20 transition group-hover:bg-orange-300 motion-reduce:transition-none">
                          Ver torneo
                          <ArrowRight size={15} className="transition group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" aria-hidden="true" />
                        </span>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/[0.04] px-6 py-16 text-center">
              <Trophy className="mx-auto h-12 w-12 text-orange-400" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">
                No se encontraron torneos
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-white/60">
                No hay competencias que coincidan con tu búsqueda y filtros actuales. Probá con otro nombre o volvé a ver todos los deportes.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSportFilter("all");
                }}
                className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-orange-400/30 bg-orange-400/10 px-5 py-2 text-sm font-black text-orange-300 transition hover:bg-orange-400 hover:text-zinc-950 motion-reduce:transition-none ${focusRing}`}
              >
                Ver todos los torneos
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
