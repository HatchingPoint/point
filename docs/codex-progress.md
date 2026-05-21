# Codex Progress Log

Codex appends a checkpoint here after each verified section. Do not delete entries.

---

## Session start

- **Goal:** Execute `docs/full-language-plan.md` Phases 0–6
- **Active phase:** Phase 0
- **Active section:** (not started)
- **Last verified command:** (none yet)

---

<!-- Codex: append new checkpoints below this line -->

## Checkpoint 0.1 - Documentation and script alignment
- Completed: Aligned production and package docs to root scripts, corrected generated output docs, removed nonexistent VS Code setup guidance, preserved root README plan links, and made VSIX packaging offline for CI.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 0.1 documentation and script alignment.
- Next: 0.2 Naming convention spec and fixes.
- Blocked: none

## Checkpoint 0.2 - Naming convention spec and fixes
- Completed: Documented semantic naming rules, prevented duplicate rule/calculation output suffixes such as cartTotalTotal, and added naming tests for repeated output words and multi-word inputs.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 0.2 naming convention spec and fixes.
- Next: 0.3 Semantic refs for agents.
- Blocked: none

## Checkpoint 0.3 - Semantic refs for agents
- Completed: Added point://semantic refs for records, fields, calculations, rules, labels, and inputs; explain resolves semantic refs; check-json and repair plans map semantic diagnostics back to public source refs.
- Verified: bun test / fmt-check / check / build / ci all pass; index and explain verified against examples/math.point semantic refs.
- Checkboxes marked: Phase 0.3 semantic refs for agents.
- Next: 0.4 Semantic formatter.
- Blocked: none

## Checkpoint 0.4 - Semantic formatter
- Completed: Added canonical semantic source formatting, wired CLI fmt/fmt-check to enforce semantic formatting, normalized examples/math.point, and added idempotence coverage.
- Verified: bun test / fmt-check / check / build / ci all pass; explicit fmt -> fmt-check gate passes.
- Checkboxes marked: Phase 0.4 semantic formatter.
- Next: Phase 0 Exit Gate.
- Blocked: none

## Checkpoint 0.Exit - Phase 0 Exit Gate
- Completed: Confirmed every Phase 0 section checkbox is marked, production docs match root scripts and generated output, semantic refs resolve through index/explain, and semantic formatter works on examples/math.point.
- Verified: bun test / fmt-check / check / build / ci all pass; Phase 0 exit gate checks pass.
- Checkboxes marked: Phase 0 Exit Gate and Progress Tracker Phase 0 Done.
- Next: Stop here; Phase 1 not started.
- Blocked: none

## Checkpoint 1.1 - Rule and calculation mutation syntax
- Completed: Implemented semantic `add X to Y`, `subtract X from Y`, and `set X to Y` lowering in rules and calculations; preserved `add N when condition`; added core `-=` parsing/checking/emission; updated editor grammar/snippets.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 1.1 rule and calculation mutation syntax.
- Next: 1.2 Iteration.
- Blocked: none

## Checkpoint 1.2 - Iteration
- Completed: Added typed core `for <item> in <list>` statements; lowered semantic `for each <name> in <expr>` in rules and calculations; emitted TypeScript `for ... of`; documented the lowering choice; added structured iteration diagnostics and editor snippets.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 1.2 iteration.
- Next: 1.3 List and record literals.
- Blocked: none

## Checkpoint 1.3 - List and record literals
- Completed: Wired semantic list literals through existing core list support; lowered semantic record literal field labels such as `unit price` to generated field identifiers; added tests and `examples/literals.point`.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 1.3 list and record literals.
- Next: 1.4 Optional / nullable types.
- Blocked: none

## Checkpoint 1.4 - Optional / nullable types
- Completed: Chose and documented `Maybe<T>` with `none` lowering to TypeScript `null`; implemented parser/checker/emitter support; added nullable field-access diagnostics, editor grammar/snippets, tests, and `examples/optional.point`.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 1.4 optional / nullable types.
- Next: 1.5 Multi-file modules.
- Blocked: none

## Checkpoint 1.5 - Multi-file modules
- Completed: Designed `use ModuleName from "./file.point"`; implemented CLI module graph resolution, dependency-order builds, dependency-aware checks, generated TS imports, documented public symbol rules, and added `examples/multi-file/` with linked tests.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 1.5 multi-file modules.
- Next: 1.6 Cart total reference example.
- Blocked: none

