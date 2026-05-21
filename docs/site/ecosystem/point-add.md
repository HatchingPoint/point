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
| `npm:<package>` | Supported | npm registry package — installs to `node_modules/` and pins path in lock |

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

### `npm:` — registry packages

Install published Point packages from any npm-compatible registry (public npm, GitHub Packages, or a private mirror). The CLI runs `npm install --no-save` using your project’s npm configuration (`.npmrc`, environment), locates `point.json` or `src/*.point` in the package, and pins the path under `node_modules/` in `point.lock`:

```bash
point add logic npm:@hatchingpoint/point-logic
point add logic npm:@hatchingpoint/point-logic@0.0.2
```

Then `use logic.store-readiness` resolves through the lockfile.

**Note:** Packages that ship only emitted JavaScript in `dist/` (no `.point` source in the tarball) cannot be typechecked via `point add`. Prefer packages that include Point source, or import emitted JS directly for runtime-only use.

#### Registry configuration

`point add` does not implement a separate Point registry protocol. It delegates to **npm** for download and path resolution. Configure the registry the same way you would for any scoped package:

| Registry | When to use | Project setup |
|----------|-------------|---------------|
| [registry.npmjs.org](https://www.npmjs.com/) | Public open-source libraries (`@hatchingpoint/*`) | Default — no extra config |
| [GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) | Org-private or repo-scoped packages | `.npmrc` + `publishConfig.registry` on the library |
| Private Verdaccio / Artifactory | Enterprise mirrors | `.npmrc` `registry=` URL |

**GitHub Packages (consumer)** — in the consuming project root, add `.npmrc` (commit for teams, or use CI secrets locally):

```ini
@your-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then install as usual:

```bash
export GITHUB_TOKEN=ghp_...   # classic PAT with read:packages, or Actions GITHUB_TOKEN
point add logic npm:@your-org/point-logic
point check-all
```

`npm install` honors `.npmrc`, so `point.lock` pins the same `node_modules/@your-org/point-logic` path whether the tarball came from npmjs or GitHub.

**GitHub Packages (publisher)** — see [npm packages — Publish workflow](/point/ecosystem/npm-packages#publish-workflow) for `package.json` `publishConfig` and CI token setup.

## Resolution at check and build

After dependencies are locked:

- `use <package>.<module>` without a `from` path resolves through `point.lock` (e.g. `use std.http` → `std/http.point`).
- Relative imports such as `use Module from "./module.point"` still work alongside lockfile packages.
- `check-all`, `build-all`, and related project commands load `point.lock` from the project root when building the module graph.

If a package name is missing from the lockfile, check/build report an error that includes the suggested `point add` command.

## Publish → consume workflow

End-to-end flow for a Point library team:

```text
Author .point  →  point check / point build  →  npm publish  →  point add npm:  →  use pkg.module
```

| Step | Who | Command / artifact |
|------|-----|-------------------|
| 1. Author | Library maintainer | Edit `src/*.point` only; add `point.json` |
| 2. Verify | CI | `point check`, `point build` (and optional `point build-py`) |
| 3. Package | Maintainer | `package.json` `"files"` includes `dist/`, `point.json`, `src/*.point` |
| 4. Publish | Maintainer / CI | `npm publish` (public) or `npm publish --registry https://npm.pkg.github.com` |
| 5. Declare | App team | `point add <alias> npm:@scope/pkg[@version]` |
| 6. Import | App authors | `use <alias>.<module>` — resolved via `point.lock` |

Reference implementation: `@hatchingpoint/point-logic` in `packages/point-logic/` (monorepo) — same layout works in a standalone repository.

**Hosted package index:** There is no first-party Point registry service yet. Discovery is via npm search, GitHub repo README, or an internal catalog you maintain manually. Installation still uses `point add … npm:…` against whichever npm registry hosts the tarball.

## Examples

**Monorepo std library (this repository):**

```bash
point add std workspace:std
```

**Local logic package before publish:**

```bash
point add logic file:packages/point-logic
```

**Registry dependency (public npm):**

```bash
point add logic npm:@hatchingpoint/point-logic
```

**Registry dependency (GitHub Packages, after `.npmrc` is configured):**

```bash
point add logic npm:@your-org/point-logic@1.0.0
```

## Common mistakes

- Using `npm:` on packages that ship only `dist/` JS — they won't resolve for `point check`; use packages with `.point` source or `file:` for local copies.
- Adding a dependency name that does not match how you `use` it — the lockfile alias must match the prefix in `use std.text`, `use logic.store`, etc.
- Expecting `point add` to install JavaScript npm deps for `external` blocks — those still belong in `package.json`; `point add` is for Point package modules only.
- Editing `point.lock` paths by hand after moving directories — re-run `point add` or regenerate the lock from the manifest.
- Publishing or consuming GitHub Packages without a scoped `.npmrc` — npm defaults to registry.npmjs.org and `point add npm:@your-org/...` will 404.
- Forgetting to include `src/*.point` and `point.json` in the published tarball — consumers cannot `point check` against your package.

## See also

- [CLI reference](/point/reference/cli) — `add` exit codes and project commands
- [npm packages](/point/ecosystem/npm-packages) — `@hatchingpoint/point`, publishing, and `external` interop
- [Authoring vs runtime](/point/concepts/authoring-vs-runtime) — manifest vs emitted artifacts
