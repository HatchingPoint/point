# Point

Point is a **general-purpose, AI-first language** for product logic — semantic blocks you write, JavaScript and Python the machine runs.

Write rules, routes, pages, pipelines, and commands in one checked source. The compiler emits JS by default (Bun/Node), with TypeScript, Python, and SQL schema when you need them.

**Current release:** v0.1.30 · **602 tests** · npm: `@hatchingpoint/point`

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
point run checkout.point
```

## Five block families

| Family | What you write | Examples |
|--------|----------------|----------|
| **Logic** | Data + derivations | `record`, `calculation`, `rule`, `label` |
| **App** | HTTP + UI | `route`, `page`, `view`, `middleware` |
| **Agent** | Automation | `pipeline`, `prompt`, `command`, `workflow` |
| **Data** | Schema + queries | records + `use sql` + `point build-schema` |
| **Effects** | Host boundaries | `action`, `external`, `policy` |

Full reference: [docs site](docs/site/guide/introduction.md) · Internal map: [product-map.md](docs/product-map.md)

## Built-in capabilities

Import std modules with straight syntax:

```point
use http
use json
use time
```

Same as `use std.http`. List all built-ins:

```bash
point capabilities
point capabilities --json
```

Local modules stay explicit: `use Billing from "./billing.point"`. Add packages with `point add`.

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
| **Quality** | `check`, `check-json`, `fmt` |
| **Emit** | `build`, `build-ts`, `build-py`, `build-schema` |
| **Run** | `run`, `test`, `dev`, `serve` |
| **Agent** | `index`, `explain`, `repair-plan`, `capabilities` |
| **Scaffold** | `create`, `init`, `add` |

## AI-native toolchain

Agents use stable refs and structured repairs — not line-number guessing:

```bash
point check-json myfile.point
point index myfile.point
point explain myfile.point point://semantic/Module/rule.cart total
point repair-plan myfile.point
```

Benchmark: 26+ repair cases with CI gate at 100% sufficiency.

## Emit targets

- **JavaScript** (default) — `point build`, `point run`, `point dev`
- **TypeScript** — `point build-ts` for React/Vite/tsc
- **Python** — `point build-py` for logic, routes, workflows, pipelines
- **SQL** — `point build-schema` for Postgres/SQLite migrations

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

- [Introduction](docs/site/guide/introduction.md)
- [Five-minute tour](docs/site/guide/five-minute-tour.md)
- [CLI reference](docs/site/reference/cli.md)
- [Capabilities](docs/site/language/capabilities.md)
- [Changelog](CHANGELOG.md)
- [Phase roadmap](docs/phase-roadmap.md)
