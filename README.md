# SummerQuest

SummerQuest is a family learning app for the 2026-27 school year. Its main focus is Finnish literacy: daily oral reading practice with repeated passages and words-correct-per-minute tracking, plus Finnish writing with specific, teachable feedback. Other learning quests and the family reward system remain available around that core.

## School-Term Learning Focus

The school recommends regular reading for 15 minutes a day and repeated oral reading of the same text. Finnish Fluency supports that routine by saving one passage for the day and timing three complete rereads. An adult records misread or skipped words; the server calculates correctly read words per minute from the passage length and elapsed time. The family records the total daily reading minutes before the session is completed, with a 15-minute minimum.

The app compares a learner's own practice results over time. The school's indicative level is not treated as a diagnosis or mapped to the app's 1-10 content setting. Reading scores are entered by the family; AI does not judge pronunciation or fluency.

Finnish writing remains a separate practice. Its current minimum is 500 characters. AI feedback should point to exact phrases, give a simple correction, and suggest one small exercise. It should not give a grade or claim progress without evidence from earlier writing.

## Current Quality Target

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

The focus is not enterprise completeness. The focus is keeping the app understandable, safe enough for family use, and easy to extend without hard-coded drift.

## Architecture Plan

### Quest Registry

All quest metadata should be centralized in `lib/tracks.ts`.

The registry owns:

- quest route key, for example `english-reading`
- settings key, for example `english_reading`
- database table for normal entry tracks
- display label and card code
- category
- capability flags such as `hasLevel`, `aiGraded`, `hasDailyTarget`, `hasPointCap`, and `wordPairing`
- future-date visibility

Consumers should import from the registry instead of creating local maps:

- daily quest UI
- admin settings UI
- progress UI
- rewards UI
- reward point validation
- total quest count

This is the main design-pattern improvement. Adding or changing a quest should start in `lib/tracks.ts`.

### Quest Types

Current quest groups:

- normal entry quests: sport, books, piano, diary, AI project
- AI-reviewed writing quests: English and Finnish
- AI-generated reading quests: Chinese, Swedish, French, English Reading
- Finnish Fluency: one persisted daily passage, three timed full rereads, and server-calculated correct-words-per-minute tracking
- AI-generated problem quests: Math, Science
- word-pairing games: English-Finnish, English-Chinese, English-Swedish, English-French

From 2026-10-05 onward, Math, Sport, Piano, and all word-pairing quests are hidden from daily quest views. Dates before the cutoff retain the original quest set; daily and calendar completion counts use each date's applicable quest total.

### AI Model Configuration

AI-generating API routes should use the configured model helper instead of hard-coding a model in each route.

Relevant files:

- `lib/ai/settings.ts`
- `lib/ai/client.ts`
- `lib/ai/prompts.ts`
- `app/api/entries/*/route.ts`

English writing feedback should include recent same-language writing history where available. Finnish writing feedback should include the previous three entries and:

- fetch the last 3 previous entries for the same language
- pass those previous entries plus the current writing to the AI prompt
- identify exact phrases to correct and explain one useful writing pattern
- avoid scores and unsupported claims about progress

Finnish Fluency should:

- create one saved passage per learner and date, so refreshes reuse it
- avoid recently used topics without sending old article text to the AI
- save three complete reads in order, calculate words-correct-per-minute on the server, and award quest points only after all three reads and at least 15 minutes are recorded
- show the learner's recent personal results without mapping them to school screening levels

### Word-Pairing Scoring

Word-pairing XP must be server-verifiable.

Rules:

- the client may submit selected word IDs, but not trusted score or XP
- the server recomputes correctness with `computeWordPairingResult`
- XP is awarded only for a perfect score
- daily point caps are enforced server-side
- malformed, missing, duplicate, empty, or foreign-ID payloads are rejected

Relevant files:

- `lib/word-pairing-scoring.js`
- `app/api/entries/word-pairing/route.ts`
- `components/game/WordPairingGame.tsx`

### Difficulty Levels

Difficulty must come from `track_settings.current_level`.

Applied areas:

- word-pairing initial round and next rounds
- Chinese, Swedish, French reading
- English Reading and Finnish Reading
- Math and Science generation
- English and Finnish writing prompt level

Regression tests should keep checking that difficulty is actually used in code paths.

### Rewards

Reward eligibility should be based on awarded points, not recalculated entry counts multiplied by current settings.

Rules:

- normal tracks sum `points_awarded`
- word-pairing tracks sum `entries_word_pairing.points_awarded` for the language pair
- table lookup must use the registry whitelist before any dynamic SQL table interpolation

Relevant file:

- `app/api/rewards/request/route.ts`

## Design Plan

The app now uses a dark HUD-style visual direction across core pages.

Design goals:

- consistent page background and view background
- strong mobile-first quest card layout
- clean admin/guardian screens without corrupted visible text
- shared track labels from the registry
- no duplicated quest list in daily/progress/admin UI

If adding more UI, preserve the current HUD style unless intentionally redesigning the full app.

## Testing Plan

The project uses lightweight Node-based tests instead of a heavy browser test stack for now.

Scripts:

```powershell
npm.cmd run test:unit
npm.cmd run test:e2e
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

### Unit Tests

File:

- `tests/unit/quest-unit-tests.mjs`

Coverage:

- word-pairing perfect score
- word-pairing partial score rounding
- empty and non-array payload rejection
- missing answer rejection
- duplicate answer rejection
- foreign selected-ID rejection
- duplicate displayed-word rejection
- quest registry unique tracks/settings keys
- word-pairing registry capability flags
- reward route registry whitelist usage
- daily/admin UI registry dependency
- Finnish fluency rate calculation and invalid-attempt rejection
- Finnish writing prompt avoids numeric grading

### E2E Regression Harness

File:

- `tests/e2e/quest-regressions.test.mjs`

Coverage:

- server-verifiable word-pairing scoring
- word-pairing perfect-only XP
- word-pairing difficulty passed to initial and next rounds
- reading difficulty loaded from `track_settings`
- Finnish Fluency draft reuse, three-attempt validation, and recent personal history
- Finnish writing feedback gives concrete corrections without a numeric score
- AI routes use configured model
- key UI/reward paths use centralized quest metadata

## Validation Status

Latest validated commands:

```powershell
npm.cmd run test:unit
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

Expected current result:

- unit tests pass
- E2E regression tests pass
- TypeScript typecheck passes
- production build passes
- Next.js still shows the existing `middleware` deprecation warning
- current test count: 17 unit tests and 12 E2E regression tests

## Remaining Plan

To move beyond `7/10`, prioritize these in order:

1. Rename `middleware.ts` to the current Next.js `proxy` convention after checking the Next 16 docs.
2. Move repeated SQL union queries in `lib/calendar.ts` and `lib/progress.ts` behind shared query builders or views.
3. Add route-level authorization tests for guardian/admin/child boundaries.
4. Add database-backed integration tests when a disposable test database is available.
5. Continue removing old inline styles and align admin pages fully with the HUD design system.
6. Replace non-null environment assertions with explicit startup/runtime validation.

## Development

For a database that has already run migrations 001-011, apply `db/migrate_012.ts` before using the Finnish fluency flow.

Install dependencies:

```powershell
npm.cmd install
```

Run locally:

```powershell
npm.cmd run dev
```

Build:

```powershell
npm.cmd run build
```

Database helpers:

```powershell
npm.cmd run db:schema
npm.cmd run db:seed
```

## Next.js Note

This project uses Next.js `16.2.9`. Before changing routing, middleware/proxy, server components, or route handlers, check the local documentation under:

```text
node_modules/next/dist/docs/
```
