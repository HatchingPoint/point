# Point Language Specification

Normative summary of Point **semantic** source as implemented in `@hatchingpoint/point` v0.1.5. Internal core syntax (`fn`, `let`, `type`) is a compiler implementation detail and must not appear in public `.point` files.

See also: [semantic-language-design.md](./semantic-language-design.md), [agent-quick-reference.md](./agent-quick-reference.md)

---

## 1. Program structure

```ebnf
program      ::= moduleDecl? topLevel*
moduleDecl   ::= "module" name
topLevel     ::= record | variant | calculation | rule | label | external | action
               | policy | guard | workflow | pipeline | session | prompt
               | view | page | layout | navigation
               | route | middleware | streamRoute | schedule | command | useDecl
useDecl      ::= "use" modulePath ("from" string)?
modulePath   ::= identifier ("." identifier)*
name         ::= /* words, may contain spaces */
```

Every public file must contain at least one top-level declaration from the families above (excluding `use` alone).

---

## 2. Types

| Type | Meaning | TS emit |
|------|---------|---------|
| `Text` | string | `string` |
| `Int` | integer | `number` |
| `Float` | number | `number` |
| `Bool` | boolean | `boolean` |
| `Void` | no value | `void` |
| `List<T>` | homogeneous list | `Array<T>` |
| `Maybe<T>` | optional | `T \| null` |
| `A or B` | union / result | `A \| B` |
| Record name | user struct | `interface` |
| Variant name | tagged union | discriminated union (`kind` field) |

Literals: `"text"`, numbers, `true`, `false`, `none`, `[ ... ]`, `{ field: value }`, variant cases (`Pending`, `Shipped with field: value`)

**Variant types (chosen over `enum`):** Point uses `variant` blocks for tagged unions with optional payloads per case. TypeScript emit uses a `kind` discriminator and case-specific fields. Dispatch in `label` blocks uses `on Case return ...` or `on Case with field return ...` (minimal pattern match); boolean guards still use `when ... return`.

Operators: `+`, `-`, `*`, `/`, `==`, `!=`, `<`, `<=`, `>`, `>=`, `and`, `or`, property access with `.`

---

## 3. Records

```point
record Cart Item
  name: Text
  unit price: Int
```

Field labels may contain spaces. The compiler lowers them to camelCase identifiers.

---

## 3b. Variants

```point
variant Order Status
  Pending
  Shipped with tracking number: Text
  Cancelled with reason: Text
```

- Unit cases are a single line (`Pending`).
- Payload cases use `Case with field: Type` (multiple fields join with `and`).
- Literals: `Pending`, `Shipped with tracking number: "1Z..."`.
- Labels dispatch with `on Pending return ...`, `on Shipped with tracking number return ...`, and `otherwise return ...`.
- Payload fields are only valid after narrowing (via `on` or an explicit `.kind` check); the checker rejects direct access on the union.

---

## 4. Calculations

Pure functions.

```point
calculation annual price
  input monthly price: Int
  output annual price: Int
  annual price is monthly price * 12
```

Body forms:

- `input name: Type`
- `output name: Type` or `output Type`
- `output is expression` / `{name} is {expr}`
- `for each item in list` …
- `add X to Y`, `subtract X from Y`, `set X to Y`
- `return expression`

---

## 5. Rules

Stateful logic with accumulation.

```point
rule cart total
  input items: List<Cart Item>
  output total: Int
  total starts at 0
  for each item in items
    add item.unit price * item.quantity to total
  return total
```

Additional forms:

- `{name} starts at {expr}`
- `add {n} when {condition}`

---

## 6. Labels

Classification into text (or other output type).

```point
label user status
  input user: User
  output Text
  when user.active return user.name
  otherwise return "inactive"
```

---

## 7. External

Explicit JS/npm interop.

```point
external node fs
  read file(path: Text): Text from "node:fs" as readFileSync
```

Externals are impure boundaries.

---

## 8. Actions

Effectful async operations.