## Checkpoint 1.6 - Cart total reference example
- Completed: Added `examples/cart-total.point` with `Cart Item`, `line total`, and a `cart total` rule that iterates over `List<Cart Item>` and accumulates item price times quantity; added generated TypeScript coverage proving it is not a stub.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 1.6 cart total reference example.
- Next: Phase 1 Exit Gate.
- Blocked: none

## Checkpoint 1.Exit - Phase 1 Exit Gate
- Completed: Confirmed every Phase 1 checkbox is marked; `examples/cart-total.point` checks and builds end-to-end with looped aggregation; `examples/multi-file/` checks and builds through dependency graph resolution; editor keywords shipped in Phase 1 have parser/checker support.
- Verified: bun test / fmt-check / check / build / ci all pass; explicit cart-total and multi-file check/build commands pass.
- Checkboxes marked: Phase 1 Exit Gate and Progress Tracker Phase 1 Done.
- Next: Phase 2 Effects and interop.
- Blocked: none

## Checkpoint 2.1 - Result and error types
- Completed: Designed public `A or Error` result syntax; lowered to typed core `Or<A, Error>`; emitted TypeScript unions; added built-in `Error "message"` lowering and diagnostics when error values are returned where non-result types are expected; added tests and `examples/result.point`.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 2.1 result and error types.
- Next: 2.2 External declarations.
- Blocked: none

## Checkpoint 2.2 - External declarations
- Completed: Added semantic `external` blocks with typed function signatures and optional import aliases; lowered to core external declarations; emitted TypeScript imports for npm/Node built-ins; indexed core and semantic external refs; documented externals as impure boundaries; added tests and `examples/external.point`.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 2.2 external declarations.
- Next: 2.3 Action blocks.
- Blocked: none

## Checkpoint 2.3 - Action blocks
- Completed: Added semantic `action` blocks with typed inputs/outputs, external/action calls, explicit `touches` effect metadata, async TypeScript emission, index effect metadata, docs, tests, and `examples/action.point`.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 2.3 action blocks.
- Next: 2.4 Async and await.
- Blocked: none

## Checkpoint 2.4 - Async and await
- Completed: Added `await` expressions in action bodies, async output type-checking through awaited action calls, TypeScript async/await emission, missing-await diagnostics for action calls, editor snippets/grammar, tests, and `examples/async.point`.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 2.4 async and await.
- Next: 2.5 Policy blocks.
- Blocked: none

## Checkpoint 2.5 - Policy blocks
- Completed: Added semantic `policy` blocks with `allow`, `deny`, and `require`; lowered them to pure typed boolean predicates; documented semantics; updated snippets; added tests and `examples/policy.point`.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 2.5 policy blocks.
- Next: Phase 2 Exit Gate.
- Blocked: none

## Checkpoint 2.Exit - Phase 2 Exit Gate
- Completed: Confirmed every Phase 2 checkbox is marked; generated action code performs a real file read under Bun through `node:fs`; action refs expose `effects: ["file"]`; result/error checks report structured type diagnostics instead of silent fallthrough.
- Verified: bun test / fmt-check / check / build / ci all pass; explicit action build/run, action index, and result check-json commands pass.
- Checkboxes marked: Phase 2 Exit Gate and Progress Tracker Phase 2 Done.
- Next: Phase 3 Standard library.
- Blocked: none

## Checkpoint 3.1 - Std module layout
- Completed: Created `std/` with standard module naming docs and documented `std.text`, `std.http`, `std.json`, `std.time`, `std.fs`, and `std.env` layout/import rules in the semantic language design.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 3.1 std module layout.
- Next: 3.2 Core std modules.
- Blocked: none

## Checkpoint 3.2 - Core std modules
- Completed: Added `std.text`, `std.json`, `std.http`, `std.time`, `std.fs`, and `std.env` Point modules with typed external wrappers/actions; expanded project discovery to include `std/**/*.point`; added std module build/check coverage and `examples/std-usage.point`.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 3.2 core std modules.
- Next: 3.3 Std import ergonomics.
- Blocked: none

## Checkpoint 3.3 - Std import ergonomics
- Completed: Added `use std.<module>` resolution from the package root, documented std imports for agents, and verified std-only example imports without relative paths.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 3.3 std import ergonomics.
- Next: Phase 3 Exit Gate.
- Blocked: none

## Checkpoint 3.Exit - Phase 3 Exit Gate
- Completed: Confirmed every Phase 3 checkbox is marked; all std modules pass check/build; `examples/std-usage.point` uses only `use std.*` imports and no inline externals; `std/README.md` lists modules and actions for agents.
- Verified: bun test / fmt-check / check / build / ci all pass; explicit std check/build and std usage inspection pass.
- Checkboxes marked: Phase 3 Exit Gate and Progress Tracker Phase 3 Done.
- Next: Phase 4 Runtime and developer tools.
- Blocked: none

