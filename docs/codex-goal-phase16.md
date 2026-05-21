# Codex Goals — Phase 16

**Master plan:** [phase16-plan.md](./phase16-plan.md)  
**Principles gate:** [point-principles-gate.md](./point-principles-gate.md) — **required**  
**Progress log:** [codex-progress.md](./codex-progress.md)

---

## Sanity check

```bash
cd /Users/pla_cebro/clones/point
bun test
```

Expected: 200+ tests pass (Phase 15 complete).

---

## Wave 1 — launch in parallel

| Agent | Goal | Focus |
|-------|------|--------|
| 1 | **P16-1** | WebSocket / stream routes |
| 2 | **P16-3** | Workflow retry, timeout, guards |
| 3 | **P16-5** | Scheduler |

## Wave 2 — after Wave 1

| Agent | Goal | Focus |
|-------|------|--------|
| 4 | **P16-2** | Client subscribe in views |
| 5 | **P16-4** | Subprocess streaming + log-viewer app |

---

## Goal P16-1 — WebSocket routes

```text
/goal Execute docs/phase16-plan.md P16-1: Add stream route or websocket route block — path, typed message record, connect/message/disconnect handlers. Emit Bun.serve WebSocket integrated with HTTP route stack. Tests with mock client. General example (not factory-themed). MUST pass point-principles-gate.md. Run bun test. Append checkpoint. Do NOT commit.
```

---

## Goal P16-3 — workflow extensions

```text
/goal Execute docs/phase16-plan.md P16-3: Extend workflow steps with retry N times, timeout after duration, require policy before step, on failure branch. Use std.time for timeout. Add examples/workflow-retry.point. Tests for exhausted retries. MUST pass point-principles-gate.md. Run bun test. Append checkpoint. Do NOT commit.
```

---

## Goal P16-5 — scheduler

```text
/goal Execute docs/phase16-plan.md P16-5: Add schedule every or schedule block for periodic actions. Emit setInterval for dev; document production cron preference. Example health check action. MUST pass point-principles-gate.md. Run bun test. Append checkpoint. Do NOT commit.
```

---

## Goal P16-2 — client subscriptions

```text
/goal Execute docs/phase16-plan.md P16-2: View/page subscribe to stream route channel. Handler for incoming messages. Emit React hook with cleanup. Wire into log-viewer. MUST pass point-principles-gate.md. Run bun test. Append checkpoint. Do NOT commit.
```

---

## Goal P16-4 — subprocess streaming

```text
/goal Execute docs/phase16-plan.md P16-4: Action stream from process yielding lines. Bridge to WS in examples/app/log-viewer/. Document backpressure. Tests. MUST pass point-principles-gate.md. Run bun test. Append checkpoint. Do NOT commit.
```

---

## Hard rules

- Semantic source only — no raw WebSocket handlers in .point
- Pass point-principles-gate.md — append gate line to checkpoint
- General-purpose examples
- Run `bun test` before done
- Do NOT commit
