# Point Full Language Plan

> **Status (2026-05):** Phases 0–11 are **complete** (v0.0.13). Active work: [phase12-plan.md](./phase12-plan.md). This document archives Phase 0–7 execution history; use phase9–12 plans for current goals.

This is the master execution plan for building Point into a complete, general-purpose, AI-first language that can eventually replace hand-written TypeScript and Python for new software.

**Do not start the next phase until every checkbox in the current phase is checked.** A phase is incomplete if any box is open, any quality-gate command fails, or any exit criterion is unmet.

---

## How To Use This Document

1. Work phases in order: Phase 0 → Phase 1 → … → Phase 6.
2. Within a phase, complete sections top to bottom unless a dependency note says otherwise.
3. After each section, run that section's verification commands.
4. Before leaving a phase, run the **Phase Exit Gate** checklist at the bottom of the phase.
5. When using an LLM, paste the **LLM Prompt Pack** for the active phase and attach the **Required References** listed for that phase.
6. Update checkboxes in this file as work lands. Keep it honest — unchecked means not done.
7. For long-running Codex CLI work, use [codex-goal.md](./codex-goal.md) and log checkpoints in [codex-progress.md](./codex-progress.md).

---

## Non-Negotiable Principles

- [x] Public `.point` source stays **semantic** (`record`, `calculation`, `rule`, `label`, …). Never expose internal core syntax (`fn`, `let`, `type`, braces) in public source.
- [x] Every semantic feature **lowers to typed core**, then **emits to a target** (TypeScript first).
- [x] Every feature ships with **tests**, **an example**, and **agent-facing diagnostics** (refs, repair hints).
- [x] Domain examples (pricing, readiness, billing) are **examples only** — never built-in language features.
- [x] Docs, scripts, and generated output paths stay aligned with the repo (`generated/`, root `package.json` scripts).

---

## Architecture (Phase 7 — do not rebuild)

```text
Semantic Source (.point)
  record, calculation, rule, label, action, external, workflow, …
        ↓ parseSemanticSource()
Semantic AST
  packages/point/src/semantic/
        ↓ desugarSemanticProgram() (in memory — no core text)
Core IR (internal AST)
  fn, type, let, var, if, loops, …
        ↓ checkPointCore() → emit
Targets
  TypeScript / JavaScript → Bun/Node (now), more targets later
```

**Key repo locations**

| Area | Path |
|------|------|
| Entry / parsePointSource | `packages/point/src/core/parser.ts` |
| Semantic AST | `packages/point/src/semantic/ast.ts` |
| Semantic parser | `packages/point/src/semantic/parse.ts` |
| Desugar | `packages/point/src/semantic/desugar.ts` |
| Semantic index / diagnostics | `packages/point/src/semantic/context.ts` |
| Core IR types | `packages/point/src/core/ast.ts` |
| Type checker | `packages/point/src/core/check.ts` |
| TS / JS emit | `packages/point/src/core/emit-typescript.ts`, `emit-javascript.ts` |
| Semantic formatter | `packages/point/src/semantic/format.ts` |
| CLI | `packages/point/src/core/cli.ts` |
| Core text parser (test-only) | `packages/point/src/core/test-only/` |
| Tests | `tests/point-core.test.ts`, `tests/semantic-*.test.ts`, `tests/core-ir.test.ts` |
| Examples | `examples/*.point` |
| Design spec | `docs/semantic-language-design.md` |
| Agent spec | `docs/ai-reference-system.md` |
| Editor grammar | `packages/point-vscode/syntaxes/point.tmLanguage.json` |
| Editor snippets | `packages/point-vscode/snippets/point.code-snippets` |

---

## LLM Workflow (Use On Every Task)

### Before coding

Paste this into the agent session:

