import { addMonths, allowanceAfterPlan } from "./plans.mjs";

export const SEASON_MONTHS = 4;

const STATUSES = new Set([
  "none",
  "active",
  "trialing",
  "past_due",
  "canceled",
  "incomplete",
  "unpaid",
  "paused",
]);

export function priceCatalog(env = process.env) {
  return {
    "pro:month": env.STRIPE_PRICE_PRO_MONTHLY || "",
    "pro:season": env.STRIPE_PRICE_PRO_SEASON || "",
    "pro:year": env.STRIPE_PRICE_PRO_YEARLY || "",
    "club:month": env.STRIPE_PRICE_CLUB_MONTHLY || "",
    "club:year": env.STRIPE_PRICE_CLUB_YEARLY || "",
  };
}

export function lookupPriceId(plan, interval, env = process.env) {
  const id = priceCatalog(env)[`${plan}:${interval}`] || "";
  return id || null;
}

export function planFromPriceId(priceId, env = process.env) {
  if (!priceId) return null;
  for (const [key, id] of Object.entries(priceCatalog(env))) {
    if (id && id === priceId) {
      const [plan, interval] = key.split(":");
      return { plan, interval };
    }
  }
  return null;
}

export function appBaseUrl(env = process.env) {
  const raw = env.NEXT_PUBLIC_APP_URL || env.APP_URL || "http://localhost:3000";
  return String(raw).replace(/\/$/, "");
}

export function normalizeStatus(status) {
  if (status === "incomplete_expired") return "incomplete";
  if (STATUSES.has(status)) return status;
  return "incomplete";
}

export function assertCheckoutSelection(plan, interval) {
  if (plan !== "pro" && plan !== "club") {
    const error = new Error("Ese plan no se contrata desde el panel.");
    error.status = 400;
    throw error;
  }
  if (plan === "pro" && !["month", "season", "year"].includes(interval)) {
    const error = new Error("Elige mensual, temporada o anual para Liga Pro.");
    error.status = 400;
    throw error;
  }
  if (plan === "club" && !["month", "year"].includes(interval)) {
    const error = new Error("Club se contrata por mes o por año.");
    error.status = 400;
    throw error;
  }
}

export function checkoutMode(interval) {
  return interval === "season" ? "payment" : "subscription";
}

function customerId(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.id === "string") return value.id;
  return null;
}

export function subscriptionPeriodEndMs(subscription) {
  const seconds =
    subscription?.current_period_end ||
    subscription?.items?.data?.[0]?.current_period_end ||
    null;
  if (!seconds) return null;
  const ms = Number(seconds) * 1000;
  return Number.isFinite(ms) ? ms : null;
}

function billingShell(partial) {
  return {
    plan: partial.plan,
    status: normalizeStatus(partial.status),
    interval: partial.interval || null,
    currentPeriodEnd: partial.currentPeriodEnd || null,
    currentPeriodEndMs: partial.currentPeriodEndMs ?? null,
    stripeCustomerId: partial.stripeCustomerId || null,
    stripeSubscriptionId: partial.stripeSubscriptionId || null,
  };
}

export function billingFromCheckoutSession(session, subscription, now = new Date()) {
  const metadata = session?.metadata || {};
  const interval = metadata.interval || (session?.mode === "payment" ? "season" : null);
  const customer = customerId(session?.customer) || customerId(subscription?.customer);
  if (interval === "season" || session?.mode === "payment") {
    const end = addMonths(now, SEASON_MONTHS);
    return billingShell({
      plan: "pro",
      status: "active",
      interval: "season",
      currentPeriodEnd: end.toISOString(),
      currentPeriodEndMs: end.getTime(),
      stripeCustomerId: customer,
      stripeSubscriptionId: null,
    });
  }
  const plan = metadata.plan === "club" ? "club" : "pro";
  const endMs = subscriptionPeriodEndMs(subscription);
  return billingShell({
    plan,
    status: subscription?.status || "active",
    interval: interval === "year" ? "year" : "month",
    currentPeriodEnd: endMs ? new Date(endMs).toISOString() : null,
    currentPeriodEndMs: endMs,
    stripeCustomerId: customer,
    stripeSubscriptionId:
      (typeof session?.subscription === "string" ? session.subscription : null) ||
      subscription?.id ||
      null,
  });
}

export function billingFromSubscription(subscription, env = process.env) {
  const priceId = subscription?.items?.data?.[0]?.price?.id || subscription?.items?.data?.[0]?.price || null;
  const mapped = planFromPriceId(typeof priceId === "string" ? priceId : priceId?.id, env);
  const metadata = subscription?.metadata || {};
  const plan = mapped?.plan || (metadata.plan === "club" ? "club" : metadata.plan === "pro" ? "pro" : null);
  const interval = mapped?.interval || (metadata.interval === "year" ? "year" : metadata.interval === "month" ? "month" : null);
  if (!plan || !interval || interval === "season") return null;
  const endMs = subscriptionPeriodEndMs(subscription);
  return billingShell({
    plan,
    status: subscription?.status || "active",
    interval,
    currentPeriodEnd: endMs ? new Date(endMs).toISOString() : null,
    currentPeriodEndMs: endMs,
    stripeCustomerId: customerId(subscription?.customer),
    stripeSubscriptionId: subscription?.id || null,
  });
}

export function billingFromSubscriptionDeleted(subscription, env = process.env) {
  const current = billingFromSubscription({ ...subscription, status: "active" }, env);
  if (!current) {
    const metadata = subscription?.metadata || {};
    const plan = metadata.plan === "club" ? "club" : "pro";
    const endMs = subscriptionPeriodEndMs(subscription);
    return billingShell({
      plan,
      status: "canceled",
      interval: metadata.interval === "year" ? "year" : "month",
      currentPeriodEnd: endMs ? new Date(endMs).toISOString() : null,
      currentPeriodEndMs: endMs,
      stripeCustomerId: customerId(subscription?.customer),
      stripeSubscriptionId: subscription?.id || null,
    });
  }
  return billingShell({ ...current, status: "canceled" });
}

export function billingFromInvoiceFailed(existing, invoice) {
  const base = existing && typeof existing === "object" ? existing : {};
  const subscription = typeof invoice?.subscription === "string" ? invoice.subscription : base.stripeSubscriptionId || null;
  return billingShell({
    plan: base.plan || "pro",
    status: "past_due",
    interval: base.interval || null,
    currentPeriodEnd: base.currentPeriodEnd || null,
    currentPeriodEndMs: base.currentPeriodEndMs ?? null,
    stripeCustomerId: customerId(invoice?.customer) || base.stripeCustomerId || null,
    stripeSubscriptionId: subscription,
  });
}

export function nextLeagueAllowance(plan, status, userData) {
  const data = userData && typeof userData === "object" ? userData : {};
  return allowanceAfterPlan(plan, status, data.leagueAllowance, data.ownedTournamentCount);
}
