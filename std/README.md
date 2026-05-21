# Point Standard Library

Standard library modules are ordinary semantic Point files:

- `std.text`
- `std.json`
- `std.http`
- `std.time`
- `std.fs`
- `std.env`
- `std.path`
- `std.crypto`
- `std.sql` (spike — parameterized SQLite queries only)
- `std.ai` (OpenAI + Anthropic HTTP provider actions)

User code imports them with `use std.<module>`.

## Modules

### std.text

- `concat text(left: Text, right: Text): Text`
- `text length(value: Text): Int`
- `text contains(value: Text, search: Text): Bool`
- `text split(value: Text, separator: Text): List<Text>`
- `text trim(value: Text): Text`

### std.json

- `parse json(value: Text): Text or Error`
- `stringify json(value: Text): Text`

### std.http

- `http get(url: Text): Text or Error`
- `http post(url: Text, body: Text): Text or Error`

### std.time

- `current time(): Text`
- `wait milliseconds(ms: Int): Void`
- `format time(value: Text): Text`

### std.fs

- `read file(path: Text): Text or Error`
- `write file(path: Text, contents: Text): Void or Error`

### std.env

- `get env var(name: Text): Maybe<Text>`
- `env with default(value: Maybe<Text>, default value: Text): Text`

### std.path

- `join paths(left: Text, right: Text): Text`
- `path basename(value: Text): Text`
- `path dirname(value: Text): Text`
- `path extname(value: Text): Text`
- `resolve path(value: Text): Text`
- `path is absolute(value: Text): Bool`

### std.crypto

- `digest sha256(value: Text): Text`
- `digest hmac sha256(value: Text, secret: Text): Text`
- `sign jwt(payload: Text, secret: Text): Text`
- `verify jwt(token: Text, secret: Text): Text or Error`
- `check jwt valid(token: Text, secret: Text): Bool`
- `jwt auth ok(token: Text, secret: Text): Bool`

Load production secrets with `std.env` — never log keys. Example: `examples/tools/jwt-demo.point`, JWT middleware in `examples/api/middleware-demo.point`.

### std.sql (spike)

- `sql query(sql: Text, params: List<Text>): Text or Error` — parameterized queries only (`?` placeholders)

Uses Bun built-in SQLite (`:memory:` by default). For PostgreSQL, use `external` + driver — see `docs/site/ecosystem/database-interop.md`.

### std.ai

HTTP interop for OpenAI Chat Completions and Anthropic Messages — not IDE CLI wrappers.

- `complete text with openai(prompt: Text, model: Text): Text or Error`
- `stream text with openai(prompt: Text, model: Text): Text or Error`
- `complete text with anthropic(prompt: Text, model: Text): Text or Error`
- `stream text with anthropic(prompt: Text, model: Text): Text or Error`

**API keys:** Load with `std.env` only — set `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY` in the host environment. Never embed production keys in `.point` source. Example: `examples/tools/ai-demo.point`. See `docs/site/ecosystem/ai-providers.md`.
