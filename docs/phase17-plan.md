# Phase 17 — Generic database interop

**Status:** Complete (Convex removed — generic DB only).  
**Prerequisite:** Phase 14 exit gate; Phase 15 recommended for client examples.  
**North star:** Point apps persist data through **parameterized actions + externals** — any database, no vendor lock-in.

**Master plan:** [platform-vision-plan.md](./platform-vision-plan.md)  
**Principles gate:** [point-principles-gate.md](./point-principles-gate.md)

---

## Decision (revised)

**Removed Convex-specific blocks** (`server query`, `use query`, `point convex sync`). They were overfit to one vendor.

**The data path is:**

1. **`std.sql`** — SQLite spike for local scripts and tests (`touches database`)
2. **`external` + driver** — PostgreSQL, MySQL, LibSQL, etc. with parameterized queries only
3. **`load data from action`** — views/pages fetch via actions (Phase 15), not framework hooks
4. **HTTP routes** — expose actions as REST if needed

See [database-interop.md](../site/ecosystem/database-interop.md).

---

## Success criteria (exit gate)

- [x] **Database interop doc** — external + actions pattern, security rules
- [x] **`std.sql`** — parameterized query action + runtime shim
- [x] **General example:** `examples/app/notes/` — CRUD via sql actions + load data in views
- [x] **Conformance fixture:** `tests/conformance/fixtures/database-actions.point`
- [x] **No Convex** — compiler, CLI, docs, tests removed
- [x] `bun run ci` passes

---

## Non-goals

- Point-owned ORM or migrations
- Realtime subscriptions (use `stream route` + actions, or host framework)
- Vendor-specific SQL dialect blocks in the language core

---

## After Phase 17

Phase 18 — Agent orchestration.
