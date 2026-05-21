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

`touches` values include `network`, `file`, `env`, `time`, `random`, or `none`. Action calls inside other actions or workflows require `await` (`missing-await` if omitted).

## policy

Pure boolean guards:

See `examples/policy.point`.

Forms: `allow expr`, `deny expr`, `require expr`.

## Lowering

- `external` → import declarations and call wrappers
- `action` → `async function` returning `Promise<T>`
- `policy` → boolean functions

## Examples

- `examples/external.point` — externals
- `examples/action.point` — file touch
- `examples/async.point` — await
- `examples/policy.point` — policies

## Common mistakes

- Calling an action without `await` inside another action
- Returning `Error` where a non-result type is expected

## Agent diagnostic notes

- Action refs in `point index` include `effects` metadata for review
- Prefer patching `.point` over generated TypeScript when fixing effect boundaries

## See also

- [Applications](/point/language/applications)
- [Types](/point/language/types)
- [CLI: run and test](/point/reference/cli)
