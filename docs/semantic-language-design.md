# Point Semantic Language Design

Point source is AI-first application logic. Users write semantic blocks; the compiler lowers those blocks into an internal typed core and then emits TypeScript or other targets.

Programming-language-shaped forms such as function declarations, mutable bindings, braces, and direct assignment are compiler/core details. They are useful for implementation and debugging, but they are not the forward-facing Point language.

## Source Shape

Point source is organized as named blocks:

```point
module Checkout

record Cart Item
  name: Text
  unit price: Int
  quantity: Int

calculation line total
  input item: Cart Item
  output total: Int
  total is item.unit price * item.quantity

rule cart total
  input items: List<Cart Item>
  output total: Int
  total starts at 0
  return total

label shipping offer
  input total: Int
  output Text
  when total >= 100 return "Free shipping"
  otherwise return "Standard shipping"
```

## Public Constructs

- `module` names a source module.
- `record` defines named structured data.
- `calculation` derives a value from inputs.
- `rule` accumulates or decides business logic.
- `label` classifies a value into text.
- `action`, `policy`, `workflow`, and `external` are reserved for effectful and interop work.

## Naming

User-facing names may contain spaces:

```point
monthly price
Cart Item
has bundle id
```

The compiler lowers these names into stable generated identifiers:

```text
monthly price -> monthlyPrice
Cart Item -> CartItem
has bundle id -> hasBundleId
```

Block names lower by construct:

```text
calculation annual price -> annualPrice
rule launch readiness with output score -> launchReadinessScore
label user status -> userStatusLabel
```

When a rule or calculation name already ends with its output name, the compiler does not repeat the suffix:

```text
rule cart total with output total -> cartTotal
```

Diagnostics and repair plans should point at semantic source names first, with generated identifiers treated as target details.

## Iteration

Semantic loops use `for each <name> in <expr>` inside rules and calculations. The compiler lowers them to typed core `for <name> in <expr>` statements, which emit TypeScript `for ... of` loops. The checker requires the iterable expression to be `List<T>` and binds the loop variable as immutable `T` within the loop body.

## Optional Values

Point uses `Maybe<T>` for optional values. The literal `none` represents a missing value and emits to TypeScript `null`; `Maybe<User>` emits as `User | null`. Field access on `Maybe<Record>` is not implicitly unwrapped: programs must first prove the value is present before using record fields, and diagnostics should point agents at that missing presence check.

## Result Values

Operations that can fail use union-style result outputs such as `output User or Error`. The compiler lowers this to a typed core union and emits a TypeScript union (`User | { message: string }`). Error values are constructed semantically with `return Error "message"`, which lowers to the typed error object in generated TypeScript.

## Variant Types

Point uses `variant` blocks (not `enum`) for tagged unions with optional per-case payloads. Each case lowers to a TypeScript discriminated union member with a `kind` field. Construct values with case literals (`Pending`, `Shipped with tracking number: "1Z..."`). Classify or dispatch in `label` blocks with `on Case return ...` or `on Case with field return ...`; the checker requires narrowing before reading payload fields.

## External Declarations

External blocks declare explicit interop boundaries:

```point
external node fs
  read file(path: Text): Text from "node:fs" as readFileSync
```

External functions are impure by definition because they cross into JavaScript, npm packages, or Node/Bun built-ins. The checker treats their signatures as typed callable functions, and the TypeScript emitter turns them into imports.

## Actions

Actions are effectful blocks that may call externals or other actions. They declare inputs, outputs, and explicit effect metadata:

```point
action load config
  input path: Text
  output contents: Text
  touches file
  return read file(path)
```

The TypeScript target emits actions as `async` functions. The agent index includes the declared `touches` effects so repair and review tools can see when code reaches the network, filesystem, environment, time, or randomness.

Actions that call other actions must use `await`. The checker reports missing awaits on action calls, and the TypeScript target preserves `await` in emitted async functions.

## Policies

Policies are pure boolean guards:

```point
policy adult user
  input age: Int
  require age >= 18
```

`allow` and `require` return the guard expression. `deny` returns true when the denied expression is false. Policies emit pure TypeScript predicate functions and do not carry effect metadata.

## Tests

Point tests use a naming convention: any zero-input calculation or action whose semantic name starts with `test` and returns `Bool` is a test. `point test <file>` and `point test-all` execute those test entrypoints and fail when a test returns anything other than `true` or throws.

