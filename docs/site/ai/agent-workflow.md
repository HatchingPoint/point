---
title: Agent workflow
description: Recommended loop for coding agents writing and repairing Point source.
quadrant: Explanation
---

## Summary

A reliable agent workflow treats the compiler as the source of truth: check, explain, patch semantic source, repeat.

## Recommended loop

1. **Index** the file to list symbols and refs:

```bash
point index examples/math.point
```

2. **Check** with structured output:

```bash
point check-json examples/math.point
```

3. **Explain** the symbol tied to a diagnostic:

```bash
point explain examples/math.point point://semantic/Math/label.score status
```

4. **Patch** only the `.point` source at the named ref.

5. **Re-check** until `ok: true`.

For multiple errors, run `point repair-plan examples/math.point` and follow steps in order.

## Rules for agents

- Write and repair `.point` only; do not hand-edit generated TypeScript
- Prefer `point://semantic/` refs in prompts and patches
- Use `fmt` or LSP format so spans stay stable
- Run `point test` or `point test-all` when changing logic covered by tests

## Contrast with raw LLM edit

Pasting an entire file into a model and asking for a fix forces the model to guess line numbers and generated names. Point diagnostics name the declaration, suggest repairs, and link related refs — smaller context, fewer wrong edits.

## See also

- [AI overview](/point/ai/overview)
- [Stable refs](/point/ai/stable-refs)
- [Repair loops](/point/ai/repair-loops)
- [Diagnostics](/point/reference/diagnostics)
