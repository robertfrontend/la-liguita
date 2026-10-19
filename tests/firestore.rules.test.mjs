import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
const [host, portString] = emulatorHost.split(":");
const port = Number(portString || 8080);

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-la-liguita",
    firestore: {
      rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8"),
      host,
      port,
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

function dbFor(uid, claims) {
  if (!uid) return testEnv.unauthenticatedContext().firestore();
  return testEnv.authenticatedContext(uid, claims).firestore();
}

async function seed(writer) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await writer(context.firestore());
  });
}

async function seedTournament() {
  await seed(async (db) => {
    await setDoc(doc(db, "tournaments/copa"), {
      name: "Copa",
      slug: "copa",
      sport: "basketball",
      ownerId: "owner",
      adminEmails: ["coach@laliguita.com", "organizador"],
      adminUids: [],
    });
    await setDoc(doc(db, "tournaments/copa/private/access"), {
      code: "LGT-4821",
      codeHash: "abc123",
    });
    await setDoc(doc(db, "tournaments/copa/referees/ref1"), {
      name: "Ramón Bautista",
      role: "head_referee",
    });
    await setDoc(doc(db, "tournaments/copa/refereeContacts/ref1"), {
      phone: "+1-809-555-0101",
    });
    await setDoc(doc(db, "tournaments/copa/games/g1"), { scoreA: 0, scoreB: 0 });
    await setDoc(doc(db, "tournaments/copa/teams/t1"), { name: "Los Mina" });
    await setDoc(doc(db, "tournaments/copa/players/p1"), { name: "Ana" });
    await setDoc(doc(db, "users/owner"), { uid: "owner", email: "owner@example.com", isPro: false });
    await setDoc(doc(db, "users/other"), { uid: "other", email: "other@example.com", isPro: false });
    await setDoc(doc(db, "leagues/liga"), { name: "Liga", ownerId: "owner", sport: "basketball" });
    await setDoc(doc(db, "leagues/liga/players/p1"), { name: "Luis" });
    await setDoc(doc(db, "leagues/liga/games/g1"), { scoreA: 1, scoreB: 2 });
  });
}

test("public readers can see the portal but not users, phones, or access codes", async () => {
  await seedTournament();
  const anon = dbFor(null);

  await assertSucceeds(getDoc(doc(anon, "tournaments/copa")));
  await assertSucceeds(getDoc(doc(anon, "tournaments/copa/games/g1")));
  await assertSucceeds(getDoc(doc(anon, "tournaments/copa/teams/t1")));
  await assertSucceeds(getDoc(doc(anon, "tournaments/copa/players/p1")));
  await assertSucceeds(getDoc(doc(anon, "tournaments/copa/referees/ref1")));
  await assertSucceeds(getDoc(doc(anon, "leagues/liga")));
  await assertSucceeds(getDoc(doc(anon, "leagues/liga/games/g1")));
  await assertSucceeds(getDoc(doc(anon, "leagues/liga/players/p1")));

  await assertFails(getDoc(doc(anon, "users/owner")));
  await assertFails(getDocs(collection(anon, "users")));
  await assertFails(getDoc(doc(anon, "tournaments/copa/private/access")));
  await assertFails(getDoc(doc(anon, "tournaments/copa/refereeContacts/ref1")));
  await assertFails(getDocs(collection(anon, "early_access")));
  await assertSucceeds(setDoc(doc(anon, "early_access/lead1"), { email: "fan@example.com" }));
});

