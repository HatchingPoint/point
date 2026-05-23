---
title: Stdlib
description: Standard library modules and how to import them.
quadrant: Reference
---

## Summary

Point standard library modules are ordinary semantic Point files exposed under `std.<name>` imports.

## Import form

```text
module App

record App Config
  name: Text

use std.text
```

Standard modules map to files under `std/`, such as `std/text.point`, `std/json.point`, `std/http.point`, `std/time.point`, `std/fs.point`, `std/env.point`, `std/path.point`, `std/crypto.point`, `std/process.point`, `std/yaml.point`, `std/stream.point`, `std/sql.point`, `std/money.point`, and `std/ai.point`.

## Module index

| Import | File | Purpose |
|--------|------|---------|
| `use std.text` | `std/text.point` | Text length, contains, split, trim, concat |
| `use std.json` | `std/json.point` | JSON parse/stringify bridge |
| `use std.yaml` | `std/yaml.point` | YAML parse/stringify bridge |
| `use std.http` | `std/http.point` | HTTP client helpers and route-test assertions |
| `use std.time` | `std/time.point` | `Instant`, current time, sleep |
| `use std.fs` | `std/fs.point` | Read/write file actions |
| `use std.env` | `std/env.point` | Environment variable actions and defaults |
| `use std.path` | `std/path.point` | Path join, basename, dirname, extname, resolve |
| `use std.crypto` | `std/crypto.point` | SHA-256, HMAC, JWT helpers |
| `use std.process` | `std/process.point` | Spawn commands and inspect process result |
| `use std.stream` | `std/stream.point` | Read/write text and lines from stream-like sources |
| `use std.sql` | `std/sql.point` | Parameterized SQLite query action |
| `use std.money` | `std/money.point` | Cents-as-Int money record and helpers |
| `use std.ai` | `std/ai.point` | OpenAI and Anthropic text provider actions |

### std.text

- `concat text(left: Text, right: Text): Text`
- `text length(value: Text): Int`
- `text contains(value: Text, search: Text): Bool`
- `text split(value: Text, separator: Text): List<Text>`
- `text trim(value: Text): Text`

### std.json and std.yaml

- `parse json(value: Text): Text or Error`
- `stringify json(value: Text): Text`
- `parse yaml(value: Text): Text or Error`
- `stringify yaml(value: Text): Text`

Both modules return text snapshots at the Point boundary today. Host-specific structured JSON/YAML values should be decoded by the host or represented with Point records around the boundary.

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

- `sql query(sql: Text, params: List<Text>): Text or Error`

Set `POINT_SQL_DATABASE` or `DATABASE_URL` to a `sqlite:` path. For PostgreSQL in production, declare an `external` driver instead — see [Database interop](/point/ecosystem/database-interop).

### std.time

- `instant now(): Instant`
- `format instant(value: Instant): Text`
- `parse instant(value: Text): Instant or Error`
- `current time(): Text`
- `wait milliseconds(ms: Int): Void`

Prefer `Instant` when you mean a typed timestamp. `current time()` exists for legacy/plain-text timestamps.

### std.fs and std.env

- `read file(path: Text): Text or Error`
- `write file(path: Text, contents: Text): Void or Error`
- `get env var(name: Text): Maybe<Text>`
- `env with default(value: Maybe<Text>, default value: Text): Text`

Use `std.env` for secrets and environment-specific configuration. Do not embed production keys in `.point` source.

### std.path

- `join paths(left: Text, right: Text): Text`
- `path basename(value: Text): Text`
- `path dirname(value: Text): Text`
- `path extname(value: Text): Text`
- `resolve path(value: Text): Text`
- `path is absolute(value: Text): Bool`

### std.process

- `spawn command(command: Text, args: List<Text>): Process Result or Error`
- `stream lines from process(command: Text, args: List<Text>): List<Text> or Error`
- `process stdout(result: Process Result): Text`
- `process exit code(result: Process Result): Int`

`Process Result` contains `stdout`, `stderr`, and `exit code`.

### std.stream

- `stream read text(source: Text): Text or Error`
- `stream write text(sink: Text, contents: Text): Void or Error`
- `stream read lines(source: Text): List<Text> or Error`
- `stream write lines(sink: Text, lines: List<Text>): Void or Error`
- `join stream lines(lines: List<Text>): Text`

### std.money

`std.money` documents the current money pattern:

```point
record Money
  amount cents: Int
  currency: Text
```

- `money from cents(amount cents: Int, currency: Text): Money`
- `add money(left: Money, right: Money): Money`
- `money display(money: Money): Text`

## Why stdlib is small

The standard library stays narrow so agents choose known APIs instead of inventing local externals for common work. More capability can still come through explicit `external` declarations.

## See also

- [Effects](/point/language/effects)
- [Database interop](/point/ecosystem/database-interop)
- [Modules](/point/language/modules)
- [Stdlib bridge](/point/stdlib/bridge)
