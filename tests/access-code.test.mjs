import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonicalAdminEmail,
  canonicalAdminEmails,
  decideClaimResult,
  emailIsListed,
} from "../src/lib/admin-identity.mjs";
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

test("verifyAccessCode requires a Firebase user before any lookup", async () => {
  const { verifyAccessCode } = await import("../src/lib/server/tournament-access.mjs");
  const missing = await verifyAccessCode({ rawCode: "LGT-4821", decoded: null, claim: false });
  assert.equal(missing.status, 401);
  assert.equal(missing.valid, false);
  const preview = await verifyAccessCode({ rawCode: "LGT-4821", decoded: null, claim: true });
  assert.equal(preview.status, 401);
});
