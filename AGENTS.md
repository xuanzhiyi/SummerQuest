# Agent Guide

## Next.js Version Warning

This is not the Next.js version most agents may know from training data.

The project uses Next.js `16.2.9`. APIs, routing conventions, middleware/proxy behavior, and file structure can differ from older versions. Before changing routing, server components, route handlers, middleware/proxy, or build conventions, read the relevant local guide under:

```text
node_modules/next/dist/docs/
```

The current build still warns that the `middleware` file convention is deprecated and should move to `proxy`. Do not rename it blindly; check the local Next.js 16 docs first.

## Project Goal

SummerQuest is a family learning app for the 2026-27 school year. Its main focus is Finnish reading fluency and writing. Other quests and rewards remain secondary features.

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
- Finnish feedback uses the last 3 previous entries plus the current writing, identifies exact corrections, and gives one small practice exercise.
- Finnish writing feedback must not give a score or claim progress without evidence.
- Writing requires at least 500 characters.

Finnish fluency:

- Support the school's daily 15-minute reading recommendation and repeated oral reading of the same passage.
- Save one passage per child and date so refreshes resume the same practice without another AI generation.
- Record three complete rereads in order. The adult enters misread/skipped words and reading duration; the server calculates correct words per minute.
- Compare personal practice results over time; do not map the school's indicative level to app difficulty or present it as a diagnosis.
- Avoid recently used topics without sending previous full passages in the AI prompt.
- Record at least 15 total reading minutes before completing the session.
- Award the reading quest points only after all three attempts and the 15-minute minimum are recorded.

Quest focus:

- Finnish reading fluency and Finnish writing are the primary school-term practice paths.
- Word-pairing exercises do not count as Finnish reading-fluency practice.

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

- `npm.cmd test` passes with 16 unit tests and 11 E2E regression tests.
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
