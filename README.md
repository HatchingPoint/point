# Point

Point is an AI-first general-purpose language for building software with coding agents.

People write semantic product logic. The compiler lowers that source into an internal typed core, then emits JavaScript by default so Bun and Node can run it without authors touching generated TypeScript. Use `point build-ts` when you need typed targets for React, Vue, or `tsc` pipelines.

## What Exists Today

- Point core language package: `@hatchingpoint/point`
- Cursor/VS Code extension package: `point`
- Formatter, checker, JavaScript and TypeScript emitters, AST emitter, and CLI
- Stable `point://` refs, symbol indexing, explanations, and repair plans for coding agents
- AI-first public syntax with `record`, `calculation`, `rule`, `label`, `add ... when`, and `otherwise`
- Internal typed core IR (functions, types, loops, assignment) — compiler data structures only; authors do not write core syntax

## Source Example

```point
module Readiness

record Deploy Signals
  has bundle id: Bool
  submitted for review: Bool

calculation annual price
  input monthly price: Int
  output annual price: Int
  annual price is monthly price * 12

rule deploy readiness
  input signals: Deploy Signals
  output score: Int
  score starts at 0
  add 50 when signals.has bundle id
  add 50 when signals.submitted for review
  return score

label deploy status
  input score: Int
  output Text
  when score >= 90 return "Ready"
  otherwise return "Not ready"
```

## Install (users)

1. Install [Bun](https://bun.sh).
2. Install the compiler:
   ```bash
   npm install -g @hatchingpoint/point
   ```
3. Install [Point Language](https://marketplace.visualstudio.com/items?itemName=hatchingpoint.point) in VS Code or Cursor **(optional)** — or use any editor with the CLI (see below).
4. Open a `.point` file — diagnostics and symbols use the `point` CLI on PATH (VS Code extension) or `point check` from the terminal (any editor).

### Any editor (no VS Code)

```bash
point check myfile.point
point fmt myfile.point
point build myfile.point generated/myfile.js
point run myfile.point
```

Use `point build-ts` when you need TypeScript for typed imports in an existing TS project.

Use `point check-json`, `point index`, and `point explain` in CI or agent scripts. For editor integration in Neovim, Zed, or other LSP clients, run `point lsp` — see [docs/editor-setup.md](docs/editor-setup.md).

## Quick Start (repo development)

```bash
bun install
bun run fmt-check
bun run check
bun run build
```

Build output is written to `generated/` as JavaScript by default.

```bash
bun packages/point/src/cli.ts build examples/math.point generated/math.js
bun packages/point/src/cli.ts build-ts examples/math.point generated/math.ts
```

## AI Context Commands

```bash
bun run index examples/math.point
bun run explain examples/math.point point://core/Math/fn.scoreStatusLabel
bun run repair-plan examples/math.point
bun run check-json examples/math.point
```

These commands are the core of Point's AI engineering model: agents should navigate stable refs and repair structured diagnostics, not guess from raw source.

## Roadmap

Phases 0–11 and Phase 12 Wave 1 are complete (v0.0.14). **Active:** [phase12-plan.md](docs/phase12-plan.md) Wave 2.

- [Vision — authoring vs runtime](docs/vision.md)
- [Phase 10 plan](docs/phase10-plan.md) · [Phase 11 plan](docs/phase11-plan.md)
- [Phase 12 plan](docs/phase12-plan.md)
- [Documentation site plan](docs/docs-site-plan.md)

## Packages

```text
packages/point
  Point language core and CLI

packages/point-vscode
  Cursor/VS Code language support and file icons
```

## Product Name vs Package Name

The product and repo are named **Point**.

The npm package uses `@hatchingpoint/point` so it has a collision-resistant public package identity owned by Hatching Point.
