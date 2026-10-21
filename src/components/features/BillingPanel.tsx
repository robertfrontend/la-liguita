"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CreditCard, Check, Loader2, ExternalLink } from "lucide-react";
import { Tournament, TournamentSponsor } from "@/types/tournament";
import { updateTournamentInDb } from "@/lib/db";
import { openBillingPortal, startCheckout } from "@/lib/billing-client";
import {
  FEDERATION_EMAIL,
  PLAN_PRICES,
  effectivePlan,
  getPlanLimits,
} from "@/lib/plans.mjs";
import { useLanguage } from "@/components/providers/LanguageProvider";

function money(amount: number | null) {
  if (amount == null) return null;
  return `US$${amount}`;
}

function statusLabel(status: string | undefined, language: "es" | "en") {
  const labels = language === "en"
    ? {
        none: "No subscription",
        active: "Active",
        trialing: "Trial",
        past_due: "Payment failed",
        canceled: "Canceled",
        incomplete: "Incomplete",
        unpaid: "Unpaid",
        paused: "Paused",
      }
    : {
        none: "Sin suscripción",
        active: "Activo",
        trialing: "Prueba",
        past_due: "Pago fallido",
        canceled: "Cancelado",
        incomplete: "Incompleto",
        unpaid: "Impago",
        paused: "Pausado",
      };
  return labels[status as keyof typeof labels] || status || labels.none;
}

