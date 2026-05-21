---
title: CLI reference
description: All point commands, arguments, defaults, and exit behavior.
quadrant: Reference
---

## Summary

The `point` CLI ships in `@hatchingpoint/point`. Commands take a file path unless noted. Project-wide commands end in `-all`.

**Version:** `@hatchingpoint/point` (see `npm view @hatchingpoint/point version`)

## Invocation

```bash
point <command> [input] [output-or-ref]
```

Defaults when omitted: `input` = `examples/math.point`, `output` = `generated/math.ast.json` (for build) or path used as ref (for `explain`).

## Single-file commands

| Command | Purpose | Exit |
|---------|---------|------|
| `check` | Typecheck one file | 1 on diagnostics |
| `check-json` | JSON diagnostics with semantic refs | 1 on diagnostics |
| `fmt` | Rewrite file with canonical formatting | 0 |
| `fmt-check` | Fail if file would change | 1 if unformatted |
| `index` | Symbol index JSON (semantic when available) | 0 |
| `explain` | Explain a ref: `point explain <file> <ref>` | 0 |
| `repair-plan` | Ordered repair steps from diagnostics | 1 if diagnostics |
| `print-ast` | Dump core program JSON | 0 |
| `build` | Write core AST JSON to output path | 1 on diagnostics |
| `build-ts` | Emit TypeScript (default `generated/<base>.ts`) | 1 on diagnostics |
| `build-js` | Emit JavaScript | 1 on diagnostics |
| `run` | Check, emit temp TS, run zero-arg entrypoint | 1 on check/runtime error |
| `test` | Run `test*` Bool calculations/actions | 1 on failure |
| `repl` | Evaluate expressions from stdin or inline | 0 |
| `lsp` | Start stdio language server | runs until stopped |

## Project commands (`-all`)

Discovered globs: `examples/**/*.point`, `std/**/*.point`, `compiler/**/*.point`.

| Command | Purpose |
|---------|---------|
| `check-all` | Typecheck all discovered files in dependency order |
| `fmt-all` | Format all discovered files |
| `fmt-check-all` | Verify formatting for all files |
| `build-all` | Write AST JSON for each file under `generated/` |
| `build-ts-all` | Emit TypeScript for each file |
| `build-js-all` | Emit JavaScript for each file |
| `test-all` | Run tests in all discovered files |

## Environment

| Variable | Effect |
|----------|--------|
| `POINT_INCREMENTAL=1` | Cache unchanged files during `check-all` |

## Run and test conventions

- **run:** prefers `command`, then function named `main`, then first zero-argument function
- **test:** zero-input `calculation` or `action` whose semantic name starts with `test` and returns `Bool`

## Agent-facing commands

Prefer `check-json`, `index`, `explain`, and `repair-plan` for automation. See [AI overview](/point/ai/overview).

## See also

- [LSP](/point/toolchain/lsp)
- [Diagnostics](/point/reference/diagnostics)
- [Installation](/point/guide/installation)
