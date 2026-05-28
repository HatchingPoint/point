---
title: Golden app demo
description: Evaluator walkthrough - runtime-native admin app in ten minutes.
quadrant: Tutorial
---

## Summary

This is the **golden demo** for evaluators: scaffold a runtime-native Point app, discover what's wired, run it in the browser and from the CLI, and see the agent repair loop - without reading every block type first.

**Prerequisites:** [Point in 60 seconds](/point/guide/point-in-60-seconds).

## 1. Scaffold (2 minutes)

**Default runtime app:**

```bash
point create eval-demo
cd eval-demo
bun install
point demo src/app.point
point dev src/app.point
```

The default template is `runtime-app`: one `src/app.point`, owned runtime HTTP, SSR pages/forms/navigation, and JSON routes. No Vite, React, or author JavaScript is generated.

**Runtime SaaS starter** (auth + SQLite + DB init):

```bash
point create eval-demo --template runtime-saas-app
cd eval-demo
bun install
point run init database
point demo src/app.point
point dev src/app.point
```

## 2. Discover (1 minute)

```bash
point box src/app.point
```

One screen shows built-in capabilities and runnable commands. Copy the launch line for the smoke/demo command.

What's already in the default template (no boilerplate hunting):

| Layer | Wired in `src/app.point` |
|-------|--------------------------|
| **Runtime** | Interpreter, HTTP, SSR, forms, and navigation |
| **Routes** | Readiness JSON and runtime form handling |
| **Pages** | SSR readiness UI authored in Point |
| **Views** | Point-rendered form, links, and status output |
| **Command** | `smoke` - CLI smoke test |

You write `.point`. The runtime owns the UI and HTTP path; Point does not generate a Vite/React host for the default app.

## 3. Run in browser (2 minutes)

```bash
point dev src/app.point
```

Open the URL printed by `point dev`.

| Path | What |
|------|------|
| `/` | Runtime SSR page and readiness form |
| `/readiness-ui` | Runtime SSR navigation page |
| `/readiness` | Runtime JSON route |

Edit `src/app.point`, save - dev rechecks and reloads.

## 4. Run from CLI (1 minute)

```bash
point launch src/app.point smoke
```

Named commands are the simple launch path. List them anytime with `point commands src/app.point`.

## 5. Logic in the same file (2 minutes)

The template is not UI-only. Open `src/app.point` and find:

- **records** - typed inputs for runtime forms and routes
- **rules/labels** - readiness scoring and classification
- **views/pages/navigation** - SSR UI rendered by the runtime
- **routes** - typed handlers returning JSON

Add a rule or label block, `point check`, save - same file, same toolchain.

## 6. Agent loop (2 minutes)

The compiler is the agent's IDE:

```bash
point check-json src/app.point
point index src/app.point
point repair-plan src/app.point
```

Stable refs like `point://semantic/PointOnlyApp/rule.deploy readiness` - not generated TypeScript names. Introduce a typo, run `point repair-plan`, patch semantic source, re-check.

Benchmark: 33+ repair cases, CI gate at 100% sufficiency. See [AI overview](/point/ai/overview).

## 7. Ship (when ready)

```bash
bun run serve
```

Legacy React/Vite templates still use `bun run build` before `bun run serve`. See [Deploy](/point/toolchain/deploy).

## Evaluator checklist

| Question | Answer in this demo |
|----------|---------------------|
| Is syntax readable? | Open `src/app.point` - English block names, no brace soup |
| Does check work? | `point check src/app.point` |
| Full-stack real? | Runtime SSR + HTTP from one `.point` file |
| CLI entrypoints? | `point launch src/app.point smoke` |
| Agent-native? | `check-json` + `repair-plan` + semantic refs |
| Honest stack? | Point authors logic/UI/routes; runtime runs interpreter, HTTP, and SSR |

## See also

- [Point in 60 seconds](/point/guide/point-in-60-seconds)
- [Five-minute tour](/point/guide/five-minute-tour)
- [In the box](/point/language/in-the-box)
- [Deploy](/point/toolchain/deploy)
