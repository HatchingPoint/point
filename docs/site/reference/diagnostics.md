---
title: Diagnostics
description: Checker error codes, structured fields, and repair hints for agents.
quadrant: Reference
---

## Summary

`point check-json` returns diagnostics designed for automated repair. Each entry includes a stable `code`, human `message`, semantic `ref` when available, and optional `expected`, `actual`, `repair`, and `relatedRefs`.

## JSON shape

```json
{
  "schemaVersion": "point.core.check.v1",
  "ok": false,
  "diagnostics": [
    {
      "code": "unknown-field",
      "message": "Unknown field email on User",
      "ref": "point://semantic/Math/record.User/field.email",
      "expected": ["name", "active"],
      "actual": "email",
      "repair": "Use one of: name, active.",
      "relatedRefs": []
    }
  ]
}
```

## Error codes

| Code | Typical cause |
|------|----------------|
| `unknown-field` | Field not on record type |
| `missing-field` | Record literal missing required field |
| `unknown-identifier` | Name not in scope |
| `unknown-function` | Call to undefined function |
| `unknown-type` | Type name not declared |
| `type-mismatch` | Expression type does not match expected |
| `return-type-mismatch` | Return does not match function output |
| `iteration-type-mismatch` | `for each` needs `List<T>` |
| `operator-type-mismatch` | Operator used on wrong types |
| `arity-mismatch` | Wrong number of call arguments |
| `missing-await` | Action call without `await` |
| `missing-variant-case` | `on Case return` dispatch misses declared variant cases |
| `immutable-assignment` | Assign to non-mutable binding |
| `nullable-field-access` | Field access on `Maybe<T>` without narrow |
| `not-a-record` | Field access on non-record type |
| `record-type-required` | Record literal without expected type |
| `list-type-required` | Empty list without `List<T>` context |
| `invalid-type-arity` | Wrong number of generic args |
| `duplicate-type` | Two types with same name |
| `duplicate-function` | Two functions with same name |
| `duplicate-value` | Two values with same name |

Parse failures from the semantic parser may surface as `parse-error` in LSP output.

## unknown-field behavior

`unknown-field` now supports two repair-oriented ergonomics:

- CamelCase aliases can resolve to spaced field labels when the match is unique (for example `input.monthlyAmount` can resolve to `monthly price`).
- When a field is still unknown, the repair hint can include `Did you mean "..."?` based on edit distance to known field labels.

If an alias is ambiguous, diagnostics keep `code: "unknown-field"` and narrow `expected` to ambiguous candidates so agents can pick a concrete field explicitly.

## Repair workflow

1. `point check-json <file>`
2. Read `ref` and `repair` on each diagnostic
3. `point explain <file> <ref>` when context is unclear
4. `point repair-plan <file>` for ordered steps when multiple errors exist
5. Patch `.point` source and repeat

## Agent note

Use `point://semantic/...` refs from public diagnostics. Do not edit generated TypeScript to clear semantic errors.

## See also

- [Repair loops](/point/ai/repair-loops)
- [Stable refs](/point/ai/stable-refs)
- [CLI reference](/point/reference/cli)