```point
action load config
  input path: Text
  output contents: Text
  touches file
  return read file(path)
```

- `touches` values: `network`, `file`, `env`, `time`, `random`
- Action calls require `await` inside other actions/workflows
- Emits `async function` returning `Promise<T>`

---

## 9. Policies

Pure boolean guards.

```point
policy adult user
  input age: Int
  require age >= 18
```

Forms: `allow expr`, `deny expr`, `require expr`

---

## 10. Workflows

Multi-step orchestration.

```point
workflow signup flow
  input email: Text
  output user: Text or Error
  step created user is await create user(email)
  return created user
```

Step modifiers (Phase 16):

- `retry N times` — re-run the step on failure up to N attempts
- `timeout after N seconds` — fail the step when exceeded (uses `std.time`)
- `require policy <name>` — run the step only when the named policy passes
- `on failure return Error "..."` — structured failure branch

```point
workflow import user flow
  input email: Text
  output user: Text or Error
  step verified is await verify email(email)
    retry 3 times
    timeout after 5 seconds
    require policy can signup
    on failure return Error "Email verification failed"
  return verified
```

---

## 11. Views

React-targeted UI blocks.

```point
view welcome banner
  input name: Text
  output Page
  when name != "" render name
  otherwise render "Guest"
```

Emits JSX-oriented functions (React first target).

View modifiers:

- `class "tailwind classes"` on `render` — emits `className` on a wrapper element
- `load data from action <name>` or `on mount call <name>` — async data binding to `data`
- `when loading render`, `when error render`, `when empty render` — loading states
- `each item in data render ...` — list rendering
- `link "Label" to "/path"` — client navigation links
- `subscribe to <stream route>` or `subscribe to "/ws/path"` — WebSocket client binding (Phase 16)

---

## 11b. Layout, pages, and navigation (Phase 15)

**Layout** — named slots for app shells:

```point
layout app shell
  slot sidebar render dashboard nav()
  slot main render "Select a page"
```

**Page** — full-page shell with layout, title, and main content:

```point
page settings page
  layout app shell
  title "Settings"
  description "Manage workspace preferences"
  main render settings form(settings, on settings change)
```

**Navigation** — client route registry (emits React Router config):

```point
navigation dashboard app
  path "/settings" page settings page
  path "/items/:id" page item detail page
  bootstrap router
```

Path params (`:id`) map to page `input id: Text`. See `examples/app/dashboard/dashboard.point`.

---

## 12. Routes

HTTP handlers (Bun fetch stack).

```point
route get health
  method GET
  path "/health"
  output response: Text
  return "ok"
```

Reserved input names `query`, `body`, and `headers` must use **record types**. JSON responses use `return json { ... }` with optional `status` and `headers` clauses. Path params use normal `input` bindings matching `:segment` names in `path`.

See `examples/api/middleware-demo.point` and `docs/site/language/routes.md`.

---

## 12b. Middleware (Phase 14)

Reusable request gates attached with ordered `before` lines on routes (first listed runs first):

```point
middleware require auth
  input headers: Auth Headers
  output response: Maybe Text
  when checkJwtValid(headers.authorization, secret()) == false return "{\"error\":\"unauthorized\"}"
  otherwise return none
```

Return `none` to continue; any other value short-circuits with a JSON error response.

```point
route get item
  method GET
  path "/items"
  before require auth
  input headers: Auth Headers
  output response: Item Response
  return json { item: "demo", authenticated: true }
```

---

## 12c. Stream routes (Phase 16)

WebSocket server routes with typed messages:

```point
record Echo Message
  text: Text

stream route echo
  path "/ws"
  message Echo Message
  on connect return "ready"
  on message message return { text: message.text }
  on disconnect return none
```

- `on connect` may `stream from action <name>` to pipe subprocess or action output
- Views subscribe with `subscribe to <stream route name>` or an explicit path
- Effect metadata: `touches network`

See `examples/api/stream-echo.point` and `examples/app/log-viewer/log-viewer.point`.

