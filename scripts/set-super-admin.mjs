/**
 * Grant the superAdmin custom claim.
 *
 *   node --env-file=.env.local scripts/set-super-admin.mjs
 *   node --env-file=.env.local scripts/set-super-admin.mjs robert02frontend@gmail.com
 *
 * The signed-in client must refresh its ID token (sign out and sign in) before
 * Firestore rules and isSuperAdmin() observe the claim.
 */
import { adminAuth } from "../src/lib/server/firebase-admin.mjs";

const email = (process.argv[2] || process.env.SUPER_ADMIN_EMAIL || "robert02frontend@gmail.com")
  .trim()
  .toLowerCase();

if (!email.includes("@")) {
  console.error("Pass the super admin email, or set SUPER_ADMIN_EMAIL.");
  process.exit(1);
}

const user = await adminAuth().getUserByEmail(email);
const nextClaims = { ...(user.customClaims || {}), superAdmin: true };
await adminAuth().setCustomUserClaims(user.uid, nextClaims);

console.log(`superAdmin claim set for ${email} (uid ${user.uid}).`);
console.log("Ask that account to sign out and sign in again so the new ID token is issued.");
