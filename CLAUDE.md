# Claude Guide

Use `AGENTS.md` as the canonical project and agent guide.

Critical points:

- This project uses Next.js `16.2.9`; read `node_modules/next/dist/docs/` before changing routing, route handlers, middleware/proxy, or server/client component conventions.
- Current target is a pragmatic `7/10` hobby-project baseline, not an enterprise rewrite.
- Quest metadata belongs in `lib/tracks.ts`; avoid new duplicated quest labels, table maps, quest counts, or capability sets.
- Word-pairing score and XP must be recomputed server-side.
- Writing feedback should use AI with recent same-language writing history where available.
- Difficulty should come from `track_settings.current_level`.
- Reward eligibility should use awarded points and registry-whitelisted table lookup.

Validation commands:

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

Expected current status:

- 9 unit tests pass.
- 6 E2E regression tests pass.
- Typecheck passes.
- Build passes with the existing Next.js middleware deprecation warning.
