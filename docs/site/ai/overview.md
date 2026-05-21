---
title: AI overview
description: Why Point exposes compiler context for agents instead of relying on raw source text.
quadrant: Explanation
---

## Summary

Point is designed for a workflow where coding agents write, check, explain, and repair software continuously.

## The problem with raw text

Agents can read source files, but raw text is a weak interface for repair. Line numbers drift after formatting. Generated names hide intent. Large files force the agent to infer which symbol matters.

Point exposes compiler context as CLI output, so agents can ask the language for the symbols, diagnostics, explanations, and repair steps they need.

## The agent loop

Use this loop for `.point` files:

```bash
point check-json examples/math.point
point index examples/math.point
point explain examples/math.point point://semantic/Math/label.score status
point repair-plan examples/math.point
```

Then patch the semantic source and run `point check-json` again until it returns success.

## Public refs are semantic

For public `.point` source, prefer `point://semantic/...` refs. Core refs may appear in internal compiler paths and generated target details, but semantic refs are the right interface for authors and agents.

## Narrow context is better context

`point explain` lets an agent focus on one declaration and its related refs. `repair-plan` turns diagnostics into a sequence of patch targets. This keeps context small and precise.

## See also

- [Stable refs](/point/ai/stable-refs)
- [Repair loops](/point/ai/repair-loops)
- [Agent workflow](/point/ai/agent-workflow)
