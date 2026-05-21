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

Current dependency resolution supports:

- `workspace:<path>` for local Point packages.
- `use std.<module>` for standard library modules resolved from `std/`.
- Relative `use Module from "./module.point"` imports.

External package registry resolution is reserved for the publish pipeline; manifests and lockfiles are intentionally JSON so agents can inspect and update them safely.
