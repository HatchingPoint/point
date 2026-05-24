# Codex goals — Phase 35 (parallel burst)

**Plan:** [phase35-plan.md](./phase35-plan.md)  
**Principles gate:** [point-principles-gate.md](./point-principles-gate.md)

Paste **one block per chat**. Do not edit files owned by another track.

---

## Wave 1 (parallel — start all three)

### Track A — Agent repair CI gate

```
/goal Execute docs/phase35-plan.md P35-1: Add scripts/agent-repair-gate.ts that runs agent-repair sufficiency benchmark and exits non-zero if any case fails. Wire as "benchmark:agent-repair:gate" and add to bun run ci after benchmark:agent-repair. tests/agent-repair-gate.test.ts smoke. Document threshold in docs/site/ai/repair-plan.md. Append codex-progress checkpoint. Do NOT commit unless user asked.
```

### Track B — Timezone std pattern

```
/goal Execute docs/phase35-plan.md P35-2: Add format instant in timezone raw helper to std/time (JS + Python stdlib via Intl/datetime). calculation format instant in timezone in std/time.point. examples/tools/timezone-demo.point. Update types.md timezone section (audit defer → pattern shipped). tests/timezone-std.test.ts. Append codex-progress. Do NOT commit unless user asked.
```

### Track C — LSP cross-module use

```
/goal Execute docs/phase35-plan.md P35-3: Pass document URI/path into analyzePointSource / parsePointSource in LSP so cross-module use resolves like CLI. tests/agent-lsp-cross-module.test.ts using examples/tools/money-demo.point (diagnostics empty, hover on money display). Append codex-progress. Do NOT commit unless user asked.
```

---

## Wave 2 — Integrator (single chat, after A+B+C green)

```
/goal Phase 35 integrator: Run bun run ci. Mark phase35-plan.md checkboxes. CHANGELOG v0.1.27. Update phase-roadmap.md. Append codex-progress integrator checkpoint. Commit and tag v0.1.27 when user asked.
```
