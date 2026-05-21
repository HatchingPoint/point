# Point Package Management

Point projects use `point.json`:

```json
{
  "name": "point",
  "version": "0.0.5",
  "dependencies": {
    "std": "workspace:std"
  }
}
```

`point.lock` pins resolved dependencies with `schemaVersion: "point.lock.v1"`.

## Adding dependencies

```bash
point add <name> <spec>
```

| Spec | Meaning |
|------|---------|
| `workspace:<path>` | Local Point package directory (monorepo / workspace) |
| `file:<path>` | Local path on disk (relative to project root) |
| `npm:<package>` | npm registry package (optional `@version` suffix) |

Example:

```bash
point add std workspace:std
point add logic file:packages/point-logic
point add logic npm:@hatchingpoint/point-logic
point add logic npm:@hatchingpoint/point-logic@0.0.2
```

The command updates `point.json` `dependencies` and regenerates `point.lock` with resolved `path` entries.

For `npm:` specs, the CLI runs `npm install` (or reuses an existing `node_modules/` install), locates `point.json` or `src/*.point` inside the package, and pins the resolved directory under `node_modules/` in `point.lock`. The npm package must include Point source (not just emitted JavaScript) for check/build to resolve `use` imports.

## Resolution at check/build

Current dependency resolution supports:

- `workspace:<path>`, `file:<path>`, and `npm:<package>` specs pinned in `point.lock`.
- `use <package>.<module>` for lockfile packages (e.g. `use std.text` resolves via the `std` entry’s `path`; npm packages with modules under `src/` resolve automatically).
- Relative `use Module from "./module.point"` imports.

`check-all`, `build-all`, and related project commands load `point.lock` from the project root when resolving `use` imports without an explicit `from` path.

Manifests and lockfiles are intentionally JSON so agents can inspect and update them safely.
