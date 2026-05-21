# Point AI Reference System

Point should be easy for humans to avoid reading and easy for coding agents to repair.

The core idea is that Point source is fluid and concise, while the compiler exposes stable references and structured diagnostics that agents can follow without guessing.

## Stable References

Every meaningful symbol and diagnostic path can be addressed with a stable ref. The current implementation exposes internal core refs:

```text
point://core/<module>/<path>
```

Examples:

```text
point://core/Billing/<internal-symbol-path>
point://core/Math/<internal-generated-target>
```

These refs are not line-number based. They survive formatting and small edits better than raw file positions, which makes them better for agents.

## Agent Diagnostics

`point check-json` returns diagnostics designed for repair loops:

```json
{
  "code": "unknown-field",
  "message": "Unknown field email on User",
  "path": "<internal-return-path>",
  "ref": "point://core/Billing/<internal-return-path>",
  "expected": ["name", "active"],
  "actual": "email",
  "repair": "Use one of: name, active.",
  "relatedRefs": [
    "point://core/Billing/<user-name-field>",
    "point://core/Billing/<user-active-field>"
  ]
}
```

This lets an agent patch the correct intent instead of scanning the whole repo.

## Self-Context Commands

Point exposes context as compiler output:

```bash
point index
point explain examples/math.point point://core/Math/<internal-symbol-path>
point repair-plan
point check-json
```

`point index` returns every known symbol with its stable ref, kind, type, module, and span.

`point explain` resolves a ref into a focused explanation and related refs.

`point repair-plan` converts diagnostics into ordered repair steps:

```json
{
  "schemaVersion": "point.core.repair-plan.v1",
  "ok": false,
  "steps": [
    {
      "ref": "point://core/Broken/<internal-return-path>",
      "code": "unknown-field",
      "repair": "Use one of: name, active.",
      "relatedRefs": [
        "point://core/Broken/<user-name-field>",
        "point://core/Broken/<user-active-field>"
      ]
    }
  ]
}
```

## Why This Matters

Most languages were built for humans reading source directly. Point is built for a workflow where agents write, check, repair, and explain code continuously.

Point should keep moving toward:

- Stable symbol refs for semantic modules, records, fields, calculations, rules, labels, and generated targets.
- Diagnostics with `expected`, `actual`, `repair`, and `relatedRefs`.
- Canonical formatting so context paths stay predictable.
- Explicit effect boundaries so agents know when code touches network, files, env, database, time, or randomness.
- Small standard APIs with narrow choices so agents do not invent infrastructure.
- Generated TypeScript that remains boring, readable, and easy to diff.

The language should feel like water at the source level, but like a structured graph to the compiler and coding agents.