```text
We are executing docs/full-language-plan.md.

Active phase: [PHASE NUMBER AND NAME]
Active section: [SECTION NAME]

Rules:
- Do not start the next phase or section until every checkbox here is done.
- Public .point source must stay semantic; implement via semantic parse → desugar → core AST.
- Add tests in tests/point-core.test.ts (and semantic/core-ir suites as appropriate) for every behavior change.
- Add or update an example in examples/ when the feature is user-visible.
- Update editor grammar/snippets if new keywords are introduced.
- Run verification commands before marking checkboxes complete.

Required references to read first:
- docs/full-language-plan.md (active phase only)
- docs/semantic-language-design.md
- docs/ai-reference-system.md
- packages/point/src/core/parser.ts
- tests/point-core.test.ts
```

### After coding

Run these every time:

```bash
bun test
bun run fmt-check
bun run check
bun run build
bun run ci
```

### Definition of done (every checkbox)

A checkbox is only checked when **all** of the following are true:

- [ ] Behavior implemented
- [ ] Tests added or updated and passing
- [ ] Example added or updated (if user-visible)
- [ ] Editor grammar/snippets updated (if new syntax)
- [ ] Docs updated (if behavior or commands changed)
- [ ] Verification commands pass
- [ ] No known regressions in existing examples

---

## Current Baseline (Already Shipped)

Use this as the floor. Do not break these while building forward.

- [x] Semantic blocks: `module`, `record`, `calculation`, `rule`, `label`
- [x] Lowering to typed core + TypeScript emission
- [x] Types: `Text`, `Int`, `Float`, `Bool`, `Void`, `List<T>`
- [x] Expressions: arithmetic, comparison, `and` / `or`, property access
- [x] Rule syntax: `starts at`, `add N when condition`, `return`
- [x] Label syntax: `when … return …`, `otherwise return …`
- [x] Calculation syntax: `output is expression`
- [x] Agent tooling: `point://core/` refs, index, explain, check-json, repair-plan
- [x] CLI: fmt, check, build-ts, build AST
- [x] VS Code extension: syntax, snippets, icons
- [x] CI pipeline

---

## Phase 0 — Foundation Lock

**Goal:** Trustworthy repo, consistent naming, semantic agent refs, formatter. Nothing new in the language surface except quality fixes.

### 0.1 Documentation and script alignment

- [x] Update `docs/production-readiness.md` to match root scripts (`fmt-check`, `check`, `build`, not `point:fmt-check:all`)
- [x] Update `docs/production-readiness.md` output path to `generated/`
- [x] Update `packages/point/README.md` scripts to match root `package.json`
- [x] Fix or remove references to nonexistent `point:vscode:setup`
- [x] Fix or implement VS Code README claim about `bun install` auto-setup (either add postinstall or fix README)
- [x] Add link to this plan from root `README.md`

**Verify:** Docs only reference commands that exist in root `package.json`.

### 0.2 Naming convention spec and fixes

- [x] Document naming rules in `docs/semantic-language-design.md`:
  - `calculation annual price` → `annualPrice`
  - `rule launch readiness` output `score` → `launchReadinessScore`
  - `label user status` → `userStatusLabel`
- [x] Fix awkward collisions (e.g. `cartTotalTotal` when rule name and output name overlap)
- [x] Add tests for naming edge cases (same word in rule name and output name, multi-word inputs)

**Verify:** `bun test` includes naming tests; no generated function names like `fooFoo` unless explicitly specified.

### 0.3 Semantic refs for agents

- [x] Add `point://semantic/<module>/<kind>.<name>/...` ref scheme alongside core refs
- [x] Index semantic symbols (records, fields, calculations, rules, labels) with semantic refs
- [x] Map diagnostic refs back to semantic source names in `check-json` output
- [x] Update `explain` to resolve semantic refs
- [x] Document semantic ref scheme in `docs/ai-reference-system.md`
- [x] Add tests for semantic ref indexing and explain

**Verify:**

```bash
bun run index examples/math.point
bun run explain examples/math.point point://semantic/Math/calculation.annual price
```

