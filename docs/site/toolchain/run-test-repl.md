---
title: Run, test, REPL
description: Execute Point commands, tests, and expressions from the terminal.
quadrant: Reference
---

## Summary

Discover with `point box`, launch by name, run tests, or use the REPL.

See [Point in 60 seconds](/point/guide/point-in-60-seconds) for the daily path.

## Run

```bash
point box src/app.point
point launch examples/command.point hello cli
point run examples/command.point hello cli    # same; optional when one default command
```

`run` and `launch` check the source and execute a zero-input command. **`launch` requires a command name** — the simple path.

Logic-only files (no `command` block) validate with `point check` only.

For **pure logic** modules, Point can run emitted JavaScript **in memory** via an internal bundle:

```bash
point run --bundle examples/pure/math-only.point
point run --no-bundle examples/command.point hello cli
```

Honest limits (Bun/Node host still required): see `docs/native-target-research.md` in the repository.

## Test

```bash
point test examples/point-tests.point
point test-all
point test integration examples/api/middleware-integration.point
```

Unit tests are zero-input calculations or actions whose semantic name starts with `test` and returns `Bool`.

Integration tests are actions whose semantic name starts with `integration test`, return `Bool`, and take either zero inputs or one `base url: Text` input.

## REPL

```bash
point repl
```

The REPL evaluates expressions and prints the value plus inferred Point type.

## See also

- [point run](/point/toolchain/run)
- [CLI reference](/point/reference/cli)
- [Golden app demo](/point/guide/golden-app-demo)
