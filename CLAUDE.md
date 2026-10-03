# Claude Guide

Use `AGENTS.md` as the canonical project and agent guide.

Critical points:

- This project uses Next.js `16.2.9`; read `node_modules/next/dist/docs/` before changing routing, route handlers, middleware/proxy, or server/client component conventions.
- Current target is a pragmatic `7/10` hobby-project baseline, not an enterprise rewrite.
- The current school-term priority is Finnish reading fluency and Finnish writing; other quests remain secondary.
- Quest metadata belongs in `lib/tracks.ts`; avoid new duplicated quest labels, table maps, quest counts, or capability sets.
- Word-pairing score and XP must be recomputed server-side.
- Finnish fluency saves one passage per date, records three complete rereads, calculates correct words per minute from adult-entered misreads and reading duration, and records at least 15 minutes of daily reading. It must not treat school screening levels as app difficulty or diagnosis.
- Finnish writing feedback should use AI with the previous three Finnish entries, give exact corrections and one practice exercise, and avoid numeric grades.
- Writing submissions require at least 500 characters.
- Difficulty should come from `track_settings.current_level`.
- Reward eligibility should use awarded points and registry-whitelisted table lookup.

Validation commands:

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

Expected current status:

- 16 unit tests pass.
- 11 E2E regression tests pass.
- Typecheck passes.
- Build passes with the existing Next.js middleware deprecation warning.
