"use client";

import { useState } from "react";
import { FEDERATION_EMAIL, PLAN_PRICES } from "@/lib/plans.mjs";

type Locale = "es" | "en";
type Interval = "month" | "season" | "year";

const copy = {
  es: {
    htmlLang: "es",
    skip: "Saltar al contenido",
    nav: { leagues: "Ligas", pricing: "Precios", enter: "Entrar", lang: "English" },
    langHref: "/en/pricing",
    title: "Precios para quien organiza la liga.",
    lede: "El marcador, las plantillas y el calendario siguen en el portal. El plan cambia cuántos equipos, administradores y ligas puedes llevar.",
    intervals: [
      { id: "month" as Interval, label: "Mensual" },
      { id: "season" as Interval, label: "Temporada" },
      { id: "year" as Interval, label: "Anual" },
    ],
    seasonNote: "La temporada de Liga Pro son 4 meses, un solo pago.",
    per: { month: "/mes", season: " / 4 meses", year: "/año" },
    from: "Desde",
    plans: {
      free: {
        name: "Gratis",
        blurb: "Para arrancar una liga del barrio.",
        cta: "Empezar gratis",
        href: "/login",
      },
      pro: {
        name: "Liga Pro",
        blurb: "La liga completa, sin la marca de La Liguita en el portal.",
        cta: "Elegir en el panel",
        href: "/login",
      },
      club: {
        name: "Club",
        blurb: "Varias ligas, patrocinadores y soporte por WhatsApp.",
        cta: "Elegir en el panel",
        href: "/login",
        unavailable: "Club se contrata por mes o por año.",
      },
      federation: {
        name: "Federación",
        blurb: "Para quien administra varias competencias a la vez.",
        cta: "Contactar",
      },
    },
    compareTitle: "Qué incluye cada plan",
    compareIntro: "Los precios de Liga Pro y Club se eligen en el panel de la liga, después de entrar.",
    rows: [
      ["Ligas activas", "1", "1", "Hasta 5", "A medida"],
      ["Equipos", "Hasta 8", "Ilimitados", "Ilimitados", "Ilimitados"],
      ["Administradores", "1", "Varios, con código", "Varios, con código", "Varios"],
      ["Marcador en vivo", "—", "Sí", "Sí", "Sí"],
      ["Estadísticas y líderes", "—", "Sí", "Sí", "Sí"],
      ["Marca La Liguita en el portal", "Sí", "No", "No", "No"],
      ["Logo de la liga", "—", "Sí", "Sí", "Sí"],
      ["Banners de patrocinio", "—", "3", "Ilimitados", "Ilimitados"],
      ["Dominio propio", "—", "—", "Próximamente", "Próximamente"],
      ["Soporte", "—", "—", "WhatsApp", "Dedicado"],
    ],
    faqTitle: "Preguntas",
    faqs: [
      {
        q: "¿La temporada qué cubre?",
        a: "Liga Pro por temporada es un pago único de US$49 y dura 4 meses. No se renueva sola.",
      },
      {
        q: "¿Qué pasa con las ligas que ya existen?",
        a: "Se quedan en Liga Pro. No pierden equipos, administradores ni el portal. El script de migración marca legacyPro.",
      },
      {
        q: "¿Dónde pago?",
        a: "Entras, abres tu liga y en Plan y facturación eliges mensual, temporada o anual. El cobro lo hace Stripe.",
      },
      {
        q: "¿Federación tiene checkout?",
        a: "No. Escribe a romerofront@gmail.com y armamos el plan.",
      },
    ],
    closeTitle: "Arma tu liga",
    closeBody: "Crea el torneo en Gratis y mejora el plan cuando la liga lo pida.",
    closeCta: "Empezar a gestionar",
    pricesCta: "Ver precios",
    foot: "La Liguita",
  },
  en: {
    htmlLang: "en",
    skip: "Skip to content",
    nav: { leagues: "Leagues", pricing: "Pricing", enter: "Sign in", lang: "Español" },
    langHref: "/precios",
    title: "Pricing for the people who run the league.",
    lede: "The scoreboard, rosters, and calendar stay on the portal. The plan changes how many teams, admins, and leagues you can run.",
    intervals: [
      { id: "month" as Interval, label: "Monthly" },
      { id: "season" as Interval, label: "Season" },
      { id: "year" as Interval, label: "Yearly" },
    ],
    seasonNote: "Liga Pro season is 4 months, paid once.",
    per: { month: "/month", season: " / 4 months", year: "/year" },
    from: "From",
    plans: {
      free: {
        name: "Free",
        blurb: "To start a neighborhood league.",
        cta: "Start free",
        href: "/login",
      },
      pro: {
        name: "Liga Pro",
        blurb: "The full league, without La Liguita branding on the portal.",
        cta: "Choose in the dashboard",
        href: "/login",
      },
      club: {
        name: "Club",
        blurb: "Several leagues, sponsors, and WhatsApp support.",
        cta: "Choose in the dashboard",
        href: "/login",
        unavailable: "Club is billed monthly or yearly.",
      },
      federation: {
        name: "Federation",
        blurb: "For someone running many competitions at once.",
        cta: "Contact",
      },
    },
    compareTitle: "What each plan includes",
    compareIntro: "Liga Pro and Club are purchased from your league dashboard after you sign in.",
    rows: [
      ["Active leagues", "1", "1", "Up to 5", "Custom"],
      ["Teams", "Up to 8", "Unlimited", "Unlimited", "Unlimited"],
      ["Admins", "1", "Several, with a code", "Several, with a code", "Several"],
      ["Live scoreboard", "—", "Yes", "Yes", "Yes"],
      ["Stats and leaders", "—", "Yes", "Yes", "Yes"],
      ["La Liguita branding on the portal", "Yes", "No", "No", "No"],
      ["League logo", "—", "Yes", "Yes", "Yes"],
      ["Sponsor banners", "—", "3", "Unlimited", "Unlimited"],
      ["Custom domain", "—", "—", "Coming soon", "Coming soon"],
      ["Support", "—", "—", "WhatsApp", "Dedicated"],
    ],
    faqTitle: "Questions",
    faqs: [
      {
        q: "What does the season cover?",
        a: "Liga Pro season is a one-time US$49 payment and lasts 4 months. It does not renew.",
      },
      {
        q: "What about leagues that already exist?",
        a: "They stay on Liga Pro. They do not lose teams, admins, or the portal. The migration script sets legacyPro.",
      },
      {
        q: "Where do I pay?",
        a: "Sign in, open your league, and choose monthly, season, or yearly under Plan and billing. Stripe charges the card.",
      },
      {
        q: "Does Federation have checkout?",
        a: "No. Email romerofront@gmail.com and we will put the plan together.",
      },
    ],
    closeTitle: "Start your league",
    closeBody: "Create the tournament on Free and upgrade when the league needs it.",
    closeCta: "Start managing",
    pricesCta: "See pricing",
    foot: "La Liguita",
  },
} as const;

