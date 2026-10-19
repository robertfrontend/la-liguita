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
