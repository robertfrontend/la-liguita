/**
 * Move existing tournament secrets out of publicly readable documents.
 *
 * Preserves ownerId and every adminEmails entry (lowercased). Access codes are
 * copied into tournaments/{id}/private/access as HMAC hashes. Referee phone
 * numbers move to tournaments/{id}/refereeContacts/{refereeId}.
 *
 *   node --env-file=.env.local scripts/migrate-tournament-security.mjs
 *   node --env-file=.env.local scripts/migrate-tournament-security.mjs --apply
 *
 * Default is a dry run. Pass --apply to write.
 */
import { randomInt } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../src/lib/server/firebase-admin.mjs";
import {
  hashAccessCode,
  isBlockedAccessCode,
  normalizeAccessCode,
} from "../src/lib/server/access-code.mjs";

const apply = process.argv.includes("--apply");

function normalizeEmails(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const next = [];
  for (const entry of value) {
    const clean = String(entry || "").trim().toLowerCase();
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    next.push(clean);
  }
  return next;
}

function sameList(left, right) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function randomCode() {
  return `LGT-${randomInt(1000, 10000)}`;
}

async function chooseReplacement(db) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = randomCode();
    const codeHash = hashAccessCode(code);
    const clash = await db.collectionGroup("private").where("codeHash", "==", codeHash).limit(1).get();
    if (clash.empty && !isBlockedAccessCode(code)) return code;
  }
  throw new Error("Could not generate a unique replacement access code.");
}

const db = adminDb();
const tournaments = await db.collection("tournaments").get();

let codesMoved = 0;
let codesReplaced = 0;
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
      notes.push(`adminEmails normalized (${normalized.length} kept)`);
    } else {
      notes.push(`adminEmails unchanged (${normalized.length})`);
    }
  }

  const accessRef = tournament.ref.collection("private").doc("access");
  const accessSnap = await accessRef.get();
  const legacyCode = typeof data.adminAccessCode === "string" ? normalizeAccessCode(data.adminAccessCode) : "";

  if (accessSnap.exists && accessSnap.data()?.codeHash) {
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
    if (apply) {
      await accessRef.set(
        {
          code: legacyCode,
          codeHash: hashAccessCode(legacyCode),
          migratedAt: new Date().toISOString(),
          updatedBy: "migrate-tournament-security",
        },
        { merge: true }
      );
    }
    publicUpdates.adminAccessCode = FieldValue.delete();
  } else if (legacyCode && isBlockedAccessCode(legacyCode)) {
    const replacement = apply ? await chooseReplacement(db) : "LGT-XXXX";
    notes.push(`blocked legacy code replaced with ${replacement}`);
    codesReplaced += 1;
    if (apply) {
      await accessRef.set({
        code: replacement,
        codeHash: hashAccessCode(replacement),
        migratedAt: new Date().toISOString(),
        updatedBy: "migrate-tournament-security",
        replacedBlockedCode: true,
      });
    }
    publicUpdates.adminAccessCode = FieldValue.delete();
    console.log(`  NEW CODE for ${tournament.id} (${data.name || "untitled"}): ${replacement}`);
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
    `admin email lists normalized: ${emailsNormalized}`,
    `referee phones moved: ${phonesMoved}`,
  ].join("\n")
);

if (!apply) {
  console.log("\nDry run only. Re-run with --apply to write these changes.");
}