function priceLine(plan: "free" | "pro" | "club" | "federation", interval: Interval, locale: Locale) {
  const text = copy[locale];
  if (plan === "free") return { amount: "US$0", suffix: "" };
  if (plan === "federation") return { amount: `${text.from} US$${PLAN_PRICES.federation.month}`, suffix: text.per.month };
  if (plan === "club" && interval === "season") return null;
  const amount = PLAN_PRICES[plan][interval];
  if (amount == null) return null;
  return { amount: `US$${amount}`, suffix: text.per[interval] };
}

export function PricingPage({ locale }: { locale: Locale }) {
  const [interval, setInterval] = useState<Interval>("month");
  const text = copy[locale];
  const mailto = `mailto:${FEDERATION_EMAIL}?subject=${encodeURIComponent("La Liguita Federación")}`;

  const cards = [
    { key: "free" as const, ...text.plans.free },
    { key: "pro" as const, ...text.plans.pro },
    { key: "club" as const, ...text.plans.club },
    { key: "federation" as const, ...text.plans.federation },
  ];

  return (
    <div className="ll-home" lang={text.htmlLang}>
      <a className="ll-skip" href="#contenido">
        {text.skip}
      </a>
      <div className="ll-wrap">
        <header className="ll-bar">
          <a className="ll-brand" href="/">
            <picture>
              <source type="image/avif" srcSet="/logo-64.avif 1x, /logo-128.avif 2x" />
              <source type="image/webp" srcSet="/logo-64.webp 1x, /logo-128.webp 2x" />
              <img src="/logo-64.png" width={32} height={32} alt="" />
            </picture>
            <strong>La Liguita</strong>
          </a>
          <nav className="ll-nav" aria-label={locale === "es" ? "Principal" : "Main"}>
            <a href="/#ligas">{text.nav.leagues}</a>
            <a href={locale === "es" ? "/precios" : "/en/pricing"} aria-current="page">
              {text.nav.pricing}
            </a>
            <a href={text.langHref}>{text.nav.lang}</a>
            <a href="/login">{text.nav.enter}</a>
          </nav>
        </header>

        <main id="contenido">
          <section className="ll-hero ll-pricing-hero">
            <div>
              <h1>{text.title}</h1>
              <div className="ll-rule" aria-hidden="true" />
              <p className="ll-lede">{text.lede}</p>
              <div className="ll-toggle" role="group" aria-label={locale === "es" ? "Periodo de cobro" : "Billing period"}>
                {text.intervals.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={interval === item.id}
                    className={interval === item.id ? "is-on" : undefined}
                    onClick={() => setInterval(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {interval === "season" && <p className="ll-season-note">{text.seasonNote}</p>}
            </div>
          </section>

          <section className="ll-plan-grid" aria-label={text.compareTitle}>
            {cards.map((card) => {
              const price = priceLine(card.key, interval, locale);
              const href = card.key === "federation" ? mailto : card.href;
              return (
                <article key={card.key} className={`ll-plan${card.key === "pro" ? " is-featured" : ""}`}>
                  <h2>{card.name}</h2>
                  <p className="ll-plan-price">
                    {price ? (
                      <>
                        <strong>{price.amount}</strong>
                        {price.suffix && <span>{price.suffix}</span>}
                      </>
                    ) : (
                      <strong className="ll-plan-muted">{"unavailable" in card ? card.unavailable : "—"}</strong>
                    )}
                  </p>
                  <p className="ll-plan-blurb">{card.blurb}</p>
                  <a className={card.key === "federation" ? "ll-btn ll-btn-ghost" : "ll-btn"} href={href}>
                    {card.cta}
                  </a>
                </article>
              );
            })}
          </section>

          <section className="ll-section" aria-labelledby="comparacion-titulo">
            <h2 id="comparacion-titulo">{text.compareTitle}</h2>
            <p className="ll-intro">{text.compareIntro}</p>
            <div className="ll-table-wrap">
              <table className="ll-table">
                <thead>
                  <tr>
                    <th scope="col"></th>
                    <th scope="col">{text.plans.free.name}</th>
                    <th scope="col">{text.plans.pro.name}</th>
                    <th scope="col">{text.plans.club.name}</th>
                    <th scope="col">{text.plans.federation.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {text.rows.map((row) => (
                    <tr key={row[0]}>
                      <th scope="row">{row[0]}</th>
                      <td>{row[1]}</td>
                      <td>{row[2]}</td>
                      <td>{row[3]}</td>
                      <td>{row[4]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="ll-section" aria-labelledby="faq-titulo">
            <h2 id="faq-titulo">{text.faqTitle}</h2>
            <div className="ll-faq">
              {text.faqs.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="ll-section ll-close" aria-labelledby="empezar-titulo">
            <h2 id="empezar-titulo">{text.closeTitle}</h2>
            <p>{text.closeBody}</p>
            <div className="ll-actions">
              <a className="ll-btn" href="/login">
                {text.closeCta}
              </a>
            </div>
          </section>
        </main>

        <footer className="ll-foot">{text.foot}</footer>
      </div>
    </div>
  );
}
