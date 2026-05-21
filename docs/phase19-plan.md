# Phase 19 — Python Full Parity

**Status:** Complete.  
**Prerequisite:** Phase 14 exit gate (stdlib must exist in JS first; mirror to Python).  
**North star:** Any Point module can target **Python** for scripts, services, and automation — same semantic source, no hand-written Python.

**Master plan:** [platform-vision-plan.md](./platform-vision-plan.md)  
**Principles gate:** [point-principles-gate.md](./point-principles-gate.md)

---

## Point principles gate

Every P19 deliverable must pass [point-principles-gate.md](./point-principles-gate.md). Same semantic source emits to Python — no forked syntax per target.

---

## Success criteria (Phase 19 exit gate)

- [x] **Python emit for routes, workflows, commands** — not only calculations/actions
- [ ] **Python std mirror** — path, process, yaml, json, http, fs, env, time, text, crypto (match Phase 14 stdlib)
- [x] **External shims map** — common npm externals → Python equivalents table in docs
- [ ] **Target selection** — `point build-py` per file; `point.json` default target per module optional
- [ ] **General example:** `examples/tools/process-runner.point` runs via `python generated/process-runner.py`
- [ ] **General example:** `examples/api/middleware-demo.point` → Python HTTP server (stdlib http.server or emitted FastAPI spike — document choice)
- [x] Parity tests: same inputs → same outputs on JS and Python for pure logic + selected actions (`bun run test:py-parity`)
- [ ] `bun run ci` passes

---

## P19-1 — Python route emit

- [x] Route blocks → Python HTTP handler (start with stdlib `http.server` or FastAPI external)
- [x] Middleware lowering
- [x] Tests

---

## P19-2 — Python workflow + command emit

- [x] Workflows → async Python functions
- [x] Commands → `if __name__ == "__main__"` entrypoints
- [x] Tests

---

## P19-3 — Python std mirror

- [ ] Generate or hand-write Python shims under `packages/point/python_std/`
- [ ] Wire `use std.*` to mirror in Python emit
- [ ] Cross-language parity tests

---

## P19-4 — External shim registry

- [x] `docs/python-emit-registry.md` — npm external → Python mapping
- [x] Database action mapping documented in python-emit-registry.md
- [x] OpenAI Python SDK mapping for Phase 18 pack

---

## P19-5 — CI parity suite

- [x] `bun run test:py-parity` — runs paired JS/Python examples (`examples/math.point`, `examples/tools/path-demo.point`, `examples/api/middleware-demo.point`)
- [x] Optional GitHub Actions job `py-parity` in `.github/workflows/ci.yml` (not in `bun run ci` — Python optional locally)

---

## Parallel tracks

```text
Wave 1:  P19-1, P19-3
Wave 2:  P19-2, P19-4, P19-5
```

Phase 13 Python route spike merges here if still open.

---

## Non-goals

- Python view/page emit (JS remains UI target unless demand proves otherwise)
- CPython replacement for Bun server apps

---

## After Phase 19

Phase 20 — Dev platform: `point dev`, full-stack template, integration tests.
