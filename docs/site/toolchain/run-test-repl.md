---
title: Run, test, REPL
description: Execute Point commands, tests, and expressions from the terminal.
quadrant: Reference
---

## Summary

Point can run command entrypoints, execute tests, and evaluate expressions from the terminal.

## Run

```bash
point run examples/hello.point
```

`run` checks the source and executes a zero-input command or entrypoint. Authors do not need emit files in the project.

For **pure logic** modules (calculations, rules, labels, simple actions — no imports, externals, views, routes, workflows, or commands), Point runs emitted JavaScript **in memory** via an internal bundle (no OS temp file). Other modules still use a short-lived temp `.js` under the system temp directory.

```bash
point run examples/pure/math-only.point
point run --bundle examples/pure/math-only.point   # force in-memory path
point run --no-bundle examples/hello.point         # force temp-module import
```

Honest limits (Bun/Node host still required, no owned VM): see `docs/native-target-research.md` in the repository.

## Test

```bash
point test examples/point-tests.point
point test-all
```

Tests are zero-input calculations or actions whose semantic name starts with `test` and returns `Bool`.

## REPL

```bash
point repl
```

The REPL evaluates expressions and prints the value plus inferred Point type.

## See also

- [CLI reference](/point/reference/cli)
- [Commands in applications](/point/language/applications)
