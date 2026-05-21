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

Point emits Python for logic, actions, routes, workflows, and commands (`point build-py`). Views, layouts, and realtime client code still target JavaScript/TypeScript. Full parity for every Python application layer is not the goal — automation and server scripts are.

## Can I use any database?

Yes. Point does not ship an ORM. Use `action` blocks with `touches database`, calling `std.sql` for local SQLite or an `external` block for your driver (PostgreSQL, MySQL, LibSQL, etc.). See [Database interop](/point/ecosystem/database-interop).

## Do I need VS Code?

No. VS Code and Cursor are optional. The CLI and `point lsp` support terminal workflows and other editors.

## Should I edit generated files?

No. Edit `.point` source, run checks, and rebuild generated output.

## What makes Point agent-friendly?

Semantic refs, structured diagnostics, `index`, `explain`, `repair-plan`, canonical formatting, and explicit effect boundaries all give agents stable context.

## Why not just use TypeScript with Copilot or ChatGPT?

Copilot speeds up human typing; chat tools can suggest patches. Neither gives you stable `point://semantic/` refs, `check-json` with `repair` / `expected` / `actual`, or a single checked source for rules and models. Point is built so **the compiler is the agent’s partner** — see [Point vs other languages for AI engineering](/point/ai/vs-other-languages) and [Proof of concept](/point/concepts/proof-of-concept).

## Why did Hatching Point create a new language?

General-purpose languages were designed for humans reading source, not agents repairing it after every format run. Point adds semantic blocks and agent-native CLI commands without forcing a new runtime. See [Why Point exists](/point/concepts/why-point-exists).

## Is Point only for AI, or also for human teams?

Humans benefit from the same explicit `record` / `rule` / `label` syntax. The AI-first bet is that **most product logic will be co-authored by agents** — so the toolchain optimizes check-and-repair loops, not just syntax highlighting.

## See also

- [Why Point exists](/point/concepts/why-point-exists)
- [Proof of concept](/point/concepts/proof-of-concept)
- [Point vs other languages for AI engineering](/point/ai/vs-other-languages)
- [Introduction](/point/guide/introduction)
- [Stable refs](/point/ai/stable-refs)
- [Authoring vs runtime](/point/concepts/authoring-vs-runtime)
