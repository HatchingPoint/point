# Point full-stack template

A self-contained SaaS admin app: layout shell, sidebar navigation, three pages (settings, members list, member detail), client routes, and a data-loading action. Everything lives in `.point` source — no hand-written TypeScript.

## Layout

```text
full-stack-template/
  point.json
  src/
    app.point
  generated/          # created by point build (gitignore in real projects)
```

## Scaffold a new app

From the Point monorepo (or with `@hatchingpoint/point` on your PATH):

```bash
point app new my-app
```

This copies this template into `./my-app/`, substitutes the app name in `point.json` and README, and leaves `src/app.point` ready to check and build.

## Install

Install Bun, then the Point CLI:

```bash
npm install -g @hatchingpoint/point
```

From the [Point repo](https://github.com/HatchingPoint/point), use the workspace CLI:

```bash
bun packages/point/src/cli.ts check src/app.point
```

## Check

```bash
point check src/app.point
```

From the monorepo root:

```bash
bun packages/point/src/cli.ts check examples/full-stack-template/src/app.point
```

## Build

Emit TypeScript for React Router views and layout slots:

```bash
point build-ts src/app.point generated/app.ts
```

## Run

Execute the `admin demo` command entrypoint:

```bash
point run src/app.point
```

Expected output:

```text
Admin app navigation ready
```

## What's inside

- **layout** `admin shell` — sidebar + main slots
- **navigation** — `/settings`, `/members`, `/members/:id`
- **pages** — settings (form + tabs + modal), members list (load + each + links), member detail
- **action** `fetch members` — sample data load (swap for your API)
- **command** `admin demo` — CLI smoke test for `point run`

## Optional database

Wire any database with `action` blocks + `external` driver shims or `std.sql`. See [Database interop](https://hatchingpoint.com/point/ecosystem/database-interop). Until then, routes and actions stay in-process with sample data.

Add shared packages with `point add <name> <spec>` (`workspace:`, `file:`, or `npm:`). See the [point add guide](https://hatchingpoint.com/point/ecosystem/point-add).
