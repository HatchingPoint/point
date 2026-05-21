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
| `src/store-readiness.point` | Authoritative semantic module |
| `point.json` | Point project manifest |
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

## Publishing a Point-only npm library

Follow the `@hatchingpoint/point-logic` pattern:

1. Create a package directory with `src/*.point` only.
2. Add `point.json` and npm `package.json` with `"type": "module"`.
3. Wire scripts:
   - `"check": "point check src/your-module.point"`
   - `"build": "point build src/your-module.point dist/your-module.js"`
   - `"prepublishOnly": "bun run build"`
4. Set `"files": ["dist", "README.md", "LICENSE"]` — do not publish `.point` source unless you want to (logic package keeps source in git only).
5. Map `"exports"` to emitted JavaScript entrypoints.
6. Run `npm publish --access public` after CI passes.

Pure logic libraries (records, rules, calculations, labels) can also offer Python wheels or `.py` artifacts via `point build-py` in a separate script — keep npm JS as the primary path for actions and std IO until Python action emit is stable.

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
point add logic npm:@hatchingpoint/point-logic@0.0.2
```

For `npm:` specs, the CLI installs (or reuses) the package under `node_modules/`, locates `point.json` or `src/*.point`, and pins the path so `use logic.store-readiness` resolves at check/build time. See [point add](/point/ecosystem/point-add) for full spec reference and lockfile shape.

**Note:** Published `@hatchingpoint/point-logic` npm tarballs ship emitted JavaScript in `dist/` only. To consume Point source via `point add … npm:…`, install a package that includes `.point` files (for example a git dependency or local `file:` install during development). For runtime-only consumption, import the emitted JS from npm directly.

## Common mistakes

- Hand-editing `dist/*.js` after `point build` — changes are lost on the next build.
- Publishing `.point` without running `point check` and `point build` in CI.
- Missing `@hatchingpoint/point` in app dependencies when using `use std.*` (emit imports std shims).
- Expecting `@hatchingpoint/point-logic` to include HTTP servers — it exports pure scoring functions; see dogfood examples in the repository for route wiring.

## See also

- [point add](/point/ecosystem/point-add) — `workspace:`, `file:`, and `npm:` specs
- [Stdlib bridge](/point/stdlib/bridge) — externals and `@hatchingpoint/point/std/*`
- [Installation](/point/guide/installation) — global CLI setup
- [CLI reference](/point/reference/cli) — `build`, `build-py`, `check-all`
- [Authoring vs runtime](/point/concepts/authoring-vs-runtime) — source vs emit