---

## 12d. Schedule (Phase 16)

Periodic action invocation:

```point
schedule health check tick
  every 5 minutes
  call health check
```

Cron-style expressions are supported. Production deploys should prefer host cron; emit uses `setInterval` for local dev. See `examples/tools/health-check-schedule.point`.

---

## 13. Commands

CLI entrypoints for `point run`.

```point
command hello cli
  output result: Text
  return "Hello CLI"
```

Zero-input commands/actions/calculations may serve as run entrypoints; commands are preferred.

---

## 14. Modules and imports

```point
use Billing from "./billing.point"
use std.http
```

The CLI resolves a module graph, checks dependencies first, and emits TypeScript imports between generated files.

---

## 15. Tests

**Unit tests** — zero-input `calculation` or `action` whose semantic name starts with `test` and returns `Bool`:

```point
calculation test pricing sanity
  output ok: Bool
  ok is true
```

Run: `point test <file>`, `point test-all`

**Integration tests (Phase 20)** — `action` blocks whose semantic name starts with `integration test`, return `Bool`, and take zero inputs or one `base url: Text` input:

```point
action integration test missing auth
  input base url: Text
  output passed: Bool
  touches network
  return assert missing auth response(await fetchMissingAuthSnapshot(base url))
```

Run: `point test integration <file>`. Point starts the module's route server, passes the live base URL, and runs HTTP assertions. Requires route blocks in the module. Not picked up by `point test` or `point test-all`. See `examples/api/middleware-integration.point`.

---

## 15b. Pipeline and guards (Phase 18)

**Pipeline** — multi-step async orchestration with typed events:

```point
pipeline document ingest
  input url: Text
  output result: Text or Error
  step fetched is await fetch document(url)
    retry 2 times
    require policy allowed url
    on failure return Error "Fetch failed"
  step parsed is await parse document(fetched)
  return parsed
```

Step modifiers reuse workflow semantics (`retry`, `timeout`, `require policy`, `on failure`). Pipeline steps may declare `touches file scope <guard name>`.

**Guard** — path allowlists for file-touching automation:

```point
guard output paths
  allow "output/**"
  allow "tmp/*"
```

Violations return structured `Error` at runtime. See `examples/pipelines/document-ingest.point` and `examples/pipelines/guarded-output.point`.

---

## 15c. Session and prompts (Phase 18)

**Session** — agent conversation state with streaming:

```point
session support chat
  message Chat Message
  messages messages: List<Chat Message>
  stream response from action summarize support
```

Emits typed session event logs (`point.session.event.v1`). See `examples/agents/support-chat.point`.

**Prompt** — versioned text templates with record interpolation:

```point
prompt support greeting
  version 1
  input Support Context
  template Hello {user name}, thank you for contacting support. Your {tier} plan is ready to help.
```

Placeholders match record field labels. Indexed by `point index`. See `examples/prompts/support-greeting.point`.

---

## 15d. Data interop — databases (Phase 17)

Point does **not** own a database runtime or ORM. Persist data with **`action`** blocks that declare `touches database`, calling **`external`** driver shims or **`std.sql`** for parameterized queries.

```point
external point std sql
  sql query raw(sql: Text, params: List<Text>): Text or Error from "@hatchingpoint/point/std/sql"

action list notes
  output rows: Text or Error
  touches database
  return sql query raw("SELECT id, title, body FROM notes ORDER BY title", [])
```

Views load database actions with `load data from action <name>` (Phase 15). For PostgreSQL or other engines, declare an `external` block for your npm driver — see `docs/site/ecosystem/database-interop.md`.

---

## 16. Naming lowering

| Source | Generated |
|--------|-----------|
| `calculation annual price` | `annualPrice` |
| `rule launch readiness` output `score` | `launchReadinessScore` |
| `label user status` | `userStatusLabel` |
| `rule cart total` output `total` | `cartTotal` (no duplicate suffix) |

---

## 17. Agent refs

Semantic refs:

