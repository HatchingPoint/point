# Point

Point is an AI-first general-purpose language for building software with coding agents.

People write semantic product logic. The compiler lowers that source into an internal typed core, then emits TypeScript so existing React, Vue, Bun, Node, and Vite projects can use it without changing their runtime stack.

## What Exists Today

- Point core language package: `@hatchingpoint/point`
- Cursor/VS Code extension package: `point`
- Formatter, checker, TypeScript emitter, AST emitter, and CLI
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
3. Install [Point Language](https://marketplace.visualstudio.com/items?itemName=hatchingpoint.point) in VS Code or Cursor.
4. Open a `.point` file — diagnostics and symbols use the `point` CLI on PATH.

## Quick Start (repo development)

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

## Roadmap

The master execution plan for building Point into a full general-purpose language lives in [docs/full-language-plan.md](docs/full-language-plan.md). Work phases in order; do not advance until every checkbox in the current phase is complete.

- [Language spec](docs/language-spec.md)
- [Agent quick reference](docs/agent-quick-reference.md)
- [Phase 7 complete review](docs/phase7-complete-review.md) — architecture after AST modernization
- [Phase 7 AST plan](docs/phase7-ast-plan.md) — complete
- [Post–Phase 7 Codex goals](docs/codex-goal-post-phase7.md)

To run the plan as a long-running Codex CLI goal, see [docs/codex-goal.md](docs/codex-goal.md). For work after Phase 7, see [docs/codex-goal-post-phase7.md](docs/codex-goal-post-phase7.md).

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