## Checkpoint 4.1 - point run
- Completed: Added `point run <file>` to check, transpile to a temp TypeScript module, execute a zero-argument entrypoint with Bun, print results, and report runtime failures against the semantic source file; added `examples/hello.point` and tests for entrypoint selection/failure.
- Verified: bun test / fmt-check / check / build / ci all pass; explicit `point run` success and missing-entrypoint failure verified.
- Checkboxes marked: Phase 4.1 point run.
- Next: 4.2 point test.
- Blocked: none

## Checkpoint 4.2 - point test
- Completed: Defined Point tests as zero-input Bool calculations/actions whose semantic name starts with `test`; implemented `point test` and `point test-all`; added value/error assertions through runner results; integrated `point:test` into CI; documented the convention and added `examples/point-tests.point`.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 4.2 point test.
- Next: 4.3 point repl.
- Blocked: none

## Checkpoint 4.3 - point repl
- Completed: Added `point repl` expression evaluation from stdin or inline input, prints inferred Point types, and exits on `.exit`, `exit`, or EOF; documented behavior and added tests.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 4.3 point repl.
- Next: 4.4 Semantic LSP.
- Blocked: none

## Checkpoint 4.4 - Semantic LSP
- Completed: Added VS Code activation for diagnostics on save via `point check-json`, semantic go-to-definition and document symbols via `point index`, README documentation, and packaging manifest wiring.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 4.4 semantic LSP.
- Next: 4.5 Source maps.
- Blocked: none

## Checkpoint 4.5 - Source maps
- Completed: Added declaration-level runtime source mapping for `point run` errors and documented current limitations around statement-level generated TypeScript source maps.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 4.5 source maps.
- Next: Phase 4 Exit Gate.
- Blocked: none

## Checkpoint 4.Exit - Phase 4 Exit Gate
- Completed: Confirmed every Phase 4 checkbox is marked; `point run`, `point test`, `point repl`, runtime source mapping, and VS Code diagnostics/symbol wiring are implemented; users can run/test/debug without manual TypeScript steps.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 4 Exit Gate and Progress Tracker Phase 4 Done.
- Next: Phase 5 Application layer.
- Blocked: none

## Checkpoint 5.1 - View blocks
- Completed: Added semantic `view` syntax with inputs as props, conditional `when ... render ...`, React-targeted JSX emission, view refs, editor grammar/snippets, docs, tests, and `examples/view.point`.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 5.1 view blocks.
- Next: 5.2 Route blocks.
- Blocked: none

## Checkpoint 5.2 - Route blocks
- Completed: Added semantic `route` syntax with method/path metadata, typed inputs/outputs, Hono-targeted handler emission, route refs, editor snippets, docs, tests, and `examples/route.point`.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 5.2 route blocks.
- Next: 5.3 Workflow blocks.
- Blocked: none

## Checkpoint 5.3 - Workflow blocks
- Completed: Added semantic `workflow` syntax with typed inputs/outputs, `step ... is ...` orchestration, async workflow emission, missing-await enforcement for workflow/action composition, docs, snippets, tests, and `examples/workflow.point`.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 5.3 workflow blocks.
- Next: 5.4 CLI commands.
- Blocked: none

## Checkpoint 5.4 - CLI commands
- Completed: Added semantic `command` syntax, async command emission, `point run` entrypoint support, docs, snippets, tests, and `examples/command.point`.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 5.4 CLI commands.
- Next: 5.5 Demo app.
- Blocked: none

## Checkpoint 5.5 - Demo app
- Completed: Added Point-only `examples/app/todo.point` with std import, record, view, action, workflow, route, and command; added README run/build instructions and test coverage proving check/build/run.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 5.5 demo app.
- Next: Phase 5 Exit Gate.
- Blocked: none

## Checkpoint 5.Exit - Phase 5 Exit Gate
- Completed: Confirmed every Phase 5 checkbox is marked; demo app runs with `point run`; demo source is Point-only with generated TypeScript as build output.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 5 Exit Gate and Progress Tracker Phase 5 Done.
- Next: Phase 6 Production and ecosystem.
- Blocked: none

## Checkpoint 6.1 - Package management
- Completed: Added `point.json`, `point.lock`, package-management docs, workspace std dependency pinning, and tests for manifest/lockfile shape.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 6.1 package management.
- Next: 6.2 Publish pipeline.
- Blocked: none