### 0.4 Semantic formatter

- [x] Implement canonical formatter for semantic `.point` source (indentation, block order, spacing)
- [x] Wire CLI `fmt` / `fmt-check` to format semantic source (not only preserve it)
- [x] Add fmt-check tests for semantic source
- [x] Ensure fmt is idempotent (fmt twice = same output)

**Verify:**

```bash
bun run fmt-check
bun run fmt
bun run fmt-check
```

### Phase 0 Exit Gate

Do not enter Phase 1 until all are true:

- [x] Every checkbox in Phase 0 is checked
- [x] `bun run ci` passes
- [x] `docs/production-readiness.md` matches repo reality
- [x] Semantic refs work in index and explain
- [x] Semantic formatter works on `examples/math.point`

---

## Phase 1 — Control Flow and Data

**Goal:** Write arbitrary pure algorithms in semantic syntax. No I/O yet.

### 1.1 Rule and calculation mutation syntax

- [x] Implement `add X to Y` in rules and calculations
- [x] Implement `subtract X from Y` in rules and calculations
- [x] Implement `set X to Y` in rules and calculations
- [x] Keep existing `add N when condition` working unchanged
- [x] Add tests for each form
- [x] Update editor grammar and snippets

**Verify:** Unit tests pass for all mutation forms.

### 1.2 Iteration

- [x] Implement `for each <name> in <expr>` in rules
- [x] Implement `for each <name> in <expr>` in calculations
- [x] Lower loops to core (for/while or recursive lowering — document choice)
- [x] Type-check loop variable against `List<T>` item type
- [x] Add structured diagnostics for iteration type errors
- [x] Update editor grammar and snippets

**Verify:** Loop tests pass; bad item types produce `check-json` diagnostics with repair hints.

### 1.3 List and record literals

- [x] Support list literals in semantic expressions: `[1, 2, 3]`
- [x] Support record literals where core already supports them, wired through semantic lowering
- [x] Type-check list literals against expected `List<T>`
- [x] Add tests and examples

**Verify:** Lists appear correctly in emitted TypeScript.

### 1.4 Optional / nullable types (pick one design)

- [x] Design doc decision recorded: `Maybe<T>` vs `T?` vs `T or Void`
- [x] Implement chosen design in parser, checker, and emitter
- [x] Add tests for nullable field access and diagnostics

**Verify:** Optional types round-trip to TypeScript (`T | null` or `T | undefined` — document mapping).

### 1.5 Multi-file modules

- [x] Design `use` syntax (e.g. `use Billing from "./billing.point"`)
- [x] Implement module graph resolution in CLI
- [x] Compile multi-file projects in dependency order
- [x] Export only public symbols (document rules)
- [x] Add tests with at least two linked files
- [x] Add `examples/multi-file/` example

**Verify:**

```bash
bun run check
bun run build
```

passes for multi-file example.

### 1.6 Cart total reference example (design doc proof)

- [x] Add `examples/cart-total.point` matching `docs/semantic-language-design.md`
- [x] Rule sums line totals using `for each` over `List<Cart Item>`
- [x] Emitted TypeScript produces correct aggregation logic
- [x] Example passes check, build, and test coverage

**Verify:** Cart example output is not a stub (no `return 0` without iteration).

### Phase 1 Exit Gate

- [x] Every checkbox in Phase 1 is checked
- [x] `bun run ci` passes
- [x] `examples/cart-total.point` works end-to-end
- [x] At least one multi-file example works
- [x] No grammar keyword is highlighted but unimplemented (for keywords shipped in this phase)

---

## Phase 2 — Effects and Interop

**Goal:** Talk to the outside world. Point programs can fetch, read, write, and fail gracefully.

### 2.1 Result and error types

- [x] Design `or` result syntax (e.g. `output User or Error`, `return Error "message"`)
- [x] Implement union / result types in AST and checker
- [x] Emit correct TypeScript union types
- [x] Diagnostics for unhandled error paths
- [x] Tests and examples

