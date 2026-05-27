---
title: CLI reference
description: All point commands, arguments, defaults, and exit behavior.
quadrant: Reference
---

## Summary

The `point` CLI ships in `@hatchingpoint/point`. Commands take a file path unless noted. Project-wide commands end in `-all`.

**Version:** `@hatchingpoint/point@0.2.4` (see `npm view @hatchingpoint/point version`)

## CLI rings (start here)

Most users need only these:

| Ring | Commands | Purpose |
|------|----------|---------|
| **Daily** | `check`, `box`, `launch`, `demo`, `dev` | Validate, discover, run, app dev |
| **Build** | `build`, `build-app`, `build-schema` | Emit for legacy hosts and deploy |
| **Agent** | `check-json`, `repair`, `repair-plan`, `index`, `explain` | Compiler as agent IDE |
| **Advanced** | `build-ts`, `build-py`, `build-ast`, `*-all`, `repl` | Alternate emit, batch, tooling |

See [Point in 60 seconds](/point/guide/point-in-60-seconds) and [Build and emit](/point/toolchain/build-emit) decision tree.

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
| `repair` | Alias for `repair-plan` | 1 if diagnostics |
| `demo` | Golden demo path: check, box, print dev/launch/repair next steps | 1 on check failure |
| `capabilities` | List built-in std modules (`use http` shorthand); `--json` for agents | 0 |
| `commands` | List runnable `command` blocks in a file; `--json` for agents | 0 |
| `box` | Capabilities + commands for one file in one screen; `--json` for agents | 0 |
| `print-ast` | Dump core program JSON | 0 |
| `build` | Emit JavaScript (default `generated/<base>.js`); `--production` for deploy-oriented emit | 1 on diagnostics |
| `build-ts` | Emit TypeScript (default `generated/<base>.ts`) | 1 on diagnostics |
| `build-js` | Alias for `build` (same flags) | 1 on diagnostics |
| `build-py` | Emit Python (logic, actions, routes, workflows, commands where supported) | 1 on diagnostics |
| `build-py-all` | Emit Python for all discovered files (skips unsupported blocks) | 1 on diagnostics |
| `run` | Check, run zero-arg entrypoint: `point run <file> [command name]` | 1 on check/runtime error |
| `launch` | Alias for `point run` — requires command name: `point launch <file> <command name>` | 1 on check/runtime error |
| `dev` | Runtime-owned apps (`point.json` `runtime: "owned"`) run through `packages/point/runtime/`; legacy apps still use incremental build/dev and may start Vite | 1 on initial check failure |
| `serve` | Runtime-owned apps serve through `packages/point/runtime/`; legacy Path B apps serve static `dist/` + `/api/*` routes | 1 on check failure or missing legacy `dist/` |
| `build-app` | Legacy app build: emit JS + TS then run Vite build → `dist/` (requires `web/vite.config.*`; disabled for `runtime: "owned"`) | 1 on check failure, vite error, or runtime-owned app |
| `test` | Run `test*` Bool calculations/actions | 1 on failure |
| `test integration` | Start route server and run `integration test*` Bool actions | 1 on failure |
| `repl` | Evaluate expressions from stdin or inline | 0 |
| `lsp` | Start stdio language server | runs until stopped |

## App scaffolding

| Command | Purpose | Exit |
|---------|---------|------|
| `create` | Scaffold a new runtime-owned app: `point create <name> [directory]` (default `--template runtime-app`) | 1 on invalid name or non-empty target |
| `create --list-templates` | List bundled app templates | 0 |
| `init` | Add Point to an existing repo: `point init [directory] [--skip-install] [--force]` | 0 |
| `app new` | Legacy alias for `point create` | same as `create` |

Creates a project directory with `point.json`, `package.json`, `src/app.point`, editor configs (`.vscode/`, `.point/`), `.gitignore`, and README. The default `runtime-app` template sets `point.json` to `runtime: "owned"` so `point run`, `point test`, `point dev`, and `point serve` use the Point runtime instead of generated app artifacts.

Available templates include:

| Template | Command | Runtime mode |
|----------|---------|--------------|
| `runtime-app` | `point create my-app` or `point create my-app --template runtime-app` | Runtime-owned (`point.json` `runtime: "owned"`) |
| `runtime-saas-app` | `point create my-app --template runtime-saas-app` | Runtime-owned auth middleware + SQLite, no `web/` or Vite |
| `full-stack-app` | `point create my-app --template full-stack-app` | Legacy Vite/React host |
| `saas-app` | `point create my-app --template saas-app` | Legacy Vite/React host with auth/SQLite |
| `vercel-app` | `point create my-app --template vercel-app` | Legacy Vite/React/Vercel host |

Runtime-owned apps disable emit/app-build paths (`build`, `build-js`, `build-ts`, `build-app`) for that app surface. Use legacy templates only when you explicitly want generated host artifacts and Vite/React integration during the transition.

`point init` adds `@hatchingpoint/point`, workspace editor settings, `.point/lsp.mjs` (portable LSP launcher), and a `check` script when `.point` files are present.

## Package management

| Command | Purpose | Exit |
|---------|---------|------|
| `add` | Add dependency: `point add <name> <spec>` | 1 on invalid spec or missing `point.json` |

Supported specs: `workspace:<path>`, `file:<path>`, `npm:<package>[@version]`.

Updates `point.json` and regenerates `point.lock`. Project-wide check/build resolve `use <package>.<module>` through the lockfile (see [package management](/point/ecosystem/package-management) in the repo docs).

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
| `build-py-all` | Emit Python for pure-logic fixtures (skips views, routes, workflows, commands) |
| `test-all` | Run tests in all discovered files |

## Environment

| Variable | Effect |
|----------|--------|
| `POINT_INCREMENTAL=1` | Cache unchanged files during `check-all` and legacy `point dev` rebuilds |

## Run and test conventions

- **run:** `point run <file> [command name]` — when omitted, picks default `command` (non-serve first), then `main`, then first zero-arg function
- **launch:** same as run but command name is required
- **commands / box:** discover entrypoints before running
- **test:** zero-input `calculation` or `action` whose semantic name starts with `test` and returns `Bool`
- **runtime-owned apps:** a nearby `point.json` with `runtime: "owned"` is the app ownership boundary. Run/test/dev/serve stay inside `packages/point/runtime/`; generated JS/TS app artifacts are not part of that workflow.

## Agent-facing commands

Prefer `check-json`, `index`, `explain`, `repair-plan`, `capabilities`, `commands`, and `box` for automation. See [AI overview](/point/ai/overview).

## Build flags

| Flag | Commands | Effect |
|------|----------|--------|
| `--production` | `build`, `build-js` | Optimized JavaScript emit for deploy (header + compact spacing; use host minifier for final bundle) |
| `--port <n>` | `dev`, `serve` | Listen port (default `3456`) |
| `--api` | `dev` | API-only dev — skip Vite |
| `--static <dir>` | `serve` | Static root (default `dist`) |

## See also

- [Dev and serve](/point/toolchain/dev)
- [Deploy](/point/toolchain/deploy)
- [Python build (build-py)](/point/toolchain/build-py)
- [LSP](/point/toolchain/lsp)
- [Diagnostics](/point/reference/diagnostics)
- [Installation](/point/guide/installation)
