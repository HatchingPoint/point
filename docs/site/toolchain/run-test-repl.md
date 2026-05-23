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
point test integration examples/api/middleware-integration.point
```

Unit tests are zero-input calculations or actions whose semantic name starts with `test` and returns `Bool`.

Integration tests are actions whose semantic name starts with `integration test`, return `Bool`, and take either zero inputs or one `base url: Text` input. Point starts the module's route server, passes the live base URL into each test, and runs HTTP assertions against real routes.

Author integration tests with `std.http` helpers:

```text
use std.http

action integration test health route
  input base url: Text
  output passed: Bool
  touches network
  return httpAssertStatusRaw(await httpFetchSnapshot(base url + "/health", "{}"), 200) and httpAssertJsonBodyRaw(await httpFetchSnapshot(base url + "/health", "{}"), "{\"status\":\"ok\"}")
```

`http fetch` returns JSON text `{ "status": <code>, "body": "<response text>" }`. Pass request options as JSON text (`method`, `headers`, `body`). Use `http assert status` and `http assert json body` to compare status codes and JSON payloads.

Integration tests require route blocks so Point can call `startRoutesServer()` from emitted JavaScript. They are not picked up by `point test` or `point test-all`; run them explicitly with `point test integration <file>`.

## REPL

```bash
point repl
```

The REPL evaluates expressions and prints the value plus inferred Point type.

## See also

- [Testing](/point/guide/testing)
- [CLI reference](/point/reference/cli)
- [Commands in applications](/point/language/applications)