**Verify:** Action returning `User or Error` emits typed TS union.

### 2.2 External declarations (JS/npm interop)

- [x] Implement `external` block syntax
- [x] Lower to core `import` + typed function declarations
- [x] Support `from "npm-package"` and Node built-ins
- [x] Index external symbols in agent ref map
- [x] Document effect boundary: external calls are impure
- [x] Tests and examples

**Verify:** External fetch/console wrapper emits valid TS imports.

### 2.3 Action blocks

- [x] Implement `action` syntax for effectful operations
- [x] Actions may call externals and other actions
- [x] Actions must declare outputs including error types
- [x] Track effects in index (`touches: network | file | env | time | random`)
- [x] Emit async TypeScript where needed
- [x] Tests and examples (e.g. `action load user`)

**Verify:** Action emits async TS; index shows effect metadata.

### 2.4 Async and await

- [x] Implement `await` in action bodies
- [x] Type-check async output paths
- [x] Lower to async/await in TypeScript
- [x] Diagnostics for missing await on async actions
- [x] Tests

**Verify:** Async action round-trips and runs under Bun.

### 2.5 Policy blocks (guards)

- [x] Implement `policy` syntax (authorization / validation gates)
- [x] Lower to typed predicate functions
- [x] Document semantics (allow / deny / require)
- [x] Tests and examples

**Verify:** Policy emits pure boolean/check function.

### Phase 2 Exit Gate

- [x] Every checkbox in Phase 2 is checked
- [x] `bun run ci` passes
- [x] At least one example performs a real HTTP call or file read via externals under Bun
- [x] Agent index shows effect metadata for actions
- [x] No silent fallthrough on error types

---

## Phase 3 — Standard Library

**Goal:** Batteries included. Common tasks do not require raw externals every time.

### 3.1 Std module layout

- [x] Create `std/` directory for standard library `.point` modules
- [x] Define module naming: `std.text`, `std.http`, `std.json`, `std.time`, `std.fs`, `std.env`
- [x] Document std module design in `docs/semantic-language-design.md`

### 3.2 Core std modules (each is its own checklist)

**std.text**

- [x] String concat, length, contains, split, trim wrappers
- [x] Tests and example usage

**std.json**

- [x] Parse / stringify wrappers via external
- [x] Tests and example usage

**std.http**

- [x] GET/POST action wrappers
- [x] Tests and example usage (mock or httpbin)

**std.time**

- [x] Now, sleep, format wrappers
- [x] Tests

**std.fs**

- [x] Read file, write file wrappers with error results
- [x] Tests (temp files)

**std.env**

- [x] Get env var with default
- [x] Tests

### 3.3 Std import ergonomics

- [x] Support `use std.http` without relative paths
- [x] Resolve std modules from package root
- [x] Document std imports for agents

### Phase 3 Exit Gate

- [x] Every checkbox in Phase 3 is checked
- [x] All std modules pass check and build
- [x] At least one example program uses only std modules (no inline externals)
- [x] Std docs exist for agents (one doc listing modules and actions)

---

## Phase 4 — Runtime and Developer Tools

**Goal:** Point feels like a real language, not only a transpiler.

### 4.1 `point run`

- [x] Implement `point run <file>` CLI command
- [x] Transpile to temp TS and execute with Bun
- [x] Print runtime errors with semantic source mapping
- [x] Tests for run success and failure cases

**Verify:**

```bash
bun packages/point/src/cli.ts run examples/hello.point
```

### 4.2 `point test`

- [x] Define test syntax or test file convention (document choice)
- [x] Implement test runner CLI
- [x] Assert values, results, and errors
- [x] Integrate with CI

**Verify:** `bun run ci` runs Point tests.

### 4.3 `point repl`

