# Codex goals — Phase 28 (Agent loop hardening)

**Runs in parallel with Phase 27.** Read [phase28-plan.md](./phase28-plan.md) file ownership before editing.

**Do not touch:** `parse.ts` (theme), `check-themes.ts`, `ui-style.ts` theme toggle, SQL codegen, `vercel-app` template theme UX.

---

## Wave 1 (parallel with P27-3)

```
/goal Execute docs/phase28-plan.md P28-1: Improve repair-plan ordering and add 2+ multistep agent-repair cases in scripts/agent-repair-sufficiency.ts. Document in docs/site/ai/repair-plan.md. bun test tests/agent-repair-sufficiency.test.ts. Append checkpoint. Do NOT commit unless user asked.
```

```
/goal Execute docs/phase28-plan.md P28-2: Audit diagnostic codes vs point index/explain; fill explain gaps in semantic/context.ts for Phase 26–27 codes. Add tests/agent-index-explain.test.ts. point-principles-gate.md. Append checkpoint. Do NOT commit unless user asked.
```

```
/goal Execute docs/phase28-plan.md P28-3: Add 5+ agent-repair fixture pairs (middleware, pipeline, money lint, variant, view). Register in agent-repair-sufficiency.ts. bun scripts/export-agent-repair-cases.ts. Append checkpoint. Do NOT commit unless user asked.
```

---

## Wave 2 (parallel with P27-4)

```
/goal Execute docs/phase28-plan.md P28-4: LSP vs check-json parity spot-check for new diagnostic codes. Test in packages/point-vscode or root tests. Update docs/site/ai/check-json.md. Append checkpoint.
```

```
/goal Execute docs/phase28-plan.md P28-5: Self-host increment — compiler/passes diagnostic or naming catalog in .point. CI hook or test. Append checkpoint.
```

---

## Integrator (after Wave 1+2 or when Phase 27 also complete)

```
/goal Phase 28 integrator: bun run ci. Mark phase28-plan.md checkboxes. Append codex-progress. If Phase 27 exit gate also [x], single release v0.1.20; else release v0.1.21 with Phase 28 only. Follow docs/codex-goal-cursor-overnight.md ritual.
```
