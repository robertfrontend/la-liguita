# Technical Design — Landing page design direction

## Decision summary

Implement the approved homepage as a route-owned landing experience at `/` that contains its own low-chrome navigation, cinematic hero, public-portal messaging, organizer workflow, and preserved active tournament directory. Keep global app navigation off the homepage through the existing route-aware shell strategy so the homepage exposes exactly one navigation system.

This design is implementation-ready and intentionally does not change source code in this phase.

## Inputs reviewed

- `openspec/changes/landing-page-design-direction/proposal.md`
- `openspec/changes/landing-page-design-direction/specs/landing-page/spec.md`
- `src/app/page.tsx`
- `src/components/features/PublicTournamentDirectory.tsx`
- `src/components/layout/TopNav.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/lib/db.ts`
- `src/types/tournament.ts`

## Current architecture context

| Area | Current state | Design implication |
| --- | --- | --- |
| Homepage route | `src/app/page.tsx` renders `PublicTournamentDirectory`. | Keep `/` as the single landing entry point. |
| Route shell | `RouteAwareAppShell` is imported from `PublicTournamentDirectory` and wraps all app pages in `src/app/layout.tsx`. | Preserve the route-aware header suppression for `/`; consider moving it to layout ownership during implementation if edits grow. |
| Global nav | `TopNav` is fixed, admin-oriented, and currently appears on non-homepage routes. | Do not reuse `TopNav` on `/`; the landing page needs a distinct low-chrome nav. |
| Tournament data | Homepage subscribes through `subscribeToAllTournaments` in `src/lib/db.ts`. | Preserve the Firestore subscription and callback shape. |
| Directory behavior | Search, sport filter, counts, loading, empty, and public card links are local client state. | Redesign only presentation and component structure; keep behavior equivalent. |
| Styling system | Tailwind v4 via `src/app/globals.css`; orange brand variable is `#f97316`. | Keep orange as action/focus/emphasis; no new primary accent token. |

## Component and layout ownership

### Route ownership

`src/app/page.tsx` should continue to own only route composition. It should render the landing-page feature component and avoid embedding layout details directly.

Recommended route shape:

```tsx
export default function RootPage() {
  return <PublicTournamentDirectory />;
}
```

### Landing feature ownership

`src/components/features/PublicTournamentDirectory.tsx` may remain the implementation home for this change if the implementation is small. If the file becomes difficult to review or exceeds the 400-line review budget, split presentational sections into private components in the same feature area before adding new behavior.

Recommended internal ownership:

| Component/function | Responsibility | State/data access |
| --- | --- | --- |
| `PublicTournamentDirectory` | Client feature root; owns Firestore subscription, search query, sport filter, derived counts, filtered tournaments. | Reads auth user and Firestore data. |
| `LandingHeader` | Homepage-only low-chrome nav with brand, anchor links, optional admin link, and `Crear torneo`. | Receives `user` or `showAdminLink`. |
| `HeroSection` | Cinematic sports first impression, headline, public portal promise, primary CTA, secondary anchor CTA. | Receives tournament count only if proof badge remains. |
| `PortalValueSection` | Public portal differentiator: fixture, results, standings, league info. | Static content. |
| `WorkflowSection` | Organizer path: create, configure, publish/update. | Static content and CTA destination. |
| `TournamentDirectorySection` | Lower-page proof and utility, including controls, loading/empty states, cards. | Receives behavior props from feature root. |
| `TournamentCard` | One accessible public tournament link/card. | Receives a `Tournament` and computes `/t/{slug-or-id}`. |

The split is optional for a small source edit but preferred if the landing feature grows. It keeps Firestore behavior centralized while making visual sections easier to review.

## Route-aware shell strategy

The app must expose one homepage navigation system.

