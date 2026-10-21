/**
 * Commercial plans for La Liguita.
 * `tier` on a tournament (amateur / pro) is the sports box score, not this plan.
 * Existing leagues stay on Liga Pro until LEGACY_PRO_UNTIL, or permanently when
 * `legacyPro` is true (set by scripts/migrate-tournament-billing.mjs).
 */

export const FEDERATION_EMAIL = "romerofront@gmail.com";

/** Rules reject more than this many sponsor rows. Marketing copy still says unlimited. */
export const SPONSOR_RULE_CAP = 100;

export const FREE_TEAM_CAP = 8;
export const FREE_ADMIN_EMAIL_CAP = 1;

const DEFAULT_LEGACY_UNTIL = "2027-01-01T00:00:00.000Z";

export const PLAN_PRICES = {
  free: { month: 0, season: 0, year: 0 },
  pro: { month: 12, season: 49, year: 99 },
  club: { month: 29, season: null, year: 249 },
  federation: { month: 79, season: null, year: null },
};

const LIMITS = {
  free: {
    plan: "free",
    maxActiveLeagues: 1,
    maxTeams: FREE_TEAM_CAP,
    maxAdminEmails: FREE_ADMIN_EMAIL_CAP,
    sponsorSlots: 0,
    liveScoreboard: false,
    statsLeaders: false,
    multipleAdmins: false,
    hideBranding: false,
    showLeagueLogo: false,
    customDomain: false,
    whatsappSupport: false,
  },
  pro: {
    plan: "pro",
    maxActiveLeagues: 1,
    maxTeams: Number.POSITIVE_INFINITY,
    maxAdminEmails: Number.POSITIVE_INFINITY,
    sponsorSlots: 3,
    liveScoreboard: true,
    statsLeaders: true,
    multipleAdmins: true,
    hideBranding: true,
    showLeagueLogo: true,
    customDomain: false,
    whatsappSupport: false,
  },
  club: {
    plan: "club",
    maxActiveLeagues: 5,
    maxTeams: Number.POSITIVE_INFINITY,
    maxAdminEmails: Number.POSITIVE_INFINITY,
    sponsorSlots: SPONSOR_RULE_CAP,
    liveScoreboard: true,
    statsLeaders: true,
    multipleAdmins: true,
    hideBranding: true,
    showLeagueLogo: true,
    customDomain: true,
    whatsappSupport: true,
  },
  federation: {
    plan: "federation",
    maxActiveLeagues: Number.POSITIVE_INFINITY,
    maxTeams: Number.POSITIVE_INFINITY,
    maxAdminEmails: Number.POSITIVE_INFINITY,
    sponsorSlots: SPONSOR_RULE_CAP,
    liveScoreboard: true,
    statsLeaders: true,
    multipleAdmins: true,
    hideBranding: true,
    showLeagueLogo: true,
    customDomain: true,
    whatsappSupport: true,
  },
};

const MESSAGES = {
  es: {
    PLAN_LEAGUE_LIMIT:
      "Tu plan permite una sola liga activa. Club incluye hasta 5 ligas.",
    PLAN_TEAM_LIMIT:
      "El plan Gratis permite hasta 8 equipos. Mejora a Liga Pro para equipos ilimitados.",
    PLAN_ADMIN_LIMIT:
      "El plan Gratis incluye 1 administrador. Liga Pro suma organizadores con el código de acceso.",
  },
  en: {
    PLAN_LEAGUE_LIMIT: "Your plan includes one active league. Club includes up to 5.",
    PLAN_TEAM_LIMIT: "The free plan allows up to 8 teams. Upgrade to Liga Pro for unlimited teams.",
    PLAN_ADMIN_LIMIT:
      "The free plan includes 1 admin. Liga Pro adds organizers with the access code.",
  },
};

export function legacyProUntil(env = process.env) {
  const raw = env.LEGACY_PRO_UNTIL || env.NEXT_PUBLIC_LEGACY_PRO_UNTIL || DEFAULT_LEGACY_UNTIL;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return new Date(DEFAULT_LEGACY_UNTIL);
  return parsed;
}

