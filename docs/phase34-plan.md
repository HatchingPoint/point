# Phase 34 — Cross-module use resolution

**Status:** Complete — v0.1.26  
**Prerequisite:** Phase 33 complete (v0.1.25)  
**North star:** Authors can `use` another `.point` module and call imported calculations, labels, and types from the importing file — single-file `point check` included.

---

## Why now

Phase 33 shipped `std/money` format helpers, but `money display(...)` failed across `use Money from "../../std/money.point"` because:

1. `use` paths were resolved from repo cwd, not the importing file directory
2. Single-file CLI commands did not merge dependency declarations before check

---

## Success criteria (Phase 34 exit gate)

- [x] **File-relative `use` resolution** — `../../std/money.point` resolves from importer path
- [x] **Cross-module callables in parse** — `money from cents(...)`, `money display(...)` parse in importing modules
- [x] **Single-file CLI graph merge** — `point check`, `point test`, etc. merge dependency public symbols when `use` is present
- [x] **Examples** — `examples/tools/money-demo.point` uses linked `std/money`
- [x] **Tests** — `tests/cross-module-import.test.ts`
- [x] `bun run ci` passes; patch release **v0.1.26**

---

## Non-goals

- npm/lock `use std.money` without `from` path (lock resolution unchanged)
- Re-export / selective `use` imports (all public symbols visible today)

---

## Key files

- `packages/point/src/core/module-resolve.ts` — shared path resolution
- `packages/point/src/core/parser.ts` — input-aware parse + dependency collection
- `packages/point/src/semantic/callables.ts` — transitive callable discovery
- `packages/point/src/core/cli.ts` — single-file graph merge
