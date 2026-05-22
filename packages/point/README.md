# Point

Point is an AI-first general-purpose language core for coding-agent-native software engineering.

## Install

Requires [Bun](https://bun.sh) on PATH.

```bash
bun install -g @hatchingpoint/point
point create my-app
cd my-app
point check src/app.point
point run src/app.point
```

Also works: `npm install -g @hatchingpoint/point`.

List templates with `point create --list-templates`. Legacy alias: `point app new`.

Pair with the [Point Language](https://marketplace.visualstudio.com/items?itemName=hatchingpoint.point) extension in VS Code or Cursor.

Point's public source language is semantic product logic. The compiler lowers that source into an internal typed core and emits JavaScript by default for Bun and Node. Use `point build-ts` when you need TypeScript for existing typed JavaScript infrastructure.

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

`bun run build` emits JavaScript into `generated/` by default. Use `bun run build:ts` for TypeScript and `bun run build:ast` when debugging compiler output.

When Point is extracted, this package can move into a standalone repo with the same package name and public entrypoints.
