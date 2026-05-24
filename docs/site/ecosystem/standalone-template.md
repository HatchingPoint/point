---
title: Standalone app template
description: Create a full-stack Point app outside the monorepo.
quadrant: How-to
---

## Summary

You do not need a clone of the Point repository to start an application. The **`full-stack-app`** template ships inside the **`@hatchingpoint/point`** npm package and scaffolds with **`point create`**.

## Create from npm

```bash
npm install -g @hatchingpoint/point
point create my-app
cd my-app
npm install
point dev
```

Use **`--template full-stack-app`** explicitly when listing templates:

```bash
point create my-app --template full-stack-app
point create --list-templates
```

The template includes:

- Semantic `.point` source under `src/`
- Vite + React UI under `web/`
- Editor/LSP config under `.point/` and `.vscode/`
- `render.yaml` for deployment

## Monorepo reference

The canonical template lives at `packages/point/templates/full-stack-app/` in the [Point repository](https://github.com/HatchingPoint/point). The monorepo also keeps `examples/full-stack-template/` for dogfooding — same layout, different name substitution.

To publish template updates, maintainers run `bun run sync:app-template` before releasing `@hatchingpoint/point`.

## Registry note

Phase 13 registry work covers **`point add npm:`** and GitHub Packages — not a hosted Point catalog. Third-party modules install like any npm dependency; see [point-add.md](./point-add.md).

## See also

- [npm-packages.md](./npm-packages.md)
- [point-add.md](./point-add.md)
