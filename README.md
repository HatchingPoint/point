# Point

Point is an AI-first general-purpose language for building software with coding agents.

It starts by compiling `.point` source into TypeScript so existing React, Vue, Bun, Node, and Vite projects can use it without changing their runtime stack.

## What Exists Today

- Point core language package: `@point-lang/point`
- Cursor/VS Code extension package: `point`
- Formatter, checker, TypeScript emitter, AST emitter, and CLI
- Stable `point://` refs, symbol indexing, explanations, and repair plans for coding agents

## Quick Start

```bash
bun install
bun run fmt-check
bun run check
bun run build
```

Build output is written to `generated`.

```bash
bun packages/point/src/cli.ts build-ts examples/math.point generated/math.ts
```

## AI Context Commands

```bash
bun run index examples/math.point
bun run explain examples/math.point point://core/Math/fn.userLabel
bun run repair-plan examples/math.point
bun run check-json examples/math.point
```

These commands are the core of Point's AI engineering model: agents should navigate stable refs and repair structured diagnostics, not guess from raw source.

## Packages

```text
packages/point
  Point language core and CLI

packages/point-vscode
  Cursor/VS Code language support and file icons
```

## Product Name vs Package Name

The product and repo are named **Point**.

The npm package uses `@point-lang/point` so it has a collision-resistant public package identity.
