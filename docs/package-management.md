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
| `npm:<package>` | Reserved — CLI returns a clear error until registry support ships |

Example:

```bash
point add std workspace:std
point add logic file:packages/point-logic
```

The command updates `point.json` `dependencies` and regenerates `point.lock` with resolved `path` entries.

## Resolution at check/build

Current dependency resolution supports:

- `workspace:<path>` and `file:<path>` specs pinned in `point.lock`.
- `use <package>.<module>` for lockfile packages (e.g. `use std.text` resolves via the `std` entry’s `path`).
- Relative `use Module from "./module.point"` imports.

`check-all`, `build-all`, and related project commands load `point.lock` from the project root when resolving `use` imports without an explicit `from` path.

External package registry resolution (`npm:`) is reserved for a later phase; manifests and lockfiles are intentionally JSON so agents can inspect and update them safely.
