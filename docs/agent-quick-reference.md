# Point Agent Quick Reference

For coding agents working on `.point` files and compiler output.

## Golden rules

1. Write **semantic blocks only** — never `fn`, `let`, `type`, braces in public source
2. Run `bun run check` after edits
3. Use `point check-json` for structured diagnostics with `ref`, `repair`, `expected`, `actual`
4. Prefer `point://semantic/...` refs when explaining or repairing user source

## Block chooser

| Intent | Block |
|--------|-------|
| Data shape | `record` |
| Tagged union | `variant` |
| Pure transform | `calculation` |
| Score / accumulate / decide | `rule` |
| Classify to text | `label` |
| npm/Node call | `external` |
| I/O or side effect | `action` |
| Auth / validation guard | `policy` |
| File path allowlist | `guard` |
| Multi-step flow | `workflow` or `pipeline` |
| Agent conversation | `session` |
| Prompt template | `prompt` |
| React UI fragment | `view` |
| Full page shell | `page` |
| App shell slots | `layout` |
| Client route registry | `navigation` |
| HTTP handler | `route` |
| HTTP request gate | `middleware` |
| WebSocket server | `stream route` |
| Periodic job | `schedule` |
| Database access | `action` + `external` or `std.sql` (`touches database`) |
| CLI entry | `command` |

## Common patterns

**Loop over list**

```point
for each item in items
  add item.price to total
```

**Variant dispatch**

```point
label order status label
  input status: Order Status
  output Text
  on Pending return "Pending"
  on Shipped with tracking number return tracking number
  otherwise return "Unknown"
```

**Error result**

```point
output user: User or Error
return Error "not found"
```

**Optional**

```point
email: Maybe<Text>
return none
```

**Route with middleware and typed inputs**

```point
middleware require auth
  input headers: Auth Headers
  output response: Maybe Text
  when token invalid return "{\"error\":\"unauthorized\"}"
  otherwise return none

route get item
  method GET
  path "/items"
  before require auth
  input query: Item Query
  output response: Item Response
  return json { item: query.limit, authenticated: true }
```

**Stream route + view subscription**

```point
stream route logs
  path "/ws/logs"
  message Log Line
  on connect stream from action tail demo logs
  on disconnect return none

view log panel
  subscribe to logs
  when connecting render "Connecting..."
  each line in messages render line.line
```

**Layout, page, navigation**

```point
layout app shell
  slot sidebar render nav()
  slot main render "Select a page"

page items page
  layout app shell
  title "Items"
  main render items list()

navigation my app
  path "/items" page items page
  path "/items/:id" page item detail page
  bootstrap router
```

**Load data in views**

```point
view items list
  load data from action fetch items
  when loading render "Loading..."
  when error render "Could not load"
  when empty render "No items"
  each item in data render item.title
```

**Workflow / pipeline step modifiers**

```point
step verified is await verify email(email)
  retry 3 times
  timeout after 5 seconds
  require policy can signup
  on failure return Error "Verification failed"
```

**Guard + pipeline file scope**

```point
guard output paths
  allow "output/**"

pipeline guarded write
  input target: Text
  output result: Text or Error
  step written is await resolve path(target)
    touches file scope output paths
  return written
```

**Session + prompt**

```point
prompt support greeting
  version 1
  input Support Context
  template Hello {user name}, your {tier} plan is active.

session support chat
  message Chat Message
  messages messages: List<Chat Message>
  stream response from action summarize support
```

**Schedule**

```point
schedule health check tick
  every 5 minutes
  call health check
```

**Database actions**

```point
external point std sql
  sql query raw(sql: Text, params: List<Text>): Text or Error from "@hatchingpoint/point/std/sql"

action list notes
  output rows: Text or Error
  touches database
  return sql query raw("SELECT id, title, body FROM notes ORDER BY title", [])

view notes list
  load data from action list notes
  when loading render "Loading..."
  each note in data render note.title
```

**Unit test**

```point
calculation test pricing sanity
  output ok: Bool
  ok is true
```

**Integration test**

```point
action integration test health route
  input base url: Text
  output passed: Bool
  touches network
  return httpAssertStatus(await httpFetch(base url + "/health"), 200)
```

**Import std**

```point
use std.http
```

**Import local module**

```point
use Billing from "./billing.point"
```

## Commands (repo root)

```bash
bun run check
bun run check-json examples/math.point
bun run check-docs
bun run index examples/math.point
bun run explain examples/math.point point://semantic/Math/calculation.annual price
bun run repair-plan examples/math.point
bun run build
bun packages/point/src/cli.ts build-js examples/math.point generated/math.js
bun packages/point/src/cli.ts build-py examples/math.point generated/math.py
bun packages/point/src/cli.ts run examples/hello.point
bun packages/point/src/cli.ts test examples/point-tests.point
bun packages/point/src/cli.ts test integration examples/api/middleware-integration.point
bun packages/point/src/cli.ts dev examples/full-stack-template/src/app.point --port 3000
point lsp   # Language Server for Neovim, Zed, etc. (stdio)
POINT_INCREMENTAL=1 bun run check
```

## Diagnostic repair loop

1. `point check-json <file>`
2. Read `ref`, `repair`, `relatedRefs`
3. Patch semantic source at the named block/field
4. Re-run check-json until `ok: true`

## Files agents should read first

- `docs/editor-setup.md` — Neovim, Zed, terminal-only workflows
- `docs/language-spec.md` — grammar and CLI (Phases 14–20 syntax)
- `docs/platform-vision-plan.md` — north star and phase map (internal)
- `docs/point-principles-gate.md` — required gates before marking goals done
- `docs/semantic-language-design.md` — design intent
- `docs/ai-reference-system.md` — refs and repair metadata
- `examples/` — working fixtures by feature
- `std/README.md` — standard library modules

## Feature examples (Phases 14–20)

| Feature | Example |
|---------|---------|
| Variant types | `examples/variants/order-status.point` |
| Middleware + typed routes | `examples/api/middleware-demo.point` |
| Process + path stdlib | `examples/tools/process-runner.point` |
| Multi-page app | `examples/app/dashboard/dashboard.point` |
| WebSocket + subprocess stream | `examples/app/log-viewer/log-viewer.point` |
| Workflow retry/timeout | `examples/workflow-retry.point` |
| Notes app (std.sql) | `examples/app/notes/notes.point` |
| Pipeline + guard | `examples/pipelines/guarded-output.point` |
| Session + AI | `examples/agents/support-chat.point` |
| Prompt library | `examples/prompts/support-greeting.point` |
| Integration tests | `examples/api/middleware-integration.point` |
| Full-stack template | `examples/full-stack-template/` |

## Do not

- Expose internal core syntax in `.point` files
- Invent keywords that are not in the grammar/parser
- Treat pricing/readiness examples as built-in language features
- Publish packages without credentials (`NPM_TOKEN`, `VSCE_PAT`)
- Hand-edit generated JS/TS/PY for product logic — repair `.point` source

## Principles gate (Phases 14–21)

Before marking work done, verify [point-principles-gate.md](./point-principles-gate.md): semantic blocks, agent loop refs, block family fit, effect honesty, general example, boring emit, no product-specific keywords.
