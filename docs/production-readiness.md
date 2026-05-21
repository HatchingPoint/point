# Point Production Readiness

Point is being built as a general-purpose, AI-first language that can be used inside existing JavaScript ecosystems before it owns a full app runtime.

The forward-facing language is semantic product logic. Conventional programming-language-shaped syntax is internal compiler core, not the authoring surface.

## Shipped

- **npm:** `@hatchingpoint/point@0.0.9` — `npm install -g @hatchingpoint/point`
- **VS Code Marketplace:** [Point Language](https://marketplace.visualstudio.com/items?itemName=hatchingpoint.point) — diagnostics, symbols, syntax highlighting
- **Docs:** [hatchingpoint.com/point](https://www.hatchingpoint.com/point)
- **CI / publish:** `bun run ci` (78 tests); tag push `v*.*.*` publishes npm + Marketplace

## Today

Point semantic source supports:

- Modules, records, calculations, rules, labels, returns, conditionals, and expressions.
- Primitive types: `Text`, `Int`, `Float`, `Bool`, and `Void`.
- Generic lists with `List<T>`.
- Property access on named types.
- Type checking with structured diagnostics.
- Stable `point://` refs and repair metadata for AI coding-agent loops.
- Formatting for canonical semantic source.
- TypeScript and JavaScript emission for React, Vue, Bun, Node, and Vite consumers.

## Daily Workflow

```bash
bun run fmt-check
bun run check
bun run build
```

`bun run build` emits JavaScript into `generated/` by default. Use `bun run build:ts` for TypeScript and `bun run build:ast` when debugging compiler output.

Use `bun run check-json` when an agent needs machine-readable diagnostics with stable refs, expected/actual metadata, repair hints, and related symbols.

Use these commands for self-context:

```bash
bun run index examples/math.point
bun run explain examples/math.point point://semantic/Math/label.score status
bun run repair-plan examples/math.point
```

## Editor Workflow

The Cursor/VS Code extension lives in `packages/point-vscode`.

```bash
bun run vscode:package
```

The extension provides `.point` language registration, syntax highlighting, snippets, diagnostics on save (`check-json`), document outline (`index`), and a Point file icon theme.

## Production Path

1. Keep the core language package framework-neutral.
2. Emit TypeScript first so existing React/Vue/Bun projects can import Point output.
3. Grow semantic source with iteration, errors/results, modules across files, async, effects, and package resolution.
4. Add framework targets later: React components, Vue components, server handlers, edge functions, and app routing.
5. **Done:** core package, editor extension, LSP, adoption examples, and `@hatchingpoint/point-logic` published. Active: [phase12-plan.md](./phase12-plan.md).
