/**
 * Move existing tournament secrets out of publicly readable documents.
 *
 * Preserves ownerId. adminEmails are lowercased and bare usernames become
 * username@laliguita.com (the login the app actually creates). Access codes are
 * copied into tournaments/{id}/private/access as HMAC hashes. Referee phone
 * numbers move to tournaments/{id}/refereeContacts/{refereeId}.
 *
 *   node --env-file=.env.local scripts/migrate-tournament-security.mjs
 *   node --env-file=.env.local scripts/migrate-tournament-security.mjs --apply
 *   node --env-file=.env.local scripts/migrate-tournament-security.mjs --apply --rotate-weak
 *
 * Default is a dry run. Pass --apply to write.
 * --rotate-weak replaces old 4-digit codes (and any other weak code) and prints the new value.
 * Without that flag, existing codes stay valid, including LGT-####.
 */
import { FieldValue } from "firebase-admin/firestore";
import { canonicalAdminEmails } from "../src/lib/admin-identity.mjs";
import { generateAccessCode, isWeakAccessCode } from "../src/lib/access-code-format.mjs";
import { adminDb } from "../src/lib/server/firebase-admin.mjs";
import {
  hashAccessCode,
  isBlockedAccessCode,
  normalizeAccessCode,
} from "../src/lib/server/access-code.mjs";

const apply = process.argv.includes("--apply");
const rotateWeak = process.argv.includes("--rotate-weak");

function normalizeEmails(value) {
  return canonicalAdminEmails(value);
}

function sameList(left, right) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

async function chooseReplacement(db) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = generateAccessCode();
    if (isBlockedAccessCode(code) || isWeakAccessCode(code)) continue;
    const codeHash = hashAccessCode(code);
    const clash = await db.collectionGroup("private").where("codeHash", "==", codeHash).limit(1).get();
    if (clash.empty) return code;
  }
  throw new Error("Could not generate a unique replacement access code.");
}

function privatePlainCode(accessSnap) {
  if (!accessSnap.exists) return "";
  const code = accessSnap.data()?.code;
  return typeof code === "string" ? normalizeAccessCode(code) : "";
}

const db = adminDb();
const tournaments = await db.collection("tournaments").get();

let codesMoved = 0;
let codesReplaced = 0;
let weakRotated = 0;
let weakKept = 0;
let emailsNormalized = 0;
let phonesMoved = 0;

console.log(`${apply ? "Applying" : "Dry run"} across ${tournaments.size} tournament(s).`);

