---
title: npm
description: Install Point and publish Point-authored packages through npm workflows.
quadrant: Reference
---

## Summary

The public CLI package is `@hatchingpoint/point`.

## Install

```bash
npm install -g @hatchingpoint/point
```

This installs the `point` command, including the compiler, formatter, LSP server, and agent-facing commands.

## Point-authored packages

Point source can be used to generate package output. Keep `.point` as the source of truth, build generated JavaScript or TypeScript into `dist/`, and publish the package artifact through normal npm tooling.

## See also

- [Installation](/point/guide/installation)
- [Build and emit](/point/toolchain/build-emit)
- [Authoring vs runtime](/point/concepts/authoring-vs-runtime)
