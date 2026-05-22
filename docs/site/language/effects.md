---
title: Effects
description: external, action, and policy blocks for interop, async IO, and pure guards.
quadrant: Reference
---

## Summary

Pure blocks (`record`, `calculation`, `rule`, `label`) stay free of IO. Effectful work uses `external`, `action`, and `policy`.

## external

Declare npm or Node imports with typed signatures:

See `examples/external.point` and `examples/action.point`.

Externals are impure boundaries. Calculations should not call them directly.

## action

Async operations with explicit effect metadata:

```point
module Effects

external node fs
  read file(path: Text): Text from "node:fs" as readFileSync

action load config
  input path: Text
  output contents: Text
  touches file
  return read file(path)
```

`touches` values include `network`, `file`, `env`, `process`, `time`, `random`, `database`, or `none`. Action calls inside other actions or workflows require `await` (`missing-await` if omitted).

Database actions declare `touches database` so `point index` and review tools see the IO boundary. Use parameterized queries only — see [Database interop](/point/ecosystem/database-interop).

## policy and guard

Pure boolean guards:

See `examples/policy.point`.

Forms: `allow expr`, `deny expr`, `require expr`.

**`guard output paths`** scopes file writes in pipelines — see `examples/pipelines/guarded-output.point`.

## Compiler note

- `external` — import boundary with typed signature
- `action` — async IO with `touches` metadata
- `policy` / `guard` — pure boolean checks (pipeline guards scope file paths)

## Examples

- `examples/external.point` — externals
- `examples/action.point` — file touch
- `examples/async.point` — await
- `examples/policy.point` — policies
- `examples/app/notes/notes.point` — database actions

## Common mistakes

- Calling an action without `await` inside another action
- Returning `Error` where a non-result type is expected

## Agent diagnostic notes

- Action refs in `point index` include `effects` metadata for review
- Prefer patching `.point` when fixing effect boundaries

## See also

- [Applications](/point/language/applications)
- [Database interop](/point/ecosystem/database-interop)
- [Types](/point/language/types)
- [CLI: run and test](/point/reference/cli)
