import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonicalAdminEmail,
  canonicalAdminEmails,
  claimResolvedTournament,
  decideClaimResult,
  decidePostLoginRedirect,
  emailIsListed,
} from "../src/lib/admin-identity.mjs";
import {
  ACCESS_CODE_ALPHABET,
  generateAccessCode,
  isWeakAccessCode,
} from "../src/lib/access-code-format.mjs";
import {
  ACCESS_ATTEMPT_TOURNAMENT_MAX,
  trustedClientIp,
} from "../src/lib/server/access-attempts.mjs";
import {
  BLOCKED_ACCESS_CODES,
  hashAccessCode,
  hashesMatch,
  isBlockedAccessCode,
  normalizeAccessCode,
} from "../src/lib/server/access-code.mjs";
import {
  nextAttemptBucket,
  planAttemptUpdates,
} from "../src/lib/server/access-attempts.mjs";

process.env.ACCESS_CODE_PEPPER = "test-pepper-at-least-16";

test("normalizes codes before hashing", () => {
  assert.equal(normalizeAccessCode("  lgt-4821 "), "LGT-4821");
  assert.equal(hashAccessCode("lgt-4821"), hashAccessCode("LGT-4821"));
});

test("compare is constant-time and rejects malformed digests", () => {
  const hash = hashAccessCode("LGT-4821");
  assert.equal(hashesMatch(hash, hash), true);
  assert.equal(hashesMatch(hash, hashAccessCode("LGT-4822")), false);
  assert.equal(hashesMatch(undefined, hash), false);
  assert.equal(hashesMatch("zz", hash), false);
  assert.equal(hashesMatch("", hash), false);
});

test("retired master codes are blocked", () => {
  for (const code of BLOCKED_ACCESS_CODES) {
    assert.equal(isBlockedAccessCode(code), true);
    assert.equal(isBlockedAccessCode(code.toLowerCase()), true);
  }
  assert.equal(isBlockedAccessCode("LGT-4821"), false);
});

test("admin email matching is the full address only", () => {
  assert.equal(canonicalAdminEmail("  Organizador "), "organizador@laliguita.com");
  assert.equal(canonicalAdminEmail("Coach@LaLiguita.com"), "coach@laliguita.com");
  assert.deepEqual(
    canonicalAdminEmails(["organizador", "Coach@X.com", "organizador", ""]),
    ["organizador@laliguita.com", "coach@x.com"]
  );
  assert.equal(emailIsListed(["coach@laliguita.com"], "Coach@LaLiguita.com"), true);
  assert.equal(emailIsListed(["organizador"], "organizador@laliguita.com"), false);
  assert.equal(emailIsListed(["organizador"], "organizador@gmail.com"), false);
  assert.equal(emailIsListed(["organizador@gmail.com"], "organizador@laliguita.com"), false);
  assert.equal(emailIsListed(["organizador@laliguita.com"], "organizador@gmail.com"), false);
});

test("attempt buckets lock for the window and do not extend an active lock", () => {
  const options = { max: 2, windowMs: 1000 };
  let bucket = null;
  const now = 1_000_000;
  for (let i = 0; i < 2; i += 1) {
    bucket = nextAttemptBucket(bucket, now, options);
    assert.equal(bucket.allowed, true);
  }
  const locked = nextAttemptBucket(bucket, now + 10, options);
  assert.equal(locked.allowed, false);
  assert.equal(locked.changed, true);
  assert.equal(locked.lockedUntil, now + 10 + 1000);

  const still = nextAttemptBucket(locked, now + 20, options);
  assert.equal(still.allowed, false);
  assert.equal(still.changed, false);
  assert.equal(still.lockedUntil, locked.lockedUntil);

  const later = nextAttemptBucket(locked, locked.lockedUntil + 1, options);
  assert.equal(later.allowed, true);
  assert.equal(later.count, 1);

  const plan = planAttemptUpdates([locked, bucket], now + 20, options);
  assert.equal(plan.allowed, false);
  assert.equal(plan.writes, null);

  const open = planAttemptUpdates([null, null], now, options);
  assert.equal(open.allowed, true);
  assert.equal(open.writes.length, 2);
  assert.equal(open.writes[0].count, 1);
});

test("a failed claim keeps the PIN and does not navigate", () => {
  const failed = decideClaimResult({ ok: false, message: "Código o PIN no encontrado." }, "copa");
  assert.equal(failed.proceed, false);
  assert.equal(failed.clearPin, false);
  assert.equal(failed.message, "Código o PIN no encontrado.");

  const mismatch = decideClaimResult({ ok: true, tournamentId: "otro" }, "copa");
  assert.equal(mismatch.proceed, false);
  assert.equal(mismatch.clearPin, false);

  const ok = decideClaimResult({ ok: true, tournamentId: "copa" }, "copa");
  assert.equal(ok.proceed, true);
  assert.equal(ok.clearPin, true);
  assert.equal(ok.tournamentId, "copa");
});

