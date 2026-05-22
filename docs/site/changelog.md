---
title: Changelog
description: Where to find release history and public package versions.
quadrant: Reference
---

## Summary

Release history lives in the Point repo changelog and package metadata.

## Package version

Current release: **0.1.10**

Check the published npm version:

```bash
npm view @hatchingpoint/point version
```

## Recent releases (summary)

| Version | Highlights |
|---------|------------|
| **0.1.10** | `point init` for existing repos; project-local CLI/LSP after `bun install`; full-stack template ships `.vscode/` + `.point/` editor configs. |
| **0.1.9** | Fix fmt-check/publish CI: formatter resolves `use std.*` callables; map/lookup format; `label is` parse in calculations. |
| **0.1.8** | Phase 23 Wave 2: `Instant` opaque type with `std.time` (`instant now`, `format instant`, `parse instant`); dependency-aware parse/desugar for multi-word std callables. |
| **0.1.7** | Phase 24 Path B: `point dev` app mode (Vite + Bun API), `point serve`, `point build-app`, full-stack template with Render deploy path. |
| **0.1.6** | Phase 22 dedomainized docs; Phase 23 `Map<Text, T>`, lookup, and std money pattern. |
| **0.1.5** | Bun-first install docs; `point add` prefers bun. |
| **0.1.1** | Agent repair: check-json lists Point source field names in expected/repair; model benchmark + CI sufficiency tests. |
| **0.1.0** | Platform Phases 14–21: multi-page apps, WebSockets, generic DB (`std.sql` + external), pipelines/sessions/prompts, Python parity, `point dev`, full-stack template. Convex removed. |
| **0.0.15** | Phase 12 complete: starter template, Open VSX, live demo, point-logic source on npm |
| **0.0.14** | npm `point add`, full std shims, `point run --bundle` |
| **0.0.13** | Phase 10–11: `page` block, `build-py-all`, `point add` workspace/file, controlled views |
| **0.0.11** | LSP in VS Code extension, completion/rename, adoption examples |

Full history: Point repository `CHANGELOG.md`.

## Editor extension

The VS Code Marketplace entry uses the same product line but may have its own package version timing.

## See also

- [npm](/point/ecosystem/npm)
- [Marketplace](/point/ecosystem/marketplace)
- [Installation](/point/guide/installation)
- [Platform vision](/point/concepts/platform-vision)
