# SDD Init — la-liguita

## Session Preflight

- Execution mode: auto
- Artifact store: openspec
- Delivery strategy: ask-on-risk
- Review budget: 400 changed lines
- Chain strategy: deferred until chaining is selected
- Size exceptions require explicit acceptance of `size:exception`
- Preserve human-controlled gates for consent, authorization, security, destructive/publishing operations, ambiguous scope, and size exceptions

## Project Context

La Liguita is a Next.js web application for casual sports league and tournament management. It supports public tournament pages, league and game history, live scoring, leaderboards, admin/superadmin areas, rosters, referees, media, standings, stats, and Firebase-backed data flows.

## Detected Stack

- Package manager: npm (`package-lock.json` present)
- Framework: Next.js 16.1.6 using App Router under `src/app`
- Language: TypeScript 5 with `strict: true`
- UI: React 19.2.3
- Styling: Tailwind CSS 4 through `@tailwindcss/postcss`
- State: Zustand with persistence in `src/lib/store.ts`
- Backend/data: Firebase client SDK, Firestore, Auth, and `firestore.rules`
- Icons: Lucide React
- Path alias: `@/*` -> `./src/*`

## Validation and Testing

Configured package scripts:

- `npm run dev` — local development server
- `npm run build` — Next.js production build
- `npm run start` — Next.js production start
- `npm run lint` — ESLint using Next core-web-vitals and TypeScript presets

Derived validation command:

- `npx tsc --noEmit` — TypeScript typecheck, because no explicit `typecheck` script exists

Test runner status:

- No explicit workspace-wide test command covering every project was detected.
- No Jest, Vitest, Playwright, or test files were detected.
- Lint, typecheck, and build are validation commands, not a test runner.
- Strict TDD is disabled for this initialization until an explicit workspace-wide test command/test runner is added; feature work should still establish the nearest executable validation before implementation.

## Repository Conventions Observed

- Application routes live under `src/app`.
- Feature components live under `src/components/features`.
- Layout/navigation components live under `src/components/layout`.
- Providers live under `src/components/providers`.
- Shared UI primitives live under `src/components/ui`.
- Firebase access and data helpers live under `src/lib/db.ts` and `src/lib/firebase.ts`.
- Zustand state lives under `src/lib/store.ts`.
- Shared domain types live under `src/lib/types.ts` and `src/types/tournament.ts`.

## SDD Operating Rules

1. Prefer small, reviewable work units and pause when work risks exceeding 400 changed lines.
2. Use `ask-on-risk`; do not invent a chain strategy or size exception.
3. Keep OpenSpec artifacts under `openspec/` and preserve user-maintained SDD configuration.
4. Treat Firebase rules, auth, publishing, and destructive data operations as gated work requiring explicit user authorization.
5. For feature work, start with a failing test when an appropriate runner exists; otherwise establish the nearest executable validation before implementation.

## Skill Registry

`.atl/skill-registry.md` exists and indexes available skills with exact `SKILL.md` paths for delegators. No subagents were launched during init.
