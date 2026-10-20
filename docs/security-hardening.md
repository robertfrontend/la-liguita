# Security hardening — deploy notes

This change closes three holes:

- Firestore writes on tournaments, games, teams, players, referees, and legacy leagues are limited to the owner, a listed tournament admin, or a super admin custom claim.
- Access codes are checked on the server. The client no longer accepts master codes or `LGT-` + the first characters of the tournament id.
- Super admin is `request.auth.token.superAdmin == true`. Matching the string `robert02frontend` in an email does nothing.

The public portal can still read tournament, team, game, player, and referee **names**. It cannot read `users`, referee phone numbers, or the access-code document.

## New environment variables

Set these on the Next.js host (Vercel/server), not in `NEXT_PUBLIC_*`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | One of the credential options | Full service-account JSON, one line. This is the preferred option. |
| `FIREBASE_PROJECT_ID` | With the key pair below | Firebase project id. |
| `FIREBASE_CLIENT_EMAIL` | With the key pair | Service account email. |
| `FIREBASE_PRIVATE_KEY` | With the key pair | PEM private key. Newlines may be escaped as `\n`. |
| `ACCESS_CODE_PEPPER` | Yes | Random secret, at least 16 characters. HMAC key for access codes. Use the **same** value for the migration script and the Next.js host. Do not rotate it after migration unless every code is hashed again. |
| `SUPER_ADMIN_EMAIL` | No | Defaults to `robert02frontend@gmail.com` for `scripts/set-super-admin.mjs`. |

Keep the existing `NEXT_PUBLIC_FIREBASE_*` client config. `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` is no longer used for authorization.

The service account needs Firebase Authentication admin and Cloud Firestore read/write.

## Order of operations

Existing owners keep access without a code. `adminEmails` must be full lowercase addresses before the rules go live: the rules compare the entire token email and do not match a bare username or another domain with the same local part. People who only know a code need that code copied into `private/access` before the new server is the only thing checking it.

Do it in this order:

1. Put the env vars on the Next.js host and in the local `.env.local` used by the scripts.
2. Grant the super admin claim, then sign out and sign in once on `robert02frontend@gmail.com` so the ID token actually contains `superAdmin: true`. Do this **before** deploying rules. After the rules are live, the email string is not enough.
3. Dry-run the migration, read the report, then apply it. Also **before** deploying rules.
4. Deploy `firestore.rules` and `firestore.indexes.json`.
5. Deploy the Next.js app.
6. Sign out and sign in once more so this app refreshes the ID token.

```bash
node --env-file=.env.local scripts/migrate-tournament-security.mjs
node --env-file=.env.local scripts/migrate-tournament-security.mjs --apply
node --env-file=.env.local scripts/set-super-admin.mjs robert02frontend@gmail.com
```

Deploy rules with the Firebase CLI, from this repo:

```bash
npx firebase deploy --only firestore:rules,firestore:indexes --project <project-id>
```

If the Firestore console asks for a collection-group index on `private.codeHash`, deploy the indexes file above. It is already declared in `firestore.indexes.json`.

## What the migration keeps

For every `tournaments/{id}` document:

- `ownerId` is not modified. Tournaments with no owner can be managed only by a super admin until an owner is set in the console.
- `adminEmails` entries are trimmed, lowercased, and de-duplicated. A username without `@` is rewritten to `username@laliguita.com`, which is the account `resolveLoginIdentifier` creates. `organizador@gmail.com` does not match a stored `organizador` or `organizador@laliguita.com`. Run this before deploying rules or those organizers lose access.
- A real `adminAccessCode` is copied to `tournaments/{id}/private/access` as `{ code, codeHash }` and then **deleted** from the public document. The code organizers already know keeps working, including old `LGT-####` codes.
- Retired master codes (`SUPER2026`, `ADMIN2026`, `2026`, `LGT-ROOT`, and the other old client backdoors) are not copied. The script prints a replacement `LGT-####` for that tournament. Share the new code out of band.
- Codes that were never stored (the old client accepted `LGT-` + the id prefix, or the raw id) are **not** invented. Set a code in the super admin console after deploy. Those patterns no longer unlock anything.
- `referees/{id}.phone` moves to `refereeContacts/{id}.phone` and is removed from the public referee document.