```text
point://semantic/<Module>/record.User.field.name
point://semantic/<Module>/calculation.annual price
point://semantic/<Module>/action.load config
```

Commands: `point index`, `point explain`, `point check-json`, `point repair-plan`

---

## 18. CLI

| Command | Purpose |
|---------|---------|
| `point check` | Typecheck |
| `point fmt` | Format semantic source |
| `point build-ts` | Emit TypeScript |
| `point build-js` | Emit JavaScript |
| `point build-py` | Emit Python (automation target) |
| `point build --production` | Optimized emit bundle |
| `point run` | Execute entrypoint |
| `point dev` | Watch, check, emit, reload server + client |
| `point test` | Run unit tests |
| `point test integration` | Run integration test actions against live routes |
| `point test-all` | Run all unit tests in project |
| `point create` | Scaffold a new app from bundled template |
| `point app new` | Legacy alias for `point create` |
| `point repl` | Expression REPL |
| `point index` | Symbol index |

Incremental checks: `POINT_INCREMENTAL=1 point check-all`

---

## 19. Conformance

The suite in `tests/conformance/` requires every fixture under `examples/`, `std/`, and `compiler/` to parse, check, and build without diagnostics.

---

## 20. Semantic AST (Phase 7.1)

The compiler maintains a **semantic AST** parallel to public source. It is the target of the Phase 7 semantic parser and the input to in-memory desugar passes. Types live in `packages/point/src/semantic/ast.ts`.

### Program root

```typescript
PointSemanticProgram {
  kind: "semanticProgram"
  module?: string
  uses: PointSemanticUseDeclaration[]
  declarations: PointSemanticDeclaration[]
  span?: PointSourceSpan
}
```

### Top-level declarations

Each public construct maps to a declaration node with `kind` discriminant:

| Source keyword | AST kind | Key fields |
|----------------|----------|------------|
| `record` | `record` | `name`, `fields[]` |
| `variant` | `variant` | `name`, `cases[]` |
| `calculation` | `calculation` | `name`, `inputs[]`, `output`, `body[]` |
| `rule` | `rule` | `name`, `inputs[]`, `output`, `body[]` |
| `label` | `label` | `name`, `inputs[]`, `output`, `body[]` |
| `external` | `external` | `name`, `functions[]` |
| `action` | `action` | `name`, `inputs[]`, `output`, `touches[]`, `body[]` |
| `policy` | `policy` | `name`, `inputs[]`, `body[]` |
| `guard` | `guard` | `name`, `allowPatterns[]` |
| `pipeline` | `pipeline` | `name`, `inputs[]`, `output`, `steps[]` |
| `session` | `session` | `name`, `message`, `fields[]`, `streamAction` |
| `prompt` | `prompt` | `name`, `version`, `input`, `template` |
| `view` | `view` | `name`, `inputs[]`, `output`, `body[]` |
| `page` | `page` | `name`, `layout?`, `title`, `body[]` |
| `layout` | `layout` | `name`, `slots[]` |
| `navigation` | `navigation` | `name`, `routes[]` |
| `route` | `route` | `name`, `method`, `path`, `middleware[]`, `inputs[]`, `output`, `body[]` |
| `middleware` | `middleware` | `name`, `inputs[]`, `output`, `body[]` |
| `stream route` | `streamRoute` | `name`, `path`, `message`, `handlers[]` |
| `schedule` | `schedule` | `name`, `interval`, `action` |
| `workflow` | `workflow` | `name`, `inputs[]`, `output`, `body[]` |
| `command` | `command` | `name`, `inputs[]`, `output`, `body[]` |
| `use` | `use` (on program) | `moduleName`, `from?` |

Field labels in source are preserved verbatim (spaces allowed). Record type references keep author spelling (e.g. `Cart Item`).

### Statement and expression nodes

Body statements use kind-specific unions, for example:

