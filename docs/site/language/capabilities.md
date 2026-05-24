---
title: Capabilities
description: Built-in std modules with straight use syntax.
quadrant: Reference
---

## Summary

Point ships **built-in capabilities** — std modules you import with one word:

```text
use http
use json
use time
```

Each shorthand resolves to `use std.<name>`. Run `point capabilities` to list them.

**Frontend is not a capability.** Views, pages, layouts, and navigation are native App blocks — you write them directly in `.point`, not via `capabilities`. Capabilities cover host I/O and std batteries (HTTP, SQL, crypto, AI, files, etc.).

## Syntax

| Form | Meaning |
|------|---------|
| `capabilities http json` | One-line import for multiple built-ins |
| `use http` | Single built-in HTTP capability (`std/http.point`) |
| `use std.http` | Explicit std import (same module) |
| `use Billing from "./billing.point"` | Local file import |

Use lowercase names for built-ins. PascalCase names without `from` are package modules (for example lockfile packages added with `point add`).

## Discover

```bash
point capabilities
point capabilities --json
```

JSON output uses schema `point.capabilities.v1` for agent scripts.

## Catalog

| Capability | Summary |
|------------|---------|
| `text` | Text parse, format, and pad helpers |
| `json` | JSON parse and stringify |
| `http` | HTTP fetch and route test assertions |
| `time` | Instant, duration, and timezone formatting |
| `fs` | Filesystem read and write actions |
| `env` | Environment variable access |
| `path` | Path join and basename helpers |
| `process` | Spawn and run host processes |
| `pty` | Pseudo-terminal subprocess spawn and line streaming |
| `crypto` | Hashing, HMAC, and JWT helpers |
| `auth` | Bearer tokens, JWT auth checks, unauthorized responses |
| `yaml` | YAML parse and stringify |
| `stream` | Stream route helpers |
| `sql` | SQLite query actions and schema helpers |
| `ai` | OpenAI and Anthropic complete/stream actions |
| `money` | Cents-based money formatting |

## Example

```point
module CapabilitiesDemo

use http
use json

calculation pass through
  input value: Text
  output result: Text
  result is value

action fetch snapshot
  input url: Text
  output body: Text or Error
  touches network
  return await httpGetResponse(url)
```

See `examples/capabilities-demo.point` in the repository.

## Expand beyond built-ins

- **`point add npm:…`** — third-party Point packages via lockfile
- **`use Module from "./file.point"`** — your modules
- **`command` / `pipeline`** — runnable entrypoints agents and humans invoke

## See also

- [Modules](/point/language/modules)
- [Stdlib overview](/point/stdlib/overview)
- [In the box](/point/language/in-the-box)