## Checkpoint 6.2 - Publish pipeline credentials gate
- Completed: Added `publish:release` pipeline scaffold, credential checks for `NPM_TOKEN` and `VSCE_PAT`, publishing docs, semver policy, changelog policy, and tests for the publish pipeline.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 6.2 versioning and changelog policy.
- Next: npm package publish and VS Code/Open VSX publish.
- Blocked: Missing publish credentials (`NPM_TOKEN`, `VSCE_PAT`); per goal contract, stop before publish when credentials are unavailable.

## Checkpoint 6.3 - Performance
- Completed: Added direct JavaScript emit (`build-js`, `build-js-all`), benchmark script, incremental `check-all` cache via `POINT_INCREMENTAL=1`, and `docs/performance.md`.
- Verified: bun test / fmt-check / check / build / ci all pass.
- Checkboxes marked: Phase 6.3 performance.
- Next: 6.4 Self-hosting milestone.
- Blocked: none

## Checkpoint 6.4 - Self-hosting milestone
- Completed: Added first self-hosted compiler pass `compiler/passes/naming-lint.point` and `docs/self-hosting.md`.
- Verified: bun test / fmt-check / check / build / ci all pass; naming lint pass runs via `point test`.
- Checkboxes marked: Phase 6.4 self-hosting milestone.
- Next: 6.5 Additional targets research.
- Blocked: none

## Checkpoint 6.5 - Additional targets research
- Completed: Documented Python emit deferral in `docs/python-emit-research.md` and native binary research in `docs/native-target-research.md`.
- Verified: docs present; bun run ci passes.
- Checkboxes marked: Phase 6.5 additional targets research.
- Next: 6.6 Language specification.
- Blocked: none

## Checkpoint 6.6 - Language specification
- Completed: Added `docs/language-spec.md`, `docs/agent-quick-reference.md`, and conformance suite `tests/conformance/conformance.test.ts`.
- Verified: bun test / fmt-check / check / build / ci all pass; conformance covers examples, std, and compiler fixtures.
- Checkboxes marked: Phase 6.6 language specification.
- Next: 6.7 External adoption proof.
- Blocked: none

## Checkpoint 6.7 - External adoption proof
- Completed: Added `docs/adoption-postmortem.md` documenting the todo app pilot, blockers, and external adopter checklist.
- Verified: bun run ci passes.
- Checkboxes marked: Phase 6.7 external adoption proof.
- Next: Phase 6 Exit Gate (publish still pending credentials).
- Blocked: none

## Checkpoint 6.Exit - Phase 6 Exit Gate (publish pending)
- Completed: Phases 6.3–6.7 complete; language spec and conformance suite exist; adoption postmortem documented; publish pipeline remains blocked without NPM/VSCE credentials by design.
- Verified: bun run ci passes.
- Checkboxes marked: Phase 6 Exit Gate except npm/marketplace publish.
- Next: Phase 7 AST modernization when ready.
- Blocked: npm/marketplace publish pending `NPM_TOKEN` and `VSCE_PAT`.

## Checkpoint 7.1 - Semantic AST model
- Completed: Added `packages/point/src/semantic/` (`ast.ts`, `expressions.ts`, `parse.ts`, `serialize.ts`, `index.ts`); documented semantic AST in `docs/language-spec.md` section 20; snapshot tests in `tests/semantic-ast.test.ts` for `examples/math.point` and `examples/cart-total.point`.
- Verified: semantic AST tests pass without core text lowering; `bun run ci` passes.
- Checkboxes marked: Phase 7.1 semantic AST model.
- Next: 7.2 Semantic parser (direct to AST, parallel path).
- Blocked: none

## Checkpoint 7.2 - Semantic parser
- Completed: Hardened `parseSemanticSource()` for all Phase 0–6 constructs (spaced callables, record/list literals, workflow step bindings, generic calls); added `collectSemanticCallables`, `parsePointSourceV2()`, `isPointSemanticAstEnabled()` (`POINT_SEMANTIC_AST=1`); coverage tests for all `examples/**/*.point`.
- Verified: `bun test tests/semantic-ast.test.ts` passes (24 tests); `bun run ci` passes.
- Checkboxes marked: Phase 7.2 semantic parser.
- Next: 7.3 AST desugar passes.
- Blocked: none