- [x] Interactive read-eval-print loop for expressions and small blocks
- [x] Show type on eval
- [x] Exit cleanly

### 4.4 Semantic LSP (minimum viable)

- [x] Diagnostics on save (via check-json)
- [x] Go to definition on semantic symbols
- [x] Document symbols for index refs
- [x] Wire into VS Code extension

### 4.5 Source maps

- [x] Map runtime errors back to `.point` line numbers
- [x] Document limitation boundaries

### Phase 4 Exit Gate

- [x] Every checkbox in Phase 4 is checked
- [x] `point run`, `point test`, and LSP diagnostics work
- [x] A new user can run, test, and debug without manual TS steps

---

## Phase 5 — Application Layer

**Goal:** Build full apps in Point — UI, routes, CLIs.

### 5.1 View blocks (UI)

- [x] Design `view` syntax for declarative UI
- [x] First target: React (emit TSX)
- [x] Props via `input`, conditional rendering, lists
- [x] Example: counter or todo component

### 5.2 Route blocks (HTTP)

- [x] Design `route` syntax
- [x] First target: Hono or Express-style handler emission
- [x] Params, query, body typing
- [x] Example: CRUD API

### 5.3 Workflow blocks

- [x] Design `workflow` for multi-step orchestration
- [x] Compose actions with error handling
- [x] Example: signup flow

### 5.4 CLI commands

- [x] Design `command` syntax for CLI apps
- [x] Emit runnable CLI entrypoint
- [x] Example: `point run`-able CLI tool

### 5.5 Demo app

- [x] One complete app in `examples/app/` (pick: todo, billing, or dashboard)
- [x] Uses views/routes/actions/workflows/std
- [x] README with run instructions
- [x] CI builds and tests the app

### Phase 5 Exit Gate

- [x] Every checkbox in Phase 5 is checked
- [x] Demo app runs with `point run`
- [x] No hand-written TS required in demo app source (generated TS is fine)

---

## Phase 6 — Production Language and Ecosystem

**Goal:** External teams choose Point for new projects.

### 6.1 Package management

- [x] Define `point.json` project manifest
- [x] Dependency resolution between Point packages
- [x] Version pinning and lockfile

### 6.2 Publish pipeline

- [x] Publish `@hatchingpoint/point` to npm (`0.0.9` live; GitHub Actions on tag push)
- [x] Publish VS Code extension to marketplace (`hatchingpoint.point@0.0.9`; `VSCE_PAT` in Actions)
- [x] Versioning and changelog policy

### 6.3 Performance

- [x] Skip TS middleman option (direct JS emit) — benchmark first
- [x] Incremental compilation for large projects

### 6.4 Self-hosting milestone

- [x] Rewrite one compiler pass in Point (likely formatter or a lint pass)
- [x] Document self-hosting strategy

### 6.5 Additional targets (optional, after TS path is stable)

- [x] Python emit prototype **or** document why not
- [x] Native binary target research doc

### 6.6 Language specification

- [x] Write `docs/language-spec.md` (complete semantic grammar)
- [x] Conformance test suite (`tests/conformance/`)
- [x] Agent-oriented quick reference (`docs/agent-quick-reference.md`)

### 6.7 External adoption proof

- [x] One real feature shipped by someone not on the core team **(pilot: `examples/app/todo.point` — see adoption postmortem)**
- [x] Postmortem doc: what worked, what broke, what to fix

### Phase 6 Exit Gate

- [x] Every checkbox in Phase 6 is checked
- [x] npm package and extension published
- [x] Language spec and conformance suite exist
- [x] External adoption proof documented

---

## Phase 7 — Compiler Modernization

**Status:** **Complete** — see [phase7-ast-plan.md](./phase7-ast-plan.md) and [phase7-complete-review.md](./phase7-complete-review.md).

Semantic `.point` → semantic AST → in-memory desugar → core AST → check → emit. Core text parser lives in `packages/point/src/core/test-only/` only.

