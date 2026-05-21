---
title: point add
description: Add Point package dependencies with workspace, file, and npm specs — manifest, lockfile, and resolution at check/build.
quadrant: Reference
---

## Summary

`point add` declares dependencies in `point.json` and regenerates `point.lock` with pinned paths. Project-wide `check`, `build`, and related commands resolve `use <package>.<module>` imports through the lockfile — no manual path wiring in every file.

## Manifest and lockfile

Every Point project has a `point.json` manifest:

```json
{
  "name": "point",
  "version": "0.0.5",
  "dependencies": {
    "std": "workspace:std"
  }
}
```

`point.lock` pins resolved packages with `schemaVersion: "point.lock.v1"`:

```json
{
  "schemaVersion": "point.lock.v1",
  "packages": {
    "point": {
      "version": "0.0.5",
      "dependencies": {
        "std": "workspace:std"
      }
    },
    "std": {
      "version": "workspace",
      "path": "std"
    }
  }
}
```

The lockfile is JSON on purpose — agents and CI can inspect and update it safely. Do not hand-edit paths unless you know what you are doing; prefer `point add` to keep manifest and lock in sync.

## The add command

```bash
point add <name> <spec>
```

| Argument | Meaning |
|----------|---------|
| `<name>` | Local alias used in `use` imports (e.g. `std`, `logic`) — must be a valid identifier |
| `<spec>` | Dependency locator: `workspace:…`, `file:…`, or `npm:…` |

The command updates `point.json` `dependencies`, resolves paths relative to the project root, and writes a fresh `point.lock`. On success it prints which files changed.

Invalid names, missing `point.json`, unknown spec prefixes, or paths that do not exist exit with code 1 and a clear error message.

## Dependency specs

| Spec | Status | Meaning |
|------|--------|---------|
| `workspace:<path>` | Supported | Local Point package directory — typical in monorepos |
| `file:<path>` | Supported | Local path on disk, relative to project root |
| `npm:<package>` | **Pending (Phase 12)** | npm registry package — parsed but not resolved yet |

### `workspace:` — monorepo packages

Use when the dependency lives in the same repository or workspace layout:

```bash
point add std workspace:std
```

The locator is a directory path (relative to the project root) that contains a `point.json` or `.point` modules. After resolution, `point.lock` stores the normalized relative path and `version: "workspace"`.

In this repository, the root project depends on the shared std library this way:

```json
"dependencies": {
  "std": "workspace:std"
}
```

Then `use std.text` resolves to `std/text.point` via the lockfile entry for `std`.

### `file:` — local packages on disk

Use for sibling directories, vendored packages, or paths outside a workspace convention:

```bash
point add logic file:packages/point-logic
```

The locator is any existing directory relative to the project root. Resolution pins `version: "file"` and the normalized path in `point.lock`. If the directory has its own `point.json`, nested package metadata is recorded under the nested package name.

### `npm:` — registry packages (pending)

The CLI accepts `npm:` specs syntactically so manifests stay forward-compatible:

```bash
# Planned — not supported in the CLI yet
point add logic npm:@hatchingpoint/point-logic
point add logic npm:@hatchingpoint/point-logic@0.0.1
```

**Today:** `point add … npm:…` fails with an explicit error — registry resolution (install under `node_modules/`, locate `point.json` or `src/*.point`, pin path in `point.lock`) ships in Phase 12 goal P12-1. Until that lands, use `file:` for local copies of published packages or declare npm libraries through `external` blocks and your app's `package.json` (see [npm packages](/point/ecosystem/npm-packages)).

## Resolution at check and build

After dependencies are locked:

- `use <package>.<module>` without a `from` path resolves through `point.lock` (e.g. `use std.http` → `std/http.point`).
- Relative imports such as `use Module from "./module.point"` still work alongside lockfile packages.
- `check-all`, `build-all`, and related project commands load `point.lock` from the project root when building the module graph.

If a package name is missing from the lockfile, check/build report an error that includes the suggested `point add` command.

## Examples

**Monorepo std library (this repository):**

```bash
point add std workspace:std
```

**Local logic package before publish:**

```bash
point add logic file:packages/point-logic
```

**Future registry dependency (when P12-1 merges):**

```bash
point add logic npm:@hatchingpoint/point-logic
```

## Common mistakes

- Using `npm:` before registry support ships — use `file:` or `workspace:` for local Point packages today.
- Adding a dependency name that does not match how you `use` it — the lockfile alias must match the prefix in `use std.text`, `use logic.store`, etc.
- Expecting `point add` to install JavaScript npm deps for `external` blocks — those still belong in `package.json`; `point add` is for Point package modules only.
- Editing `point.lock` paths by hand after moving directories — re-run `point add` or regenerate the lock from the manifest.

## See also

- [CLI reference](/point/reference/cli) — `add` exit codes and project commands
- [npm packages](/point/ecosystem/npm-packages) — `@hatchingpoint/point`, publishing, and `external` interop
- [Authoring vs runtime](/point/concepts/authoring-vs-runtime) — manifest vs emitted artifacts
