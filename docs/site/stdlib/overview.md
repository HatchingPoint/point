---
title: Stdlib
description: Standard library modules and how to import them.
quadrant: Reference
---

## Summary

Point standard library modules are ordinary semantic Point files. Import with straight syntax:

```text
module App

use http
use json
```

`use http` is shorthand for `use std.http`. Run `point capabilities` for the catalog.

## Import forms

| Syntax | Resolves to |
|--------|-------------|
| `use http` | `std/http.point` |
| `use std.http` | same module (explicit) |
| `use Billing from "./billing.point"` | local file |

Standard modules map to files under `std/`, such as `std/text.point`, `std/json.point`, `std/http.point`, `std/time.point`, `std/fs.point`, `std/env.point`, `std/path.point`, `std/crypto.point`, `std/process.point`, `std/yaml.point`, `std/stream.point`, `std/sql.point`, `std/ai.point`, and `std/money.point`.

### std.http

HTTP client helpers and integration-test assertions:

- `http get(url: Text)` / `http post(url: Text, body: Text)` — fetch response text or error
- `http fetch(url: Text, options: Text)` — returns JSON snapshot text `{ "status", "body" }` for route tests
- `http assert status(response: Text, expected status: Int): Bool`
- `http assert json body(response: Text, expected json: Text): Bool`

Use `point test integration <file>` to run actions named `integration test …` against a live route server — see [Run, test, REPL](/point/toolchain/run-test-repl).

### std.crypto

Hashing and JWT helpers for auth middleware and tooling:

- `digest sha256(value: Text): Text` — SHA-256 hex digest
- `digest hmac sha256(value: Text, secret: Text): Text` — HMAC-SHA256 hex digest
- `sign jwt(payload: Text, secret: Text): Text` — HS256 JWT for a JSON payload string
- `verify jwt(token: Text, secret: Text): Text or Error` — validates Bearer or raw tokens; returns payload JSON text
- `check jwt valid(token: Text, secret: Text): Bool` — validates Bearer or raw tokens
- `jwt auth ok(token: Text, secret: Text): Bool` — convenience wrapper for route middleware

**Secret handling:** Load signing keys with `std.env` (for example `JWT_SECRET`) inside actions or commands. Never log secrets or embed production keys in `.point` source — use environment variables and keep demo secrets limited to examples/tests.

### std.ai

OpenAI and Anthropic HTTP provider actions for complete and stream text:

- `complete text with openai(prompt: Text, model: Text): Text or Error`
- `stream text with openai(prompt: Text, model: Text): Text or Error`
- `complete text with anthropic(prompt: Text, model: Text): Text or Error`
- `stream text with anthropic(prompt: Text, model: Text): Text or Error`

**API keys:** Set `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` in the host environment and read them through `std.env` inside actions — never hard-code keys in source. See [AI provider interop](/point/ecosystem/ai-providers).

### std.sql

Parameterized SQLite queries for local scripts and tests (Bun `bun:sqlite`):

- `sql query raw(sql: Text, params: List<Text>): Text or Error`

Set `POINT_SQL_DATABASE` or `DATABASE_URL` to a `sqlite:` path. For PostgreSQL in production, declare an `external` driver instead — see [Database interop](/point/ecosystem/database-interop).

## Why stdlib is small

The standard library stays narrow so agents choose known APIs instead of inventing local externals for common work. More capability can still come through explicit `external` declarations.

## See also

- [Capabilities](/point/language/capabilities)
- [Effects](/point/language/effects)
- [Database interop](/point/ecosystem/database-interop)
- [Modules](/point/language/modules)
- [Stdlib bridge](/point/stdlib/bridge)
