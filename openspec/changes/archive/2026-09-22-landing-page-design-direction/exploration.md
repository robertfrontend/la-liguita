# Exploration — Landing page design direction

## Change
`landing-page-design-direction`

## Scope
Product/design exploration only. No application source files were changed.

## Inputs reviewed
- `openspec/config.yaml`
- `openspec/sdd-init/la-liguita.md`
- `README.md`
- `odd/tasks/homepage-redesign.md`
- `odd/tasks/homepage-professional-dashboard.md`
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/features/PublicTournamentDirectory.tsx`
- `src/components/features/PublicTournamentPortal.tsx`
- `src/components/features/CreateTournamentForm.tsx`
- `src/components/ui/Button.tsx`

## Current product and design constraints

La Liguita is a Next.js sports tournament platform with Firebase-backed public tournament pages, admin tools, live scoring, standings, stats, rosters, schedules, media, and tournament creation. The homepage route currently renders `PublicTournamentDirectory`, while `RootLayout` loads Inter and suppresses the global `TopNav` only on `/` through `RouteAwareAppShell`.

The current homepage already moved away from a simple directory and now behaves like a product-first landing page. It uses:

- A transparent homepage navigation with a primary `Crear torneo` CTA.
- A cinematic dark hero with a field/stadium-like abstract background.
- Oversized centered lightweight typography.
- An italic accent word in orange.
- Pill CTAs.
- Product sections for the public portal, organizer workflow, and active tournaments.
- A preserved tournament directory with search, sport filters, loading and empty states.

The global brand/system uses a dark base and orange primary accent:

- `--background: #09090b`
- `--primary: #f97316`
- `--secondary/card: #18181b`
- `--border: #27272a`

The orange accent is not incidental. It is present in global tokens, current CTAs, focus rings, loading indicators, badges, and product cues, so the landing direction should preserve orange as the main action/accent color rather than switching to lime or a generic sports green.

## Audience and strategic objective

The landing page should sell to formal league organizers, not only casual players. The buyer needs to trust that the league will look organized, official, and easy to communicate to teams, players, families, sponsors, and spectators.

Primary conversion action:

- `Crear torneo` via `/tournament/new`, positioned as autoservice.

Main differentiator:

- The professional public tournament portal that organizers can share as the official source for fixtures, results, standings, and league information.

Secondary utility:

- Active tournament discovery remains useful as proof and as a public directory, but should not lead the page.

## Design direction options

### Option A — Cinematic premium sports flagship

A full-bleed, high-impact sports landing page inspired by premium broadcast/event sites. It uses an atmospheric field/court hero, transparent navigation, oversized editorial headline, italic orange accent word, and high-contrast pill CTAs.

Strengths:

- Matches the supplied reference most directly.
- Makes La Liguita feel premium and public-facing rather than like an internal admin panel.
- Supports emotional selling: leagues look more serious when their public portal looks official.
- Works well with the existing orange brand token.
- Creates a strong above-the-fold moment for `Crear torneo`.

Risks:

- If overdone, visual drama can obscure the product proof.
- Requires disciplined contrast and typography to avoid a generic dark-gradient SaaS look.
- Needs real or abstract sports imagery/court geometry with enough restraint to stay formal.

Best use:

- Primary recommendation for the current landing page.

### Option B — Institutional sports operations suite

A more B2B direction: dark professional dashboard, live match modules, schedule cards, standings panels, and organizer control surfaces. It sells reliability, workflow, and operational confidence.

Strengths:

- Speaks directly to formal organizers managing real competitions.
- Makes product capabilities concrete.
- Can reuse existing app surfaces and tournament data affordances.

Risks:

- Previous notes indicate a dashboard pass was rejected as generic.
- It can feel more like a logged-in product screen than a premium landing page.
- It may underplay the public tournament portal as a shareable public destination.

Best use:

- Secondary sections below the hero, especially portal preview, workflow, and directory proof.

### Option C — Community-first local sports identity

A warm, neighborhood-league visual language with team crests, player/community moments, stickers, club textures, and accessible copy. It would emphasize belonging and easy participation.

Strengths:

- Strong emotional fit for casual leagues and local sports communities.
- Differentiates from sterile SaaS competitors.
- Could make the product approachable for first-time organizers.

Risks:

- Less aligned with the user’s stated desire to sell to formal league organizers.
- Can feel less premium if not controlled.
- May dilute the cinematic reference and the public-portal differentiator.

Best use:

