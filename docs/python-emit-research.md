# Python Emit Research

## Status (Phase 9 / Goal R2)

Point now ships a **minimal Python emit backend** for pure logic modules. The first fixture is `examples/math.point` → `generated/math.py`.

```bash
point build-py examples/math.point generated/math.py
python -c "import importlib.util; spec=importlib.util.spec_from_file_location('m','generated/math.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); print(m.annualPrice(10))"
```

Runtime parity with JavaScript emit is covered in `tests/python-emit.test.ts`.

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
- Conditionals, assignments, arithmetic and boolean operators
- Module-level typed functions and local typed bindings

## Limits (honest)

| Area | Status |
|------|--------|
| Views / JSX | Not emitted (comment placeholder only) |
| Routes / HTTP | Not emitted |
| Actions / workflows / commands | Skipped with comment (async Python later) |
| npm-style externals | Minimal `from module import name` only |
| stdlib bridge | No Python std mirror yet |
| Project-wide `build-py-all` | Not wired — many fixtures include views/actions |
| Dataclass runtime | TypedDict typing only; values are dicts at runtime |

## Smoke test without pytest

```bash
point build-py examples/math.point generated/math.py
python -c "import importlib.util, json; spec=importlib.util.spec_from_file_location('math','generated/math.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); print(json.dumps({'annual': m.annualPrice(10), 'score': m.launchReadinessScore({'hasBundleId': True, 'submittedForReview': True, 'hasPassingTests': False})}))"
```

Expected: `{"annual": 120, "score": 70}`

## Roadmap

1. Python emit for actions + async (`async def` / `await`)
2. Effect/import story for Python packages
3. Conformance suite shared across JS and Python for all pure-logic fixtures
4. Optional `build-py-all` once view/action fixtures can be skipped safely

## Original decision (Phase 6)

Phase 6 deferred Python emit because the semantic surface was still evolving and JS interop was the near-term product goal. Phase 7 AST stability and Phase 9 replacement goals made a **pure-logic prototype** worthwhile without committing to full Python parity.
