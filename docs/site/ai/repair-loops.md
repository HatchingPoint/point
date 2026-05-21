---
title: Repair loops
description: Use check-json, refs, repair messages, and repeatable checks to patch Point source safely.
quadrant: Explanation
---

## Summary

Point repair loops make compiler feedback structured enough for a coding agent to follow.

## Loop

Run:

```bash
point check-json examples/math.point
```

If diagnostics are returned, read the stable `ref`, the `repair` text, and any `relatedRefs`. Patch the semantic source at the named declaration or field. Then run the same command again.

## Repair plan

For ordered steps, run:

```bash
point repair-plan examples/math.point
```

A repair plan is useful when a file has multiple related diagnostics and the agent needs to work through them in a stable order.

## Explain before patching

When a diagnostic references a symbol you do not understand, use `explain`:

```bash
point explain examples/math.point point://semantic/Math/label.score status
```

This returns focused context for that declaration instead of requiring the agent to reread the whole file.

## What to avoid

Do not patch generated TypeScript when the source of truth is a `.point` file. Do not use `point://core/...` refs in public repair instructions unless the task is explicitly about compiler internals.

## See also

- [Stable refs](/point/ai/stable-refs)
- [AI overview](/point/ai/overview)
- [Quick start](/point/guide/quick-start)
