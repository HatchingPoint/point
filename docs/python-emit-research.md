# Python Emit Research

**External shim registry:** [python-emit-registry.md](./python-emit-registry.md) — npm / std externals → Python mappings (P19-4).

## Status (Phase 19 / Goal P19-1)

Point ships a **Python emit backend** for pure logic modules, **action blocks**, and **route blocks with middleware**. Fixtures:

- `examples/math.point` → `generated/math.py` (pure logic)
- `examples/action.point` → `generated/action.py` (async action + external shim)
- `examples/api/middleware-demo.point` → `generated/middleware-demo.py` (HTTP routes + middleware)

```bash
point build-py examples/math.point generated/math.py
point build-py examples/action.point generated/action.py
point build-py examples/api/middleware-demo.point generated/middleware-demo.py
python generated/middleware-demo.py  # or import start_routes_server()
```

### Route runtime choice

Python route emit uses **stdlib `http.server`** (not FastAPI):

- Zero third-party dependencies — matches “boring emit” and works in restricted environments
- Same middleware chain + typed query/body/header extraction as JavaScript emit
- FastAPI remains a future option via the [external shim registry](./python-emit-registry.md) if teams want OpenAPI/docs

`@hatchingpoint/point/std/crypto` `checkJwtValid` maps to `packages/point/python_std/point_std/crypto.py` via the Point std bootstrap import path.

Runtime parity with JavaScript emit for pure logic is covered in `tests/python-emit.test.ts`. Action emit smoke test reads `examples/action.point` via the generated async function.

### Cross-language parity suite (P19-5)

```bash
bun run test:py-parity
```

Builds and compares paired outputs for:

| Example | Parity scope |
|---------|----------------|
| `examples/math.point` | Calculations, rules, labels |
| `examples/tools/path-demo.point` | `std.path` calculations + action |
| `examples/api/middleware-demo.point` | JWT secret calculation; HTTP status/body vs JS server |

Tests live in `tests/python-parity-suite.test.ts`. CI: optional `py-parity` job in `.github/workflows/ci.yml` (Python 3.12). Main `bun run ci` stays Bun-only; run parity locally or in the optional job when Python is available.

## Type mapping

| Point | Python |
|-------|--------|
| Text | `str` |
| Int | `int` |
| Float | `float` |
| Bool | `bool` |
| List[T] | `list[T]` |
| Maybe[T] | `T \| None` |
| Or A B | `A \| B` |
| records | `TypedDict` |

Record field access emits bracket notation (`signals["hasBundleId"]`) so callers can pass plain dicts.

## Supported today

- Records, calculations, rules, labels
- **Actions** — `async def` with `await` for nested action calls
- **Routes** — stdlib `http.server` runtime with middleware stacks and typed query/body/header records
- Conditionals, assignments, arithmetic and boolean operators
- Module-level typed functions and local typed bindings
- **`node:fs` readFileSync** — mapped to `pathlib.Path.read_text()` shim

## Limits (honest)

| Area | Status |
|------|--------|
| Views / JSX | Not emitted (comment placeholder only) |
| Routes / HTTP | ✅ stdlib `http.server` runtime + middleware (P19-1) |
| Workflows / commands | Skipped with comment (except route `serve` commands) |
| npm-style externals | `node:fs` readFileSync + `@hatchingpoint/point/std/*` → `point_std.*`; see [registry](./python-emit-registry.md) |
| stdlib bridge | ✅ `packages/point/python_std/` mirrors Phase 14 std modules |
| Project-wide `build-py-all` | ✅ Skips view/route/workflow/command fixtures; includes actions |
| Dataclass runtime | TypedDict typing only; values are dicts at runtime |

## Smoke test without pytest

Pure logic:

```bash
point build-py examples/math.point generated/math.py
python -c "import importlib.util, json; spec=importlib.util.spec_from_file_location('math','generated/math.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); print(json.dumps({'annual': m.annualPrice(10), 'score': m.launchReadinessScore({'hasBundleId': True, 'submittedForReview': True, 'hasPassingTests': False})}))"
```

Expected: `{"annual": 120, "score": 70}`

Action:

```bash
point build-py examples/action.point generated/action.py
python -c "import asyncio, importlib.util; spec=importlib.util.spec_from_file_location('action','generated/action.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); print(asyncio.run(m.loadConfigContents('examples/action.point')).startswith('module Actions'))"
```

Expected: `True`

## Roadmap

1. ~~Python emit for actions + async (`async def` / `await`)~~ (Phase 10 P10-3)
2. Effect/import story for Python packages
3. Conformance suite shared across JS and Python for all pure-logic fixtures
4. ~~`build-py-all` batch emit for action + pure-logic fixtures (P10-4)~~ ✅ `point build-py-all`

## Original decision (Phase 6)

Phase 6 deferred Python emit because the semantic surface was still evolving and JS interop was the near-term product goal. Phase 7 AST stability and Phase 9 replacement goals made a **pure-logic prototype** worthwhile without committing to full Python parity.
