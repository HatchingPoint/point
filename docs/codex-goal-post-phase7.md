# Codex Goals After Phase 7

> **Historical.** Phases 8–11 are complete. Use [phase12-plan.md](./phase12-plan.md) and [codex-goal-phase11.md](./codex-goal-phase11.md) for current agent work.

Phases 0–7 and publish are **complete**. This doc archived Phase 8 goals.

**Current plan:** [phase12-plan.md](./phase12-plan.md)  
**Review:** [phase7-complete-review.md](./phase7-complete-review.md)  
**Progress log:** [codex-progress.md](./codex-progress.md)

---

## Sanity check

```bash
cd c:\Users\mcarr\Documents\clones\point-1
bun install
bun run ci
```

Expected: pass (78 tests).

---

## Goal A — Publish packages ✅ Done

`@hatchingpoint/point@0.0.9` on npm; `hatchingpoint.point@0.0.9` on VS Code Marketplace; GitHub Actions publish on tag push. See [publishing.md](./publishing.md).

---

## Goal B — Refresh master plan docs ✅ Done

`full-language-plan.md`, `phase7-complete-review.md`, and `adoption-postmortem.md` reflect Phase 7 architecture and live publish status.

---

## Goal C — Phase 8.1 Editor experience

```text
/goal Execute docs/phase8-plan.md section 8.1 only: format-on-save, explain hover, repair quick-fix stub in packages/point-vscode. Read docs/phase8-plan.md and extension.js first. Run bun run ci. Append checkpoint to docs/codex-progress.md. Do not change compiler architecture.
```

---

## Goal D — Phase 8.2 Dogfood module

```text
/goal Execute docs/phase8-plan.md section 8.2: add one real-world Point module under examples/adopters/hatchingpoint/ with README and CI smoke test. Use routes/actions/std.http if appropriate. Run bun run ci. Append checkpoint to docs/codex-progress.md.
```

---

## Goal E — Python emit spike (optional)

```text
/goal Read docs/python-emit-research.md and docs/phase7-complete-review.md. Prototype a minimal Python emitter from PointCoreProgram AST for examples/math.point only. Keep TS emit unchanged. Add tests. Document limitations. Run bun run ci.
```

---

## Goal F — Audit only (no code changes)

```text
/goal Read docs/phase8-plan.md, docs/phase7-complete-review.md, docs/language-spec.md. Produce audit: gaps vs Python/TS, recommended Phase 8 priority order. Do not modify files unless asked.
```

---

## Prompt file (multi-goal router)

Pipe to Codex:

```powershell
Get-Content docs/codex-goal-post-phase7.prompt.txt -Raw | codex exec -
```

Then: `Execute Goal C — Phase 8.1 editor experience.`
