---
title: npm
description: Install Point and publish Point-authored packages — Bun-first, from the public npm registry.
quadrant: Reference
---

## Summary

The public CLI package is `@hatchingpoint/point`. Point is **Bun-first**: install with Bun when you can. Packages live on the npm registry, so npm, pnpm, and yarn work too.

## Install (Bun)

```bash
bun install -g @hatchingpoint/point
```

Also works from the same registry:

```bash
npm install -g @hatchingpoint/point
```

This installs the `point` command — compiler, formatter, LSP server, and agent-facing commands. Point runs on Bun; install [Bun](https://bun.sh) if `point` cannot start.

## Point-authored packages

Point source can be used to generate package output. Keep `.point` as the source of truth, build generated JavaScript into `dist/`, and publish through normal registry tooling (`bun publish` or `npm publish`).

## See also

- [Installation](/point/guide/installation)
- [npm packages](/point/ecosystem/npm-packages)
- [Build and emit](/point/toolchain/build-emit)
- [Authoring vs runtime](/point/concepts/authoring-vs-runtime)
