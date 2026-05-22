---
title: How Point runs
description: What you write in .point, what the toolchain checks, and where build output fits — without making emit the main story.
quadrant: Explanation
---

## Summary

Point is the language you **write**. The toolchain **checks** semantic source, then **builds** runnable output when you need it. Most day-to-day work is `point check`, `point fmt`, and `point run` on `.point` files — not editing generated files.

## What you work in

| Layer | You touch it? | What it is |
|-------|---------------|------------|
| **`.point` source** | ✅ Always | Records, rules, labels, routes, views, pipelines — the language |
| **Checker + CLI** | ✅ Via commands | `check`, `fmt`, `index`, `explain`, `check-json`, `repair-plan` |
| **Core IR** | ❌ Never | Internal typed representation — like an AST other compilers keep private |
| **Build output** | ⚠️ Generated only | Files under `generated/` when you run `point build` — artifacts, not source |

Daily workflow:

```bash
point check myfile.point
point fmt myfile.point
point run myfile.point
point test myfile.point
```

Use `point build` when a host app imports compiled modules. Use `point dev` for watch mode on apps. Repair product behavior in `.point`, then re-check — not by hand-editing build output.

## Check path

```text
.point → parse → semantic AST → check → ok / diagnostics
```

Diagnostics use stable `point://semantic/` refs and structured fields (`expected`, `repair`) so agents patch declarations, not line numbers.

## Build path (when you need it)

```text
.point → check → build → generated modules
```

`point build` is the default build command. Optional targets and flags (`build-ts`, `build-py`) are documented in [Build and emit](/point/toolchain/build-emit). You do not need every target to use Point — most apps stay on the default build + Bun/Node.

Interop (React, npm packages, SQL drivers, HTTP) happens at the edges through `external` blocks and std imports — see [Effects](/point/language/effects) and [Integrations](/point/ecosystem/integrations).

## For coding agents

- Write and repair `.point` only
- Use `check-json`, `index`, `explain`, and `repair-plan` with semantic refs
- Do not treat generated files as source of truth

## See also

- [Language overview](/point/language/overview)
- [Build and emit](/point/toolchain/build-emit) — optional build targets
- [Platform vision](/point/concepts/platform-vision)
- [Introduction](/point/guide/introduction)
- [Authoring vs runtime](/point/concepts/authoring-vs-runtime) — legacy note (redirects here)
- [Point vs other languages](/point/ai/vs-other-languages) — evaluation only
