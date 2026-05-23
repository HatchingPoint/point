---
title: Style guide
description: Naming, formatting, file organization, effects, and examples for idiomatic Point source.
quadrant: How-to
---

## Summary

Idiomatic Point source reads like semantic product logic, not generated JavaScript or a generic function library. Prefer clear block names, explicit effect boundaries, small modules, and stable formatting.

This guide documents conventions for writing `.point` files that remain readable to people, tools, and coding agents.

## Formatting

Use the formatter as the canonical source style:

```bash
point fmt src/app.point
point fmt-check src/app.point
```

The formatter:

- Keeps one top-level declaration per block.
- Uses two spaces for nested block lines.
- Preserves semantic names with spaces.
- Separates top-level declarations with a blank line.
- Emits stable field/type/call formatting from the semantic AST.

Do not hand-format generated JavaScript or TypeScript to fix Point source issues. Format `.point`, check it, then rebuild.

## Names

Use readable semantic names:

```point
calculation line total
rule cart total
label order size
action load config
route health check
```

Point lowers spaced names to host identifiers internally, but public docs, diagnostics, and agent refs should keep source spelling.

Recommended naming:

| Construct | Style | Example |
|-----------|-------|---------|
| Module | Pascal-ish domain words | `module Checkout` |
| Record | Domain noun | `record Cart Item` |
| Variant | Domain state noun | `variant Order Status` |
| Calculation | Verb/noun phrase | `calculation line total` |
| Rule | Accumulator phrase | `rule cart total` |
| Label | Classification phrase | `label order size` |
| Action | Verb phrase | `action load config` |
| Route | HTTP purpose phrase | `route health check` |
| Test | Starts with `test` | `calculation test cart total` |

Avoid generated names such as `cartTotal`, `fn`, `let`, `type`, or host-framework details in `.point` source.

## Records and fields

Use field labels that match product vocabulary:

```point
record Cart Item
  name: Text
  unit price: Int
  quantity: Int
```

Prefer:

- `unit price` over `unitPrice`
- `amount cents` over `amount`
- `submitted for review` over `submitted`
- `tracking number` over `trackingNo`

CamelCase field access can resolve to spaced fields when unambiguous, but source examples and docs should use semantic field labels.

## Pure logic first

Use pure blocks for deterministic product rules:

```point
calculation line total
  input item: Cart Item
  output total: Int
  total is item.unit price * item.quantity
```

Prefer pure blocks when possible:

| Need | Use |
|------|-----|
| Shape data | `record`, `variant` |
| Derive a value | `calculation` |
| Accumulate score/total | `rule` |
| Classify/label | `label` |
| Check access | `policy` |

This keeps logic reusable from CLI, API, UI, tests, and agent repair loops.

## Effects are explicit

Use `action` for IO and declare what it touches:

```point
action read settings
  input path: Text
  output contents: Text or Error
  touches file
  return read file(path)
```

Use `external` only at the host boundary. Keep external declarations narrow and wrap them in named actions/calculations that match the domain.

Avoid hiding IO inside generic helper names. A reviewer or agent should be able to see `touches file`, `touches network`, `touches database`, or `touches env` from the block.

## Results and errors

Use union results for operations that can fail:

```point
action load profile
  input id: Text
  output profile: Text or Error
  touches network
  return await fetch profile(id)
```

Use `Error "message"` for structured failures:

```point
on failure return Error "Email verification failed"
```

Avoid plain `"error"` sentinel strings when the type should communicate failure.

## Money and time

Use integer minor units for money:

```point
record Money
  amount cents: Int
  currency: Text
```

Use `Instant` for timestamps:

```point
record Event
  name: Text
  at: Instant
```

Avoid `Float` for currency and raw `Text` when the value is a timestamp.

## UI and app blocks

Use UI blocks for semantic rendering and app structure:

```point
view order summary
  input total: Int
  output Page
  render "Total: " + total
```

Keep app structure explicit:

- `layout` for shared shell slots.
- `navigation` for route registry.
- `page` for document-level route views.
- `view` for reusable fragments.
- `route` and `stream route` for server boundaries.

Use generated CSS/classes as output details. Keep `.point` source about semantic structure and state.

## Tests

Point tests are zero-input calculations or actions whose names start with `test` and return `Bool`:

```point
calculation test cart total
  output passed: Bool
  passed is cart total([]) == 0
```

Run:

```bash
point test src/app.point
```

Use integration tests for route modules with live HTTP behavior.

## Agent-friendly source

For agent repair loops:

- Keep related declarations in the same module when they change together.
- Prefer semantic names over abbreviations.
- Use `point index` to discover refs before editing.
- Use `point explain <file> <ref>` for context.
- Patch `.point` source, not generated output.
- Run `point check-json` after edits.

## See also

- [Formatting](/point/toolchain/formatting)
- [Project structure](/point/guide/project-structure)
- [Expressions and operators](/point/reference/expressions)
- [Diagnostics](/point/reference/diagnostics)
