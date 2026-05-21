# Point Language Specification

Normative summary of Point **semantic** source as implemented in `@hatchingpoint/point` v0.0.5. Internal core syntax (`fn`, `let`, `type`) is a compiler implementation detail and must not appear in public `.point` files.

See also: [semantic-language-design.md](./semantic-language-design.md), [agent-quick-reference.md](./agent-quick-reference.md)

---

## 1. Program structure

```ebnf
program      ::= moduleDecl? topLevel*
moduleDecl   ::= "module" name
topLevel     ::= record | calculation | rule | label | external | action
               | policy | workflow | view | route | command | useDecl
useDecl      ::= "use" modulePath ("from" string)?
modulePath   ::= identifier ("." identifier)*
name         ::= /* words, may contain spaces */
```

Every public file must contain at least one of: `record`, `calculation`, `rule`, `label`, `action`, `external`, `policy`, `workflow`, `view`, `route`, `command`.

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

Literals: `"text"`, numbers, `true`, `false`, `none`, `[ ... ]`, `{ field: value }`

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

---

## 12. Routes

HTTP handlers (Hono-first target).

```point
route GET /health
  output Text
  return "ok"
```

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

Zero-input `calculation` or `action` whose semantic name starts with `test` and returns `Bool`:

```point
calculation test pricing sanity
  output ok: Bool
  ok is true
```

Run: `point test <file>`, `point test-all`

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
| `point run` | Execute entrypoint |
| `point test` | Run tests |
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
| `calculation` | `calculation` | `name`, `inputs[]`, `output`, `body[]` |
| `rule` | `rule` | `name`, `inputs[]`, `output`, `body[]` |
| `label` | `label` | `name`, `inputs[]`, `output`, `body[]` |
| `external` | `external` | `name`, `functions[]` |
| `action` | `action` | `name`, `inputs[]`, `output`, `touches[]`, `body[]` |
| `policy` | `policy` | `name`, `inputs[]`, `body[]` |
| `view` | `view` | `name`, `inputs[]`, `output`, `body[]` |
| `route` | `route` | `name`, `method`, `path`, `inputs[]`, `output`, `body[]` |
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
