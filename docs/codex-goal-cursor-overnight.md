# Cursor overnight loop — Phase 26+ language improvement

Use this in **Cursor Agent** with `/loop` while you're away. Machine must stay on; Cursor open.

---

## One-line start

Paste in Cursor chat:

```text
/loop 45m Read docs/codex-goal-phase26-overnight.prompt.txt and execute it fully. After each wave integrator, run the Phase release ritual in that file. If Phase 26 exit gate is checked, continue with docs/phase27-plan.md.
```

---

## Release ritual (after every wave integrator or phase exit)

1. `bun run ci` (must pass)
2. Mark checkboxes in active phase plan
3. Append checkpoint to `docs/codex-progress.md` with principles gate
4. Bump `package.json`, `packages/point/package.json`, `packages/point-vscode/package.json`
5. Update `CHANGELOG.md` and `docs/site/changelog.md`
6. Commit on `main`: `Release vX.Y.Z with Phase NN …`
7. `git push origin main && git tag vX.Y.Z && git push origin vX.Y.Z`
8. LandingPage: if `../LandingPage` exists run `npm run sync:point-docs && npm run build && git push`
9. Optional: bump point-pulse `@hatchingpoint/point`

---

## Expand when finished early

When all Phase 26 checkboxes are `[x]`, release v0.1.18+ then continue Phase 27 (`docs/phase27-plan.md`).

---

## Current queue

| Status | Item |
|--------|------|
| Done | P26-1–4 Wave 1 (merged main) |
| Next | P26-5 pipeline I/O, P26-6 money lint, P26-7 load-data repairs |
| Then | Phase 27 → v0.1.19 |
