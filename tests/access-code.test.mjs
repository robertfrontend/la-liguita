import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BLOCKED_ACCESS_CODES,
  hashAccessCode,
  hashesMatch,
  isBlockedAccessCode,
  normalizeAccessCode,
} from "../src/lib/server/access-code.mjs";

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