test("post-login redirect follows the tournament the code resolved to", () => {
  const claimed = decidePostLoginRedirect({
    hasPin: true,
    claim: { ok: true, tournamentId: "copa-nueva" },
    rememberedDestination: "torneo-viejo",
    isSuperAdmin: false,
  });
  assert.equal(claimed.path, "/tournament/copa-nueva/games");
  assert.equal(claimed.clearPin, true);
  assert.equal(claimed.clearStoredTournamentId, true);
  assert.equal(claimed.consumeRemembered, true);
  assert.equal(claimed.rememberedDestination, "");

  const failed = decidePostLoginRedirect({
    hasPin: true,
    claim: { ok: false, message: "Código o PIN no encontrado." },
    rememberedDestination: "torneo-viejo",
  });
  assert.equal(failed.path, null);
  assert.equal(failed.clearPin, false);
  assert.equal(failed.clearStoredTournamentId, true);
  assert.equal(failed.message, "Código o PIN no encontrado.");

  const alreadyClaimed = decidePostLoginRedirect({
    hasPin: false,
    rememberedDestination: "copa-nueva",
    isSuperAdmin: false,
  });
  assert.equal(alreadyClaimed.path, "/tournament/copa-nueva/games");
  assert.equal(alreadyClaimed.consumeRemembered, true);

  const plainLogin = decidePostLoginRedirect({
    hasPin: false,
    rememberedDestination: "",
    isSuperAdmin: false,
  });
  assert.equal(plainLogin.path, "/admin");
  assert.equal(plainLogin.clearStoredTournamentId, true);
});

test("a claim resolves by code and ignores a stored tournament id", () => {
  const resolved = claimResolvedTournament({
    valid: true,
    tournament: { id: "copa-nueva" },
  });
  assert.equal(resolved.ok, true);
  assert.equal(resolved.tournamentId, "copa-nueva");
  const decision = decideClaimResult(resolved, "");
  assert.equal(decision.proceed, true);
  assert.equal(decision.tournamentId, "copa-nueva");
});

test("new access codes use eight unambiguous CSPRNG characters", () => {
  const seen = new Set();
  for (let i = 0; i < 20; i += 1) {
    const code = generateAccessCode();
    assert.match(code, new RegExp(`^LGT-[${ACCESS_CODE_ALPHABET}]{8}$`));
    for (const char of code.slice(4)) {
      assert.equal(ACCESS_CODE_ALPHABET.includes(char), true);
      assert.equal("ILO01".includes(char), false);
    }
    assert.equal(isWeakAccessCode(code), false);
    seen.add(code);
  }
  assert.equal(seen.size, 20);
  assert.equal(isWeakAccessCode("LGT-4821"), true);
  assert.equal(isWeakAccessCode("lgt-1111"), true);
  assert.equal(isWeakAccessCode("LGT-23456789"), false);
});

test("client IP comes from Vercel, not the first forwarded hop", () => {
  const spoofed = new Headers();
  spoofed.set("x-forwarded-for", "1.2.3.4, 5.6.7.8");
  spoofed.set("x-vercel-forwarded-for", "203.0.113.9, 10.0.0.4");
  assert.equal(
    trustedClientIp({ headers: spoofed, requestIp: "198.51.100.4", vercelIp: "198.51.100.8" }),
    "203.0.113.9"
  );
  spoofed.delete("x-vercel-forwarded-for");
  assert.equal(trustedClientIp({ headers: spoofed, requestIp: "198.51.100.4" }), "198.51.100.4");
  assert.equal(
    trustedClientIp({ headers: new Headers([["x-forwarded-for", "1.2.3.4"]]), vercelIp: "198.51.100.8" }),
    "198.51.100.8"
  );
  assert.equal(trustedClientIp({ headers: new Headers([["x-forwarded-for", "1.2.3.4"]]) }), "");
});

test("a tournament bucket has its own higher lockout", () => {
  const now = 5_000_000;
  const windowMs = 1000;
  let uid = null;
  for (let i = 0; i < 2; i += 1) uid = nextAttemptBucket(uid, now, { max: 2, windowMs });
  const uidLocked = nextAttemptBucket(uid, now + 10, { max: 2, windowMs });
  assert.equal(uidLocked.allowed, false);

  let tournament = null;
  for (let i = 0; i < 3; i += 1) {
    tournament = nextAttemptBucket(tournament, now, { max: ACCESS_ATTEMPT_TOURNAMENT_MAX, windowMs });
    assert.equal(tournament.allowed, true);
  }
  const plan = planAttemptUpdates(
    [
      { bucket: uidLocked, max: 2, windowMs },
      { bucket: null, max: ACCESS_ATTEMPT_TOURNAMENT_MAX, windowMs },
    ],
    now + 20
  );
  assert.equal(plan.allowed, false);
  assert.equal(plan.writes, null);
});

test("verifyAccessCode requires a Firebase user before any lookup", async () => {
  const { verifyAccessCode } = await import("../src/lib/server/tournament-access.mjs");
  const missing = await verifyAccessCode({ rawCode: "LGT-4821", decoded: null, claim: false });
  assert.equal(missing.status, 401);
  assert.equal(missing.valid, false);
  const preview = await verifyAccessCode({ rawCode: "LGT-4821", decoded: null, claim: true });
  assert.equal(preview.status, 401);
});
