---
title: How Point is novel
description: The language is designed around semantic source, stable refs, and repair loops for AI-assisted development.
quadrant: Explanation
---

## Summary

Point combines a semantic language surface with compiler APIs that expose stable context to coding agents.

## Semantic blocks are the source

In Point, semantic declarations are not comments or annotations on top of another language. They are the source language.

```point
record Launch Signals
  has bundle id: Bool
  submitted for review: Bool
  has passing tests: Bool

rule launch readiness
  input signals: Launch Signals
  output score: Int
  score starts at 0
  add 30 when signals.has bundle id
  add 40 when signals.submitted for review
  add 30 when signals.has passing tests
  return score
```

That source is compact enough for humans to read, but structured enough for a compiler and agent to index.

## Stable refs beat line numbers

Agents often fail because they patch by nearby text, line numbers, or generated names that shift under formatting. Point gives public declarations stable semantic refs:

```text
point://semantic/Math/record.User
point://semantic/Math/rule.launch readiness
point://semantic/Math/label.score status
```

These refs survive formatting and small edits better than raw source positions.

## Repair loops are first-class

The CLI emits structured diagnostics through `check-json` and ordered repair steps through `repair-plan`. A coding agent can read `ref`, `expected`, `actual`, `repair`, and `relatedRefs`, patch the semantic source, and run the checker again.

That is different from asking an agent to paste a whole file into a prompt and hope it notices the right part.

## Explicit effect boundaries

Point separates pure blocks from effectful blocks. `external` declarations mark interop boundaries, `action` blocks carry effect metadata, and `policy` blocks express pure guards.

This gives review tools and agents a clearer map of when code reaches the filesystem, network, environment, time, randomness, or external packages.

## See also

- [Why Point exists](/point/concepts/why-point-exists)
- [Proof of concept](/point/concepts/proof-of-concept)
- [Point vs other languages for AI engineering](/point/ai/vs-other-languages)
- [AI overview](/point/ai/overview)
- [Stable refs](/point/ai/stable-refs)
- [Repair loops](/point/ai/repair-loops)
