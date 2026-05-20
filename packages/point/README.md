# Point

Point is an AI-first general-purpose language core for coding-agent-native software engineering.

This package is the source of truth for Point. It exposes:

- `point` CLI through `src/cli.ts`
- core language APIs through `@point-lang/point/core`
- core parser, formatter, checker, and TypeScript emitter APIs

Core workflow:

```bash
bun run point:fmt-check:all
bun run point:check:all
bun run point:build:all
```

`point:build:all` emits TypeScript that can be imported by React, Vue, Bun, Node, and Vite projects.

When Point is extracted, this package can move into a standalone repo with the same package name and public entrypoints.
