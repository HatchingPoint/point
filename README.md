# Point

Point is a **general-purpose, AI-first language** for application logic — semantic blocks you write, JavaScript and Python the machine runs.

Write rules, routes, pages, pipelines, and commands in one checked source. The compiler emits JS by default (Bun/Node), with TypeScript, Python, and SQL schema when you need them.

**Current release:** v0.1.41 · npm: `@hatchingpoint/point`

**Start here:** [Point in 60 seconds](docs/site/guide/point-in-60-seconds.md) · **Evaluator demo:** [Golden app demo](docs/site/guide/golden-app-demo.md)

## Scaffold

```bash
point create my-app --template saas-app   # auth + SQL + admin UI
point create my-app                       # full-stack admin (default)
point create --list-templates
```

## Three daily moves

```bash
point check myfile.point                              # trust
point box src/app.point                               # discover
point launch src/app.point admin demo                 # run
```

Import batteries in one line:

```point
capabilities http json time
```

## 30-second example

```point
module Checkout

record Cart Item
  name: Text
  unit price: Int
  quantity: Int

calculation line total
  input item: Cart Item
  output total: Int
  total is item.unit price * item.quantity

rule cart total
  input items: List<Cart Item>
  output total: Int
  total starts at 0
  for each item in items
  add item.unit price * item.quantity to total
  return total
```

```bash
point check checkout.point
```

Logic-only files validate with `point check`. To execute something, add a `command` block and use `point launch`:

```bash
point commands examples/command.point
point launch examples/command.point hello cli
```

## Five block families

| Family | What you write | Examples |
|--------|----------------|----------|
| **Logic** | Data + derivations | `record`, `calculation`, `rule`, `label` |
| **App** | HTTP + UI | `route`, `page`, `view`, `middleware` |
| **Agent** | Automation | `pipeline`, `prompt`, `command`, `workflow` |
| **Data** | Schema + queries | records + `use sql` + `point build-schema` |
| **Effects** | Host boundaries | `action`, `external`, `policy` |

Full reference: [docs site](docs/site/guide/point-in-60-seconds.md) · Block map: [language overview](docs/site/language/overview.md)

## Install

```bash
bun install -g @hatchingpoint/point
point create my-app
cd my-app
point dev src/app.point
```

Also: `npm install -g @hatchingpoint/point`. Optional: [Point Language](https://marketplace.visualstudio.com/items?itemName=hatchingpoint.point) for VS Code/Cursor, or any editor with `point lsp`.

## CLI essentials

| Group | Commands |
|-------|----------|
| **Daily** | `check`, `box`, `launch`, `demo`, `dev` |
| **Quality** | `fmt`, `check-json`, `test` |
| **Build** | `build`, `build-app`, `build-schema` |
| **Agent** | `repair`, `repair-plan`, `index`, `explain` |
| **Scaffold** | `create`, `init`, `add` |

Advanced emit and project commands: [CLI reference](docs/site/reference/cli.md).

## The compiler is the agent's IDE

Agents use stable refs and structured repairs — not line-number guessing:

```bash
point check-json myfile.point
point repair-plan myfile.point
point explain myfile.point point://semantic/Checkout/rule.cart total
```

Benchmark: 26+ repair cases with CI gate at 100% sufficiency. See [AI overview](docs/site/ai/overview.md).

## What you write vs what runs

You author **`.point`**. JavaScript is the default runtime. Full-stack apps use a Vite/React host for UI — Point generates the glue. Python emit covers logic, routes, workflows, and pipelines; views and rich UI stay on JS/TS.

| Need | Command |
|------|---------|
| Logic / API JS | `point build` |
| Full-stack deploy | `point build-app` |
| SQL migrations | `point build-schema` |
| TypeScript host | `point build-ts` (advanced) |
| Python automation | `point build-py` (advanced) |

## Repo development

```bash
bun install
bun run ci
```

## Packages

```text
packages/point       — compiler + CLI (@hatchingpoint/point)
packages/point-vscode — VS Code/Cursor extension
```

## Product vs package name

The product is **Point**. The npm package is **`@hatchingpoint/point`** for a collision-resistant public identity.

## Docs

- [Point in 60 seconds](docs/site/guide/point-in-60-seconds.md)
- [Golden app demo](docs/site/guide/golden-app-demo.md)
- [Five-minute tour](docs/site/guide/five-minute-tour.md)
- [CLI reference](docs/site/reference/cli.md)
- [In the box](docs/site/language/in-the-box.md)
- [Changelog](CHANGELOG.md)
