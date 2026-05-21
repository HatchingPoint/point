# Point Production Readiness

Point is being built as a general-purpose, AI-first language that can be used inside existing JavaScript ecosystems before it owns a full app runtime.

The forward-facing language is semantic product logic. Conventional programming-language-shaped syntax is internal compiler core, not the authoring surface.

## Today

Point semantic source supports:

- Modules, records, calculations, rules, labels, returns, conditionals, and expressions.
- Primitive types: `Text`, `Int`, `Float`, `Bool`, and `Void`.
- Generic lists with `List<T>`.
- Property access on named types.
- Type checking with structured diagnostics.
- Stable `point://` refs and repair metadata for AI coding-agent loops.
- Formatting for canonical core output.
- TypeScript emission for React, Vue, Bun, Node, and Vite consumers.

## Daily Workflow

```bash
bun run point:fmt-check:all
bun run point:check:all
bun run point:build:all
```

`point:build:all` emits TypeScript into `src/point-core/generated`. Use `point:build:ast:all` when debugging compiler output.

Use `bun run point:check-json` when an agent needs machine-readable diagnostics with stable refs, expected/actual metadata, repair hints, and related symbols.

Use these commands for self-context:

```bash
bun run point:index
bun run point:explain examples/math.point point://core/Math/fn.scoreStatusLabel
bun run point:repair-plan
```

## Editor Workflow

The Cursor/VS Code extension lives in `packages/point-vscode`.

```bash
bun run point:vscode:package
bun run point:vscode:setup
```

The extension provides `.point` language registration, syntax highlighting, snippets, and a Point file icon theme.

## Production Path

1. Keep the core language package framework-neutral.
2. Emit TypeScript first so existing React/Vue/Bun projects can import Point output.
3. Grow semantic source with iteration, errors/results, modules across files, async, effects, and package resolution.
4. Add framework targets later: React components, Vue components, server handlers, edge functions, and app routing.
5. Publish the core package and editor extension when the generated TypeScript target is stable.
