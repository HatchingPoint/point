# Python Emit Research

## Status (Phase 10 / Goal P10-3)

Point ships a **Python emit backend** for pure logic modules and **action blocks**. Fixtures:

- `examples/math.point` → `generated/math.py` (pure logic)
- `examples/action.point` → `generated/action.py` (async action + external shim)

```bash
point build-py examples/math.point generated/math.py
point build-py examples/action.point generated/action.py
python -c "import asyncio, importlib.util; spec=importlib.util.spec_from_file_location('a','generated/action.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); print(asyncio.run(m.loadConfigContents('examples/action.point'))[:20])"
```

Runtime parity with JavaScript emit for pure logic is covered in `tests/python-emit.test.ts`. Action emit smoke test reads `examples/action.point` via the generated async function.

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
- Conditionals, assignments, arithmetic and boolean operators
- Module-level typed functions and local typed bindings
- **`node:fs` readFileSync** — mapped to `pathlib.Path.read_text()` shim

## Limits (honest)

| Area | Status |
|------|--------|
| Views / JSX | Not emitted (comment placeholder only) |
| Routes / HTTP | Not emitted |
| Workflows / commands | Skipped with comment |
| npm-style externals | `node:fs` readFileSync only; others emit raw import (likely invalid Python) |
| stdlib bridge | No Python std mirror yet |
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
