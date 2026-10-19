import { createHash } from "node:crypto";
import { assertPepper } from "./access-code.mjs";

export const ACCESS_ATTEMPT_MAX = 8;
export const ACCESS_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

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

/** Combine the uid bucket and the IP bucket. An active lock is not rewritten. */
export function planAttemptUpdates(buckets, now, options) {
  const decisions = (Array.isArray(buckets) ? buckets : []).map((bucket) =>
    nextAttemptBucket(bucket, now, options)
  );
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