- Keep `RouteAwareAppShell` as the shell gate that renders `TopNav` only when `pathname !== "/"`.
- Keep homepage top spacing independent from the global fixed header; `/` must not receive the non-homepage `pt-16` offset.
- Keep `TopNav` unchanged for authenticated/admin/application routes unless a separate proposal approves a global nav redesign.
- The homepage header should be inside the landing feature and use `<header>` + `<nav aria-label="Navegación principal">`.
- Do not render both `TopNav` and the landing header on `/` at any viewport.

Implementation note: `RouteAwareAppShell` currently lives in `src/components/features/PublicTournamentDirectory.tsx`. That is acceptable for this change, but a future cleanup may move it to `src/components/layout/RouteAwareAppShell.tsx` to reduce coupling between app layout and homepage feature code.

## Visual system application

### Brand and color

- Preserve original orange accent `#f97316` / Tailwind orange (`orange-400`/near equivalents) as the only primary action, focus, and emphasis color.
- Use orange for:
  - `Crear torneo` primary CTA backgrounds.
  - Focus rings and active filter states.
  - Key eyebrow labels and small proof chips.
  - Tournament card public-link affordances.
- Do not introduce blue, purple, green, or gradient colors as primary brand accents. Non-orange color may appear only as restrained supporting status/proof, never as the main action color.

### Premium cinematic direction

- Use a dark warm base close to `#0b0805` with high contrast white text.
- Use restrained sports geometry as decorative, non-interactive layers: field/court arcs, center lines, stadium glow, radial light, or grid-like field cues.
- Use large editorial typography in the hero, with concise Spanish copy that explains the portal value before decorative proof.
- Use glass/translucent surfaces only where contrast remains readable.
- Avoid dashboard-heavy chrome, dense stats panels, pricing sections, or generic SaaS cards above the public-portal story.

### Copy direction

Preferred narrative order:

1. Hero: “Tu competencia puede verse profesional hoy” / “Organizá con presencia” style promise.
2. Support: “Creá torneos, publicá fixtures y compartí un portal público profesional…”
3. Portal value: fixtures, resultados, posiciones, información de liga, actualizaciones.
4. Workflow: crear → configurar equipos → publicar portal → actualizar resultados.
5. Proof: active tournament directory.

## Responsive structure

| Viewport | Structure | Requirements |
| --- | --- | --- |
| Mobile | Single-column hero, compact header, visible `Crear torneo`, vertical CTA stack, directory controls stacked. | No horizontal scroll; touch targets at least ~44px; hero typography scales down. |
| Tablet | Single/partial two-column sections where space allows; cards can become two columns. | Preserve content order and readable spacing. |
| Desktop | Large centered hero with atmospheric background; portal cards and workflow use grid layouts; tournament cards up to three columns. | Use scale and whitespace, not extra controls, to feel premium. |

Content order must remain: navigation → hero → public portal value → workflow → active tournaments.

## Data and behavior preservation

The redesign must not alter Firebase data flows, tournament creation, authentication, or permissions.

### Firestore subscription

Keep the existing data source:

- `subscribeToAllTournaments(callback)` from `src/lib/db.ts`.
- Callback receives `Tournament[]` sorted by `createdAt` descending.
- Unsubscribe on component cleanup.
- On subscription error, existing helper returns `[]`; landing UI should show a valid empty state rather than an application failure.

### Directory state

Preserve these local states and derived values:

- `loading: boolean`
- `searchQuery: string`
- `sportFilter: "all" | "basketball" | "soccer"`
- `filteredTournaments` matching tournament name or organization name, case-insensitive.
- Sport fallback: missing sport behaves as basketball, matching current behavior.
- Counts for basketball, soccer, and pro tournaments may remain as proof chips.

### Public links and CTA destinations

| Interaction | Destination/behavior |
| --- | --- |
| Hero `Crear torneo` | `/tournament/new` |
| Header `Crear torneo` | `/tournament/new` |
| Repeated create CTA | `/tournament/new` |
| Tournament card | `/t/{t.slug || t.id}` |
| Directory anchor | `#torneos-activos` |

