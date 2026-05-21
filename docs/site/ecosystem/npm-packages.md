---
title: npm packages
description: Official Point packages on npm, how to consume them, and how to publish libraries authored in Point.
quadrant: Reference
---

## Summary

Point ships on npm under the `@hatchingpoint` scope. The compiler CLI, standard-library runtime shims, and published application logic packages all follow the same rule: **`.point` source is authoritative**; JavaScript in `dist/` or std shims is emitted or maintained as runtime glue, not hand-written product logic.

## Official packages

| Package | Role | Install |
|---------|------|---------|
| `@hatchingpoint/point` | Compiler, CLI, LSP, core APIs, std runtime shims (`@hatchingpoint/point/std/*`) | `npm install -g @hatchingpoint/point` |
| `@hatchingpoint/point-logic` | Pure product logic published from `.point` only (store listing readiness scoring) | `npm install @hatchingpoint/point-logic` |

Both packages are MIT licensed and published from the [Point repository](https://github.com/HatchingPoint/point).

## @hatchingpoint/point (compiler + std bridge)

Install globally for the CLI and language server:

```bash
npm install -g @hatchingpoint/point
point --help
point lsp
```

In application projects, add `@hatchingpoint/point` as a dependency when emitted JavaScript imports std runtime shims — for example `@hatchingpoint/point/std/http` after `use std.http`.

Exports used by generated code:

| Import path | Purpose |
|-------------|---------|
| `@hatchingpoint/point` | Programmatic compiler APIs |
| `@hatchingpoint/point/cli` | CLI entry (also exposed as `point` bin) |
| `@hatchingpoint/point/core` | Parse, check, emit helpers |
| `@hatchingpoint/point/std/text` | Text helpers backing `std.text` |
| `@hatchingpoint/point/std/json` | JSON parse/stringify backing `std.json` |
| `@hatchingpoint/point/std/http` | Fetch wrappers backing `std.http` |
| `@hatchingpoint/point/std/time` | Time/sleep helpers backing `std.time` |
| `@hatchingpoint/point/std/fs` | File read/write backing `std.fs` |
| `@hatchingpoint/point/std/env` | Environment variable access backing `std.env` |

See [Stdlib bridge](/point/stdlib/bridge) for how `std/*.point` maps to these imports.

## @hatchingpoint/point-logic (published library)

`@hatchingpoint/point-logic` is the reference npm library authored **only** from Point source — no hand-written TypeScript under `src/`.

Source lives in `packages/point-logic/src/store-readiness.point`. The published API is emitted JavaScript in `dist/store-readiness.js`.

### Install and use

```bash
npm install @hatchingpoint/point-logic
```

```javascript
import { listingScore, listingStatusLabel } from "@hatchingpoint/point-logic";

const signals = {
  hasScreenshots: true,
  hasDescription: true,
  hasPrivacyPolicy: true,
  hasSupportUrl: true,
  hasAgeRating: true,
};

listingScore(signals); // 100
listingStatusLabel(100); // "Ready to submit"
```

Emitted record fields use camelCase (`hasScreenshots`, `hasPrivacyPolicy`, …) matching Point naming rules.

### Package layout

| Path | Role |
|------|------|
| `src/store-readiness.point` | Authoritative semantic module (published in npm `files`) |
| `point.json` | Point project manifest (published in npm `files`) |
| `dist/store-readiness.js` | Generated JS (published in npm `files`) |
| `package.json` | `"exports"` map to `dist/` |

Do not add `.ts` files under `src/`. Extend behavior by editing `.point` and rebuilding.

### Build from the monorepo

```bash
bun run --cwd packages/point-logic check
bun run --cwd packages/point-logic build
```

Root CI runs `bun run build:logic` to verify the package builds on every push. `prepublishOnly` runs `point build` before `npm publish`.

## Calling npm from your own Point modules

Third-party npm packages are not special-cased. Declare them with `external` blocks (or wrap them in a shared module):

```point
module Billing

external stripe client
  create customer raw(email: Text): Text or Error from "stripe" as customersCreate

action create customer
  input email: Text
  output id: Text or Error
  touches network
  return create customer raw(email)
```

Your application's `package.json` must list `"stripe"` (or whatever module string you use) alongside `@hatchingpoint/point` when std shims are involved.

## Publish workflow

Point libraries publish through **npm-compatible registries**. There is no separate Point registry daemon — `point add … npm:…` installs tarballs via npm and pins paths in `point.lock`. Use `@hatchingpoint/point-logic` as the reference layout.

### 1. Scaffold the package

```text
my-point-lib/
├── package.json
├── point.json
├── src/
│   └── my-module.point
├── dist/          # generated — gitignore, included in npm files
└── README.md
```

**`point.json`** (minimal):

```json
{
  "name": "my-point-lib",
  "version": "0.1.0"
}
```

**`package.json`** (scripts and publish surface):

```json
{
  "name": "@your-scope/my-point-lib",
  "version": "0.1.0",
  "type": "module",
  "license": "MIT",
  "files": ["dist", "point.json", "src/*.point", "README.md", "LICENSE"],
  "exports": {
    ".": "./dist/my-module.js"
  },
  "scripts": {
    "check": "point check src/my-module.point",
    "build": "point build src/my-module.point dist/my-module.js",
    "prepublishOnly": "npm run build"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

Rules:

- **Only** `.point` under `src/` — no hand-written TypeScript product logic.
- **`files`** must include `point.json` and `src/*.point` so downstream projects can `point add … npm:…` and run `point check` against your source.
- **`prepublishOnly`** runs `point build` so `dist/` is fresh before every publish.

### 2. Build and verify locally

```bash
npm run check
npm run build
npm pack --dry-run   # confirm tarball lists dist/, point.json, src/*.point
```

From the Point monorepo, the same flow applies:

```bash
bun run --cwd packages/point-logic check
bun run --cwd packages/point-logic build
```

Root CI runs `bun run build:logic` on every push to guard the reference package.

### 3. Publish to the public npm registry

Prerequisites: npm account, scope access (`@your-scope`), and `NPM_TOKEN` in CI.

```bash
npm login
npm publish --access public
```

Consumers then declare the dependency:

```bash
point add mylib npm:@your-scope/my-point-lib
point add mylib npm:@your-scope/my-point-lib@0.1.0
```

Runtime-only consumers can skip `point add` and `import` from `@your-scope/my-point-lib` directly in JavaScript — but Point projects that want `use mylib.*` at check time need the published tarball to include `.point` source.

### 4. Publish to GitHub Packages

Use GitHub Packages when the library should stay org-private or versioned beside a GitHub repo.

**Library `package.json`** — point publish at GitHub’s npm endpoint:

```json
{
  "name": "@your-org/my-point-lib",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/my-point-lib.git"
  }
}
```

**Publisher `.npmrc`** (repo root or user home):

```ini
@your-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

**Publish:**

```bash
export GITHUB_TOKEN=ghp_...   # write:packages + read:packages
npm publish
```

**GitHub Actions** (typical):

```yaml
- run: npm ci && npm run check && npm run build
- run: npm publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Use `GITHUB_TOKEN` for packages in the same repo; use a PAT with `write:packages` for cross-repo publishes.

**Consumers** add the same scoped `.npmrc`, then:

```bash
point add mylib npm:@your-org/my-point-lib
```

See [point add — registry configuration](/point/ecosystem/point-add#registry-configuration) for lockfile behavior and troubleshooting.

### 5. Versioning and CI checklist

| Check | Why |
|-------|-----|
| `point check` passes in CI | Catches semantic errors before publish |
| `point build` produces `dist/` | Tarball must not ship stale emit |
| `npm pack --dry-run` lists `.point` + `point.json` | Required for `point add npm:` consumers |
| Semver bump in `package.json` | npm rejects duplicate versions |
| Changelog / tag (optional) | Team discovery — not enforced by tooling |

Bump `@hatchingpoint/point` when compiler or std shim paths change; bump library packages when product rules change independently.

### 6. Optional Python artifacts

Pure logic libraries (records, rules, calculations, labels) can also ship Python via `point build-py` in a separate CI job or optional npm script. Keep **npm JS** as the primary path for actions and std IO until Python action emit is stable across all block families.

### Hosted index (manual)

A future Point-hosted catalog may list package names, descriptions, and semver ranges. **Today:** maintain discovery in README, internal wikis, or `registry.json` you own. Installation remains `point add <alias> npm:<package>` — no extra CLI flag is required once the tarball is on an npm-compatible registry.

## Version alignment

- Bump `@hatchingpoint/point` on compiler releases (CLI, LSP, emit fixes).
- Bump `@hatchingpoint/point-logic` when product rules change independently.
- Generated imports pin std shims to the same major tooling generation as your compiler — upgrade `@hatchingpoint/point` in consuming apps when std bridge paths change.

Check live versions:

```bash
npm view @hatchingpoint/point version
npm view @hatchingpoint/point-logic version
```

## What is not on npm yet

- Every example under `examples/` as a separate package — clone the repo or copy modules instead.

## Declaring Point package dependencies

Use `point add` to wire Point packages into `point.json` and `point.lock`:

```bash
point add std workspace:std
point add logic file:packages/point-logic
point add logic npm:@hatchingpoint/point-logic
point add logic npm:@hatchingpoint/point-logic@0.0.3
```

For `npm:` specs, the CLI installs (or reuses) the package under `node_modules/`, locates `point.json` or `src/*.point`, and pins the path so `use logic.store-readiness` resolves at check/build time. See [point add](/point/ecosystem/point-add) for full spec reference and lockfile shape.

**Note:** Published `@hatchingpoint/point-logic@0.0.3+` tarballs include `point.json`, `src/*.point`, and emitted JavaScript in `dist/`. Use `point add logic npm:@hatchingpoint/point-logic` for check/build against Point source, or import `@hatchingpoint/point-logic` directly for runtime-only JS consumption.

## Common mistakes

- Hand-editing `dist/*.js` after `point build` — changes are lost on the next build.
- Publishing `.point` without running `point check` and `point build` in CI.
- Missing `@hatchingpoint/point` in app dependencies when using `use std.*` (emit imports std shims).
- Expecting `@hatchingpoint/point-logic` to include HTTP servers — it exports pure scoring functions; see dogfood examples in the repository for route wiring.

## Registry comparison

| Option | Discovery | Auth | `point add npm:` |
|--------|-----------|------|------------------|
| npmjs (public) | npmjs.com, search | Optional for install | Works out of the box |
| GitHub Packages | GitHub repo / org | `GITHUB_TOKEN` / PAT | Works with scoped `.npmrc` |
| Private mirror | Internal docs | Mirror credentials | Works with `registry=` in `.npmrc` |
| Point hosted index | Not shipped yet | N/A | Same `npm:` install when index only lists names |

## See also

- [point add](/point/ecosystem/point-add) — `workspace:`, `file:`, `npm:` specs, publish→consume flow
- [Stdlib bridge](/point/stdlib/bridge) — externals and `@hatchingpoint/point/std/*`
- [Installation](/point/guide/installation) — global CLI setup
- [CLI reference](/point/reference/cli) — `build`, `build-py`, `check-all`
- [Authoring vs runtime](/point/concepts/authoring-vs-runtime) — source vs emit