## REPL

`point repl` reads expression lines from stdin or an interactive terminal, evaluates them, prints the value and inferred Point type, and exits on `.exit`, `exit`, or EOF.

## Runtime Source Mapping

`point run` reports runtime failures against the semantic `.point` file and entry declaration line. Current source maps are declaration-level rather than statement-level; generated TypeScript does not yet carry full per-expression source maps.

## Views

Views declare UI in semantic blocks and target React first. A minimal view accepts inputs as props and uses `render` or `when ... render ...` clauses; the TypeScript target emits a React-style function returning `JSX.Element`.

Rich view syntax includes:

- `class "..."` on `render` for Tailwind styling
- `load data from action <name>` with `when loading/error/empty render`
- `each item in data render ...` and `link "Label" to "/path"`
- `form` with `bind field` / `bind checkbox`
- `tabs` / `tab "Name" render ...`
- `modal "Title" when condition render ...`
- `Handler T` callback inputs with `on change call`
- `subscribe to <stream route>` for WebSocket clients

See `examples/app/dashboard/dashboard.point` and `docs/site/language/ui.md`.

## Pages, layouts, and navigation

**Layout** blocks define named slots (`sidebar`, `main`, optional `header`/`footer`). **Page** blocks bind to a layout with `title`, optional `description`, and `main render`. **Navigation** registers paths to pages and emits a client router bootstrap. Path params (`:id`) map to page inputs. See `examples/app/dashboard/dashboard.point`.

## Routes and middleware

Routes declare HTTP handlers with `method`, `path`, typed inputs, and outputs. **Middleware** blocks run in route-level `before` order. Routes may take typed `query`, `body`, and `headers` record inputs. JSON handlers use `return json { ... }` with optional `status` and `headers`. See `examples/route.point` and `examples/api/middleware-demo.point`.

## Stream routes

**Stream route** blocks declare WebSocket servers with typed `message` records and `on connect`, `on message`, and `on disconnect` handlers. Views subscribe with `subscribe to`. See `examples/api/stream-echo.point`.

## Schedules

**Schedule** blocks call actions on an interval (`every N minutes`). See `examples/tools/health-check-schedule.point`. Prefer host cron for production.

## Pipelines, sessions, prompts, and guards

- **Pipeline** — multi-step flows with `step name is await action(...)` and retry/timeout/policy modifiers
- **Session** — conversational state with streaming actions
- **Prompt** — versioned templates with record placeholders (`version N`, `input Record`, `template "..."`)
- **Guard output paths** — allow/deny file path scopes for pipeline file IO

See `examples/pipelines/`, `examples/agents/support-chat.point`, and `examples/prompts/support-greeting.point`.

## Workflows

Workflows orchestrate multi-step application flows. They use typed inputs/outputs, `step <name> is <expression>` bindings, and explicit `await` when composing actions or other workflows. The TypeScript target emits async functions.

## Commands

Commands define CLI entrypoints. A zero-input command can be executed with `point run <file>`; the TypeScript target emits async command functions that return printable values.

## Modules

Multi-file projects use `use ModuleName from "./file.point"` at the top of a semantic source file. The CLI resolves these imports as a project graph, checks dependency declarations before dependents, and emits TypeScript imports from generated dependency files. Until package visibility rules exist, all semantic top-level declarations (`record`, `calculation`, `rule`, and `label`) are public exports.

## Standard Library Layout

Standard library modules live under `std/` and use dotted public names mapped to files:

```text
std.text -> std/text.point
std.http -> std/http.point
std.json -> std/json.point
std.time -> std/time.point
std.fs -> std/fs.point
std.env -> std/env.point
```

User code imports them with `use std.http` rather than a relative path. Standard modules are ordinary semantic Point files built on explicit externals and actions.

## Lowering Contract

Semantic source lowers into the internal core:

```point
calculation annual price
  input monthly price: Int
  output annual price: Int
  annual price is monthly price * 12
```

Internal core equivalent: a typed function named `annualPrice` that accepts `monthlyPrice: Int` and returns `monthlyPrice * 12`.

TypeScript target:

```ts
export function annualPrice(monthlyPrice: number): number {
  return monthlyPrice * 12;
}
```

The semantic source is the language. The core and generated TypeScript are implementation artifacts.