export function addMonths(date, months) {
  const next = new Date(date.getTime());
  const day = next.getUTCDate();
  next.setUTCMonth(next.getUTCMonth() + months);
  if (next.getUTCDate() < day) next.setUTCDate(0);
  return next;
}

export function initialFreeBilling() {
  return {
    plan: "free",
    status: "none",
    interval: null,
    currentPeriodEnd: null,
    currentPeriodEndMs: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  };
}

function asRecord(value) {
  return value && typeof value === "object" ? value : {};
}

function periodStillOpen(billing, now) {
  const ms = billing.currentPeriodEndMs;
  if (typeof ms === "number" && Number.isFinite(ms)) return ms > now.getTime();
  if (typeof billing.currentPeriodEnd === "string" && billing.currentPeriodEnd) {
    const parsed = new Date(billing.currentPeriodEnd);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime() > now.getTime();
  }
  return false;
}

function activePaidPlan(billing, now) {
  if (!billing || typeof billing.plan !== "string") return null;
  if (billing.plan !== "pro" && billing.plan !== "club" && billing.plan !== "federation") return null;
  const status = billing.status || "none";
  const open = periodStillOpen(billing, now);
  const entitled =
    status === "active" ||
    status === "trialing" ||
    status === "past_due" ||
    (status === "canceled" && open);
  if (!entitled) return null;
  if (billing.interval === "season" && !open) return null;
  return billing.plan;
}

export function effectivePlan(tournament, now = new Date(), env = process.env) {
  const data = asRecord(tournament);
  const paid = activePaidPlan(asRecord(data.billing), now);
  if (paid) return paid;
  if (data.legacyPro === true) return "pro";
  const billing = data.billing;
  if (!billing || !billing.plan) {
    if (now.getTime() <= legacyProUntil(env).getTime()) return "pro";
  }
  return "free";
}

export function getPlanLimits(tournament, now = new Date(), env = process.env) {
  const plan = effectivePlan(tournament, now, env);
  return { ...LIMITS[plan] };
}

export function canAddAdmin(tournament, currentEmailCount, now = new Date()) {
  const limits = getPlanLimits(tournament, now);
  if (!Number.isFinite(limits.maxAdminEmails)) return true;
  return currentEmailCount < limits.maxAdminEmails;
}

export function canAddTeam(tournament, currentTeamCount, now = new Date()) {
  const limits = getPlanLimits(tournament, now);
  if (!Number.isFinite(limits.maxTeams)) return true;
  return currentTeamCount < limits.maxTeams;
}

export function leagueAllowanceFor(userData) {
  const value = asRecord(userData).leagueAllowance;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  return 1;
}

export function canOwnAnotherLeague(ownedCount, allowance) {
  const count = Number(ownedCount || 0);
  const cap = typeof allowance === "number" && allowance > 0 ? allowance : 1;
  return count < cap;
}

export function planLimitMessage(code, language = "es") {
  const table = MESSAGES[language] || MESSAGES.es;
  return table[code] || MESSAGES.es[code] || code;
}

export function normalizeSponsors(value, cap) {
  const list = Array.isArray(value) ? value : [];
  const next = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const name = String(entry.name || "").trim().slice(0, 80);
    if (!name) continue;
    const href = String(entry.href || "").trim().slice(0, 300);
    const imageUrl = String(entry.imageUrl || "").trim().slice(0, 500);
    const sponsor = { name };
    if (href) sponsor.href = href;
    if (imageUrl) sponsor.imageUrl = imageUrl;
    next.push(sponsor);
    if (next.length >= cap) break;
  }
  return next;
}

export function allowanceAfterPlan(plan, status, currentAllowance, ownedCount) {
  const current = typeof currentAllowance === "number" && currentAllowance > 0 ? currentAllowance : 1;
  const owned = Number(ownedCount || 0);
  const entitled = status === "active" || status === "trialing" || status === "past_due";
  if (!entitled) return Math.max(current, owned, 1);
  if (plan === "club") return Math.max(current, owned, 5);
  if (plan === "federation") return Math.max(current, owned, 100);
  return Math.max(current, owned, 1);
}
