---
title: Stdlib bridge
description: How Point std modules, external blocks, and emit targets connect to npm and Python at runtime.
quadrant: Explanation
---

## Summary

Point keeps product logic in semantic `.point` files. When that logic needs npm packages, Node built-ins, or (for pure modules) Python, the compiler emits explicit import boundaries — never hidden magic.

The **stdlib bridge** is the pattern where `std/*.point` modules declare typed `external` blocks that import runtime helpers from `@hatchingpoint/point/std/*`. Application code imports std with `use std.http` (and similar) instead of repeating raw externals.

## The bridge in one picture

```text
Author (.point)          Compiler                 Runtime
─────────────────────────────────────────────────────────────
use std.http      →   check + emit JS/TS   →   import from @hatchingpoint/point/std/http
external node fs  →   check + emit JS/TS   →   import from "node:fs"
calculation …     →   point build-py       →   pure Python module (no IO yet)
```

Authors stay on the left. Generated JavaScript or TypeScript (default) and optional Python (pure logic) sit on the right.

## external blocks

An `external` block declares a typed callable boundary into JavaScript, npm, or Node/Bun built-ins. Each function lists a Point signature, a module string, and an optional import alias.

See `examples/external.point` for a minimal file read:

```point
module ExternalExample

external node fs
  read file(path: Text): Text from "node:fs" as readFileSync
```

Lowering turns each external function into an ES module import. Externals are **impure** — calculations and rules should not call them directly. Wrap IO in `action` blocks with explicit `touches` metadata instead.

Common `from` values:

| Pattern | Example | Use when |
|---------|---------|----------|
| Node built-in | `"node:fs"` | Filesystem, crypto, etc. |
| npm package | `"zod"` | Third-party libraries |
| Point std runtime | `"@hatchingpoint/point/std/http"` | Standard library helpers |

## How std modules bridge npm

Standard library files under `std/` are ordinary Point modules. They declare externals that point at small JavaScript shims published with `@hatchingpoint/point`, then expose typed actions and calculations on top.

From `std/http.point`:

```point
module StdHttp

external point std http
  http get raw(url: Text): Text or Error from "@hatchingpoint/point/std/http" as httpGet
  http post raw(url: Text, body: Text): Text or Error from "@hatchingpoint/point/std/http" as httpPost

action http get
  input url: Text
  output response: Text or Error
  touches network
  return http get raw(url)
```

Application modules import the std surface with `use std.http` (and similar) instead of repeating npm import paths. The repository includes a multi-module std usage example under `examples/` that wires text, JSON, HTTP, time, filesystem, and env helpers together.

Available std modules today: `std.text`, `std.json`, `std.http`, `std.time`, `std.fs`, and `std.env`. See the repository `std/README.md` for the full API list.

### Why two layers?

1. **Semantic layer** — authors and agents work with stable Point names, types, and effect metadata.
2. **Runtime layer** — emitted code imports tested JavaScript helpers that wrap Bun/Node APIs and npm where needed.

That split keeps review tools honest: `point index` shows when code touches `network`, `file`, or `env`, even though the runtime import path lives in generated output.

## npm packages in your own modules

For packages outside the std bridge, declare externals directly in your module (or a shared wrapper module):

```point
module Validation

external zod schema
  parse user(raw: Text): Text or Error from "zod" as safeParse

action parse user json
  input raw: Text
  output user: Text or Error
  touches none
  return parse user(raw)
```

After `point build`, the emitted JavaScript contains a normal `import` from `"zod"`. Your app bundler or runtime must resolve that dependency like any other npm import.

## Python interop (pure logic today)

Point can emit **pure logic** modules to Python with `point build-py`. Records, calculations, rules, and labels lower to typed functions and `TypedDict` shapes. This path is for scripts, services, and data pipelines that do not need npm or Node at runtime.

Example from `examples/math.point`:

```point
module Math

calculation annual price
  input monthly price: Int
  output annual price: Int
  annual price is monthly price * 12
```

```bash
point build-py examples/math.point generated/math.py
python -c "import importlib.util; spec=importlib.util.spec_from_file_location('m','generated/math.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); print(m.annualPrice(10))"
```

### Python limits (honest)

| Area | JavaScript emit (default) | Python emit |
|------|---------------------------|-------------|
| Records, calculations, rules, labels | ✅ | ✅ |
| Actions | ✅ async JS | ✅ async Python (minimal; see limits below) |
| Workflows, commands | ✅ | ⏳ skipped with comment |
| Views, routes | ✅ React/Hono targets | ⏳ not emitted |
| npm-style `external` | ✅ ES imports | Minimal shims only |
| `use std.*` IO | ✅ via `@hatchingpoint/point/std/*` | ⏳ no Python std mirror yet |

For effectful work in production today, emit JavaScript (default `point build`) and call npm or Node through `external` blocks or `use std.*`. Use Python emit for portable logic and simple async actions; use JS emit for routes, views, and full std IO.

See `docs/python-emit-research.md` in the repository for current limits and smoke tests.

## Production checklist

1. **Author** product logic in `.point` — prefer `use std.*` over inline externals when a std module exists.
2. **Check** with `point check` or `point check-all` before emit.
3. **Emit** JavaScript by default (`point build`) for apps with actions, routes, or views; use `point build-py` only for pure modules.
4. **Install runtime deps** — `@hatchingpoint/point` (CLI + std shims), plus any npm packages referenced in your externals.
5. **Do not hand-edit** generated `dist/` or `generated/` output; repair `.point` and rebuild.

## Common mistakes

- Calling an `external` from a `calculation` or `rule` — wrap IO in an `action` with `touches`.
- Forgetting `await` when one `action` calls another.
- Expecting Python emit to run HTTP or filesystem code — use JS emit + std bridge instead.
- Patching generated JavaScript instead of the semantic source.

## Agent diagnostic notes

- External refs appear in `point index` under `external.*` paths.
- Prefer adding a typed wrapper module over sprinkling raw externals through business logic.
- When docs snippets fail CI, run `point check-docs` locally — it validates every fenced ` ```point ` block under `docs/site/`.

## See also

- [Effects](/point/language/effects) — `external`, `action`, and `policy`
- [Modules](/point/language/modules) — `use std.http` and multi-file graphs
- [npm packages](/point/ecosystem/npm-packages) — `@hatchingpoint/point`, `@hatchingpoint/point-logic`, publishing
- [Authoring vs runtime](/point/concepts/authoring-vs-runtime) — what you write vs what runs
- [CLI reference](/point/reference/cli) — `build`, `build-py`, `check-all`
