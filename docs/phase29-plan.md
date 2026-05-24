# Phase 29 — Python std mirror (parallel with Phase 27 & 28)

**Status:** Active — runs **in parallel** with [phase27-plan.md](./phase27-plan.md) and [phase28-plan.md](./phase28-plan.md)  
**Prerequisite:** Phase 19 routes/workflows/commands emit shipped; JS `std.*` modules exist  
**North star:** Same `.point` source emits runnable **Python** with `use std.*` working — not hand-maintained Python scripts for product logic.

**Parallel rule:** Phase 29 agents must **not** edit Phase 27/28-owned paths (see [File ownership](#file-ownership)).

---

## What “Python mirror” means

Point already emits JavaScript/TypeScript by default. **Python mirror** means:

1. **`point build-py`** (or equivalent) produces `generated/*.py` from the same semantic `.point`
2. **`use std.path`**, `std.json`, `std.http`, etc. resolve to **Python implementations** shipped inside `@hatchingpoint/point` (`packages/point/python_std/`), not ad-hoc pip deps in every project
3. **Parity tests** — same module, run on Bun (JS) and `python3` (PY), same outputs for pure logic and selected actions

This is **real integration**: semantic source → checker → emit → in-package std shims. It is **not** a wrapper that shells out to random Python scripts.

Phase 19 marked “complete” but **P19-3 std mirror** and several exit criteria remain open — Phase 29 closes that gap.

---

## Why parallel (won’t fight 27 or 28)

| Track | Primary files |
|-------|----------------|
| Phase 27 | `parse.ts`, theme, `ui-style`, SQL codegen |
| Phase 28 | `cli` repair/index, `fixtures/agent-repair`, benchmarks |
| **Phase 29** | `emit-python.ts`, `emit-python-routes.ts`, `python_std/`, `tests/python-*`, `tests/py-parity*` |

Almost zero overlap. All three may touch `bun run ci` and release metadata — use **integrator commits** or short-lived branches to avoid CHANGELOG fights.

---

## Principles

Same as [point-principles-gate.md](./point-principles-gate.md):

- **Single source** — authors never duplicate logic in `.py`
- **No new author syntax** — extend emit + std bridge only
- **General examples** — `examples/tools/process-runner.point`, `examples/api/middleware-demo.point` (Python run path documented)
- **Agent loop** — Python emit errors still use semantic refs where possible

---

## Success criteria (Phase 29 exit gate)

- [x] **`packages/point/python_std/`** — mirror for path, process, yaml, json, http, fs, env, time, text, crypto (match JS std surface)
- [x] **Python emit wires `use std.*`** to python_std imports
- [x] **`point build-py`** documented and tested per module
- [x] **Optional `point.json` target** — `"target": "python"` per module (spike OK)
- [x] **Parity tests** extended — existing `test:py-parity` green + new std cases
- [x] **General example:** `examples/tools/process-runner.point` runs via `python3 generated/...`
- [x] `bun run ci` passes
- [x] Patch release **v0.1.20+** (integrator with 27/28 or **v0.1.21**)

---

## Non-goals

- Theme toggle, SQL schema (27)
- Agent repair fixtures (28)
- ORM, SSR, Convex/vendor blocks
- FastAPI required — stdlib `http.server` or documented external spike is fine

---

## Workstreams

### P29-1 — python_std package layout (Wave 1)

Create/mirror shims under `packages/point/python_std/` matching `packages/point/src/std/*.ts` behavior for pure functions.

### P29-2 — Wire Python emit to std (Wave 1)

Update `emit-python.ts` (and routes if needed) so `use std.json` → `from point_std.json import ...` or equivalent in-package path.

### P29-3 — build-py CLI + target selection (Wave 2)

CLI flag or `point build-py <file>`; optional `point.json` `"emit": "python"`.

### P29-4 — Parity & examples (Wave 2)

Extend `scripts/py-parity.ts` / tests; document middleware-demo or process-runner Python path.

---

## File ownership

**Phase 29 only:**

- `packages/point/src/core/emit-python*.ts`
- `packages/point/python_std/**`
- `tests/python-*.test.ts`, `tests/py-parity*`, `scripts/py-parity.ts`
- `docs/python-emit-registry.md`, `docs/site/toolchain/build-py.md` (if added)

**Do not touch (27/28):**

- `parse.ts`, `check-themes.ts`, `ui-style.ts` (27)
- SQL codegen modules (27)
- `tests/fixtures/agent-repair/**`, `benchmarks/agent-repair-cases.json` (28)
- `semantic/context.ts` explain strings (28) — unless adding Python-specific explain line

---

## After Phase 29

- **Phase 30 (sequential):** Record → SQL codegen **productization** (if 27 P27-4 was spike-only)
- **Later:** ORM, SSR — still non-goals until data + multi-target are solid

---

## Agent dispatch

See [codex-goal-phase29.md](./codex-goal-phase29.md).