- **Calculation / rule:** `assignIs`, `startsAt`, `startsAs`, `forEach`, `addTo`, `subtractFrom`, `setTo`, `addWhen`, `return`
- **Label:** `whenReturn`, `otherwiseReturn`
- **View:** `whenRender`, `render`
- **Policy:** `allow`, `deny`

Expressions: `literal`, `name`, `property`, `binary`, `call`, `await`, `list`, `record`, `error`.

Types: `typeRef` with `name` and `args[]` (for `List<T>`, `Maybe<T>`, `A or B`).

### Source spans

Every declaration, binding, field, statement, and expression node may carry `span: PointSourceSpan` (`start`/`end` line, column, offset). Spans refer to **semantic `.point` source**, not lowered core text.

### Serialization (tests)

`serializeSemanticProgram()` produces stable JSON snapshots with spans stripped. Snapshot tests in `tests/semantic-ast.test.ts` cover `examples/math.point` and `examples/cart-total.point`.

### Parser entry points (Phase 7.2–7.6)

- `parseSemanticSource(source)` — parse semantic `.point` text to `PointSemanticProgram`
- `parsePointSource(source)` — **production:** semantic parse → desugar → core AST (never parses core text)
- `parsePointSourceV2(source)` — alias for `parseSemanticSource`
- `desugarSemanticProgram(program)` — semantic AST → core AST
- `desugarSemanticImports(uses, resolve)` — `use` declarations → core `import` nodes
- `formatSemanticProgram(program)` / `formatPointSource(source)` — semantic AST formatter

**Test-only:** `packages/point/src/core/test-only/` provides `parsePointCore`, `formatPointCore`, and `parsePointSourceLegacy` for IR unit tests and migration parity. Core is **AST IR data**, not an author-facing source language.

### Core IR (not a source language)

Production never emits or re-parses core text (`fn`, `let`, `type`, …). The checker, emitter, and CLI operate on in-memory `PointCoreProgram` nodes from desugaring semantic AST.

---

## 22. Desugar rules (Phase 7.3)

Semantic AST lowers in-memory to core AST via `desugarSemanticProgram()`. Rules mirror the legacy string lowering retained in `core/test-only/legacy-lowering.ts`:

| Semantic | Core |
|----------|------|
| `record` | `type` with PascalCase name; field labels → camelCase identifiers |
| `calculation` / `rule` / `label` / `action` / … | `function` with `semanticFunctionName()` |
| `external` | `external` per function (`read file` → `readFile`) |
| `{name} is expr` (calculation output) | `return expr` |
| `{name} starts at/as` | `var` (mutable) initialization |
| `for each item in list` + mutations | `for` loop with `+=` / `-=` / `=` body |
| `add X when C` (rule) | `if C { output += X }` |
| `when C return V` / `otherwise return V` | `if` / fallthrough `return` |
| `step name is expr` (workflow) | `let name: OutputType = expr` |
| `Error "msg"` | `Error("msg")` call |
| `Text or Error`, `Maybe<T>`, `List<T>` | `Or<…>`, `Maybe<…>`, `List<…>` type refs |
| Spaced names / property access | camelCase identifiers and `property` nodes |
| `use Module from "path"` | `desugarSemanticImports()` → `import` declarations (wired at module graph in CLI) |

Parity tests in `tests/semantic-desugar.test.ts` assert desugared core AST matches the legacy pipeline for every fixture. `tests/semantic-emit.test.ts` asserts byte-identical TypeScript and JavaScript emit from both pipelines.

### Emit backends (Phase 7.7)

Production emit reads `PointCoreProgram` AST nodes only:

- `emitPointCoreTypeScript(program)` — TypeScript with interfaces and types
- `emitPointCoreJavaScript(program)` — JavaScript without type syntax

CLI `build-ts` / `build-js` call these after `parsePointSource()` → `checkPointCore()`. Benchmarks: [phase7-benchmarks.md](./phase7-benchmarks.md).

---

## 23. Reserved future work

- Python emit: deferred ([python-emit-research.md](./python-emit-research.md))
- Native binary: deferred ([native-target-research.md](./native-target-research.md))
