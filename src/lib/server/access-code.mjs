import { createHmac, timingSafeEqual } from "node:crypto";

/** Codes that used to unlock every tournament from the client. Never valid. */
export const BLOCKED_ACCESS_CODES = [
  "SUPER2026",
  "LGT-SUPER",
  "SUPERADMIN",
  "LGT-ROOT",
  "ADMIN2026",
  "2026",
  "LGT-ADMIN",
];

const BLOCKED = new Set(BLOCKED_ACCESS_CODES);
const DUMMY_HASH = Buffer.alloc(32, 7);

export function normalizeAccessCode(rawCode) {
  return String(rawCode || "").trim().toUpperCase();
}

export function isBlockedAccessCode(rawCode) {
  const code = normalizeAccessCode(rawCode);
  return code.length === 0 || BLOCKED.has(code);
}

export function assertPepper() {
  const pepper = process.env.ACCESS_CODE_PEPPER || "";
  if (pepper.trim().length < 16) {
    throw new Error(
      "ACCESS_CODE_PEPPER must be a random string of at least 16 characters."
    );
  }
  return pepper;
}

/** HMAC-SHA256 so the server can look the code up without storing plaintext in the comparison. */
export function hashAccessCode(rawCode) {
  const pepper = assertPepper();
  return createHmac("sha256", pepper).update(normalizeAccessCode(rawCode)).digest("hex");
}

/**
 * Constant-time compare of two hex digests.
 * Always touches a fixed-size buffer, including when the stored value is missing or malformed.
 */
export function hashesMatch(storedHex, candidateHex) {
  const candidate = decodeHex(candidateHex);
  const stored = decodeHex(storedHex);
  if (!candidate || !stored || candidate.length !== stored.length) {
    timingSafeEqual(DUMMY_HASH, DUMMY_HASH);
    return false;
  }
  return timingSafeEqual(stored, candidate);
}

function decodeHex(value) {
  if (typeof value !== "string" || value.length === 0 || value.length % 2 !== 0) {
    return null;
  }
  if (!/^[0-9a-f]+$/i.test(value)) return null;
  return Buffer.from(value, "hex");
}
