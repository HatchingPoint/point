---
title: Point in 60 seconds
description: Three moves — import, check, launch. Simple daily workflow.
quadrant: Tutorial
---

## Summary

Point is application logic in plain blocks — rules, routes, views, and commands in one source. Frontend is native syntax (`view`, `page`, `layout`, `navigation`), not a capability import. You do not need every block type on day one — just three moves.

## 1. Import (10 seconds)

```point
module Demo

capabilities http json

calculation noop
  output value: Text
  return "ok"
```

One line for built-in batteries. Discover what's available:

```bash
point capabilities
point box src/app.point    # capabilities + commands in one screen
```

## 2. Check (10 seconds)

```bash
point check myfile.point
```

Types, effects, and wiring — pass or fail. Logic-only modules stop here until a host imports them.

## 3. Launch (10 seconds)

Commands are runnable entrypoints:

```bash
point commands src/app.point
point launch src/app.point admin demo
```

`launch` requires a command name. Copy the line from `point commands`.

## App in one command

```bash
point create my-app
cd my-app
point dev src/app.point
```

Open the URL printed by `point dev`. The default `runtime-app` template serves Point-owned SSR, forms, navigation, and JSON routes from the runtime. No Vite or React host is required.

Legacy hosts are still available when you need them:

```bash
point create my-app --template full-stack-app
point create my-saas --template saas-app
```

## Agent path (same source)

The compiler is the agent's IDE — not line-number guessing:

```bash
point check-json myfile.point
point repair-plan myfile.point
```

Stable refs like `point://semantic/Module/rule.cart total`. See [AI overview](/point/ai/overview).

## What you write vs what runs

You author **`.point`**. The default app path is runtime-owned: `point dev` runs the interpreter, HTTP server, and SSR from `packages/point/runtime/`. JavaScript/TypeScript emit and Vite/React hosts are legacy template paths, not the default app workflow. Python emit remains available for supported logic and route surfaces.

## Go deeper (when ready)

| Step | Page |
|------|------|
| 60 seconds | [Point in 60 seconds](/point/guide/point-in-60-seconds) (you are here) |
| Full app eval | [Golden app demo](/point/guide/golden-app-demo) |
| Five families | [Introduction](/point/guide/introduction) |
| Full walkthrough | [Five-minute tour](/point/guide/five-minute-tour) |
| All blocks | [Language overview](/point/language/overview) |
| Build for deploy | [Build and emit](/point/toolchain/build-emit) |

## See also

- [Golden app demo](/point/guide/golden-app-demo)
- [Quick start](/point/guide/quick-start)
- [In the box](/point/language/in-the-box)
- [Capabilities](/point/language/capabilities)