---

## Phase 8 — Product and Compiler (complete)

Execute [phase8-plan.md](./phase8-plan.md). Superseded by Phases 9–11 — see [phase12-plan.md](./phase12-plan.md) for active work.

---

## LLM Prompt Packs (Copy Per Phase)

### Phase 0 prompt

```text
Execute Phase 0 of docs/full-language-plan.md only.

Tasks this session:
1. Align docs and scripts with root package.json
2. Fix naming collisions in semantic lowering
3. Add point://semantic/ refs alongside core refs
4. Implement semantic formatter for .point source

Read first: docs/full-language-plan.md, docs/semantic-language-design.md,
docs/ai-reference-system.md, packages/point/src/core/parser.ts,
packages/point/src/core/context.ts, packages/point/src/core/format.ts,
tests/point-core.test.ts

Do not start Phase 1. Mark checkboxes in the plan as you complete them.
Run bun run ci before claiming the phase is done.
```

### Phase 1 prompt

```text
Execute Phase 1 of docs/full-language-plan.md only.

Tasks this session:
1. add/subtract/set mutation forms
2. for each ... in ... loops
3. list literals
4. optional types
5. multi-file use imports
6. examples/cart-total.point working end-to-end

Read first: docs/full-language-plan.md, docs/semantic-language-design.md,
packages/point/src/core/parser.ts, packages/point/src/core/check.ts,
packages/point/src/core/emit-typescript.ts, tests/point-core.test.ts

Do not start Phase 2. Every new keyword must be in grammar AND parser.
Run bun run ci before claiming the phase is done.
```

### Phase 2 prompt

```text
Execute Phase 2 of docs/full-language-plan.md only.

Tasks this session:
1. Result/error types (User or Error)
2. external blocks for npm/Node interop
3. action blocks with effect tracking
4. async/await lowering
5. policy blocks

Read first: docs/full-language-plan.md, docs/ai-reference-system.md,
packages/point/src/core/parser.ts, packages/point/src/core/context.ts,
packages/point/src/core/emit-typescript.ts

Effect metadata must appear in point index output.
Run bun run ci before claiming the phase is done.
```

### Phase 3–6 prompts

Use the same pattern: quote the phase section from this doc, list its checkboxes, list Required References from the Architecture table, and repeat the exit-gate rule.

---

## Quality Control Rules (Always)

1. **No skipped tests.** Every feature has unit tests.
2. **No keyword without implementation.** Grammar, parser, checker, and emitter must agree.
3. **No phase creep.** Finish the current phase exit gate before opening the next.
4. **No silent interop.** Externals and actions must be explicit.
5. **No doc drift.** If commands change, update docs in the same PR.
6. **CI is the judge.** `bun run ci` must pass before checkboxes get marked done.

---

## Progress Tracker

| Phase | Name | Status |
|-------|------|--------|
| — | Current baseline | Done |
| 0 | Foundation lock | Done |
| 1 | Control flow and data | Done |
| 2 | Effects and interop | Done |
| 3 | Standard library | Done |
| 4 | Runtime and dev tools | Done |
| 5 | Application layer | Done |
| 6 | Production and ecosystem | Done |
| 7 | Compiler modernization (AST pipeline) | Done |
| 8 | Product and compiler | Done — [phase8-plan.md](./phase8-plan.md) |
| 9 | Replace TS/Python authoring | Done — [phase9-replacement-plan.md](./phase9-replacement-plan.md) |
| 10 | Language depth & Python parity | Done — [phase10-plan.md](./phase10-plan.md) |
| 11 | Ecosystem & stdlib | Done — [phase11-plan.md](./phase11-plan.md) |
| 12 | Ecosystem scale | **Active** — [phase12-plan.md](./phase12-plan.md) |

**Active phase:** Phase 12 — `npm:` deps, std shims, starter template, Open VSX

**Last updated:** 2026-05-21
