---
title: Applications
description: view, route, workflow, and command blocks for UI, HTTP, orchestration, and CLI.
quadrant: Reference
---

## Summary

Application blocks connect product logic to frameworks. They still lower through core IR to TypeScript or JavaScript emit targets.

## view

React-oriented UI (first target):

See `examples/view.point`.

## route

HTTP handlers (Hono-first target):

See `examples/route.point`.

## workflow

Multi-step async orchestration:

See `examples/workflow.point`.

## command

CLI entrypoints for `point run`:

`point run` prefers zero-argument `command` blocks, then `main`, then other zero-arg entrypoints. See `examples/command.point` and `examples/app/todo.point`.

## Lowering

- Views emit JSX-oriented functions
- Routes emit handler functions with method/path metadata
- Workflows emit async functions with step bindings
- Commands emit async or sync CLI entry functions

## Common mistakes

- Defining a run entrypoint with required inputs (run needs zero-arg command/action/calculation)
- Forgetting `await` between workflow steps that call actions

## Agent diagnostic notes

- Application blocks appear in `point index` with semantic kinds `view`, `route`, `workflow`, `command`
- Demo app: `examples/app/todo.point` for end-to-end patterns

## See also

- [Effects](/point/language/effects)
- [CLI reference](/point/reference/cli)
- [Replaces TypeScript and Python](/point/concepts/replaces-typescript-and-python)
