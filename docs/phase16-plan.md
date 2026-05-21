# Phase 16 — Realtime & Processes

**Status:** Complete (Wave 1 + Wave 2).  
**Prerequisite:** Phase 14 exit gate (P14-5, P14-7 strongly recommended). Phase 15 complete.  
**North star:** Point programs handle **live systems** — streaming logs, WebSocket APIs, long-running jobs with retries.

**Master plan:** [platform-vision-plan.md](./platform-vision-plan.md)  
**Principles gate:** [point-principles-gate.md](./point-principles-gate.md)

---

## Point principles gate

Every P16 deliverable must pass [point-principles-gate.md](./point-principles-gate.md). Realtime features must be `stream route` / workflow extensions with effect metadata — not raw WebSocket handlers in author source.

---

## Success criteria (Phase 16 exit gate)

- [x] **`websocket route`** or `stream route` block — upgrade HTTP to WS, message typed events
- [x] **Client subscription** in views — bind WS events to state/handler
- [x] **Workflow extensions** — `retry`, `timeout`, `on failure`, step guards via `policy`
- [x] **Subprocess streaming action** — pipe stdout lines to WS or callback (builds on `std.process`)
- [x] **Scheduler** — `schedule` block or `command` + cron emit for periodic actions
- [x] **General example:** `examples/app/log-viewer/` — spawns process, streams to browser via WS
- [x] **General example:** workflow with retry in `examples/workflow-retry.point`
- [x] `bun run ci` passes

---

## P16-1 — WebSocket server routes

- [x] Semantic WS route: path, message record types, connect/disconnect handlers
- [x] Emit Bun.serve WebSocket handler integrated with HTTP routes
- [x] Tests with mock client

---

## P16-2 — Client realtime bindings

- [x] View/page `subscribe to` WS or SSE channel
- [x] Handler callbacks for incoming messages
- [x] Emit React hook + cleanup on unmount
- [x] Wire log-viewer example

---

## P16-3 — Workflow retry, timeout, guards

- [x] `retry N times` on step
- [x] `timeout after` duration (use std.time)
- [x] `require policy` before step runs
- [x] `on failure` branch
- [x] Tests for exhausted retries

---

## P16-4 — Subprocess streaming

- [x] Action `stream from process` yielding lines/events
- [x] Bridge to WS route in log-viewer example
- [x] Backpressure documented
- [x] Tests

---

## P16-5 — Scheduler

- [x] `schedule every` / cron expression → emit setInterval or host cron script
- [x] Document production use (external cron preferred for server deploy)
- [x] Example: health check action every N minutes

---

## Parallel tracks

```text
Wave 1:  P16-1, P16-3, P16-5
Wave 2:  P16-2, P16-4 (depends on P16-1, P14-5)
```

**Codex goals:** [codex-goal-phase16.md](./codex-goal-phase16.md)

---

## Non-goals

- Full terminal emulator / xterm (use external + thin view wrapper)
- Replacing vendor-specific realtime DBs (Phase 17 composes with generic DB clients)

---

## After Phase 16

Phase 17 — Data interop with any database via `external` + `std.sql`.
