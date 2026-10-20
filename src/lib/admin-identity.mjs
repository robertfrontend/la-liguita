/** Full email only. Bare organizer usernames are the @laliguita.com login the app creates. */
export function canonicalAdminEmail(entry) {
  const clean = String(entry || "").trim().toLowerCase();
  if (!clean) return "";
  if (clean.includes("@")) return clean;
  return `${clean}@laliguita.com`;
}

export function canonicalAdminEmails(list) {
  const seen = new Set();
  const next = [];
  for (const entry of Array.isArray(list) ? list : []) {
    const email = canonicalAdminEmail(entry);
    if (!email || seen.has(email)) continue;
    seen.add(email);
    next.push(email);
  }
  return next;
}

/** Exact lowercase match. Local-part and cross-domain aliases are not admins. */
export function emailIsListed(adminEmails, tokenEmail) {
  const email = String(tokenEmail || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return false;
  return (Array.isArray(adminEmails) ? adminEmails : []).some(
    (entry) => String(entry || "").trim().toLowerCase() === email
  );
}

/**
 * A failed PIN claim must stay on the login screen with the PIN intact.
 * `result` is either `{ ok, message, tournamentId }` or the access-code JSON.
 */
export function decideClaimResult(result, expectedTournamentId = "") {
  const tournamentId = result?.tournamentId || result?.tournament?.id || "";
  const accepted = Boolean(result?.ok || (result?.valid && result?.tournament));
  const idOk = !expectedTournamentId || tournamentId === expectedTournamentId;
  if (!accepted || !idOk) {
    return {
      proceed: false,
      clearPin: false,
      message: result?.message || "No se pudo canjear el código de acceso.",
      tournamentId: "",
    };
  }
  return {
    proceed: true,
    clearPin: true,
    message: null,
    tournamentId,
  };
}

export const CLAIM_DESTINATION_STORAGE_KEY = "admin_claim_destination";

/** The code picks the tournament. A previously stored id is not a constraint. */
export function claimResolvedTournament(result) {
  const tournamentId = result?.tournament?.id || result?.tournamentId || "";
  if ((result?.valid || result?.ok) && tournamentId) {
    return { ok: true, tournamentId };
  }
  return {
    ok: false,
    tournamentId: "",
    message: result?.message || "No se pudo canjear el código de acceso.",
  };
}

/**
 * After sign-in, follow the tournament the access code resolved to.
 * A stored tournament id is not a destination: a logged-out PIN cannot know it,
 * and a leftover id from an earlier preview must not reject or redirect.
 */
export function decidePostLoginRedirect({ hasPin, claim, rememberedDestination, isSuperAdmin }) {
  if (hasPin) {
    const decision = decideClaimResult(claim, "");
    if (!decision.proceed) {
      return {
        path: null,
        clearPin: false,
        clearStoredTournamentId: true,
        rememberedDestination: "",
        consumeRemembered: false,
        message: decision.message,
      };
    }
    return {
      path: decision.tournamentId ? `/tournament/${decision.tournamentId}/games` : "/admin",
      clearPin: true,
      clearStoredTournamentId: true,
      rememberedDestination: "",
      consumeRemembered: true,
      message: null,
    };
  }

  if (rememberedDestination) {
    return {
      path: `/tournament/${rememberedDestination}/games`,
      clearPin: false,
      clearStoredTournamentId: true,
      rememberedDestination: "",
      consumeRemembered: true,
      message: null,
    };
  }

  return {
    path: isSuperAdmin ? "/superadmin" : "/admin",
    clearPin: false,
    clearStoredTournamentId: true,
    rememberedDestination: "",
    consumeRemembered: false,
    message: null,
  };
}
