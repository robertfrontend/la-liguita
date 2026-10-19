import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "./firebase-admin.mjs";
import {
  hashAccessCode,
  hashesMatch,
  isBlockedAccessCode,
  normalizeAccessCode,
} from "./access-code.mjs";

const TOURNAMENTS = "tournaments";
const ACCESS_DOC = "access";

const rateBuckets = new Map();

export function resetAccessCodeRateLimit() {
  rateBuckets.clear();
}

export function enforceAccessCodeRateLimit(key, limit = 30, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const bucket = rateBuckets.get(key) || [];
  const recent = bucket.filter((ts) => now - ts < windowMs);
  if (recent.length >= limit) {
    rateBuckets.set(key, recent);
    return false;
  }
  recent.push(now);
  rateBuckets.set(key, recent);
  return true;
}

export async function verifyIdToken(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authorizationHeader.slice("Bearer ".length).trim();
  if (!token) return null;
  try {
    return await adminAuth().verifyIdToken(token);
  } catch {
    return null;
  }
}

export function callerManagesTournament(decoded, tournament) {
  if (!decoded || !tournament) return false;
  if (decoded.superAdmin === true) return true;
  if (tournament.ownerId && tournament.ownerId === decoded.uid) return true;

  const adminUids = Array.isArray(tournament.adminUids) ? tournament.adminUids : [];
  if (adminUids.includes(decoded.uid)) return true;

  const email = typeof decoded.email === "string" ? decoded.email.trim().toLowerCase() : "";
  if (!email) return false;
  const local = email.split("@")[0];
  const aliases = new Set([email, local, `${local}@laliguita.com`]);
  const adminEmails = Array.isArray(tournament.adminEmails) ? tournament.adminEmails : [];
  return adminEmails.some((entry) => aliases.has(String(entry).trim().toLowerCase()));
}

function publicTournament(id, data) {
  return {
    id,
    name: data.name || "Torneo",
    slug: data.slug || id,
    sport: data.sport === "soccer" ? "soccer" : "basketball",
    tier: data.tier === "pro" ? "pro" : "amateur",
    organizationName: data.organizationName || "",
    logoUrl: data.logoUrl || "",
    bannerUrl: data.bannerUrl || "",
    status: data.status || "active",
    settings: data.settings || {},
  };
}

async function writePrivateAccess(tournamentId, code, uid) {
  const normalized = normalizeAccessCode(code);
  if (isBlockedAccessCode(normalized) || normalized.length < 4 || normalized.length > 64) {
    throw new Error("El código de acceso no es válido.");
  }
  const codeHash = hashAccessCode(normalized);
  const existing = await adminDb()
    .collectionGroup("private")
    .where("codeHash", "==", codeHash)
    .limit(5)
    .get();

  const conflict = existing.docs.find((docSnap) => {
    const parts = docSnap.ref.path.split("/");
    return parts[0] === TOURNAMENTS && parts[2] === "private" && parts[1] !== tournamentId;
  });
  if (conflict) {
    throw new Error("Ese código ya está asignado a otro torneo.");
  }

  const ref = adminDb().collection(TOURNAMENTS).doc(tournamentId);
  const batch = adminDb().batch();
  batch.set(
    ref.collection("private").doc(ACCESS_DOC),
    {
      code: normalized,
      codeHash,
      updatedAt: new Date().toISOString(),
      updatedBy: uid || "server",
    },
    { merge: true }
  );
  batch.update(ref, {
    adminAccessCode: FieldValue.delete(),
    updatedAt: new Date().toISOString(),
  });
  await batch.commit();
  return normalized;
}

export async function setTournamentAccessCode(tournamentId, rawCode, decoded) {
  const ref = adminDb().collection(TOURNAMENTS).doc(tournamentId);
  const snap = await ref.get();
  if (!snap.exists) {
    return { ok: false, status: 404, message: "Torneo no encontrado." };
  }
  if (!callerManagesTournament(decoded, snap.data())) {
    return { ok: false, status: 403, message: "No puedes cambiar el código de este torneo." };
  }
  try {
    const code = await writePrivateAccess(tournamentId, rawCode, decoded.uid);
    return { ok: true, status: 200, code };
  } catch (error) {
    return {
      ok: false,
      status: 400,
      message: error instanceof Error ? error.message : "No se pudo guardar el código.",
    };
  }
}

async function findByHash(codeHash) {
  const snap = await adminDb()
    .collectionGroup("private")
    .where("codeHash", "==", codeHash)
    .limit(5)
    .get();

  const matches = snap.docs.filter((docSnap) => {
    const parts = docSnap.ref.path.split("/");
    return parts.length === 4 && parts[0] === TOURNAMENTS && parts[2] === "private" && parts[3] === ACCESS_DOC;
  });
  return matches;
}

