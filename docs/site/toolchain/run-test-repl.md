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

`run` checks the source, emits temporary JavaScript, and executes a zero-input command or entrypoint.

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
