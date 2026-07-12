# Agent Guide

## Next.js Version Warning

This is not the Next.js version most agents may know from training data.

The project uses Next.js `16.2.9`. APIs, routing conventions, middleware/proxy behavior, and file structure can differ from older versions. Before changing routing, server components, route handlers, middleware/proxy, or build conventions, read the relevant local guide under:

```text
node_modules/next/dist/docs/
```

The current build still warns that the `middleware` file convention is deprecated and should move to `proxy`. Do not rename it blindly; check the local Next.js 16 docs first.

## Project Goal

SummerQuest is a family learning tracker for Summer 2026. Children complete daily quests, earn XP, receive AI feedback, and request rewards.

The current target is a pragmatic `7/10` hobby-project baseline:

| Area | Target |
| --- | ---: |
| Coding Structure | 7/10 |
| Tidiness | 7/10 |
| Design Pattern | 7/10 |
| Test Coverage | 6/10 |
| Extendibility | 7/10 |
| Security | 6.5/10 |
| Overall | 7/10 |

Prefer practical, low-risk improvements over large rewrites.

## Current Architecture Rules

Use `lib/tracks.ts` as the central quest registry.

Do not add new local hard-coded maps for:

- quest labels
- quest counts
- settings-track names
- entry table names
- level support
- AI-graded support
- word-pairing daily target or point-cap behavior

When adding or changing a quest, start in `lib/tracks.ts`, then update route/UI/database code only where necessary.

## Important Behavior

Writing feedback:

- English and Finnish writing feedback should use AI analysis, not hard-coded review text.
- Same-language previous writing history should be included where available.
- The current plan is to pass the last 3 previous entries plus the current writing to the AI prompt.

Word pairing:

- Never trust client-provided score or XP.
- Server recomputes score through `computeWordPairingResult`.
- XP is awarded only for a perfect score.
- The scorer rejects empty, missing, duplicate, or foreign-ID payloads.

Difficulty:

- Difficulty comes from `track_settings.current_level`.
- It must affect word-pairing rounds, reading generation, math/science generation, and writing prompts.

Rewards:

- Reward eligibility should use awarded points, not entry count multiplied by current settings.
- Dynamic SQL table interpolation must go through the registry whitelist first.

## Validation Commands

Run these after meaningful code changes:

```powershell
npm.cmd run test:unit
npm.cmd run test:e2e
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

Current expected status:

- `npm.cmd test` passes with 9 unit tests and 6 E2E regression tests.
- `npm.cmd run typecheck` passes.
- `npm.cmd run build` passes, with the existing Next.js middleware deprecation warning.

## Test Layout

Unit tests:

```text
tests/unit/quest-unit-tests.mjs
```

Regression/E2E-style source checks:

```text
tests/e2e/quest-regressions.test.mjs
```

The tests intentionally use a lightweight Node harness instead of a heavy browser stack.

## Documentation

Keep `README.md`, `AGENTS.md`, and `CLAUDE.md` aligned when changing the project plan, quality target, or validation workflow.