- Supporting copy, testimonials, empty states, and future brand illustration—not the main visual direction.

## Recommendation

Adopt Option A: **Cinematic premium sports flagship**, with Option B used as supporting proof sections.

The ideal direction is a premium sports landing page that feels like a tournament broadcast/presentation layer first, and an organizer tool second. The page should immediately communicate: “your competition can look official today.” The portal should be framed as the public face of the league, while the autoservice create flow is framed as the fastest path to publishing that face.

Recommended creative principle:

> La Liguita turns a local competition into a polished public sports product.

## Concrete visual system

### Color

Preserve the original orange as the core action and brand accent.

- Background: near-black / warm black (`#0b0805`, `#09090b`).
- Primary accent: orange (`#f97316`) and accessible variants for hover/focus.
- Text: white and warm white with opacity steps.
- Surfaces: translucent white on black, black glass, and subtle orange glows.
- Avoid replacing orange with lime/green as the main accent.

Orange should own:

- Primary CTA backgrounds.
- Focus rings.
- Hero accent word.
- Feature icons and portal status cues.
- Active filter states.
- Loading spinner.

### Typography

Keep the hero oversized, centered, lightweight, and editorial.

- Hero headline: very large, light weight, tight tracking, centered.
- Accent word: italic serif or serif-like styling in orange.
- Section titles: light or semibold, compressed vertical rhythm, premium editorial tone.
- Body copy: clear, medium-weight, high contrast, short sentences.

The existing Inter foundation is acceptable, but the design should avoid feeling like default Inter SaaS by relying on scale, weight contrast, italic accent, and sports-specific composition.

### Hero composition

Use a full-bleed cinematic sports environment, preferably abstract enough to avoid asset dependency:

- Transparent nav over hero.
- Stadium/court/field geometry in background.
- Radial orange lighting and black vignette.
- Centered value proposition.
- Two pill CTAs: primary `Crear torneo`, secondary `Ver torneos activos`.
- A compact credibility badge above the headline.

Suggested hero message hierarchy:

1. Badge: `Portal público para ligas formales` or `+X competencias organizadas`.
2. Headline: `Organizá con presencia. Elevá tu liga.`
3. Subcopy: `Creá torneos, publicá fixtures y compartí un portal público profesional para equipos, jugadores y público.`
4. Primary CTA: `Crear torneo`.
5. Secondary CTA: `Ver torneos activos`.

### Information architecture

Recommended page flow:

1. Hero: emotional premium promise and autoservice CTA.
2. Public portal differentiator: explain why the public page matters.
3. Organizer workflow: create, configure, publish, update.
4. Product proof/directory: active tournaments with preserved search and filters.
5. Optional future proof: sample portal preview or testimonial once content exists.

The active tournament directory should be proof and utility, not the core pitch.

### Interaction and accessibility requirements

- Preserve visible focus rings, especially on nav links, CTA pills, filters, inputs, and tournament cards.
- Keep touch targets at least 44px.
- Preserve `prefers-reduced-motion` handling for transitions and transforms.
- Maintain readable contrast on glass surfaces.
- Keep semantic `header`, `nav`, `main`, `section`, headings, labels, and `aria-live` for loading/result counts.
- Avoid relying on color only for state where labels or icons can reinforce meaning.

## Copy direction

Use Spanish with direct organizer-focused language. Current copy can remain close to the existing direction. Favor professional confidence over hype.

Recommended phrases:

- `Portal público listo para compartir`
- `Tu competencia puede verse profesional hoy`
- `Menos planillas sueltas. Más liga.`
- `Creá el torneo, configurá equipos y publicá el portal`
- `La información oficial vive en un solo lugar`

Avoid language that makes the product feel only casual, internal, or experimental.

## Implementation notes for a future phase

No source changes were made in this exploration. If implementation follows, the current `PublicTournamentDirectory.tsx` is already directionally aligned with this recommendation. A future implementation phase should refine rather than restart:

- Keep the cinematic hero and orange accent system.
- Strengthen the public-portal proof with a more explicit mock/preview if scope allows.
- Audit all contrast on translucent cards over the hero and dark backgrounds.
- Keep tournament discovery behavior intact.
- Avoid adding packages unless a later explicit design choice requires a new asset/font strategy.

## Decision

Recommended design direction: **Cinematic premium sports flagship with preserved orange accent and public-portal-led messaging**.

This best satisfies the supplied reference, the formal-organizer audience, the autoservice `Crear torneo` conversion goal, and the product differentiator of a professional public tournament portal.
