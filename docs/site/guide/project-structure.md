---
title: Project structure
description: Recommended files, folders, generated outputs, and source-of-truth conventions for Point projects.
quadrant: How-to
---

## Summary

A Point project should keep `.point` source as the source of truth, generated JavaScript/TypeScript/Python as build output, and editor/runtime configuration close to the app that owns the Point files.

Use this page when deciding where files belong in a real repo.

## Minimal logic package

Use this shape when Point owns checked product logic that another app imports:

```text
my-package/
  package.json
  point.json
  src/
    checkout.point
    catalog.point
  generated/
    checkout.js
    checkout.ts
```

Recommended scripts:

```json
{
  "scripts": {
    "check": "point check src/checkout.point",
    "build": "point build src/checkout.point generated/checkout.js",
    "build:ts": "point build-ts src/checkout.point generated/checkout.ts"
  },
  "devDependencies": {
    "@hatchingpoint/point": "^0.1.19"
  }
}
```

Keep generated files out of hand edits. Fix `.point` source, rerun `point check`, then rebuild.

## Full-stack app

Use `point create my-app` for the current full-stack template:

```text
my-app/
  package.json
  point.json
  src/
    app.point
  web/
    vite.config.ts
    index.html
    src/
      main.tsx
  generated/
  dist/
  .point/
    lsp.mjs
    editor.json
  .vscode/
    extensions.json
    settings.json
```

`src/app.point` owns the semantic app surface: pages, views, routes, actions, workflows, and commands. `web/` is the host shell for browser bundling. `generated/` and `dist/` are outputs.

## Monorepos

Put Point configuration at the package/app boundary that owns the `.point` files:

```text
repo/
  apps/
    admin/
      point.json
      src/app.point
      package.json
  packages/
    pricing-rules/
      point.json
      src/pricing.point
      package.json
```

Run `point init` from each package that should have local editor config and scripts. This keeps the language server and CLI dependency resolution predictable for editors, CI, and agents.

## Source files

Use stable, domain-oriented names:

```text
src/
  checkout.point
  pricing.point
  routes.point
  workflows.point
```

Inside files, use `module` names that match the domain rather than the filesystem exactly:

```point
module Checkout
```

Relative imports connect multi-file modules:

```point
use Catalog from "./catalog.point"
```

Package imports use lockfile/package names:

```point
use std.text
use std.http
```

## Generated output

Generated output belongs in predictable folders:

| Folder | Contents | Commit? |
|--------|----------|---------|
| `generated/` | `point build`, `build-ts`, `build-py`, AST snapshots | Sometimes, when consumers import it directly |
| `dist/` | Built app/static output | Usually no |
| `.point/` | Local editor/LSP launcher | Yes |
| `.vscode/` | Workspace recommendations/settings | Yes for shared editor setup |

Whether to commit `generated/` is a product decision. Libraries may commit generated JS/TS for consumers; apps usually regenerate during build.

## CI shape

For a logic package:

```bash
bun install
bun run check
bun run build
```

For agent-friendly diagnostics:

```bash
point check-json src/app.point
point index src/app.point
point repair-plan src/app.point
```

For full apps:

```bash
point check src/app.point
point build-app src/app.point
```

## Agent conventions

- Treat `.point` source as canonical.
- Use `point://semantic/...` refs from `point index`, `check-json`, and `explain`.
- Do not repair generated JavaScript or TypeScript to fix semantic errors.
- Run project-wide checks when editing imported modules.
- Keep secrets in environment variables loaded through `std.env`.

## See also

- [Installation](/point/guide/installation)
- [Style guide](/point/guide/style-guide)
- [Compatibility](/point/guide/compatibility)
- [Modules](/point/language/modules)
- [Build and emit](/point/toolchain/build-emit)
- [Stable refs](/point/ai/stable-refs)
