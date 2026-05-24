# Codex goals — Phases 51–54 (parallel platform burst)

**Plans:** [phase51](./phase51-plan.md) · [phase52](./phase52-plan.md) · [phase53](./phase53-plan.md) · [phase54](./phase54-plan.md)

---

## Wave 1 (parallel — run now)

### Track A — Job queue (P51)
```
/goal Execute docs/phase51-plan.md: SQL-backed job queue example (enqueue, status, workflow runner), routes, admin table view, tests. Pass point-principles-gate. Append codex-progress. Do NOT commit unless user asked.
```

### Track B — Live refresh (P52)
```
/goal Execute docs/phase52-plan.md: refresh every N seconds on load data views/pages — parse, check, desugar, emit-data-load, live-dashboard example, tests, docs. Pass point-principles-gate. Append codex-progress. Do NOT commit unless user asked.
```

### Track C — std.pty (P53)
```
/goal Execute docs/phase53-plan.md: std/pty.point + runtime shim, capabilities registration, sync std, tests, docs. Pass point-principles-gate. Append codex-progress. Do NOT commit unless user asked.
```

### Track D — Terminal view (P54)
```
/goal Execute docs/phase54-plan.md: terminal view subscribe to stream, xterm or ANSI emit, script-runner example, tests. Pass point-principles-gate. Append codex-progress. Do NOT commit unless user asked.
```

---

## Integrator (after Wave 1)

Merge tracks, run `bun run ci`, fix conflicts in `parse.ts` if any, update phase-roadmap.md.
