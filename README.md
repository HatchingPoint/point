# Point

Point is an AI-first general-purpose language for building software with coding agents.

People write semantic product logic. The compiler lowers that source into an internal typed core, then emits TypeScript so existing React, Vue, Bun, Node, and Vite projects can use it without changing their runtime stack.

## What Exists Today

- Point core language package: `@hatchingpoint/point`
- Cursor/VS Code extension package: `point`
- Formatter, checker, TypeScript emitter, AST emitter, and CLI
- Stable `point://` refs, symbol indexing, explanations, and repair plans for coding agents
- AI-first public syntax with `record`, `calculation`, `rule`, `label`, `add ... when`, and `otherwise`
- Internal typed core that supports values, functions, assignment, conditionals, lists, records, and TypeScript emission

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
bun run explain examples/math.point point://core/Math/fn.scoreStatusLabel
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

The npm package uses `@hatchingpoint/point` so it has a collision-resistant public package identity owned by Hatching Point.
