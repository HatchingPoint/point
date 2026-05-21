# Point starter template

A self-contained Point app you can copy outside this monorepo. Everything lives in `.point` source — no hand-written TypeScript.

## Layout

```text
point-starter/
  point.json
  src/
    app.point
  generated/          # created by point build (gitignore in real projects)
```

## Install

Install Bun, then the Point CLI:

```bash
npm install -g @hatchingpoint/point
```

From the [Point repo](https://github.com/HatchingPoint/point), you can also run the workspace CLI:

```bash
bun packages/point/src/cli.ts check src/app.point
```

## Check

Validate syntax and types:

```bash
point check src/app.point
```

From the monorepo root:

```bash
bun packages/point/src/cli.ts check examples/starter-template/src/app.point
```

## Build

Emit JavaScript (or TypeScript for typed imports):

```bash
point build src/app.point generated/app.js
point build-ts src/app.point generated/app.ts
```

## Run

Execute the `hello` command entrypoint:

```bash
point run src/app.point
```

Expected output:

```text
Hello from Point starter
```

## What's inside

- **calculation** `annual price` — simple monthly → annual math
- **label** `pricing tier` — starter vs pro from plan inputs
- **command** `hello` — CLI entry for `point run`
- **route** `get health` — optional HTTP health check stub

Add dependencies in `point.json` and run `point add <name> <spec>` when you need shared packages (`workspace:`, `file:`, or `npm:`). See the [point add guide](https://hatchingpoint.com/point/ecosystem/point-add).
