---
title: FAQ
description: Common questions about Point's scope, runtime model, and agent workflow.
quadrant: Explanation
---

## Is Point general-purpose?

Yes. Point has general-purpose language capabilities, but its source syntax is semantic rather than shaped like Python or TypeScript.

## Does Point replace TypeScript?

Point can replace hand-written TypeScript for product logic that belongs in `.point` files. Surrounding framework code, config, and existing libraries can still stay in TypeScript.

## Does Point replace Python?

Point can emit Python for pure logic modules. It does not yet replace every Python application layer.

## Do I need VS Code?

No. VS Code and Cursor are optional. The CLI and `point lsp` support terminal workflows and other editors.

## Should I edit generated files?

No. Edit `.point` source, run checks, and rebuild generated output.

## What makes Point agent-friendly?

Semantic refs, structured diagnostics, `index`, `explain`, `repair-plan`, canonical formatting, and explicit effect boundaries all give agents stable context.

## See also

- [Introduction](/point/guide/introduction)
- [Stable refs](/point/ai/stable-refs)
- [Authoring vs runtime](/point/concepts/authoring-vs-runtime)
