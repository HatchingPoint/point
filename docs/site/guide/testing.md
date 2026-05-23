---
title: Testing
description: Unit tests, action tests, integration tests, route assertions, and agent repair checks for Point projects.
quadrant: How-to
---

## Summary

Point tests are ordinary semantic blocks with naming conventions. Unit tests run calculations and actions; integration tests can start route modules and assert against live HTTP responses.

Use tests to keep `.point` source reliable before emitting JavaScript, TypeScript, Python, or app bundles.

## Unit tests

A unit test is a zero-input `calculation` whose semantic name starts with `test` and returns `Bool`:

```point
module PointTests

calculation test arithmetic
  output passed: Bool
  passed is 2 + 2 == 4
```

Run:

```bash
point test examples/point-tests.point
```

The command fails if a test returns `false`, throws, or fails typechecking.

## Action tests

Actions can also be tests when they have zero inputs and return `Bool`:

```point
action test async value
  output passed: Bool
  touches none
  return true
```

Use action tests when the behavior needs `await`, standard-library actions, or an explicit effect boundary.

## Project-wide tests

Run every discovered test in the default module graph:

```bash
point test-all
```

Project-wide commands discover repository modules in the same broad graph used by `check-all` and build-all commands.

## Integration tests

Integration tests are actions whose names start with `integration test`, return `Bool`, and take either:

- no inputs, or
- one `base url: Text` input.

Point starts the module's route server, passes the live base URL to each test, and runs assertions against real HTTP handlers:

```bash
point test integration examples/api/middleware-integration.point
```

Example shape:

```point
action integration test missing auth
  input base url: Text
  output passed: Bool
  touches network
  return assert missing auth response(await fetch missing auth snapshot(base url))
```

Integration tests require route blocks in the module. They are not run by `point test` or `point test-all`; run them explicitly.

## HTTP assertions

Use `std.http` for route tests:

```point
use std.http

calculation assert valid response
  input snapshot: Text
  output passed: Bool
  passed is httpAssertStatusRaw(snapshot, 200) and httpAssertJsonBodyRaw(snapshot, "{\"ok\":true}")
```

`http fetch` returns a JSON snapshot string with status and body. Request options are passed as JSON text containing fields such as `method`, `headers`, and `body`.

## What to test

| Area | Recommended tests |
|------|-------------------|
| Records/types | Record literal checks through calculations |
| Calculations | Expected value examples |
| Rules | Empty, one-item, many-item accumulator cases |
| Labels | Boundary conditions and fallback branch |
| Variants | Every case plus `otherwise` when present |
| Maybe | `present` and `is none` branches |
| Actions | Success/error result shape |
| Routes | Status code, JSON body, auth/middleware |
| Workflows | Success path, failure path, retry/timeout branches |
| Pipelines | Step compatibility and guarded outputs |

## Agent repair tests

For automated repair workflows, prefer structured checks:

```bash
point check-json src/app.point
point repair-plan src/app.point
point index src/app.point
```

Assertions should target semantic source behavior, not generated code formatting.

## CI pattern

For a package:

```bash
bun install
bun run check
bun run build
bun run test
```

For a Point-only repo:

```bash
point check src/app.point
point test src/app.point
```

For route modules:

```bash
point test integration src/app.point
```

## Common failures

| Failure | Fix |
|---------|-----|
| Test is not discovered | Ensure name starts with `test`, has zero inputs, and returns `Bool` |
| Integration test is not discovered | Ensure name starts with `integration test` and run `point test integration` |
| Integration test lacks base URL | Add `input base url: Text` when the test calls routes |
| `missing-await` | Await action calls inside action/workflow/test blocks |
| `type-mismatch` | Check `expected` and `actual` in `check-json` |

## See also

- [Run, test, REPL](/point/toolchain/run-test-repl)
- [Diagnostics](/point/reference/diagnostics)
- [Stable refs](/point/ai/stable-refs)
- [Examples](/point/examples)
