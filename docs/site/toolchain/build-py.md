---
title: Python build (build-py)
description: Emit runnable Python from .point modules with in-package std shims — for automation, actions, routes, and workflows.
quadrant: Reference
---

## Summary

`point build-py` is the optional Python emit target. It lowers the same semantic `.point` source as `point build`, but writes `.py` files for hosts that run Python 3.12+.

Use it for logic, actions, routes, workflows, and commands — not for views, layouts, or client realtime code. Generated modules bootstrap `packages/point/python_std/` (or the installed `@hatchingpoint/point/python_std` path) so `use std.*` resolves to in-package shims instead of ad-hoc pip dependencies.

Do not hand-edit `generated/*.py`. Repair `.point` and rebuild.

## Single-file build

```bash
point build-py examples/math.point generated/math.py
point build-py examples/action.point generated/action.py
point build-py examples/tools/process-runner.point generated/process-runner.py
```

`build-py` merges `use` dependencies before check and emit (same as `build-py-all`). A module that `use std.process` inlines or imports sibling generated std wrappers as needed.

Default output when omitted: `generated/<base>.py`.

## Batch build

```bash
point build-py-all
```

Emits Python for every discovered pure-logic fixture plus actions, routes, workflows, and commands. Skips views, pages, and other unsupported block families. Root `package.json` exposes this as `bun run build:py`; CI runs it to keep `generated/*.py` in sync.

## Run generated Python

Pure logic (no asyncio):

```bash
point build-py examples/math.point generated/math.py
python3 -c "import importlib.util, json; spec=importlib.util.spec_from_file_location('math','generated/math.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); print(json.dumps({'annual': m.annualPrice(10)}))"
```

Async action:

```bash
point build-py examples/action.point generated/action.py
python3 -c "import asyncio, importlib.util; spec=importlib.util.spec_from_file_location('action','generated/action.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); print(asyncio.run(m.loadConfigContents('examples/action.point')).startswith('module Actions'))"
```

Command entrypoint (`if __name__ == "__main__"`):

```bash
point build-py examples/command.point generated/command.py
python3 generated/command.py
```

Process + std bridge (`use std.process`):

```bash
point build-py examples/tools/process-runner.point generated/process-runner.py
python3 -c "import asyncio, importlib.util, json; spec=importlib.util.spec_from_file_location('runner','generated/process-runner.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); print(json.dumps(asyncio.run(m.processRunnerDemoResult('hello'))))"
```

Expected process-runner output shape: `{"stdout": "hello\n", "stderr": "", "exitCode": 0}` (platform echo may vary slightly).

HTTP routes (stdlib server):

```bash
point build-py examples/api/middleware-demo.point generated/middleware-demo.py
python3 -c "import importlib.util, os, sys; spec=importlib.util.spec_from_file_location('demo','generated/middleware-demo.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); os.environ.setdefault('PORT','8765'); m.start_routes_server()"
```

## std bridge

| Point import | Python emit |
|--------------|-------------|
| `use std.json` | `from point_std.json import …` |
| `use std.path` | `from point_std.path import …` |
| `use std.process` | `from point_std.process import processSpawn as …` |
| Relative `./process` (batch emit) | `from process import …` (sibling generated module) |

See `docs/python-emit-registry.md` in the repository for the full external shim map.

## Parity tests

```bash
bun run test:py-parity
bun test tests/python-parity-suite.test.ts tests/python-std-parity.test.ts
```

Compares JS and Python outputs for math, path-demo, std/json, std/crypto, std/yaml, process-runner, and middleware-demo when `python3` is available.

## Limits

| Area | Status |
|------|--------|
| Views / JSX / layouts | Not emitted |
| Realtime WebSocket client | JS/TS only |
| FastAPI | Not required — routes use stdlib `http.server` |
| `point.json` `"emit": "python"` per module | Planned optional spike — use `build-py` today |

## See also

- [Build and emit](/point/toolchain/build-emit) — all build targets
- [CLI reference](/point/reference/cli) — `build-py`, `build-py-all`
- [How Point runs](/point/concepts/how-point-runs)
- [Run, test, REPL](/point/toolchain/run-test-repl)