test("a signed-in stranger cannot write tournament data or take ownership", async () => {
  await seedTournament();
  const stranger = dbFor("stranger", { email: "stranger@example.com" });

  await assertFails(updateDoc(doc(stranger, "tournaments/copa"), { name: "Robado" }));
  await assertFails(updateDoc(doc(stranger, "tournaments/copa"), { ownerId: "stranger" }));
  await assertFails(updateDoc(doc(stranger, "tournaments/copa"), {
    adminEmails: ["coach@laliguita.com", "organizador", "stranger@example.com"],
  }));
  await assertFails(setDoc(doc(stranger, "tournaments/copa/games/g2"), { scoreA: 9 }));
  await assertFails(setDoc(doc(stranger, "tournaments/copa/teams/t2"), { name: "Nuevo" }));
  await assertFails(setDoc(doc(stranger, "tournaments/copa/players/p2"), { name: "Beto" }));
  await assertFails(setDoc(doc(stranger, "tournaments/copa/referees/ref2"), { name: "Juez" }));
  await assertFails(setDoc(doc(stranger, "tournaments/copa/games/g1/playByPlay/e1"), { type: "2pt_made" }));
  await assertFails(updateDoc(doc(stranger, "leagues/liga"), { name: "Ajena" }));
  await assertFails(setDoc(doc(stranger, "leagues/liga/players/p2"), { name: "Extra" }));
  await assertFails(getDoc(doc(stranger, "tournaments/copa/private/access")));
  await assertFails(getDoc(doc(stranger, "users/owner")));
});

test("the owner can edit the tournament but cannot change owner or self-grant", async () => {
  await seedTournament();
  const owner = dbFor("owner", { email: "owner@example.com" });

  await assertSucceeds(updateDoc(doc(owner, "tournaments/copa"), { name: "Copa 2026" }));
  await assertSucceeds(setDoc(doc(owner, "tournaments/copa/games/g2"), { scoreA: 10, scoreB: 8 }));
  await assertSucceeds(updateDoc(doc(owner, "tournaments/copa"), {
    adminEmails: ["coach@laliguita.com", "organizador", "mesa@example.com"],
  }));
  await assertSucceeds(getDoc(doc(owner, "tournaments/copa/private/access")));
  await assertSucceeds(getDoc(doc(owner, "tournaments/copa/refereeContacts/ref1")));
  await assertSucceeds(setDoc(doc(owner, "tournaments/copa/referees/ref2"), {
    name: "Nueva",
    role: "umpire",
  }));

  await assertFails(updateDoc(doc(owner, "tournaments/copa"), { ownerId: "owner-2" }));
  await assertFails(updateDoc(doc(owner, "tournaments/copa"), {
    adminEmails: ["coach@laliguita.com", "organizador", "owner@example.com"],
  }));
  await assertFails(updateDoc(doc(owner, "tournaments/copa"), { adminAccessCode: "LGT-9999" }));
  await assertFails(updateDoc(doc(owner, "tournaments/copa"), { adminUids: ["owner"] }));
  await assertFails(setDoc(doc(owner, "tournaments/copa/private/access"), { code: "LGT-0000", codeHash: "nope" }));
  await assertFails(setDoc(doc(owner, "tournaments/copa/referees/ref3"), { name: "Con teléfono", phone: "809-000-0000" }));
  await assertSucceeds(deleteDoc(doc(owner, "tournaments/copa/private/access")));
});

test("listed admins can write, including username entries, and cannot seize the tournament", async () => {
  await seedTournament();
  const coach = dbFor("coach", { email: "coach@laliguita.com" });
  const username = dbFor("org", { email: "organizador@gmail.com" });
  const alias = dbFor("alias", { email: "organizador@laliguita.com" });

  await assertSucceeds(updateDoc(doc(coach, "tournaments/copa"), { name: "Copa coach" }));
  await assertSucceeds(getDoc(doc(coach, "tournaments/copa/private/access")));
  await assertSucceeds(updateDoc(doc(username, "tournaments/copa/games/g1"), { scoreA: 4 }));
  await assertSucceeds(setDoc(doc(alias, "tournaments/copa/teams/t9"), { name: "Alias" }));

  await assertFails(updateDoc(doc(coach, "tournaments/copa"), { ownerId: "coach" }));
  await assertFails(updateDoc(doc(coach, "tournaments/copa"), {
    adminEmails: ["coach@laliguita.com", "organizador", "coach"],
  }));
  await assertFails(updateDoc(doc(coach, "tournaments/copa"), { adminAccessCode: "HACK" }));
});