No pricing, onboarding, dashboard, auth, or marketing interstitial should intercept `Crear torneo`.

### Loading and empty states

- Loading state remains scoped to the directory and must not block navigation or CTAs above it.
- Use `role="status"` and `aria-live="polite"` for loading and result-count messaging.
- Empty state should explain no matching tournaments were found and support recovery through clearing search/filter or creating a tournament.

## Semantic accessibility

Required semantics:

- One `<main>` landmark for page content from the app shell/layout composition.
- One homepage navigation landmark via the landing header.
- Hero section labelled by the page `<h1>`.
- Subsequent sections use ordered heading levels (`h2`, then `h3` inside sections).
- Directory controls grouped and labelled.
- Sport filter buttons use `aria-pressed`.
- Decorative visual layers use `aria-hidden="true"`.
- Icon-only or icon-assisted controls need visible text or accessible names.
- Tournament cards must expose the tournament name as the link/card label context before activation.

Contrast and focus:

- Text over translucent backgrounds must be checked against the final background, not against the token alone.
- Focus rings should use the original orange accent with enough offset/contrast on dark and orange surfaces.
- Keyboard order should follow visual order: nav → hero CTAs → portal/workflow links → directory controls → cards.
- No focusable element should be hidden behind absolute decorative layers.

Touch and pointer:

- Navigation links, CTAs, filter buttons, search input, and card actions should use at least `min-h-11`/`min-h-12` patterns.
- Adjacent filter buttons must not overlap on narrow screens.

## Reduced-motion approach

Motion is allowed only as enhancement.

- Use Tailwind `motion-reduce:*` variants on transitions, transforms, animations, and spinners.
- Disable or neutralize parallax-like movement, looping cinematic animation, hover lift, and translate effects under `prefers-reduced-motion`.
- Loading indicators may stop spinning under reduced motion while still presenting text status.
- Interactions must not depend on animation completion.
- Decorative layers must not intercept pointer events or focus.

## Validation plan

### Static checks

Run after implementation:

```bash
npm run lint
npm run build
```

### Manual functional validation

- Open `/` and verify only the landing header is present; `TopNav` is absent.
- Open a non-homepage route and verify `TopNav` still appears.
- Activate every `Crear torneo` CTA and verify it routes to `/tournament/new`.
- Verify tournament cards route to `/t/{slug || id}`.
- Verify search filters by tournament name and organization name.
- Verify sport filters for all, basketball, and soccer.
- Verify clearing search/filter restores expected results.
- Simulate loading/empty states or inspect them with test data.

### Accessibility validation

- Keyboard through the full page; verify visible focus and no traps.
- Inspect landmarks; verify one primary homepage navigation and one main content path.
- Check headings follow a logical order.
- Check contrast on hero text, glass cards, filters, badges, CTAs, and disabled/empty/loading states.
- Test mobile touch targets and spacing at narrow viewport widths.
- Enable reduced motion in the OS/browser and verify decorative motion is reduced while content and interactions remain available.

### Responsive validation

- Mobile narrow viewport: no horizontal scroll; header and CTA remain usable.
- Tablet viewport: content order remains intact and cards do not crowd.
- Desktop viewport: hero uses scale/space without adding dashboard-like chrome.

## Rollout and review strategy

- Keep implementation as a single homepage-focused change if the diff remains comfortably under the 400 changed-line review budget.
- If the future implementation approaches or exceeds the 400-line budget, pause under `ask-on-risk` and request a delivery decision before proceeding.
- Safe split if needed:
  1. Component extraction preserving behavior.
  2. Visual landing redesign with route-aware nav.
  3. Accessibility/responsive polish and validation fixes.
- Rollback should restore the prior homepage route behavior and existing tournament directory/search/filter experience.

## Out of scope

- No Firebase schema, rules, auth, permission, or creation-flow changes.
- No package additions, paid assets, or font strategy changes.
- No redesign of non-homepage admin/application navigation.
- No source-code implementation in this design phase.
