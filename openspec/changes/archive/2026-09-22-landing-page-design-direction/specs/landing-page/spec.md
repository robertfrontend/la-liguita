# Landing Page Specification

## Purpose

Define the required behavior for a super-minimal, premium cinematic sports homepage that preserves the public tournament portal as the main differentiator, keeps `Crear torneo` as the primary autoservice conversion path, and retains existing tournament discovery utility.

## Requirements

### Requirement: Premium Sports Landing Direction

The landing page MUST present a super-minimal, premium cinematic sports experience using a dark high-contrast base, restrained sports venue/field/court cues, oversized editorial typography, glass or translucent surfaces only where readable, and the original orange brand accent as the primary action, focus, and emphasis color.

#### Scenario: First impression communicates the approved direction

- GIVEN a visitor opens the homepage
- WHEN the landing page renders
- THEN the page presents a minimal premium sports atmosphere rather than a generic dashboard, admin console, or casual-only community page
- AND the original orange brand accent is used for primary CTAs, focus indication, and key emphasis
- AND no new primary accent color replaces the orange brand accent.

#### Scenario: Visual treatment remains product-comprehensible

- GIVEN the homepage uses cinematic visuals or translucent surfaces
- WHEN a visitor reads the hero and supporting sections
- THEN the public tournament portal benefit remains explicit and readable
- AND decorative treatment does not obscure text, controls, or product meaning.

### Requirement: Public Portal Value Proposition

The landing page MUST lead with the public tournament portal value proposition: an official shareable destination for fixtures, results, standings, league information, and tournament updates for teams, players, spectators, sponsors, and organizers.

#### Scenario: Hero explains the public product benefit

- GIVEN a visitor reaches the hero section
- WHEN they scan the headline, supporting copy, and primary content
- THEN they can understand that La Liguita helps an organizer make a competition look official, public, and easy to share
- AND the page does not frame the product primarily as an internal operations suite.

#### Scenario: Public links remain discoverable

- GIVEN active tournaments are shown on the homepage
- WHEN a visitor chooses a tournament public link or public tournament card action
- THEN the link takes them to the corresponding public tournament destination
- AND the destination intent is identifiable before activation.

### Requirement: Single Homepage Navigation

The landing page MUST expose only one homepage navigation system and MUST avoid duplicate, competing, or contradictory navigation bars on the homepage.

#### Scenario: Homepage has one navigation landmark

- GIVEN the homepage has loaded at any supported viewport size
- WHEN assistive technology or visual scanning identifies page navigation
- THEN exactly one primary navigation landmark or equivalent header navigation is available
- AND it includes clear access to tournament creation.

#### Scenario: Navigation remains low-chrome over the hero

- GIVEN a visitor views the top of the homepage
- WHEN the navigation appears over or near the hero
- THEN it remains transparent or low-chrome enough to preserve the cinematic first impression
- AND it remains legible, operable, and non-overlapping.

### Requirement: CTA Destinations

The landing page MUST make `Crear torneo` the primary CTA and route every `Crear torneo` CTA to the autoservice tournament creation flow without changing authentication, permissions, or creation behavior.

#### Scenario: Primary CTA opens tournament creation

- GIVEN a visitor activates the primary `Crear torneo` CTA from the hero
- WHEN the navigation action completes
- THEN the visitor is taken to the existing tournament creation flow
- AND no unrelated pricing, onboarding, dashboard, or marketing route intercepts the action.

#### Scenario: Repeated CTAs stay consistent

- GIVEN the page includes additional `Crear torneo` CTAs beyond the hero
- WHEN any `Crear torneo` CTA is activated
- THEN each CTA resolves to the same autoservice tournament creation destination or equivalent authorized creation entry point.

### Requirement: Tournament Directory Preservation

The landing page MUST retain active tournament discovery as lower-page proof and utility, including existing subscription behavior, search behavior, sport filters, public links, loading states, and empty states.

#### Scenario: Active tournaments continue loading

- GIVEN active tournaments are available from the existing data source
- WHEN the homepage tournament directory subscribes or loads
- THEN active tournaments are displayed using the current public data behavior
- AND Firebase data flows, authentication, permissions, and tournament creation behavior are not changed by the landing page redesign.

