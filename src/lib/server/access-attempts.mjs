import { createHash } from "node:crypto";
import { assertPepper } from "./access-code.mjs";

export const ACCESS_ATTEMPT_MAX = 8;
export const ACCESS_ATTEMPT_TOURNAMENT_MAX = 40;
export const ACCESS_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Platform client IP. Never the first X-Forwarded-For hop: callers can prepend that.
 * Order: x-vercel-forwarded-for, request.ip, then @vercel/functions ipAddress (x-real-ip).
 */
export function trustedClientIp({ headers, requestIp, vercelIp } = {}) {
  const read = (name) => {
    if (!headers) return "";
    if (typeof headers.get === "function") return headers.get(name) || "";
    const value = headers[name] ?? headers[name.toLowerCase()];
    return typeof value === "string" ? value : "";
  };
  const vercelForwarded = String(read("x-vercel-forwarded-for") || "").split(",")[0].trim();
  if (vercelForwarded) return vercelForwarded;
  const direct = String(requestIp || "").trim();
  if (direct) return direct;
  const fromPackage = String(vercelIp || "").trim();
  if (fromPackage) return fromPackage;
  return "";
}

/**
 * Fixed-window counter with a lockout once `max` attempts are used.
 * A still-active lock does not extend itself (`changed: false`).
 */
export function nextAttemptBucket(bucket, now, options = {}) {
  const max = options.max ?? ACCESS_ATTEMPT_MAX;
  const windowMs = options.windowMs ?? ACCESS_ATTEMPT_WINDOW_MS;
  const count = Number(bucket?.count) || 0;
  const windowStart = Number(bucket?.windowStart) || 0;
  const lockedUntil = Number(bucket?.lockedUntil) || 0;

  if (lockedUntil > now) {
    return {
      allowed: false,
      changed: false,
      count,
      windowStart,
      lockedUntil,
      retryAfterMs: lockedUntil - now,
    };
  }

  const inWindow = windowStart > 0 && now - windowStart < windowMs;
  const nextCount = inWindow ? count + 1 : 1;
  const nextStart = inWindow ? windowStart : now;

  if (nextCount > max) {
    return {
      allowed: false,
      changed: true,
      count: nextCount,
      windowStart: nextStart,
      lockedUntil: now + windowMs,
      retryAfterMs: windowMs,
    };
  }

  return {
    allowed: true,
    changed: true,
    count: nextCount,
    windowStart: nextStart,
    lockedUntil: 0,
    retryAfterMs: 0,
  };
}

/** Combine attempt buckets. An entry `{ bucket, max }` can use its own limit. */
export function planAttemptUpdates(buckets, now, options) {
  const decisions = (Array.isArray(buckets) ? buckets : []).map((entry) => {
    if (entry && typeof entry === "object" && Object.prototype.hasOwnProperty.call(entry, "bucket")) {
      return nextAttemptBucket(entry.bucket, now, {
        max: entry.max ?? options?.max,
        windowMs: entry.windowMs ?? options?.windowMs,
      });
    }
    return nextAttemptBucket(entry, now, options);
  });
  const blocked = decisions.some((decision) => !decision.allowed);
  const alreadyLocked = decisions.some((decision) => !decision.allowed && !decision.changed);
  const retryAfterMs = blocked
    ? Math.max(0, ...decisions.map((decision) => decision.retryAfterMs || 0))
    : 0;
  return {
    allowed: !blocked,
    retryAfterMs,
    writes: alreadyLocked ? null : decisions,
  };
}

export function attemptDocId(kind, value) {
  const pepper = assertPepper();
  return createHash("sha256").update(`${kind}:${value}:${pepper}`).digest("hex");
}
