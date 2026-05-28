---
title: Standalone app template
description: Create a runtime-native Point app outside the monorepo.
quadrant: How-to
---

## Summary

You do not need a clone of the Point repository to start an application. The **`runtime-app`** template is the canonical default shipped inside the **`@hatchingpoint/point`** npm package. It scaffolds with **`point create`** and runs through the owned Point runtime, without React, Vite, or generated app code.

## Create from npm

```bash
npm install -g @hatchingpoint/point
point create my-app
cd my-app
npm install
point dev
```

Use **`--template runtime-app`** only when you want to be explicit; it is the default:

```bash
point create my-app --template runtime-app
point create --list-templates
```

Use **`--template runtime-saas-app`** when you want the runtime-owned SaaS starter with auth middleware and SQLite, without a `web/` directory or Vite host:

```bash
point create my-saas --template runtime-saas-app
```

The runtime app template includes:

- Semantic `.point` source under `src/`
- Point-only tests under `tests/`
- Editor/LSP config under `.point/` and `.vscode/`
- `point.json` with `runtime: "owned"`

## Monorepo reference

The canonical runtime template lives at `packages/point/templates/runtime-app/` in the [Point repository](https://github.com/HatchingPoint/point). The runtime SaaS template lives at `packages/point/templates/runtime-saas-app/`. The npm package `files` list ships only those two templates.

Runtime app template updates are maintained directly under `packages/point/templates/`. Legacy emit + Vite templates (`full-stack-app`, `saas-app`, `vercel-app`) were removed in P10.

## Registry note

Phase 13 registry work covers **`point add npm:`** and GitHub Packages, not a hosted Point catalog. Third-party modules install like any npm dependency; see [point-add.md](./point-add.md).

## See also

- [npm-packages.md](./npm-packages.md)
- [point-add.md](./point-add.md)
