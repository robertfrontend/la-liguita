/**
 * Grandfather existing tournaments onto Liga Pro.
 *
 * Sets legacyPro: true and billing.plan = "pro" when the tournament has no Stripe
 * customer yet, and records how many leagues each owner already has so the new
 * cap does not erase them.
 *
 *   node --env-file=.env.local scripts/migrate-tournament-billing.mjs
 *   node --env-file=.env.local scripts/migrate-tournament-billing.mjs --apply
 *
 * Default is a dry run. Re-running --apply is safe: a tournament that already
 * has a Stripe customer or subscription is left alone.
 */
import { adminDb } from "../src/lib/server/firebase-admin.mjs";
import { initialFreeBilling } from "../src/lib/plans.mjs";

const apply = process.argv.includes("--apply");
const db = adminDb();
const tournaments = await db.collection("tournaments").get();

const grandfatherBilling = {
  ...initialFreeBilling(),
  plan: "pro",
  status: "active",
};

const owners = new Map();
let marked = 0;
let skipped = 0;

console.log(`${apply ? "Applying" : "Dry run"} across ${tournaments.size} tournament(s).`);

for (const tournament of tournaments.docs) {
  const data = tournament.data();
  const ownerId = typeof data.ownerId === "string" ? data.ownerId : "";
  if (ownerId) owners.set(ownerId, (owners.get(ownerId) || 0) + 1);

  const billing = data.billing || {};
  const hasStripe = Boolean(billing.stripeCustomerId || billing.stripeSubscriptionId);
  if (hasStripe) {
    skipped += 1;
    console.log(`- ${tournament.id}: keep Stripe billing (${billing.plan || "unknown"} / ${billing.status || "unknown"})`);
    continue;
  }
  if (data.legacyPro === true && billing.plan === "pro" && billing.status === "active") {
    skipped += 1;
    console.log(`- ${tournament.id}: already legacy Pro`);
    continue;
  }

  marked += 1;
  console.log(`- ${tournament.id}: grandfather as Liga Pro (legacyPro)`);
  if (apply) {
    await tournament.ref.set(
      {
        legacyPro: true,
        billing: {
          ...grandfatherBilling,
          stripeCustomerId: billing.stripeCustomerId || null,
          stripeSubscriptionId: billing.stripeSubscriptionId || null,
          currentPeriodEnd: billing.currentPeriodEnd || null,
          currentPeriodEndMs: billing.currentPeriodEndMs ?? null,
          interval: billing.interval || null,
        },
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }
}

for (const [ownerId, count] of owners) {
  const ref = db.collection("users").doc(ownerId);
  const snap = await ref.get();
  const currentAllowance = snap.exists && typeof snap.data().leagueAllowance === "number"
    ? snap.data().leagueAllowance
    : 1;
  const currentCount = snap.exists ? Number(snap.data().ownedTournamentCount || 0) : 0;
  const leagueAllowance = Math.max(currentAllowance, count, 1);
  const ownedTournamentCount = Math.max(currentCount, count);
  console.log(`- user ${ownerId}: leagues ${count}, allowance ${leagueAllowance}, counter ${ownedTournamentCount}`);
  if (apply) {
    await ref.set(
      {
        uid: ownerId,
        leagueAllowance,
        ownedTournamentCount,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }
}

console.log(`Grandfathered ${marked}. Left ${skipped} untouched. Owners ${owners.size}.`);
if (!apply) console.log("Dry run only. Pass --apply to write.");
