# Point

Point is an AI-first general-purpose language for application logic — semantic blocks you write, JavaScript the machine runs.

**Start:** [Point in 60 seconds](https://github.com/HatchingPoint/point/blob/main/docs/site/guide/point-in-60-seconds.md) (in repo docs)

## Install

Requires [Bun](https://bun.sh) on PATH.

```bash
bun install -g @hatchingpoint/point
point create my-app
cd my-app
point check src/app.point
point dev src/app.point
```

Also works: `npm install -g @hatchingpoint/point`.

```bash
point box src/app.point          # discover capabilities + commands
point launch src/app.point admin demo
point capabilities               # list built-in std modules
```

Pair with the [Point Language](https://marketplace.visualstudio.com/items?itemName=hatchingpoint.point) extension in VS Code or Cursor.

## What you write vs what runs

You author **`.point`**. JavaScript is the default runtime. Full-stack apps use a Vite/React host for UI — Point generates the glue.

Built-in import:

```point
capabilities http json
```

This package exposes:

- `point` CLI through `src/cli.ts`
- core language APIs through `@hatchingpoint/point/core`
- std runtime shims under `@hatchingpoint/point/std/*`

Core workflow (repo development):

```bash
bun run fmt-check
bun run check
bun run ci
```
