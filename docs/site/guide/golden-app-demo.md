---
title: Golden app demo
description: Evaluator walkthrough — full-stack admin app in ten minutes.
quadrant: Tutorial
---

## Summary

This is the **golden demo** for evaluators: scaffold a real admin app, discover what's wired, run it in the browser and from the CLI, and see the agent repair loop — without reading every block type first.

**Prerequisites:** [Point in 60 seconds](/point/guide/point-in-60-seconds).

## 1. Scaffold (2 minutes)

```bash
point create eval-demo
cd eval-demo
bun install
point demo src/app.point
point dev src/app.point
```

You get a full-stack template: one `src/app.point`, Vite host in `web/`, API + UI from the same source.

## 2. Discover (1 minute)

```bash
point box src/app.point
```

One screen shows built-in capabilities and runnable commands. Copy the launch line for `admin demo`.

What's already in the template (no boilerplate hunting):

| Layer | Wired in `src/app.point` |
|-------|--------------------------|
| **Theme** | accent, density, radius tokens |
| **Navigation** | Settings, Members, member detail routes |
| **Routes** | `GET /api/health`, `GET /api/members` |
| **Pages** | settings form, members list, member detail |
| **Views** | forms, tabs, modals, HTTP data load, conditional render |
| **Command** | `admin demo` — CLI smoke test |

You write `.point`. The Vite/React host runs the UI; Point generates routes, views, and glue.

## 3. Run in browser (2 minutes)

```bash
point dev src/app.point
```

| URL | What |
|-----|------|
| **http://localhost:5173** | React UI — settings, members list, detail pages |
| **http://localhost:3456** | Bun API — `/api/health`, `/api/members` |

Edit `src/app.point`, save — dev rechecks and reloads.

## 4. Run from CLI (1 minute)

```bash
point launch src/app.point admin demo
```

Named commands are the simple launch path. List them anytime with `point commands src/app.point`.

## 5. Logic in the same file (2 minutes)

The template isn't UI-only. Open `src/app.point` and find:

- **records** — `Member`, `WorkspaceSettings`, typed API responses
- **calculation** — `sample members` seeds demo data
- **views with data load** — `load data from fetch GET "/api/members"`
- **routes** — typed handlers returning JSON

Add a rule or label block, `point check`, save — same file, same toolchain.

## 6. Agent loop (2 minutes)

The compiler is the agent's IDE:

```bash
point check-json src/app.point
point index src/app.point
point repair-plan src/app.point
```

Stable refs like `point://semantic/AdminApp/route.health` — not generated TypeScript names. Introduce a typo, run `point repair-plan`, patch semantic source, re-check.

Benchmark: 26+ repair cases, CI gate at 100% sufficiency. See [AI overview](/point/ai/overview).

## 7. Ship (when ready)

```bash
bun run build
bun run serve
```

Or deploy with the bundled `render.yaml`. See [Deploy](/point/toolchain/deploy).

## Evaluator checklist

| Question | Answer in this demo |
|----------|---------------------|
| Is syntax readable? | Open `src/app.point` — English block names, no brace soup |
| Does check work? | `point check src/app.point` |
| Full-stack real? | Browser UI + API from one file |
| CLI entrypoints? | `point launch src/app.point admin demo` |
| Agent-native? | `check-json` + `repair-plan` + semantic refs |
| Honest stack? | Point authors logic/UI/routes; Vite host runs React |

## See also

- [Point in 60 seconds](/point/guide/point-in-60-seconds)
- [Five-minute tour](/point/guide/five-minute-tour)
- [In the box](/point/language/in-the-box)
- [Deploy](/point/toolchain/deploy)