export function BillingPanel({ tournament }: { tournament: Tournament }) {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const checkout = searchParams.get("checkout");
  const limits = getPlanLimits(tournament);
  const plan = effectivePlan(tournament);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [sponsors, setSponsors] = useState<TournamentSponsor[]>(tournament.sponsors || []);

  const planName = t(`billing.${plan === "pro" ? "pro" : plan === "club" ? "club" : plan === "federation" ? "federation" : "free"}`);
  const period = tournament.billing?.currentPeriodEnd
    ? new Date(tournament.billing.currentPeriodEnd).toLocaleDateString(language === "en" ? "en-US" : "es")
    : null;
  const cap = Number.isFinite(limits.sponsorSlots) ? limits.sponsorSlots : 0;

  const rows = useMemo(() => {
    const next = sponsors.slice(0, cap);
    return next.length > 0 ? next : cap > 0 ? [{ name: "" }] : [];
  }, [sponsors, cap]);

  async function buy(target: "pro" | "club", interval: "month" | "season" | "year") {
    setBusy(`${target}-${interval}`);
    setError(null);
    try {
      const url = await startCheckout(tournament.id, target, interval);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir el pago.");
      setBusy(null);
    }
  }

  async function manage() {
    setBusy("portal");
    setError(null);
    try {
      const url = await openBillingPortal(tournament.id);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir el portal.");
      setBusy(null);
    }
  }

  async function saveSponsors(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const clean = rows
        .map((row) => ({
          name: row.name.trim(),
          href: row.href?.trim() || undefined,
          imageUrl: row.imageUrl?.trim() || undefined,
        }))
        .filter((row) => row.name);
      await updateTournamentInDb(tournament.id, { sponsors: clean });
      setSponsors(clean);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar los patrocinadores.");
    }
  }

  function updateRow(index: number, patch: Partial<TournamentSponsor>) {
    setSponsors((current) => {
      const base = (current.length > 0 ? current : rows).slice(0, cap);
      const next = base.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row));
      return next;
    });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80">
        <div className="flex items-center gap-2">
          <CreditCard className="text-emerald-400" size={22} />
          <h1 className="text-2xl font-black text-white tracking-tight">{t("billing.title")}</h1>
        </div>
        <p className="text-xs text-zinc-400 mt-1">{t("billing.subtitle")}</p>
      </div>

      {checkout === "success" && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
          {language === "en"
            ? "Payment received. The plan updates when Stripe confirms it."
            : "Pago recibido. El plan se actualiza cuando Stripe lo confirma."}
        </p>
      )}
      {checkout === "cancel" && (
        <p className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs text-zinc-300">
          {language === "en" ? "Checkout canceled. Your plan did not change." : "Pago cancelado. El plan no cambió."}
        </p>
      )}

      <section className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t("billing.current")}</p>
            <p className="text-xl font-black text-white mt-1">{planName}</p>
            <p className="text-xs text-zinc-400 mt-1">
              {t("billing.status")}: {statusLabel(tournament.billing?.status, language)}
              {period ? ` · ${t("billing.renews")}: ${period}` : ""}
            </p>
          </div>
          {tournament.legacyPro && (
            <p className="text-xs text-emerald-200/90 max-w-sm">
              {language === "en"
                ? "This league stays on Liga Pro because it existed before billing."
                : "Esta liga sigue en Liga Pro porque existía antes de la facturación."}
            </p>
          )}
        </div>
        <p className="text-xs text-zinc-400">
          {limits.hideBranding ? t("billing.portalClean") : t("billing.portalBranding")}
        </p>
        <div className="flex flex-wrap gap-2">
          {tournament.billing?.stripeCustomerId && (
            <button
              type="button"
              onClick={manage}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold border border-zinc-700"
            >
              {busy === "portal" ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
              {t("billing.manage")}
            </button>
          )}
          <Link href="/precios" className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white">
            {language === "en" ? "Compare plans" : "Comparar planes"}
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <article className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80 space-y-3">
          <h2 className="text-sm font-bold text-white">{t("billing.pro")}</h2>
          <p className="text-xs text-zinc-400">
            {language === "en"
              ? "Unlimited teams, several admins, live scoreboard, stats, and 3 sponsor banners."
              : "Equipos ilimitados, varios administradores, marcador en vivo, estadísticas y 3 banners."}
          </p>
          <div className="flex flex-wrap gap-2">
            <PayButton busy={busy} id="pro-month" label={`${t("billing.monthly")} ${money(PLAN_PRICES.pro.month)}`} onClick={() => buy("pro", "month")} />
            <PayButton busy={busy} id="pro-season" label={`${t("billing.season")} ${money(PLAN_PRICES.pro.season)}`} onClick={() => buy("pro", "season")} />
            <PayButton busy={busy} id="pro-year" label={`${t("billing.yearly")} ${money(PLAN_PRICES.pro.year)}`} onClick={() => buy("pro", "year")} />
          </div>
        </article>
        <article className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80 space-y-3">
          <h2 className="text-sm font-bold text-white">{t("billing.club")}</h2>
          <p className="text-xs text-zinc-400">
            {language === "en"
              ? "Up to 5 leagues, unlimited sponsors, and WhatsApp support. Custom domain is coming soon."
              : "Hasta 5 ligas, patrocinadores ilimitados y soporte por WhatsApp. Dominio propio, próximamente."}
          </p>
          <div className="flex flex-wrap gap-2">
            <PayButton busy={busy} id="club-month" label={`${t("billing.monthly")} ${money(PLAN_PRICES.club.month)}`} onClick={() => buy("club", "month")} />
            <PayButton busy={busy} id="club-year" label={`${t("billing.yearly")} ${money(PLAN_PRICES.club.year)}`} onClick={() => buy("club", "year")} />
          </div>
          {limits.customDomain && <p className="text-xs text-zinc-500">{t("billing.customDomain")}</p>}
          {limits.whatsappSupport && <p className="text-xs text-zinc-500">{t("billing.whatsapp")}</p>}
        </article>
      </section>

      <section className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">{t("billing.federation")}</h2>
          <p className="text-xs text-zinc-400 mt-1">
            {language === "en" ? "From US$79/month." : "Desde US$79/mes."}
          </p>
        </div>
        <a
          href={`mailto:${FEDERATION_EMAIL}?subject=${encodeURIComponent("La Liguita Federación")}`}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white text-zinc-950 text-xs font-bold"
        >
          {t("billing.contact")}
        </a>
      </section>

      <section className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white">{t("billing.sponsors")}</h2>
          <p className="text-xs text-zinc-400 mt-1">{t("billing.sponsorsHint")}</p>
        </div>
        {cap === 0 ? (
          <p className="text-xs text-zinc-400">{language === "en" ? "Liga Pro includes 3 banners." : "Liga Pro incluye 3 banners."}</p>
        ) : (
          <form onSubmit={saveSponsors} className="space-y-3">
            {rows.map((row, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  value={row.name}
                  onChange={(event) => updateRow(index, { name: event.target.value })}
                  placeholder={language === "en" ? "Sponsor name" : "Nombre del patrocinador"}
                  className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs"
                />
                <input
                  value={row.href || ""}
                  onChange={(event) => updateRow(index, { href: event.target.value })}
                  placeholder="https://"
                  className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs"
                />
                <input
                  value={row.imageUrl || ""}
                  onChange={(event) => updateRow(index, { imageUrl: event.target.value })}
                  placeholder={language === "en" ? "Image URL" : "URL de la imagen"}
                  className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs"
                />
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {rows.length < cap && (
                <button
                  type="button"
                  onClick={() => setSponsors([...(sponsors.length ? sponsors : rows), { name: "" }])}
                  className="px-3 py-2 rounded-xl border border-zinc-700 text-xs font-bold text-zinc-200"
                >
                  {language === "en" ? "Add banner" : "Agregar banner"}
                </button>
              )}
              <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">
                {saved ? <Check size={14} /> : null}
                {t("billing.saveSponsors")}
              </button>
            </div>
          </form>
        )}
      </section>

      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}

function PayButton({
  busy,
  id,
  label,
  onClick,
}: {
  busy: string | null;
  id: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy !== null}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold"
    >
      {busy === id ? <Loader2 size={14} className="animate-spin" /> : null}
      {label}
    </button>
  );
}