async function findLegacyTournament(normalized, codeHash) {
  const snap = await adminDb()
    .collection(TOURNAMENTS)
    .where("adminAccessCode", "==", normalized)
    .limit(5)
    .get();

  const matches = [];
  for (const docSnap of snap.docs) {
    const stored = normalizeAccessCode(docSnap.data().adminAccessCode);
    const storedHash = hashAccessCode(stored);
    if (hashesMatch(storedHash, codeHash)) {
      matches.push(docSnap);
    }
  }
  return matches;
}

async function addCallerAsAdmin(tournamentRef, data, decoded) {
  const email = typeof decoded.email === "string" ? decoded.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    return { ok: false, status: 400, message: "Tu cuenta no tiene un correo electrónico." };
  }

  const existingEmails = Array.isArray(data.adminEmails)
    ? data.adminEmails.map((entry) => String(entry).trim().toLowerCase()).filter(Boolean)
    : [];
  const existingUids = Array.isArray(data.adminUids)
    ? data.adminUids.map((entry) => String(entry)).filter(Boolean)
    : [];

  const nextEmails = existingEmails.includes(email) ? existingEmails : [...existingEmails, email];
  const nextUids = existingUids.includes(decoded.uid) ? existingUids : [...existingUids, decoded.uid];

  if (nextEmails.length !== existingEmails.length || nextUids.length !== existingUids.length) {
    await tournamentRef.update({
      adminEmails: nextEmails,
      adminUids: nextUids,
      updatedAt: new Date().toISOString(),
    });
  }

  return { ok: true };
}

/**
 * Compare a submitted code with the private HMAC.
 * When `claim` is set, the Firebase ID token is required and the caller is added
 * to adminEmails / adminUids. Preview (no claim) only returns public tournament fields.
 */
export async function verifyAccessCode({ rawCode, decoded, claim }) {
  const normalized = normalizeAccessCode(rawCode);
  if (isBlockedAccessCode(normalized) || normalized.length < 4 || normalized.length > 64) {
    hashAccessCode("invalid-placeholder");
    hashesMatch(null, hashAccessCode("invalid-placeholder-b"));
    return { ok: true, status: 200, valid: false, message: "Código o PIN no encontrado." };
  }

  if (claim && !decoded) {
    return {
      ok: false,
      status: 401,
      valid: false,
      message: "Inicia sesión para canjear el código de acceso.",
    };
  }

  const codeHash = hashAccessCode(normalized);
  let matches = await findByHash(codeHash);
  let legacyDoc = null;

  if (matches.length === 0) {
    const legacy = await findLegacyTournament(normalized, codeHash);
    if (legacy.length === 1) {
      legacyDoc = legacy[0];
    } else if (legacy.length > 1) {
      return {
        ok: true,
        status: 200,
        valid: false,
        message: "Código o PIN no encontrado.",
      };
    }
  }

  if (matches.length > 1) {
    return { ok: true, status: 200, valid: false, message: "Código o PIN no encontrado." };
  }

  let tournamentId = null;
  let storedHash = null;

  if (matches.length === 1) {
    const parts = matches[0].ref.path.split("/");
    tournamentId = parts[1];
    storedHash = matches[0].data().codeHash;
  } else if (legacyDoc) {
    tournamentId = legacyDoc.id;
    storedHash = hashAccessCode(normalizeAccessCode(legacyDoc.data().adminAccessCode));
  }

  if (!tournamentId || !hashesMatch(storedHash, codeHash)) {
    hashesMatch(storedHash, codeHash);
    return { ok: true, status: 200, valid: false, message: "Código o PIN no encontrado." };
  }

  const tournamentRef = adminDb().collection(TOURNAMENTS).doc(tournamentId);
  const tournamentSnap = legacyDoc || (await tournamentRef.get());
  if (!tournamentSnap.exists) {
    return { ok: true, status: 200, valid: false, message: "Código o PIN no encontrado." };
  }

  if (legacyDoc) {
    await writePrivateAccess(tournamentId, normalized, decoded?.uid || "legacy-migration");
  }

  const data = tournamentSnap.data() || {};
  if (claim) {
    const added = await addCallerAsAdmin(tournamentRef, data, decoded);
    if (!added.ok) return { ...added, valid: false };
  }

  return {
    ok: true,
    status: 200,
    valid: true,
    tournament: publicTournament(tournamentId, data),
  };
}
