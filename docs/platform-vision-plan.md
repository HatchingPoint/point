# Point Platform Vision — Phases 14–21

**Status:** Active north star (post Phase 12).  
**Prerequisite:** [phase12-plan.md](./phase12-plan.md) complete (v0.0.15).  
**Surgent use case:** Capability benchmark only — every feature must ship with general-purpose examples, not factory-specific syntax.

---

## One sentence (true vision)

Point is a **general-purpose, AI-first language** for entire applications: logic, UI, HTTP, realtime, data, agents, and automation — authored in semantic `.point`, emitted to JavaScript (default) or Python (opt-in), with native toolchain interop (npm, SQL drivers, Xcode) at the edges.

Authors do **not** hand-maintain TypeScript, React, Next.js glue, or Python factory scripts for product code. Generated targets are build artifacts.

---

## What stays outside Point (by design)

| Layer | Why |
|-------|-----|
| Xcode, Swift, iOS apps | Native platform; Point **invokes** via externals/commands |
| Apple signing, simulators, ASC upload binaries | macOS toolchain |
| Third-party SaaS APIs | OpenAI, FAL, Post Bridge — semantic **integration blocks** or `external`, not reimplemented runtimes |
| SQL / relational DBs | **`external` + parameterized `action`** or `std.sql` — see [Phase 17](./phase17-plan.md) |

---

## What Point must own (Phases 14–21)

| Gap today | Target |
|-----------|--------|
| Thin UI fragments | Full **application** authoring (layout, routes, data loading) |
| Six std modules | **Complete stdlib** for server/automation (process, path, crypto, yaml, streams) |
| Basic routes | **Production HTTP** (middleware, typed request/response, WebSockets) |
| Simple workflows | **Long-running orchestration** (retry, timeout, guards, streaming) |
| No data layer | **Data interop** — `std.sql` + external drivers + `touches database` actions |
| Agent tooling for Point source only | **Agent runtime** (pipelines, sessions, streaming events) |
| Partial Python emit | **Python parity** for routes/workflows/commands + std mirror |
| Logic-only replacement | **Dev platform** (`point dev`, app template, integration tests, registry) |

---

## Phase map

```text
Phase 13 (planned)     Registry + Python route spike
        ↓
Phase 14               Language foundations — stdlib, HTTP depth, types, source maps
        ↓
Phase 15               Application platform — app shell, layout, navigation, styling bridge
        ↓
Phase 16               Realtime & processes — WebSockets, subprocess streaming, workflow extensions
        ↓
Phase 17               Data interop — std.sql + external database drivers
        ↓
Phase 18               Agent orchestration — pipelines, sessions, guards, prompt libraries
        ↓
Phase 19               Python full parity — factory-grade automation target
        ↓
Phase 20               Dev platform — point dev, full-stack template, integration tests
        ↓
Phase 21               Hardening — conformance, perf, docs-in-Point, self-host increment
```

Phases 14–16 can overlap partially. Phase 17+ should wait for HTTP/realtime foundations.

---

## Parallel execution model

Each phase has:

1. **Plan doc** — `docs/phaseNN-plan.md` with checkboxes and exit gate  
2. **Codex goals** — `docs/codex-goal-phaseNN.md` with one goal per agent session  
3. **Progress log** — append checkpoints to [codex-progress.md](./codex-progress.md)

### Wave 1 — launch immediately (Phase 14, four agents)

| Agent | Goal ID | Focus |
|-------|---------|--------|
| 1 | **P14-1** | `std.path` + `std.process` modules |
| 2 | **P14-2** | Route middleware + typed request/response |
| 3 | **P14-3** | Enum / tagged variant types |
| 4 | **P14-4** | Statement-level source maps |

See [codex-goal-phase14.md](./codex-goal-phase14.md).

### Wave 2 — after P14-1 (Phase 14, three agents)

| Agent | Goal ID | Focus |
|-------|---------|--------|
| 5 | **P14-5** | `std.crypto` (hash + JWT helpers) |
| 6 | **P14-6** | `std.yaml` |
| 7 | **P14-7** | `std.stream` (readable/writeable wrappers) |

### Wave 3 — Phase 15 (four agents, after Phase 14 exit gate)

| Agent | Goal ID | Focus |
|-------|---------|--------|
| 8 | **P15-1** | `layout` block + app shell emit |
| 9 | **P15-2** | Client `navigation` / route registry |
| 10 | **P15-3** | `query` loading pattern (action-backed data for views) |
| 11 | **P15-4** | Styling bridge (`class` on view nodes → Tailwind emit) |

See [codex-goal-phase15.md](./codex-goal-phase15.md) (create when Phase 14 completes).

---

## Architecture (unchanged)

```text
.point (author) → semantic AST → core IR → check → emit → JS | TS | PY
                                                      ↓
                              Bun/Node runtime · React emit · SQL drivers · externals
```

Public source stays **semantic**. Never expose `fn`/`let`/`type` in `.point`.

---

## General-purpose proof requirement

Every phase exit gate must include **at least one example that is not App Store / factory themed**:

| Phase | Required general example |
|-------|--------------------------|
| 14 | CLI tool using `std.process` + `std.path` |
| 15 | Multi-page demo app (settings + list + detail) |
| 16 | Live log viewer (WebSocket + subprocess stream) |
| 17 | Notes app with `std.sql` or external DB driver |
| 18 | Multi-step signup or import pipeline |
| 19 | Same CLI tool runnable via `point build-py` |
| 20 | `point dev` on starter template |
| 21 | Conformance suite covers all new blocks |

**Principles gate:** Every phase goal must pass [point-principles-gate.md](./point-principles-gate.md) before checkboxes are marked done.

Existing readiness/store examples remain valid **adopter** demos; they must not be the only proofs.

---

## Database decision

**Any database.** Point does not ship a DB runtime or ORM.

1. **`std.sql`** — parameterized queries (SQLite locally via Bun)
2. **`external` + driver** — PostgreSQL, MySQL, LibSQL, etc. — see [database-interop](/point/ecosystem/database-interop)
3. **`load data from action`** — views/pages call database actions; no vendor-specific hooks

Convex-specific blocks were **removed** — they overfit one vendor.

---

## Non-goals (Phases 14–21)

- Owned VM / native binary (see native-target-research.md)
- Swift / mobile emit
- Replacing Xcode or macOS developer tools
- Reimplementing Convex, React, or npm
- Surgent-specific syntax (no `auto_build` keyword, no ASC-specific blocks in the language core)

---

## Progress tracker

| Phase | Name | Status |
|-------|------|--------|
| 13 | Registry & Python route spike | Planned — [phase13-plan.md](./phase13-plan.md) |
| 14 | Language foundations | Done — [phase14-plan.md](./phase14-plan.md) |
| 15 | Application platform | Done — [phase15-plan.md](./phase15-plan.md) |
| 16 | Realtime & processes | Done — [phase16-plan.md](./phase16-plan.md) |
| 17 | Data interop | Done — [phase17-plan.md](./phase17-plan.md) |
| 18 | Agent orchestration | Done — [phase18-plan.md](./phase18-plan.md) |
| 19 | Python full parity | Done — [phase19-plan.md](./phase19-plan.md) |
| 20 | Dev platform | Done — [phase20-plan.md](./phase20-plan.md) |
| 21 | Hardening | Done — [phase21-plan.md](./phase21-plan.md) |

**Last updated:** 2026-05-21
