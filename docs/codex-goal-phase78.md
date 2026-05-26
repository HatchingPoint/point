# Codex goals — Phase 78 (overnight integrator)

**North star:** Measured ops TS scaffold + notes form app-repair → v0.1.56.

Run in a **dedicated Agent chat** with auto-run ON. One goal per tick unless integrator ships.

---

## P78-1 — Ops Next.js scaffold

/goal Execute docs/phase78-plan.md P78-1: Add `benchmarks/next-ops-dashboard/` paired scaffold (mirror job-queue ops dashboard pattern). Wire `ops-add-dashboard` and ops app-repair cases with `nextDashboardCaseId`. Add `tests/next-ops-dashboard-scaffold.test.ts`. Remove heuristic TS padding for those cases when measured context exists. `bun run ci`. Append docs/codex-progress.md. Commit if green: "Phase 78 P78-1: measured ops Next scaffold."

---

## P78-2 — Notes create-form app-repair

/goal Execute docs/phase78-plan.md P78-2: Add `notes-create-form-wiring` app-repair fixture (bind textarea wrong target on notes create form). Register in agent-app-benchmark.ts, goldenEditsForCase, bump agent-app gate to 13 and model-eval gate to 13. `bun run ci`. Append codex-progress. Commit if green: "Phase 78 P78-2: notes create-form app-repair."

---

## P78-3 — CI + gates

/goal Execute docs/phase78-plan.md P78-3: Confirm agent-app gate 13 and model-eval gate 13. Export agent-app-cases.json. `bun run ci`. Update phase78-plan checkboxes. Append codex-progress.

---

## P78-4 — Ship v0.1.56

/goal Execute docs/phase78-plan.md P78-4: If P78-1–P78-3 complete and ci green: `bun scripts/bump-version.ts patch`, update README/product-map/site changelog, commit, tag v0.1.56, push tag. Sync LandingPage agent-app-cases. Append codex-progress. Skip if P78 incomplete.

---

## Loop prompt (paste into /loop)

```
Read docs/phase78-plan.md and docs/codex-goal-phase78.md. Execute the next unchecked P78-N goal. Respect file ownership table. Run bun run ci before commit. Bump gates when adding cases. Append docs/codex-progress.md. If all P78 boxes checked and ci green, run P78-4 ship ritual. Do not touch packages outside ownership for parallel chats.
```
