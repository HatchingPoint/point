---
title: Changelog
description: Where to find release history and public package versions.
quadrant: Reference
---

## Summary

Release history lives in the Point repo changelog and package metadata.

## Package version

Current release: **0.1.32**

Check the published npm version:

```bash
npm view @hatchingpoint/point version
```

## Recent releases (summary)

| Version | Highlights |
|---------|------------|
| **0.1.32** | Phase 40: presentation alignment — Point in 60 seconds, Apple/Agent rings, honest boundaries, version sync. |
| **0.1.31** | Phase 39: `capabilities http json`, `point commands`/`box`/`launch`, in-the-box guide. |
| **0.1.30** | Phase 38: emit import pruning, five-minute tour. |
| **0.1.29** | Phase 37: selective use merge, domain outcomes guide, template capabilities. |
| **0.1.27** | Phase 35: agent repair CI gate, timezone std, LSP cross-module use. |
| **0.1.26** | Phase 34: cross-module use resolution, money-demo linked std/money. |
| **0.1.25** | Phase 33: std/money format, Python pipeline emit, Phase 13 closed. |
| **0.1.24** | Phase 32: Duration type, std.time duration helpers, audit sync. |
| **0.1.23** | Phase 31: variant-first domain errors, calculation on failure return. |
| **0.1.22** | Phase 30 SQL productization + roadmap-analyze CI fix. |
| **0.1.21** | Phase 28 agent loop hardening + Phase 29 Python std mirror. |
| **0.1.20** | Phase 27: middleware validation, view source maps, theme toggle, `build-schema` SQL stub. |
| **0.1.19** | Phase 26 Wave 2: pipeline step I/O, money lint, load-data repair hints. |
| **0.1.18** | Phase 26 Wave 1: field aliases, variant exhaustiveness, Maybe narrowing, tab/slot style modifiers. |
| **0.1.17** | Phase 25 Wave 2: `theme` blocks, new style modifiers, `vercel-app` template, `build-app` writes `.tsx`, route handler without `command serve`, NavLink active state. |
| **0.1.16** | Fix invalid JSX when views emit multiple render lines. |
| **0.1.15** | Multi-render view emit; `.point-nav` wrapper and CSS. |
| **0.1.14** | Phase 25 Wave 1: native semantic view styling, shipped `point-ui.css`, `unknown-view-style` checker diagnostics. |
| **0.1.13** | Fix CI tests that mkdir gitignored `tests/tmp` before creating temp project dirs. |
| **0.1.12** | Fix CI test suite: Instant/`use std.*` parsing, `point run` prefers non-serve commands, ephemeral ports for test HTTP servers. |
| **0.1.11** | Fix check-docs CI for modules.md snippets; restore `@hatchingpoint/point` devDependency in published full-stack template. |
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
