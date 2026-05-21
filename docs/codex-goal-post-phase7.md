# Codex Goals After Phase 7

Phase 7 is **complete**. Use this doc to launch **follow-up** Codex work — not to re-run Phase 7.

**Review first:** [phase7-complete-review.md](./phase7-complete-review.md)  
**Progress log:** [codex-progress.md](./codex-progress.md)

---

## Sanity check

```bash
cd c:\Users\mcarr\Documents\clones\point-1
bun install
bun run ci
```

Expected: pass (~78 tests).

---

## Goal A — Publish packages (Phase 6.2 deferred)

**Requires:** `NPM_TOKEN`, `VSCE_PAT` in environment or `.env.local`.

```text
/goal Complete Phase 6.2 publish in docs/full-language-plan.md: npm publish @hatchingpoint/point and VS Code marketplace release using scripts/publish.ts. Read docs/codex-progress.md first. Do not change compiler architecture. Run bun run ci before and after. Append checkpoint to docs/codex-progress.md. Stop and report if credentials are missing — do not fake publish.
```

```powershell
Get-Content docs/codex-goal-publish.prompt.txt -Raw | codex exec -
```

---

## Goal B — Refresh master plan docs for Phase 7 reality

```text
/goal Update docs/full-language-plan.md and README.md to reflect Phase 7 complete architecture: semantic AST → desugar → core IR (not string lowering in parser.ts). Fix stale paths in Architecture table. Mark Phase 7 complete in roadmap. Do not change compiler behavior. Run bun run ci. Append checkpoint to docs/codex-progress.md.
```

---

## Goal C — Explore Python emit (research → spike)

```text
/goal Read docs/python-emit-research.md and docs/phase7-complete-review.md. Prototype a minimal Python emitter from PointCoreProgram AST for examples/math.point only. Keep TS emit unchanged. Add tests. Document limitations in docs/python-emit-research.md. Run bun run ci. Do not claim general-purpose Python replacement until math.point passes end-to-end.
```

---

## Goal D — Audit only (no code changes)

```text
/goal Read docs/phase7-complete-review.md, docs/language-spec.md, and packages/point/src/. Produce a written audit: (1) Is Point general-purpose today? (2) What is semantic vs core IR? (3) Gaps vs Python/TypeScript. (4) Recommended next phase. Do not modify files unless I ask. Output markdown in chat only.
```

---

## Prompt file (multi-goal router)

Save as `docs/codex-goal-post-phase7.prompt.txt` and pipe to Codex:

```text
You are working on the Point language repo. Phase 7 (AST-only compiler) is COMPLETE.

Read first:
- docs/phase7-complete-review.md
- docs/codex-progress.md
- docs/phase7-ast-plan.md (all checkboxes done)

Hard rules:
- Public .point source stays SEMANTIC (record, calculation, rule, label, …). Never add fn/let/type to author-facing syntax.
- Production path: parsePointSource → semantic AST → desugar → core AST → check → emit. No string lowering in production.
- Core text parser is test-only: packages/point/src/core/test-only/
- Do not change git config, force push, or skip hooks unless asked.
- Run bun run ci before declaring done.

Pick the user's requested task from their message. If unclear, ask which goal: Publish (A), Doc refresh (B), Python emit spike (C), or Audit (D) from docs/codex-goal-post-phase7.md.

Append checkpoints to docs/codex-progress.md for any implementation work.
```

---

## Windows: run without paste

```powershell
Get-Content docs/codex-goal-post-phase7.prompt.txt -Raw | codex exec -
```

Then follow up in the same session, e.g.:

```text
Execute Goal B — refresh full-language-plan.md for Phase 7 architecture.
```
