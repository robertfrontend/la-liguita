import assert from "node:assert/strict";
import { test } from "node:test";
import Stripe from "stripe";
import {
  addMonths,
  canAddAdmin,
  canAddTeam,
  canOwnAnotherLeague,
  effectivePlan,
  getPlanLimits,
  initialFreeBilling,
  planLimitMessage,
} from "../src/lib/plans.mjs";
import {
  SEASON_MONTHS,
  billingFromCheckoutSession,
  billingFromInvoiceFailed,
  billingFromSubscription,
  billingFromSubscriptionDeleted,
  checkoutMode,
  lookupPriceId,
  planFromPriceId,
} from "../src/lib/billing-state.mjs";

const env = {
  STRIPE_PRICE_PRO_MONTHLY: "price_pro_m",
  STRIPE_PRICE_PRO_SEASON: "price_pro_s",
  STRIPE_PRICE_PRO_YEARLY: "price_pro_y",
  STRIPE_PRICE_CLUB_MONTHLY: "price_club_m",
  STRIPE_PRICE_CLUB_YEARLY: "price_club_y",
  LEGACY_PRO_UNTIL: "2026-01-01T00:00:00.000Z",
};

test("free limits and grandfathering", () => {
  const free = getPlanLimits({ billing: initialFreeBilling(), legacyPro: false }, new Date("2026-06-01T00:00:00.000Z"), env);
  assert.equal(free.plan, "free");
  assert.equal(free.maxTeams, 8);
  assert.equal(free.maxAdminEmails, 1);
  assert.equal(free.maxActiveLeagues, 1);
  assert.equal(free.hideBranding, false);
  assert.equal(free.sponsorSlots, 0);
  assert.equal(canAddTeam({ billing: initialFreeBilling(), legacyPro: false }, 8), false);
  assert.equal(canAddTeam({ billing: initialFreeBilling(), legacyPro: false }, 7), true);
  assert.equal(canAddAdmin({ billing: initialFreeBilling(), legacyPro: false }, 1), false);
  assert.equal(canOwnAnotherLeague(1, 1), false);
  assert.equal(canOwnAnotherLeague(4, 5), true);

  const legacy = getPlanLimits({ legacyPro: true, billing: initialFreeBilling() }, new Date("2028-01-01T00:00:00.000Z"), env);
  assert.equal(legacy.plan, "pro");
  assert.equal(legacy.maxTeams, Number.POSITIVE_INFINITY);
  assert.equal(legacy.hideBranding, true);
  assert.equal(legacy.sponsorSlots, 3);

  const beforeCutoff = effectivePlan({}, new Date("2025-12-01T00:00:00.000Z"), env);
  const afterCutoff = effectivePlan({}, new Date("2026-02-01T00:00:00.000Z"), env);
  assert.equal(beforeCutoff, "pro");
  assert.equal(afterCutoff, "free");
});

test("paid access follows status and season end", () => {
  const now = new Date("2026-06-15T00:00:00.000Z");
  const seasonEnd = addMonths(now, SEASON_MONTHS);
  assert.equal(seasonEnd.toISOString().slice(0, 10), "2026-10-15");

  const season = {
    billing: {
      plan: "pro",
      status: "active",
      interval: "season",
      currentPeriodEnd: seasonEnd.toISOString(),
      currentPeriodEndMs: seasonEnd.getTime(),
    },
  };
  assert.equal(effectivePlan(season, now, env), "pro");
  assert.equal(effectivePlan(season, new Date("2026-10-16T00:00:00.000Z"), env), "free");

  const pastDue = {
    billing: {
      plan: "club",
      status: "past_due",
      interval: "month",
      currentPeriodEndMs: now.getTime() + 86400000,
    },
  };
  assert.equal(getPlanLimits(pastDue, now, env).maxActiveLeagues, 5);
  assert.equal(getPlanLimits(pastDue, now, env).whatsappSupport, true);

  const canceledOpen = {
    legacyPro: true,
    billing: {
      plan: "club",
      status: "canceled",
      interval: "year",
      currentPeriodEndMs: now.getTime() + 1000,
    },
  };
  assert.equal(effectivePlan(canceledOpen, now, env), "club");

  const canceledDone = {
    legacyPro: true,
    billing: {
      plan: "club",
      status: "canceled",
      interval: "year",
      currentPeriodEndMs: now.getTime() - 1000,
    },
  };
  assert.equal(effectivePlan(canceledDone, now, env), "pro");
});

test("checkout and subscription billing patches", () => {
  assert.equal(lookupPriceId("pro", "season", env), "price_pro_s");
  assert.equal(lookupPriceId("club", "season", env), null);
  assert.deepEqual(planFromPriceId("price_club_y", env), { plan: "club", interval: "year" });
  assert.equal(checkoutMode("season"), "payment");
  assert.equal(checkoutMode("year"), "subscription");

  const now = new Date("2026-01-10T00:00:00.000Z");
  const season = billingFromCheckoutSession(
    {
      mode: "payment",
      customer: "cus_1",
      metadata: { plan: "pro", interval: "season", tournamentId: "t1", uid: "u1" },
    },
    null,
    now
  );
  assert.equal(season.plan, "pro");
  assert.equal(season.status, "active");
  assert.equal(season.interval, "season");
  assert.equal(season.stripeSubscriptionId, null);
  assert.equal(season.currentPeriodEndMs, addMonths(now, 4).getTime());

  const yearly = billingFromSubscription(
    {
      id: "sub_1",
      status: "active",
      customer: "cus_1",
      current_period_end: 1800000000,
      metadata: { tournamentId: "t1", plan: "pro", interval: "year" },
      items: { data: [{ price: { id: "price_pro_y" } }] },
    },
    env
  );
  assert.equal(yearly.plan, "pro");
  assert.equal(yearly.interval, "year");
  assert.equal(yearly.stripeSubscriptionId, "sub_1");
  assert.equal(yearly.currentPeriodEndMs, 1800000000 * 1000);

  const removed = billingFromSubscriptionDeleted(
    {
      id: "sub_1",
      status: "canceled",
      customer: "cus_1",
      current_period_end: 1800000000,
      metadata: { plan: "club", interval: "month" },
      items: { data: [{ price: { id: "price_club_m" } }] },
    },
    env
  );
  assert.equal(removed.status, "canceled");
  assert.equal(removed.plan, "club");

  const failed = billingFromInvoiceFailed(
    { plan: "pro", status: "active", interval: "month", stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_1" },
    { customer: "cus_1", subscription: "sub_1" }
  );
  assert.equal(failed.status, "past_due");
  assert.equal(failed.plan, "pro");
  assert.match(planLimitMessage("PLAN_TEAM_LIMIT", "es"), /8 equipos/);
  assert.match(planLimitMessage("PLAN_TEAM_LIMIT", "en"), /8 teams/);
});

test("stripe webhook signatures reject a bad header", () => {
  const stripe = new Stripe("sk_test_123");
  const payload = JSON.stringify({ id: "evt_test", object: "event", type: "invoice.payment_failed", data: { object: {} } });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_test" });
  const event = stripe.webhooks.constructEvent(payload, header, "whsec_test");
  assert.equal(event.type, "invoice.payment_failed");
  assert.throws(() => stripe.webhooks.constructEvent(payload, header, "whsec_other"));
});
