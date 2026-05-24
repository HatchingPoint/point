# Point

Point is an AI-first general-purpose language core for coding-agent-native software engineering.

## Install

Requires [Bun](https://bun.sh) on PATH.

```bash
bun install -g @hatchingpoint/point
point create my-app
cd my-app
point check src/app.point
point dev src/app.point
```

Also works: `npm install -g @hatchingpoint/point`.

List templates with `point create --list-templates`. List built-in std modules with `point capabilities`.

Pair with the [Point Language](https://marketplace.visualstudio.com/items?itemName=hatchingpoint.point) extension in VS Code or Cursor.

Point's public source language is semantic product logic. The compiler lowers that source into an internal typed core and emits JavaScript by default for Bun and Node. Use `point build-ts` for TypeScript and `point build-py` for Python.

Built-in capabilities import with straight syntax:

```point
use http
use json
```

This package exposes:

- `point` CLI through `src/cli.ts`
- core language APIs through `@hatchingpoint/point/core`
- std runtime shims under `@hatchingpoint/point/std/*`

Core workflow (repo development):

```bash
bun run fmt-check
bun run check
bun run ci
```

When Point is extracted, this package can move into a standalone repo with the same package name and public entrypoints.
