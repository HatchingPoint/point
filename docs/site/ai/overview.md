---
title: AI overview
description: Why Point exposes compiler context for agents instead of relying on raw source text.
quadrant: Explanation
---

## Summary

Point is designed for a workflow where coding agents write, check, explain, and repair software continuously.

For the full comparison to TypeScript, Python, and prompt-only workflows, see [Point vs other languages for AI engineering](/point/ai/vs-other-languages). For worked examples and benchmarks, see [Proof of concept](/point/concepts/proof-of-concept) and [Agent repair tests](/point/ai/agent-repair-tests).

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

For multi-step agent flows, use `pipeline`, `session`, and `prompt` blocks — see `examples/pipelines/` and `examples/agents/support-chat.point`.

## Public refs are semantic

For public `.point` source, prefer `point://semantic/...` refs. Core refs may appear in internal compiler paths and generated target details, but semantic refs are the right interface for authors and agents.

## Narrow context is better context

`point explain` lets an agent focus on one declaration and its related refs. `repair-plan` turns diagnostics into a sequence of patch targets. This keeps context small and precise.

## See also

- [Why Point exists](/point/concepts/why-point-exists)
- [Point vs other languages for AI engineering](/point/ai/vs-other-languages)
- [Proof of concept](/point/concepts/proof-of-concept)
- [Stable refs](/point/ai/stable-refs)
- [Repair loops](/point/ai/repair-loops)
- [Agent coding loop](/point/ai/agent-coding-loop)
- [Agent workflow](/point/ai/agent-workflow)