test("an email containing robert02frontend is not a super admin without the claim", async () => {
  await seedTournament();
  const lookalike = dbFor("lookalike", { email: "robert02frontend@gmail.com" });
  await assertFails(updateDoc(doc(lookalike, "tournaments/copa"), { name: "No" }));
  await assertFails(getDoc(doc(lookalike, "users/other")));

  const superAdmin = dbFor("robert", { email: "robert02frontend@gmail.com", superAdmin: true });
  await assertSucceeds(updateDoc(doc(superAdmin, "tournaments/copa"), { name: "Desde claim" }));
  await assertSucceeds(updateDoc(doc(superAdmin, "tournaments/copa"), {
    adminEmails: ["coach@laliguita.com", "organizador", "robert02frontend@gmail.com"],
  }));
  await assertFails(updateDoc(doc(superAdmin, "tournaments/copa"), { ownerId: "robert" }));
  await assertSucceeds(getDoc(doc(superAdmin, "users/other")));
});

test("tournament creation cannot assign another owner or publish an access code", async () => {
  const stranger = dbFor("stranger", { email: "stranger@example.com" });

  await assertSucceeds(setDoc(doc(stranger, "tournaments/nuevo"), {
    name: "Nuevo",
    ownerId: "stranger",
    slug: "nuevo",
    adminEmails: ["mesa@example.com"],
  }));
  await assertFails(setDoc(doc(stranger, "tournaments/ajeno"), {
    name: "Ajeno",
    ownerId: "owner",
    slug: "ajeno",
  }));
  await assertFails(setDoc(doc(stranger, "tournaments/con-pin"), {
    name: "Pin",
    ownerId: "stranger",
    adminAccessCode: "LGT-1111",
  }));
  await assertFails(setDoc(doc(stranger, "tournaments/con-uids"), {
    name: "Uids",
    ownerId: "stranger",
    adminUids: ["victim"],
  }));
});

test("user profiles are private and cannot self-promote isPro", async () => {
  await seedTournament();
  const owner = dbFor("owner", { email: "owner@example.com" });

  await assertSucceeds(getDoc(doc(owner, "users/owner")));
  await assertFails(getDoc(doc(owner, "users/other")));
  await assertFails(getDocs(collection(owner, "users")));
  await assertSucceeds(updateDoc(doc(owner, "users/owner"), { displayName: "Dueño" }));
  await assertFails(updateDoc(doc(owner, "users/owner"), { isPro: true }));

  const fresh = dbFor("fresh", { email: "fresh@example.com" });
  await assertSucceeds(setDoc(doc(fresh, "users/fresh"), {
    uid: "fresh",
    email: "fresh@example.com",
    isPro: false,
  }));
  await assertFails(setDoc(doc(fresh, "users/fresh-pro"), {
    uid: "fresh",
    isPro: true,
  }));
  await assertFails(setDoc(doc(fresh, "users/other"), {
    uid: "other",
    isPro: false,
  }));
});

test("legacy league writes stay with the owner", async () => {
  await seedTournament();
  const owner = dbFor("owner", { email: "owner@example.com" });
  const stranger = dbFor("stranger", { email: "stranger@example.com" });

  await assertSucceeds(updateDoc(doc(owner, "leagues/liga"), { name: "Liga oficial" }));
  await assertSucceeds(setDoc(doc(owner, "leagues/liga/games/g2"), { scoreA: 3, scoreB: 1 }));
  await assertFails(updateDoc(doc(owner, "leagues/liga"), { ownerId: "stranger" }));
  await assertSucceeds(setDoc(doc(stranger, "leagues/nueva"), {
    name: "Nueva",
    ownerId: "stranger",
    sport: "soccer",
  }));
  await assertFails(setDoc(doc(stranger, "leagues/robada"), {
    name: "Robada",
    ownerId: "owner",
    sport: "soccer",
  }));

  const created = await getDoc(doc(owner, "leagues/liga"));
  assert.equal(created.exists(), true);
});