The script is safe to re-run. Pass no flag for a dry run.

## Rotating old 4-digit codes

New codes are `LGT-` plus 8 unambiguous characters. Codes already stored stay valid, including `LGT-` plus four digits. To replace those weak codes and print the new value for each tournament:

```bash
node --env-file=.env.local scripts/migrate-tournament-security.mjs --rotate-weak
node --env-file=.env.local scripts/migrate-tournament-security.mjs --apply --rotate-weak
```

The first command lists tournaments that would change and does not write. `--apply` writes `private/access` and prints `NEW CODE for <id>`. Share that code with the organizer. A code is weak when it is `LGT-` plus exactly four digits, or when it has fewer than 8 characters from the unambiguous alphabet. Strong codes are left as they are. Without `--rotate-weak`, the script only reminds you that weak codes were kept.

## Access code behavior

- Organizers still open **Código de acceso**, type the PIN, and sign in. The form is unchanged.
- Invite links copied from the admin UI go to `/login` and do not put the PIN in `?pin=`. Old links that still have `?pin=` are accepted once and then stripped from the address bar.
- Validation is `POST /api/admin/access-code`. Every call requires a Firebase ID token, including a preview. The server does not look up the code until the token verifies. It then HMACs the code, compares it in constant time, and, only when `claim` is set, appends the token email and uid. The client cannot add itself to `adminEmails`.
- New and regenerated codes are `LGT-` plus 8 characters from an unambiguous alphabet (`A–Z` and `2–9`, without `I`, `L`, `O`, `0`, or `1`), drawn with `crypto.getRandomValues`. Existing codes, including old `LGT-` plus four digits, keep working until they are rotated.
- Attempts are counted in Firestore (`accessCodeAttempts`, Admin SDK only) per uid, per platform client IP, and per tournament. Eight attempts in fifteen minutes locks the uid or IP bucket. Forty matches in fifteen minutes locks that tournament for every account. The response is HTTP 429. The IP is `x-vercel-forwarded-for`, then `request.ip`, then `@vercel/functions` `ipAddress` (`x-real-ip`). The first `X-Forwarded-For` hop is not used. The per-tournament bucket counts a code that actually matches that tournament, so rotating accounts does not reset it.
- `email_verified` is not required. Email/password organizer accounts are unverified; requiring the flag would lock them out. Google accounts are already verified. A listed admin is the Firebase account whose full email matches `adminEmails`.
- The owner and a super admin can remove people from `adminEmails` and `adminUids`. Another admin cannot change `adminUids`, cannot add their own exact email, and cannot change `ownerId`. Removing an organizer from the admin UI goes through `POST /api/admin/roster`, which rewrites both lists and drops the Auth uid. Removing only the email and leaving the uid would keep access.
- A failed PIN claim stays on the login screen, shows the existing error alert, and does not delete the saved PIN. A successful claim redirects to the tournament the code resolved to. A tournament id left in the tab from an earlier attempt is ignored, so it cannot reject the new code or send the organizer to the wrong place.
- Setting or regenerating a code is `POST /api/admin/access-code/set`, and only an owner, tournament admin, or super admin can call it.
- Plaintext codes are readable only by people who already manage that tournament (`private/access`). Everyone else is denied.

## Rules tests

```bash
npm run test:access-code
npm run test:rules
```

`test:rules` starts the Firestore emulator and checks that strangers cannot write, that owner changes and self-grants are rejected, that revoking `adminUids` removes access, that only the full email matches, and that phones, user profiles, access codes, and attempt counters are not public. `test:access-code` also covers the lockout window and a failed claim keeping the PIN.
