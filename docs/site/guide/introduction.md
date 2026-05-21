---
title: Introduction
description: Understand what Point is, where it fits, and why semantic source helps teams and agents.
quadrant: Tutorial
---

## Summary

Point is an AI-first general-purpose language for software teams that want product logic to be explicit, checked, and repairable by coding agents.

If you need the **why** and proof before syntax details, start with [Why Point exists](/point/concepts/why-point-exists), [Proof of concept](/point/concepts/proof-of-concept), and [Point vs other languages for AI engineering](/point/ai/vs-other-languages).

## What Point is

Point source is written as semantic blocks: `record`, `calculation`, `rule`, `label`, `action`, `policy`, `workflow`, `view`, `page`, `layout`, `navigation`, `route`, `stream route`, `pipeline`, `session`, `prompt`, `guard`, `schedule`, and `command`. Those blocks describe the shape and intent of software directly.

The compiler parses that semantic source into a semantic AST, lowers it in memory to a typed core IR, checks it, and emits JavaScript by default (TypeScript and Python are opt-in). Authors do not write the core IR.

```point
module Readiness

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

## Who Point is for

Point is for projects where business rules, application boundaries, and AI-assisted changes need clearer structure than a pile of general-purpose functions. It is especially useful when a coding agent should be able to inspect a file, explain a symbol, patch a diagnostic, and re-check without guessing from line numbers.

Point is not limited to one app category. **v0.1.0** covers data models, pure calculations, rules, labels, variant types, modules, standard library imports, actions, policies, workflows, multi-page UI (layout, navigation, forms, tabs, modals), HTTP routes with middleware, WebSockets, database actions, agent pipelines and sessions, CLI commands, integration tests, formatting, LSP, and JavaScript/TypeScript/Python emit.

## How it fits today

Point does not require a new runtime stack. Today it emits TypeScript and JavaScript for existing Bun, Node, React, Vite, Hono, and similar projects. Database access uses your driver via `external` blocks or `std.sql` — Point does not ship an ORM.

That means Point can be introduced gradually. A team can keep the surrounding application in TypeScript while moving high-leverage product logic into `.point` files that are easier to check, explain, and repair.

## Authoring vs runtime

You write `.point` source. The compiler checks it and emits JavaScript by default (TypeScript and Python are opt-in targets). Generated output is build artifacts — not source you hand-edit for product logic.

See [Authoring vs runtime](/point/concepts/authoring-vs-runtime) for the full model: what you write, what the machine runs, and why emit stays invisible on the daily path. See [Replaces TypeScript and Python](/point/concepts/replaces-typescript-and-python) for an honest scope table. See [Platform vision](/point/concepts/platform-vision) for the full application roadmap.

## See also

- [Why Point exists](/point/concepts/why-point-exists)
- [Proof of concept](/point/concepts/proof-of-concept)
- [Platform vision](/point/concepts/platform-vision)
- [Point vs other languages for AI engineering](/point/ai/vs-other-languages)
- [Quick start](/point/guide/quick-start)
- [Installation](/point/guide/installation)
- [Philosophy](/point/concepts/philosophy)
- [Authoring vs runtime](/point/concepts/authoring-vs-runtime)
- [Replaces TypeScript and Python](/point/concepts/replaces-typescript-and-python)
- [AI overview](/point/ai/overview)
