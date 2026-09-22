# Proposal — Landing page design direction

## Intent

Reposition the La Liguita homepage as a super-minimal, premium cinematic sports landing page that preserves the platform’s most visually striking identity while making the public tournament portal the primary product differentiator and `Crear torneo` the primary autoservice conversion path.

The page should communicate that an organizer can make a competition look official, public, and easy to share without needing manual onboarding or back-office setup.

## Scope

### In scope

- Define the homepage product/design direction for a future implementation phase.
- Preserve the existing orange brand accent as the main action, focus, and emphasis color.
- Keep the cinematic sports identity: dark premium atmosphere, restrained field/stadium/court cues, oversized editorial typography, and high-contrast CTA treatment.
- Lead with the public portal value proposition: fixtures, results, standings, and league information in one official shareable destination.
- Keep `Crear torneo` as the primary CTA linked to the autoservice tournament creation flow.
- Keep active tournament discovery/search/filter functionality as lower-page proof and utility.
- Maintain organizer-focused Spanish copy that feels professional, direct, and credible.
- Preserve accessibility expectations for semantic structure, focus states, readable contrast, touch targets, and reduced-motion behavior.

### Out of scope

- Source-code implementation in this phase.
- Removing or reducing tournament discovery/search/filter behavior.
- Replacing the orange brand accent with a new primary accent color.
- Reframing the homepage as a generic dashboard, admin console, or casual-only community page.
- Changing Firebase data flows, tournament creation behavior, authentication, or permissions.
- Adding paid assets, new packages, or font strategy changes unless approved in a later design/implementation phase.

## Affected areas

| Area | Expected direction |
| --- | --- |
| Homepage hero | Minimal cinematic first impression with a clear organizer promise and primary `Crear torneo` CTA. |
| Navigation | Transparent or low-chrome treatment over the hero, preserving quick access to tournament creation. |
| Public portal messaging | Elevated as the main differentiator and framed as the official public face of a competition. |
| Tournament directory | Retained lower on the page with existing search, filters, loading, empty states, and active tournament proof. |
| Visual system | Dark premium base, orange brand accent, glass/translucent surfaces, restrained sports geometry. |
| Copy | Spanish, organizer-led, confident, and concise. |
| Accessibility | Existing semantic and interaction affordances must be preserved or strengthened. |

## Proposed page narrative

1. **Hero:** “Tu competencia puede verse profesional hoy” through a minimal, cinematic sports presentation and direct `Crear torneo` CTA.
2. **Public portal differentiator:** Explain that every tournament can have an official public page for teams, players, spectators, sponsors, and organizers.
3. **Organizer workflow:** Show a simple create → configure → publish/update path.
4. **Proof and utility:** Keep active tournaments, search, and filters as evidence that the platform is live and usable.

## Product principles

- **Minimal, not empty:** Reduce clutter while preserving strong visual identity and product proof.
- **Premium, not generic SaaS:** Use sports atmosphere, typography scale, and orange accents rather than dashboard-heavy chrome.
- **Public-first:** The shareable tournament portal is the reason to believe, not a secondary feature.
- **Autoservice by default:** `Crear torneo` should feel like the natural next step from the hero.
- **Utility remains intact:** Discovery/search/filter functionality supports credibility and should not be removed.

## Risks

- A highly cinematic hero could obscure product comprehension if the portal benefit is not explicit.
- Over-minimalism could hide existing utility or make the page feel decorative instead of useful.
- Too much dashboard-style proof could regress toward the previously rejected generic operations-suite feel.
- Translucent dark surfaces may create contrast issues if not audited carefully.
- Large visual rewrites in a future implementation phase could exceed the 400-line review budget and require a delivery decision.

## Rollback

Because this phase only creates an OpenSpec proposal, rollback is limited to reverting or replacing this proposal file.

For a future implementation phase, rollback should preserve the current homepage route behavior and restore the existing tournament directory/search/filter experience if the new direction fails validation.

## Success criteria

- The proposal clearly preserves the confirmed product direction: super minimal, premium cinematic sports identity, original orange accent, public portal differentiator, and `Crear torneo` as primary CTA.
- The proposal explicitly protects active tournament discovery/search/filter functionality as lower-page proof and utility.
- The scope is narrow enough for later design/spec/task phases to plan implementation without changing product direction.
- Future reviewers can identify affected areas, risks, non-goals, rollback expectations, and acceptance signals without reconstructing the exploration.
- No source-code implementation is included in this phase.