for (const tournament of tournaments.docs) {
  const data = tournament.data();
  const notes = [];
  const publicUpdates = {};

  if (data.ownerId) {
    notes.push(`owner ${data.ownerId} kept`);
  } else {
    notes.push("no ownerId — only a super admin can manage this tournament until one is set");
  }

  if (Array.isArray(data.adminEmails)) {
    const normalized = normalizeEmails(data.adminEmails);
    const original = data.adminEmails.map((entry) => String(entry));
    if (!sameList(original, normalized)) {
      publicUpdates.adminEmails = normalized;
      emailsNormalized += 1;
      notes.push(`adminEmails normalized to full emails (${normalized.length} kept)`);
    } else {
      notes.push(`adminEmails unchanged (${normalized.length})`);
    }
  }

  const accessRef = tournament.ref.collection("private").doc("access");
  const accessSnap = await accessRef.get();
  const legacyCode = typeof data.adminAccessCode === "string" ? normalizeAccessCode(data.adminAccessCode) : "";
  const privateCode = privatePlainCode(accessSnap);
  const activeCode = privateCode || (legacyCode && !isBlockedAccessCode(legacyCode) ? legacyCode : "");

  async function writeCode(code, extra) {
    await accessRef.set(
      {
        code,
        codeHash: hashAccessCode(code),
        migratedAt: new Date().toISOString(),
        updatedBy: "migrate-tournament-security",
        ...extra,
      },
      { merge: true }
    );
  }

  if (legacyCode && isBlockedAccessCode(legacyCode) && !privateCode) {
    const replacement = apply ? await chooseReplacement(db) : "";
    notes.push(replacement
      ? `blocked legacy code replaced with ${replacement}`
      : "blocked legacy code will be replaced with a new 8-character code");
    codesReplaced += 1;
    if (apply) {
      await writeCode(replacement, { replacedBlockedCode: true });
      console.log(`  NEW CODE for ${tournament.id} (${data.name || "untitled"}): ${replacement}`);
    }
    publicUpdates.adminAccessCode = FieldValue.delete();
  } else if (activeCode && isWeakAccessCode(activeCode) && rotateWeak) {
    const replacement = apply ? await chooseReplacement(db) : "";
    notes.push(replacement
      ? `weak code rotated to ${replacement}`
      : "weak code will be rotated to a new 8-character code");
    weakRotated += 1;
    if (apply) {
      await writeCode(replacement, { replacedWeakCode: true });
      console.log(`  NEW CODE for ${tournament.id} (${data.name || "untitled"}): ${replacement}`);
    } else {
      console.log(`  WOULD ROTATE weak code for ${tournament.id} (${data.name || "untitled"})`);
    }
    if (legacyCode) publicUpdates.adminAccessCode = FieldValue.delete();
  } else if (activeCode && isWeakAccessCode(activeCode)) {
    weakKept += 1;
    notes.push("weak code kept. Re-run with --apply --rotate-weak to print a replacement.");
    if (!privateCode && legacyCode) {
      notes.push("access code will move to private/access");
      codesMoved += 1;
      if (apply) await writeCode(legacyCode, {});
    } else if (legacyCode) {
      notes.push("private code already stored; legacy public field will be removed");
      codesMoved += 1;
    }
    if (legacyCode) publicUpdates.adminAccessCode = FieldValue.delete();
  } else if (accessSnap.exists && accessSnap.data()?.codeHash) {
    if (legacyCode) {
      publicUpdates.adminAccessCode = FieldValue.delete();
      notes.push("private code already stored; legacy public field will be removed");
      codesMoved += 1;
    } else {
      notes.push("private code already stored");
    }
  } else if (legacyCode && !isBlockedAccessCode(legacyCode)) {
    notes.push("access code will move to private/access");
    codesMoved += 1;
    if (apply) await writeCode(legacyCode, {});
    publicUpdates.adminAccessCode = FieldValue.delete();
  } else {
    notes.push("no access code stored — set one from the super admin console after deploy");
  }

  const referees = await tournament.ref.collection("referees").get();
  for (const referee of referees.docs) {
    const phone = referee.data().phone;
    if (typeof phone !== "string" || !phone.trim()) continue;
    phonesMoved += 1;
    notes.push(`referee ${referee.id} phone will move to refereeContacts`);
    if (apply) {
      await tournament.ref.collection("refereeContacts").doc(referee.id).set(
        { phone: phone.trim(), migratedAt: new Date().toISOString() },
        { merge: true }
      );
      await referee.ref.update({ phone: FieldValue.delete() });
    }
  }

  if (apply && Object.keys(publicUpdates).length > 0) {
    publicUpdates.updatedAt = new Date().toISOString();
    await tournament.ref.update(publicUpdates);
  }

  console.log(`- ${tournament.id} ${data.name || ""}`.trim());
  for (const note of notes) console.log(`    ${note}`);
}

console.log("");
console.log(
  [
    `codes moved: ${codesMoved}`,
    `blocked codes replaced: ${codesReplaced}`,
    `weak codes rotated: ${weakRotated}`,
    `weak codes kept: ${weakKept}`,
    `admin email lists normalized: ${emailsNormalized}`,
    `referee phones moved: ${phonesMoved}`,
  ].join("\n")
);

if (!apply) {
  console.log("\nDry run only. Re-run with --apply to write these changes.");
}
if (!rotateWeak) {
  console.log("Old 4-digit codes stay valid. Rotate them with --apply --rotate-weak. The script prints each new code once.");
}
