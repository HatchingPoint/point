# Point

Point is an AI-first general-purpose language core for coding-agent-native software engineering.

Point's public source language is semantic product logic. The compiler lowers that source into an internal typed core and emits TypeScript for existing JavaScript infrastructure.

This package is the source of truth for Point. It exposes:

- `point` CLI through `src/cli.ts`
- core language APIs through `@hatchingpoint/point/core`
- semantic parser/lowering, core checker, formatter, and TypeScript emitter APIs

Core workflow:

```bash
bun run fmt-check
bun run check
bun run build
```

`bun run build` emits TypeScript into `generated/` for React, Vue, Bun, Node, and Vite projects.

When Point is extracted, this package can move into a standalone repo with the same package name and public entrypoints.
