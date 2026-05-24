# Phase 32 — Duration & audit sync (author time suite)

**Status:** Complete — v0.1.24  
**Prerequisite:** Phase 23 Instant shipped; Phase 31 complete (v0.1.23)  
**North star:** Close the **author-facing time** gap with a first-class **`Duration`** type and std helpers — schedules/workflows already use seconds; authors get typed durations in records, calculations, and SQL schema.

---

## Why now

| Primitive | Status before Phase 32 |
|-----------|------------------------|
| `Map<Text,T>` | **Shipped** (Phase 23) — audit still said "Missing" |
| `Instant` | Shipped |
| `Duration` | Missing — workflows use raw `Int` seconds |
| Money | **Pattern shipped** (`std/money.point` + lint) |
| Rich errors | **Pattern shipped** (Phase 31) |

Phase 32 **syncs the audit** and adds **Duration** so time arithmetic stays in semantic blocks, not magic integers.

---

## Success criteria (Phase 32 exit gate)

- [x] **`Duration` opaque type** — parser, checker, JS/TS/Python emit (runtime: integer **seconds**)
- [x] **`std.time` duration helpers** — `duration from seconds`, `duration to seconds`, `duration minutes` calculation for literals
- [x] **Schedule/workflow alignment** — document that `every N minutes` and `timeout after N seconds` align with Duration seconds
- [x] **SQL schema** — `Duration` fields map to `BIGINT` (seconds) in build-schema
- [x] **General example** — `examples/tools/duration-demo.point`
- [x] **Audit updated** — Map → Shipped; Author dates → Instant + Duration; Money → pattern shipped
- [x] `bun run ci` passes; patch release **v0.1.24+**

---

## Non-goals

- Timezone logic in language core
- Full `Money` decimal type (cents record remains idiomatic)
- Python route emit (Phase 13)

---

## Workstreams

### P32-1 — Duration type (Wave 1)

Type grammar, checker (`invalid-type-arity`), emit parity TS/JS/Python, conformance tests.

### P32-2 — std.time duration surface (Wave 1)

Extend `std/time.point` + `packages/point/src/std/time.ts` with duration helpers; Python std mirror if trivial.

### P32-3 — Example + docs + audit (Wave 2)

`duration-demo.point`, `docs/site/language/types.md`, `language-primitive-audit.md`, build-schema Duration column.

### P32-4 — Integrator

`bun run ci`, roadmap, codex-progress, v0.1.24.

---

## Agent dispatch

See [codex-goal-phase32.md](./codex-goal-phase32.md).