## Checkpoint 7.3 - AST desugar passes
- Completed: Added `semantic/desugar.ts`, `semantic/naming.ts`, `semantic/metadata.ts`, `core/serialize.ts`; `desugarSemanticProgram()` and `desugarSemanticImports()`; parity tests in `tests/semantic-desugar.test.ts` for all conformance fixtures; desugar rules documented in `docs/language-spec.md` section 22.
- Verified: desugared core AST matches legacy pipeline for all 26 fixtures; `bun run ci` passes.
- Checkboxes marked: Phase 7.3 AST desugar passes.
- Next: 7.4 Production cutover.
- Blocked: none

## Checkpoint 7.4 - Production cutover
- Completed: `parsePointSource()` now uses semantic parse → desugar; legacy string lowering gated behind `parsePointSourceLegacy()` / `POINT_LEGACY_LOWER=1`; `formatPointSource()` uses `formatSemanticProgram(parseSemanticSource())`; CLI check/fmt/build/index/explain/repair-plan on new pipeline.
- Verified: `bun run ci` passes (73 tests) with AST pipeline as default.
- Checkboxes marked: Phase 7.4 production cutover.
- Next: 7.5 Semantic diagnostics.
- Blocked: none

## Checkpoint 7.5 - Semantic diagnostics
- Completed: Expression spans on semantic parse; span propagation through desugar; `semantic/context.ts` with `createSemanticIndex()`, `explainSemanticRef()`, `mapPublicDiagnostics()`; `PointCoreProgram.semanticSource` attached in desugar; CLI `check-json`, `repair-plan`, `index`, and `explain` use semantic refs and spans for public `.point` files; tests in `tests/semantic-diagnostics.test.ts`.
- Verified: diagnostic spans point at semantic source lines; `bun run ci` passes.
- Checkboxes marked: Phase 7.5 semantic diagnostics.
- Next: 7.6 Retire core text parser.
- Blocked: none

## Checkpoint 7.6 - Retire core text parser
- Completed: Split production `parser.ts` from `core/test-only/` (`core-text-parser.ts`, `legacy-lowering.ts`, `format-core.ts`); CLI uses semantic fmt only; tests split into `tests/core-ir.test.ts` and semantic tests in `tests/point-core.test.ts`; documented core as AST IR only.
- Verified: no production path emits or re-parses core text; `bun run ci` passes.
- Checkboxes marked: Phase 7.6 retire core text parser.
- Next: 7.7 Emit backends.
- Blocked: none

## Checkpoint 7.7 - Emit backends on AST
- Completed: Verified TS/JS emit consume core AST only; `tests/semantic-emit.test.ts` asserts byte-identical emit vs legacy for all fixtures; `scripts/phase7-benchmark.ts` + `docs/phase7-benchmarks.md`; incremental check documented (`POINT_INCREMENTAL=1`).
- Verified: emit parity across 26 fixtures; AST parse+check ~34% faster than legacy lowering on reference benchmark; `bun run ci` passes.
- Checkboxes marked: Phase 7.7 emit backends; Phase 7 Exit Gate.
- Next: none (Phase 7 complete).
- Blocked: none

## Checkpoint 7.GOAL - Phase 7 GOAL COMPLETE
- Completed: Compiler modernization — semantic `.point` → semantic AST → in-memory desugar → core AST → check → emit. Core text parser retired to `core/test-only/`. Semantic diagnostics, indexing, and emit parity proven. Phases 7.1–7.7 and Exit Gate satisfied.
- Verified: `bun run ci` passes (conformance + semantic + core IR suites).
- Publish (Phase 6.2) remains deferred pending `NPM_TOKEN` / `VSCE_PAT`.
- Blocked: npm/marketplace publish only.

## Checkpoint Post-7 — Extension baseline + publish pipeline ready
- Completed: VS Code extension shells out to Point CLI for diagnostics (`check-json`), symbols (`index`), and go-to-definition; auto-detects monorepo `cli.ts` or `point` on PATH; settings `point.cliPath` and `point.runtime`; diagnostics on save and open. `scripts/publish.ts` loads `.env.local`, validates `NPM_TOKEN`/`VSCE_PAT` (rejects placeholder), runs CI → npm publish → VSIX → `vsce publish`. Updated `docs/publishing.md`, extension README, and `docs/codex-goal-publish.prompt.txt`.
- Verified: `bun run ci` passes (78 tests); VSIX packages as `point-0.0.5.vsix`.
- Next: create Azure DevOps publisher `hatchingpoint`, set real `VSCE_PAT`, then `bun run publish:release`.
- Blocked: marketplace publish pending real `VSCE_PAT` (user has placeholder).
