# Tasks — Landing page design direction

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250–380 lines if implemented as homepage refinement; pause if extraction/polish pushes above 400 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR, with optional split into component extraction → visual/a11y polish only if the budget is exceeded |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

## Implementation Tasks

- [x] 1. Confirm the homepage baseline and define the smallest implementation slice.
  - Dependencies: Approved `proposal.md`, `specs/landing-page/spec.md`, `design.md`, and `openspec/config.yaml`.
  - Allowed edit surfaces: No source edits for this task; inspect `src/app/page.tsx`, `src/app/layout.tsx`, `src/components/features/PublicTournamentDirectory.tsx`, `src/components/layout/TopNav.tsx`, and `src/app/globals.css`.
  - Acceptance criteria: The implementer can state which existing homepage behavior already satisfies the spec and which gaps remain; expected changed-line count remains under 400 or pauses under `ask-on-risk`.
  - Validation evidence: Notes in the implementation report with current gaps, planned edit count, and confirmation that no chain strategy was needed before coding.

- [x] 2. Preserve route composition and single-navigation shell behavior.
  - Dependencies: Task 1.
  - Allowed edit surfaces: `src/app/page.tsx`, `src/app/layout.tsx`, and, only if needed for reviewability, `src/components/layout/RouteAwareAppShell.tsx` plus import updates.
  - Acceptance criteria: `/` renders the landing feature; `/` does not render `TopNav`; non-homepage routes still render `TopNav`; homepage top spacing is not offset for the fixed app nav.
  - Validation evidence: Manual route check for `/` and at least one non-homepage route; include screenshots or written observations in verify notes.

- [x] 3. Implement or refine the route-owned landing sections in `PublicTournamentDirectory`.
  - Dependencies: Task 2.
  - Allowed edit surfaces: `src/components/features/PublicTournamentDirectory.tsx`; optional same-folder private components only if the file becomes hard to review.
  - Acceptance criteria: Content order is navigation → hero → public portal value → organizer workflow → active tournaments; copy is Spanish, organizer-focused, and public-portal-led; every `Crear torneo` CTA points to `/tournament/new`; the active tournaments anchor is `#torneos-activos`.
  - Validation evidence: Manual link activation for header, hero, and repeated create CTAs; manual anchor check for active tournaments.

- [x] 4. Preserve tournament directory data and filtering behavior while restyling presentation.
  - Dependencies: Task 3.
  - Allowed edit surfaces: `src/components/features/PublicTournamentDirectory.tsx`; do not edit `src/lib/db.ts`, Firebase rules, auth, permissions, or tournament creation flow.
  - Acceptance criteria: `subscribeToAllTournaments` remains the data source; cleanup still unsubscribes; search matches tournament name and organization name case-insensitively; sport filter supports all/basketball/soccer with missing sport treated as basketball; tournament cards route to `/t/{slug || id}`.
  - Validation evidence: Manual checks with existing/test tournament data for search, clearing search, each sport filter, counts, loading state, empty state, and card navigation.

- [x] 5. Apply the premium cinematic visual direction without changing the brand accent system.
  - Dependencies: Task 3.
  - Allowed edit surfaces: `src/components/features/PublicTournamentDirectory.tsx` and narrowly scoped utilities in `src/app/globals.css` only if Tailwind classes are insufficient.
  - Acceptance criteria: Dark high-contrast premium sports atmosphere is present; orange `#f97316`/Tailwind orange remains the primary action, focus, and emphasis color; no new blue/purple/green primary accent replaces orange; decorative sports geometry is `aria-hidden` and non-interactive.
  - Validation evidence: Visual inspection at mobile, tablet, and desktop widths; written confirmation that CTAs, focus states, badges, and active filters retain orange emphasis.

- [x] 6. Strengthen semantic accessibility, reduced-motion behavior, and responsive usability.
  - Dependencies: Tasks 3–5.
  - Allowed edit surfaces: `src/components/features/PublicTournamentDirectory.tsx`; `src/app/globals.css` only for reusable accessibility/responsive utilities if necessary.
  - Acceptance criteria: One main content path and one homepage navigation are exposed; heading order is logical; loading/result messaging uses `role="status"`/`aria-live` where applicable; filters use `aria-pressed`; controls and cards have visible accessible labels; focus order follows visual order; touch targets are at least about 44px; `motion-reduce:*` disables nonessential motion.
  - Validation evidence: Keyboard walkthrough notes, landmark/heading inspection notes, reduced-motion check, and mobile narrow-width check with no horizontal scroll.

- [x] 7. Run focused landing validation and decide whether the review budget was respected.
  - Dependencies: Tasks 2–6.
  - Allowed edit surfaces: No new source edits unless fixing validation failures within the same allowed surfaces above.
  - Acceptance criteria: Focused lint for landing-owned changed files and `npm run build` pass; full `npm run lint` is known to have pre-existing unrelated failures and must be recorded separately rather than treated as a landing implementation blocker; `git diff --stat` stays at or below the 400 changed-line review budget, or implementation pauses before PR preparation for an `ask-on-risk` delivery decision.
  - Validation evidence: Command outputs for focused lint on landing-owned changed files, `npm run build`, `git diff --stat`, a separate note/report for the known pre-existing unrelated full `npm run lint` failures, and a concise manual validation checklist covering navigation, CTAs, directory behavior, accessibility, reduced motion, and responsive layout.
