---
title: Stable refs
description: Use point://semantic refs to identify declarations and fields without depending on line numbers.
quadrant: Explanation
---

## Summary

Stable refs are Point's durable names for symbols and diagnostic targets.

## Ref shape

Semantic refs identify public `.point` source:

```text
point://semantic/<module>/<kind>.<name>
```

Examples:

```text
point://semantic/Math/record.User
point://semantic/Math/record.Launch Signals/field.has bundle id
point://semantic/Math/calculation.annual price
point://semantic/Math/rule.launch readiness
point://semantic/Math/label.score status
```

## Why refs matter

Refs survive formatting and nearby edits better than line numbers. They also preserve user-facing names, including names with spaces, so the agent can reason about the same language the author wrote.

## Finding refs

Run:

```bash
point index examples/math.point
```

Then pass a ref to:

```bash
point explain examples/math.point point://semantic/Math/rule.launch readiness
```

Diagnostic refs from `check-json` resolve the same way: each public error includes a `point://semantic/...` ref that `point index` lists and `point explain` summarizes (pipeline steps, load-data bindings, middleware routes, money fields, and variant dispatch included).

## Semantic vs core refs

Use semantic refs for public documentation, editor actions, and agent repair loops. Core refs are still useful inside compiler internals and generated target explanations, but they are not the primary author-facing contract.

## See also

- [AI overview](/point/ai/overview)
- [Repair loops](/point/ai/repair-loops)
- [How Point is novel](/point/concepts/how-point-is-novel)