#### Scenario: Search filters active tournaments

- GIVEN active tournaments are displayed
- WHEN a visitor enters a tournament search query
- THEN the tournament list updates to reflect matching active tournaments
- AND clearing the query restores the relevant unsearched list.

#### Scenario: Sport filters remain available

- GIVEN active tournaments include sport metadata
- WHEN a visitor chooses a sport filter
- THEN the tournament list updates to tournaments matching that sport filter
- AND the visitor can return to an all-sports or unfiltered state.

#### Scenario: Loading state is preserved

- GIVEN tournament data is still loading
- WHEN the visitor reaches the tournament directory area
- THEN the page communicates that tournament content is loading
- AND the loading state does not block use of the primary homepage CTA.

#### Scenario: Empty state is preserved

- GIVEN no active tournaments match the current directory state, search, or filter
- WHEN the tournament directory renders
- THEN the page presents a clear empty state
- AND the empty state preserves a route or message that supports creating or discovering tournaments without implying an application error.

### Requirement: Responsive Layout Behavior

The landing page MUST adapt cleanly across mobile, tablet, and desktop viewports while preserving content order, CTA access, tournament discovery utility, and the premium minimal direction.

#### Scenario: Mobile viewport remains usable

- GIVEN a visitor opens the homepage on a narrow mobile viewport
- WHEN they scroll through the page
- THEN headline text, CTAs, navigation, portal messaging, tournament search, filters, and tournament cards fit without horizontal scrolling
- AND the primary `Crear torneo` CTA remains easy to find before the lower-page tournament directory.

#### Scenario: Desktop viewport uses space without clutter

- GIVEN a visitor opens the homepage on a desktop viewport
- WHEN the page renders
- THEN the layout uses scale, spacing, and atmospheric sports cues to feel premium
- AND it does not add dashboard-heavy chrome or nonessential controls that weaken the minimal direction.

### Requirement: Semantic Accessibility

The landing page MUST preserve or strengthen semantic structure, readable contrast, accessible names, and keyboard/screen-reader operability for all navigation, CTA, search, filter, public link, loading, and empty-state interactions.

#### Scenario: Page structure is semantic

- GIVEN assistive technology reads the homepage
- WHEN it enumerates landmarks, headings, and controls
- THEN the page exposes a logical heading order, one main content area, one primary navigation system, and named interactive controls.

#### Scenario: Contrast remains readable

- GIVEN text, controls, cards, and translucent surfaces appear on the dark premium background
- WHEN a visitor reads or operates them
- THEN foreground content maintains readable contrast in default, hover, active, disabled, and focus states.

### Requirement: Focus Behavior and Touch Targets

The landing page MUST provide visible focus behavior using the original orange accent where appropriate and MUST keep interactive target sizes suitable for touch input.

#### Scenario: Keyboard focus is visible and ordered

- GIVEN a visitor navigates the homepage by keyboard
- WHEN focus moves through navigation, CTA, search, filters, tournament cards, and public links
- THEN focus is visible, follows the visual and semantic order, and does not become trapped or hidden behind decorative layers.

#### Scenario: Touch targets are operable

- GIVEN a visitor uses a touch device
- WHEN they interact with navigation items, CTAs, search controls, filters, and public links
- THEN each interactive target is large enough to activate reliably without requiring precision taps
- AND adjacent targets do not overlap.

### Requirement: Reduced-Motion-Safe Interactions

The landing page MAY use refined motion or hover interactions, but it MUST respect reduced-motion preferences and MUST keep core content and actions available when animation is disabled.

#### Scenario: Reduced motion preference is respected

- GIVEN a visitor has requested reduced motion at the system or browser level
- WHEN the homepage renders or interactive states change
- THEN nonessential animation, parallax, cinematic movement, or looping motion is reduced or removed
- AND content comprehension, CTA access, navigation, and tournament discovery remain unchanged.

#### Scenario: Motion never gates interaction

- GIVEN animations or transitions are enabled
- WHEN a visitor interacts with CTAs, navigation, search, filters, or public tournament links
- THEN the interaction does not depend on completing a decorative animation
- AND no animation prevents keyboard, pointer, or touch operation.
