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

## Checkpoint 6.2.Publish — npm and Marketplace live
- Completed: `@hatchingpoint/point@0.0.9` on npm; `hatchingpoint.point@0.0.9` on VS Code Marketplace; GitHub Actions publish on tag push; VSCE_PAT auth fixed (no quotes in secret); idempotent marketplace publish for retries.
- Verified: `npm view @hatchingpoint/point version` → 0.0.9; local and CI marketplace publish; hatchingpoint.com/point docs live.
- Checkboxes marked: Phase 6.2 publish pipeline; Phase 6 Exit Gate complete.
- Next: Phase 8 — see docs/phase8-plan.md.
- Blocked: none

## Checkpoint Post-7.DocRefresh — Phase 7 + publish docs aligned
- Completed: Updated full-language-plan.md (Phase 7 architecture, publish complete, Phase 8 active), phase7-complete-review.md, adoption-postmortem.md, production-readiness.md, README roadmap, codex-goal-post-phase7.md, phase8-plan.md created.
- Verified: `bun run ci` passes (78 tests).
- Next: Phase 8.1 editor experience or 8.2 dogfood module.
- Blocked: none

## Checkpoint 8.0 - point lsp language server
- Completed: Added `point lsp` stdio LSP server (`packages/point/src/lsp/`) with diagnostics, document symbols, go-to-definition, hover, and format; wired CLI command; tests in `tests/point-lsp.test.ts`; editor setup docs in `docs/editor-setup.md`.
- Verified: `bun run ci` passes (84 tests).
- Next: manual Neovim/Zed verification; optional VS Code extension migration to LSP client.
- Blocked: none

## Checkpoint 8.Adoption - LSP v2, dogfood, external adopter, editor configs
- Completed: LSP completion + rename; hatchingpoint store-readiness dogfood module; starter-labs external adopter example; editors/neovim and editors/zed verified configs; phase8 8.0-8.3 checkboxes.
- Verified: `bun run ci` passes (91 tests).
- Next: docs site D1-D5 on LandingPage.
- Blocked: none

## Checkpoint D1 - Docs shell in LandingPage
- Completed: Added Point docs container UI in LandingPage with top bar, sticky sidebar, prose column, desktop TOC, mobile menu, copyable code blocks, prev/next footer, and GitHub edit links. Added IA routes for guide, concepts, language, AI, toolchain, stdlib, reference, ecosystem, examples, FAQ, and changelog. Ported existing `/point` and `/point/guide` material into docs home, introduction, quick start, and language overview pages; remaining D1 routes render "Coming soon" stubs.
- Verified: `npm run build` passes in `C:\Users\mcarr\Documents\clones\LandingPage`.
- LandingPage base commit: `31ec765` (local changes not pushed).
- Next: D2 content in `docs/site/` and LandingPage markdown sync/import.
- Blocked: none

## Checkpoint 9.Plan - Phase 9 replace TS/Python agent pack
- Completed: Added docs/phase9-replacement-plan.md, docs/codex-goal-replacement.md, docs/codex-goal-replacement.prompt.txt, docs/vision.md. Parallel goals R1-R8 for JS-default run, Python emit, docs content, check-docs, npm-from-point, view spike, dogfood service.
- Next: Launch Codex agents R1+R2+R3+R4 in parallel.
- Blocked: none

## Checkpoint 9.R4 - point check-docs command
- Completed: Added `point check-docs` CLI command (`packages/point/src/core/check-docs.ts`) that scans `docs/site/**/*.md` for fenced ` ```point ` blocks and resolvable `.point` file references, runs parse+check on each snippet/file, reports structured failures (including parse errors). Wired `check-docs` script into `package.json` and `bun run ci`. Added `tests/check-docs.test.ts` (8 tests). Fixed incomplete doc snippets in `docs/site/language/rules.md`, `docs/site/language/labels.md`, and `docs/site/concepts/how-point-is-novel.md` so check-docs passes on current site content.
- Verified: `bun run ci` passes (106 tests); `point check-docs` reports 21 snippet(s), 13 file reference(s) clean.
- Next: R3 remaining docs pages; R5 npm-from-point after R1.
- Blocked: none

## Checkpoint R3 - Docs site content (D2-D4 + replaces TS/Python)
- Completed: Filled `docs/site/` with philosophy/AI pages (extended), language guide (all blocks + overview), reference (cli, grammar, diagnostics), toolchain/lsp.md, and new `concepts/replaces-typescript-and-python.md`. Linked from introduction.md. All fenced `point` snippets and file refs pass `point check-docs`.
- Verified: `bun run ci` passes (105 tests); `point check-docs` — 21 snippets, 13 file refs.
- LandingPage: `npm run sync:point-docs` updates `src/content/pointDocs.generated.json` from `../point-1/docs/site` (not committed here).
- Next: Run `npm run build` in LandingPage after sync commit; D5 polish (FAQ, gallery).
- Blocked: none

## Checkpoint 9.R2 - Python emit for pure logic
- Completed: Added `packages/point/src/core/emit-python.ts`, `point build-py` CLI command, `generated/math.py` from `examples/math.point`, parity tests in `tests/python-emit.test.ts`, updated `docs/python-emit-research.md`.
- Verified: `point build-py examples/math.point generated/math.py` succeeds; Python emit tests pass (103/105 total — 2 failures are `check-docs` from parallel R4 docs/site snippets, unrelated to R2).
- Next: Python emit for actions/async; optional `build-py-all` for pure-logic fixtures; R4 must fix docs/site fenced snippets for full `bun run ci`.
- Blocked: full `bun run ci` until R4 docs/site snippets parse (check-docs).

## Checkpoint 9.R1 - JS-default run and build
- Completed: `point build` and `point build-all` now emit JavaScript by default; `point build-ts` / `build-ts-all` remain opt-in; `point build-ast` / `build-ast-all` preserve AST JSON for debugging; `point run` and `point test` use temp `.js` via `emitPointCoreJavaScript`. Updated root/package README, quick-start, production-readiness, package.json scripts (`build`, `build:ts`, `build:ast`), tests, and fixed docs/site snippets so `check-docs` passes in CI.
- Verified: `point run examples/hello.point` prints "Hello from Point" without writing `.ts` to the project; `bun run ci` passes (105 tests).
- Next: R5 npm package from `.point` only.
- Blocked: none

## Checkpoint 9.R5 - npm package from Point source only
- Completed: Added `packages/point-logic/` with `src/store-readiness.point`, `point.json`, `package.json` (`@hatchingpoint/point-logic`), README (consumer install + usage), and `build` script emitting JS to `dist/` via `point build`. Wired `build:logic` into root `package.json` and `bun run ci`. Added `tests/point-logic-package.test.ts` (src is `.point` only, build from Point, runtime exports, `npm pack` includes `dist/` not `src/`).
- Verified: `bun run --cwd packages/point-logic build` writes `dist/store-readiness.js`; `listingScore` / `listingStatusLabel` import smoke test passes; `bun run ci` passes (112 tests).
- Next: R7 dogfood HTTP service; optional npm publish of `@hatchingpoint/point-logic`.
- Blocked: none

## Checkpoint 9.R6 - Readiness view widget spike
- Completed: Added `examples/adopters/hatchingpoint/readiness-widget.point` (listing score + `readiness widget` view); extended TypeScript view emit so non-literal `render` expressions become JSX text children (`<>{expr}</>`); documented Next.js embed in `docs/site/language/applications.md` and hatchingpoint README; tests for widget emit and conformance fixture discovery.
- Verified: `point build-ts examples/adopters/hatchingpoint/readiness-widget.point` → `readinessWidgetView` returning `JSX.Element`; `bun run ci` passes (112 tests).
- Next: R7 dogfood HTTP service; richer view layout (Phase 10).
- Blocked: none

## Checkpoint 9.R8 - Authoring vs runtime vision docs
- Completed: Added `docs/site/concepts/authoring-vs-runtime.md` (canonical public page for authoring vs emit targets). Updated `docs/vision.md` with completed R1/R2 milestones and link to site page. Consolidated duplicate content in `replaces-typescript-and-python.md` (scope table stays; conceptual framing links to authoring-vs-runtime). Linked from `introduction.md`. Marked Phase 9 exit gate checkboxes for R1–R4 and CI.
- Verified: `bun run ci` passes (112 tests); `point check-docs` — 21 snippets, 14 file refs.
- Next: R5 npm package polish; R6–R7 dogfood/view tracks.
- Blocked: none

## Checkpoint 9.R7 - Dogfood store-readiness HTTP service
- Completed: Expanded `examples/adopters/hatchingpoint/store-readiness.point` into a runnable Bun HTTP service with demo app data, JSON routes (`/health`, `/apps/:id/listing-status`) using **listing score** and **listing status** logic, `serve store readiness` command, and JS emit bootstrap (`createPointRouteFetchHandler`, `startRoutesServer`) for modules with routes + serve command. Fixed semantic string literal parsing for escaped quotes. Added `tests/store-readiness-service.test.ts` integration tests and curl examples in hatchingpoint README.
- Verified: `bun run ci` passes (117 tests); integration test hits live routes and asserts JSON scores/statuses.
- Next: Phase 10 richer UI; optional publish `@hatchingpoint/point-logic` with HTTP layer separate from pure logic package.
- Blocked: none

## Checkpoint D2 - Point docs content sync to LandingPage
- Completed: Added/kept public docs source under `docs/site/` and wired LandingPage to sync it from `../point-1/docs/site` into `src/content/pointDocs.generated.json` using Bun. LandingPage docs routes now prefer synced markdown content and fall back to D1 stubs. Sidebar/routing includes synced concept pages such as authoring-vs-runtime and replaces-typescript-and-python.
- Verified: `bun run check-docs` passes in point repo (21 snippets, 14 file refs); `bun run sync:point-docs` passes in LandingPage and synced 25 pages.
- LandingPage build: skipped by user request.
- Next: D5 polish or visual QA on the synced docs pages.
- Blocked: none

## Checkpoint D2.Polish - Docs coverage and shell UX
- Completed: Added missing public docs pages for semantic-vs-core, pipeline, check-json, formatting, build/emit, run/test/repl, VS Code, stdlib overview, examples, npm, Marketplace, integrations, FAQ, and changelog. Synced LandingPage docs content now covers 41 pages. Updated the LandingPage docs shell so synced pages no longer show "Soon" badges, removed desktop inner scroll containers, simplified sticky behavior, and reduced card-like visual treatment in navigation/footer.
- Verified: `bun run check-docs` passes in point repo (28 snippets, 24 file refs); `bun run sync:point-docs` passes in LandingPage and synced 41 pages.
- LandingPage build: not run per user preference.
- Next: visual QA in browser and deeper content editing for clarity/tone.
- Blocked: none

## Checkpoint 10.P10-4 - build-py-all command
- Completed: Added `point build-py-all` CLI mirroring `build-all` for pure-logic and action fixtures; `isPureLogicProgram` skips view/route/workflow/command files. Wired `build:py` script into root `package.json` and CI. Tests in `tests/python-emit.test.ts`. Updated `docs/python-emit-research.md` and `docs/site/reference/cli.md`.
- Verified: `point build-py-all` writes 22 Python files (7 skipped); `bun run ci` passes (122 tests).
- Next: Phase 10 remaining tracks (P10-1 page/layout, P10-5 point-logic publish, P10-6 stdlib bridge doc).
- Blocked: none

## Checkpoint 10.P10-6 - Stdlib bridge and npm ecosystem docs
- Completed: Added `docs/site/stdlib/bridge.md` (stdlib bridge, `external` blocks, `@hatchingpoint/point/std/*`, Python interop limits) and `docs/site/ecosystem/npm-packages.md` (`@hatchingpoint/point`, `@hatchingpoint/point-logic`, publishing pattern). All fenced snippets and file refs pass `point check-docs`.
- Verified: `bun run ci` passes (122 tests); `point check-docs` — 26 snippets, 16 file refs.
- Next: LandingPage sync for new stdlib/ecosystem routes; Phase 10 remaining tracks.
- Blocked: none

## Checkpoint 10.P10-1 - page/layout spike
- Completed: Added semantic `page` block with `title`, optional `description`, and `main render` slots; TypeScript emit produces Next.js-embeddable page shell (`<main>`, `<header>`, `<section>`). Added `examples/adopters/hatchingpoint/readiness-page.point` (readiness logic + page wrapping widget view). Tests in `tests/point-core.test.ts` and conformance fixture discovery. Documented in `docs/site/language/applications.md`.
- Verified: `point build-ts examples/adopters/hatchingpoint/readiness-page.point` → `readinessPage` returning `JSX.Element` with page shell; `bun run ci` passes (124 tests).
- Next: P10-2 richer view props/state; LandingPage embed readiness page.
- Blocked: none

## Checkpoint 10.P10-3 - Python action emit
- Completed: Extended `emit-python.ts` for `action` blocks (`async def`, `await`); `node:fs` readFileSync maps to `pathlib.Path.read_text()` shim. Target `examples/action.point` → `generated/action.py`. Smoke test reads fixture via `asyncio.run(loadConfigContents(...))`. Documented limits in `docs/python-emit-research.md`. Tests in `tests/python-emit.test.ts`.
- Verified: `point build-py examples/action.point generated/action.py`; Python smoke test returns file contents; `bun run ci` passes (124 tests).
- Next: Phase 10 remaining tracks (P10-2, P10-5, P10-7).
- Blocked: none

## Checkpoint 11.P10-5 - point-logic CI publish
- Completed: Extended `scripts/publish-lib.ts` with configurable package dir and idempotent skip for already-published versions. Added `scripts/publish-logic.ts` and root `publish:logic` script. Updated `scripts/publish-npm.ts` and `scripts/publish.ts` to publish `@hatchingpoint/point-logic` alongside `@hatchingpoint/point`. GitHub Actions publish workflow logs point-logic version on tag push. Bumped `packages/point-logic` to 0.0.2. Documented independent semver and publish commands in `docs/publishing.md`. Extended publish pipeline tests in `tests/point-core.test.ts`.
- Verified: `bun run ci` passes (124 tests); existing `tests/point-logic-package.test.ts` proves `npm pack` includes `dist/` and excludes `src/`.
- Next: P10-2 richer view props; P11-1 point add; P11-2 std json/http shims.
- Blocked: none

## Checkpoint 11.P11-2 - std json/http runtime shims
- Completed: Added `packages/point/src/std/json.ts` (`jsonParse`, `jsonStringify` via JSON API) and `packages/point/src/std/http.ts` (`httpGet`, `httpPost` via fetch). Exported `@hatchingpoint/point/std/json` and `std/http` from `packages/point/package.json`. Root workspace devDependency enables runtime import tests. Added `tests/std-runtime.test.ts`.
- Verified: `std/json.point`, `std/http.point`, and `examples/std-usage.point` check and build; `bun run ci` passes (133 tests).
- Next: P11-1 point add; remaining std shims (text, time, fs, env).
- Blocked: none

## Checkpoint 11.P10-2 - controlled view props and callbacks
- Completed: Added semantic `Handler T` callback input type, `bind checkbox "Label" to record.field`, and `on change call` view statements. TypeScript emit produces controlled React checkboxes and `(value: T) => void` callback props; conditional view renders fold into a single JSX fragment. Updated `readiness-widget.point` and `readiness-page.point` with interactive listing checkboxes and `onSignalsChange` wiring. Tests in `tests/point-core.test.ts`; legacy parity tests skip controlled-view fixtures. Documented in `docs/site/language/applications.md`.
- Verified: `point build-ts examples/adopters/hatchingpoint/readiness-widget.point` → `readinessWidgetView(signals, onSignalsChange)` with checkbox JSX; `bun run ci` passes (130 tests).
- Next: P11-1 point add; P11-2 std json/http shims.
- Blocked: none

## Checkpoint 11.P11-1 - point add and lockfile resolution
- Completed: Implemented `point add <name> <spec>` CLI updating `point.json` and `point.lock`. Added `packages/point/src/core/packages.ts` for spec parsing, workspace/file resolution, and lock regeneration; `npm:` returns a clear unsupported error. Wired `point.lock` into project-wide check/build module graph via `modulePathFromLock`. Tests in `tests/point-add.test.ts`. Documented in `docs/package-management.md` and `docs/site/reference/cli.md`.
- Verified: `point add std workspace:std` updates manifest and lock; `bun run ci` passes (133 tests).
- Next: P11-2 std json/http shims (if not already landed); Phase 11 exit gate.
- Blocked: none

## Checkpoint 10-11.Close - Phases 10 and 11 complete (v0.0.13)
- Completed: Phase 10 exit gates (page block, Python action emit, build-py-all, point-logic publish, bridge docs). Phase 11 exit gates (point add, std json/http shims, controlled views, CI publish for point-logic). Release v0.0.13.
- Verified: `bun run ci` passes (133 tests).
- Next: Phase 12 — npm: registry resolution, remaining std shims, external starter template, Open VSX.
- Blocked: none

## Checkpoint Docs.Truth - Public and internal docs aligned with v0.0.13
- Completed: Updated vision.md, replaces-typescript-and-python, authoring-vs-runtime, npm-packages, stdlib bridge, introduction, site changelog. Marked phase8-plan, full-language-plan, codex-goal-post-phase7 as historical; active phase is 12.
- Verified: point check-docs and bun run ci.
- Next: Phase 12 Wave 1.
- Blocked: none

## Checkpoint 12.P12-3 - Standalone runtime research and run bridge spike
- Completed: Updated `docs/native-target-research.md` with Phase 12 decision, timeline, and honest limits (Bun/Node host, no owned VM). Added `packages/point/src/core/run-bridge.ts` with in-memory `Function()` execution for pure logic; `point run --bundle` / `--no-bundle` flags; auto-bundle when eligible. Added `examples/pure/math-only.point` and `tests/run-bridge.test.ts`. Updated `docs/site/toolchain/run-test-repl.md`, `docs/site/reference/cli.md`, and phase12-plan checkbox.
- Verified: `point run examples/pure/math-only.point` prints `120` without project emit files; `bun run ci` passes (148 tests).
- Next: P12-1 npm deps, P12-2 std shims, P12-4 point-add docs.
- Blocked: none

## Checkpoint 12.P12-4 - point add ecosystem docs
- Completed: Added `docs/site/ecosystem/point-add.md` covering `workspace:`, `file:`, and pending `npm:` specs, manifest/lockfile shape, and check/build resolution. Updated `docs/site/ecosystem/npm-packages.md` with links to the new page.
- Verified: `point check-docs` (28 snippets, 24 file refs); `bun run ci` passes (137 tests).
- Next: P12-1 npm resolution (when merged, refresh point-add npm section); P12-2 std shims; P12-3 runtime spike.
- Blocked: none (skipped `docs/phase12-plan.md` checkbox edits — parallel agent had local changes).

## Checkpoint 12.P12-1 - npm dependency resolution in point add
- Completed: Implemented `npm:` dependency resolution in `point add`. `packages/point/src/core/packages.ts` runs `npm install` (or reuses `node_modules/`), locates `point.json` or `src/*.point`, pins path under `node_modules/` in `point.lock`, supports optional `@version` suffix. `modulePathFromLock` resolves `src/` module layouts and project-root lock paths for check/build. Added `@hatchingpoint/point-logic` workspace devDependency. Tests in `tests/point-add.test.ts`. Updated `docs/package-management.md`, `docs/site/ecosystem/npm-packages.md`, `docs/site/reference/cli.md`, and phase12-plan npm checkbox.
- Verified: `point add logic npm:@hatchingpoint/point-logic` updates manifest and lock; `use logic.store-readiness` resolves via lock; `bun run ci` passes (143 tests).
- Next: P12-2 std fs/env/time/text shims.
- Blocked: none

## Checkpoint 12.P12-7 - Live readiness demo on LandingPage
- Completed: Added interactive App Store listing readiness demo to LandingPage `/point/examples` — `ReadinessDemo` client component with static store-readiness scoring logic and checklist checkboxes mirroring `readiness-widget.point`. Updated `docs/site/examples.md` with link to live demo at hatchingpoint.com/point/examples#live-demo. Marked phase12-plan live demo checkbox.
- Verified: Component uses same score thresholds (20 pts/item, 90/60 status bands) as `examples/adopters/hatchingpoint/readiness-widget.point`; no npm run build required for local dev.
- Next: P12-8 point-logic npm tarball includes `.point` source.
- Blocked: none

## Checkpoint 12.P12-8 - point-logic npm includes Point source
- Completed: Updated `packages/point-logic/package.json` `files` to ship `point.json`, `src/*.point`, and `dist/`; bumped to `@hatchingpoint/point-logic@0.0.3`. Extended `tests/point-logic-package.test.ts` npm pack assertions and `tests/point-add.test.ts` version pin. Documented published tarball layout in `docs/site/ecosystem/npm-packages.md`.
- Verified: `npm pack` lists `point.json` and `src/store-readiness.point`; `bun run ci` passes (150 tests).
- Next: Phase 12 Wave 2 remaining gates (Open VSX, external starter publish path).
- Blocked: none

## Checkpoint 12.P12-5 - External starter template
- Completed: Added `examples/starter-template/` with `point.json`, `src/app.point` (hello command, annual price calculation, pricing tier rule, health route), and README with install/check/build/run steps. Extended `tests/point-core.test.ts` and `tests/conformance/conformance.test.ts`. Marked phase12-plan external starter checkbox.
- Verified: `point check/build/run examples/starter-template/src/app.point`; `bun run ci` passes.
- Next: P12-6 Open VSX publish; P12-7 live readiness demo; P12-8 point-logic npm tarball.
- Blocked: none

## Checkpoint 12.Close - Phase 12 complete (v0.0.15)
- Completed: All Wave 1 and Wave 2 exit gates. Release v0.0.15 ships starter template, Open VSX pipeline, live readiness demo, point-logic@0.0.3 with Point source.
- Verified: `bun run ci` passes (150 tests).
- Next: Phase 13 — registry service, Python route emit.
- Blocked: none

## Checkpoint Phase 14 P14-4
- Completed: Added statement-level source maps for `point run` by preserving semantic spans through desugar (action/command returns), tagging emitted JavaScript with `// @point <line>`, resolving runtime stack frames in `source-map.ts`, and formatting errors against expression lines inside block bodies. Added source map coverage in `tests/run-bridge.test.ts`, updated `tests/point-core.test.ts`, and documented limits in `docs/site/toolchain/run.md`.
- Verified: `point run --no-bundle` on deliberate `assert.fail()` reports the `return fail()` line (not the action header); `bun run ci` passes.
- Checkboxes marked: Phase 14 P14-4 statement-level source maps.
- Next: Phase 14 remaining goals (P14-5+).
- Blocked: none

## Checkpoint Phase 14 P14-1
- Completed: Added `std/path.point` with join, basename, dirname, extname, resolve, and is-absolute externals; runtime shim `packages/point/src/std/path.ts` (node:path); export `@hatchingpoint/point/std/path`; general example `examples/tools/path-demo.point`; std runtime tests; updated `docs/site/stdlib/overview.md`.
- Verified: `point check std/path.point` passes; Bun imports `@hatchingpoint/point/std/path`; `bun run ci` passes (152 tests).
- Checkboxes marked: Phase 14 P14-1 std.path module.
- Next: P14-2 route middleware or P14-5 std.process.
- Blocked: none

## Checkpoint Phase 14 P14-2 — route middleware and typed HTTP inputs
- Completed: Chose reusable `middleware` blocks plus route-level ordered `before` chains. Reserved `query`, `body`, and `headers` route inputs (record types only). Added `return json` with optional `status` and `headers`. Implemented parse, desugar, checker (`invalid-route-input`, unknown middleware), shared `emit-routes.ts` runtime, and Bun fetch handler stack in JS/TS emit. Example `examples/api/middleware-demo.point`, integration tests in `tests/middleware-routes.test.ts`, docs in `docs/site/language/routes.md` and `docs/semantic-language-design.md`, VS Code grammar/snippets for `middleware`, `before`, `json`, `status`, `headers`, `none`.
- Verified: `bun run ci` passes; middleware tests cover auth 401, typed query GET, typed body POST, middleware order emit, and type errors.
- Next: P14-5 std.process or remaining Phase 14 goals.
- Blocked: none

## Checkpoint Phase 14 P14-3 — variant types
- Completed: Chose `variant` blocks (not `enum`) for tagged unions with optional per-case payloads and a `kind` discriminator in TypeScript emit. Implemented parse, semantic AST, desugar, checker narrowing (`variant-field-access` diagnostic), and TS/JS emit for discriminated unions. Added `on Case return` / `on Case with field return` label dispatch. Example `examples/variants/order-status.point`, VS Code grammar/snippets, tests in `tests/point-core.test.ts`, conformance fixture discovery. Documented in `docs/language-spec.md` and `docs/semantic-language-design.md`. Fixed `check-docs` to resolve `use` imports when checking referenced `.point` files.
- Verified: `bun run ci` passes; variant tests assert `export type OrderStatus = ...` and `if (status.kind == "Shipped")` narrowing emit.
- Next: P14-4 statement-level source maps.
- Blocked: none

## Checkpoint Phase 14 P14-5 — std.process
- Completed: Added `std/process.point` with `Process Result` record, `spawn raw` external, `spawn command` action (`touches process`), and stdout/exit-code calculations; runtime shim `packages/point/src/std/process.ts` using `Bun.spawn` with env entries and stdout/stderr capture; export `@hatchingpoint/point/std/process`; general example `examples/tools/process-runner.point`; std runtime tests with echo subprocess and child env; updated `docs/site/stdlib/overview.md` and `docs/site/language/effects.md` (`process` effect).
- Verified: `point check std/process.point` passes; Bun imports `@hatchingpoint/point/std/process`; `bun test` passes.
- Checkboxes marked: Phase 14 P14-5 std.process module.
- Next: remaining Phase 14 goals or Phase 15.
- Blocked: none

## Checkpoint Phase 14 P14-6 — std.crypto
- Completed: Added `std/crypto.point` with SHA-256, HMAC-SHA256, JWT sign/verify, and `check jwt valid` externals; runtime shim `packages/point/src/std/crypto.ts` (sync HS256 via `node:crypto`, Bearer normalization, null-safe verify); export `@hatchingpoint/point/std/crypto` with alias exports (`jwtSign`, `checkJwtValid`, etc.); general example `examples/tools/jwt-demo.point`; JWT gate in `examples/api/middleware-demo.point` via `checkJwtValid` external to std shim; secret-handling notes in `docs/site/stdlib/overview.md` and `std/README.md` (use `std.env`, never log keys); known-vector tests in `tests/std-runtime.test.ts`; middleware integration tests for invalid/missing JWT and signed token acceptance in `tests/middleware-routes.test.ts`.
- Verified: `point check std/crypto.point` passes; `bun test` passes (179 tests).
- Checkboxes marked: Phase 14 P14-6 std.crypto module.
- Next: Phase 14 exit gate or Phase 15.
- Blocked: none

## Checkpoint Phase 14 P14-7 — std.yaml and std.stream
- Completed: Added `std/yaml.point` (parse/stringify) and `std/stream.point` (read/write text and lines, join lines); runtime shims `packages/point/src/std/yaml.ts` (npm `yaml` package) and `packages/point/src/std/stream.ts` (ReadableStream/WritableStream and Text); exports `@hatchingpoint/point/std/yaml` and `@hatchingpoint/point/std/stream`; general example `examples/tools/yaml-config.point`; std runtime tests for YAML round-trip, invalid YAML errors, stream line I/O, and WritableStream writes; updated `docs/site/stdlib/overview.md`.
- Verified: `point check std/yaml.point` and `point check std/stream.point` pass; `bun test tests/std-runtime.test.ts` passes (16 tests including yaml/stream).
- Checkboxes marked: Phase 14 P14-7 std.yaml and std.stream modules.
- Next: Phase 14 exit gate or Phase 15.
- Blocked: none

## Checkpoint Phase 15 P15-4 — Styling bridge
- Completed: Chose `render class "tailwind classes" expression` and `when condition render class "..." expression` on view nodes; optional `main render class "..."` merges with `point-page-main` shell. Parse, semantic AST, desugar (`className` on return IR), TypeScript emit (`<div className="...">`), formatter, VS Code grammar/snippet updates. General example `examples/view.point`; docs in `docs/site/language/applications.md`. Tests in `tests/point-core.test.ts`; legacy parity enrichment for view class metadata.
- Verified: `bun test` — 189 pass, 2 fail (unrelated Wave 1 P15-1 layout / P15-2 navigation tests in flight); all P15-4 class emit tests pass.
- Syntax sample emit: `counterView` returns `<div className="text-lg font-semibold text-green-700">` / `<div className="text-muted">` for conditional branches.
- Checkboxes marked: Phase 15 P15-4 styling bridge (except optional `theme` record — deferred).
- Next: P15-1 layout / P15-2 navigation completion; P15-3 data loading.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 15 P15-1 — Layout blocks
- Completed: Chose `layout <name>` with `slot <name> render <expression>` (header, sidebar, main, footer; sidebar+main required) and `page <name>` with optional `layout <name>`. Parse (`collectPageBody` so inner layout lines stay in page bodies), desugar (`layoutSpec` + `pageLayout.layoutFunction`), checker (`unknown-layout`, `missing-layout-slot`, `invalid-layout-slot`, `duplicate-layout-slot`), TypeScript emit (`AppShellLayoutSlots` type + slot prop composition), semantic index refs (`layout.*`, `layout.*.slot.*`), formatter, VS Code snippets, legacy parity enrichment. General example `examples/app/dashboard/dashboard.point` — sidebar+main shell with settings page (coexists with Wave 1 navigation). Tests in `tests/point-core.test.ts`.
- Verified: `bun test` — 191 pass; `bun run ci` passes.
- Syntax: `layout app shell` / `slot sidebar render dashboard nav()` / `page settings page` + `layout app shell`.
- Checkboxes marked: Phase 15 P15-1 layout blocks.
- Next: P15-3 data loading; P15-5 rich views.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 15 P15-2 — Client navigation
- Completed: Added `navigation` registry block mapping `path "/..." page ...` to page declarations with optional `bootstrap router`. View link syntax: `link "Label" to "/path"`, `navigate to "/path"`, and `render link "Label" to "/path"`. Path params (`/items/:id`) checked against page inputs (`missing-nav-param`, `invalid-nav-param-type`, `unknown-nav-page`). Emit React Router 7 config (`createBrowserRouter`, route wrappers with `useParams`, `RouterProvider` bootstrap, `pointNavigationLink` helper). Semantic refs + `check-json` diagnostics with repair hints; `point index` / `point explain` coverage. General example `examples/app/dashboard/dashboard.point` (settings, items list, item detail with layout shell). Tests in `tests/client-navigation.test.ts`. VS Code snippet for navigation.
- Verified: `bun test` — 191 pass, 0 fail.
- Syntax sample:
  ```point
  navigation dashboard app
    path "/settings" page settings page
    path "/items/:id" page item detail page
    bootstrap router

  view sidebar nav
    link "Settings" to "/settings"
  ```
- Checkboxes marked: Phase 15 P15-2 client navigation / route registry.
- Next: P15-3 data loading; complete dashboard with live list fetch.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 15 P15-3 — Data loading pattern
- Completed: Added `load data from action <name>` and `on mount call <name>` on views/pages; semantic `when loading render`, `when error render`, and `when empty render` modifiers; desugar metadata (`viewDataLoad`, `pageDataLoad`) with `data` binding; TypeScript emit via `useState`/`useEffect` hook wrapper (`emit-data-load.ts`); checker `check-data-load.ts` with `missing-await` and `unknown-load-action` diagnostics; semantic index refs (`view.*.load.*`, `page.*.load.*`) and explain summaries; formatter, VS Code grammar/snippet, docs in `docs/site/language/applications.md`. General example `examples/app/dashboard/dashboard.point` — `items list` view loads from `action fetch items`.
- Verified: `bun test` — 196 pass, 0 fail.
- Syntax:
  ```point
  view items list
    load data from action fetch items
    when loading render "Loading items..."
    when error render "Could not load items"
    when empty render "No items yet"
    render "Items: " + data
  ```
- Checkboxes marked: Phase 15 P15-3 data loading pattern.
- Next: P15-5 rich views.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 15 P15-5 — Rich view components
- Completed: Extended `view` block family with semantic `form` (bind field/checkbox), `tabs`/`tab`, `modal`/`when`, and `each`/`render` list. Parse, desugar metadata (`viewControls.fields`, `viewEach`, `viewModal`, `viewTabs`), checker (`check-views.ts`), accessible TSX emit (`point-form`, `pointViewTabs`, `role="dialog"`, `role="list"`), semantic index refs for form/tab/modal/each children, formatter, VS Code grammar/snippets. General example `examples/app/dashboard/dashboard.point` — settings form + tabs + modal, items list with each+links+load, item detail modal. Stateful settings route wrapper via `React.useState`. Tests in `tests/rich-view-components.test.ts`.
- Verified: `bun test` — 200 pass, 0 fail.
- Syntax samples:
  ```point
  form
    bind field "Workspace name" to settings.workspace name
    bind checkbox "Email notifications" to settings.notifications enabled
  tabs
    tab "General" render "Theme: " + settings.theme
    tab "Advanced" render "Advanced preferences"
  modal "Notifications enabled" when settings.notifications enabled render "Email alerts are active"
  each item in data render link item.title to "/items/" + item.id
  ```
- Checkboxes marked: Phase 15 P15-5 rich view components (4 minimum: form, modal, tabs, list/each).
- Next: Phase 15 exit gate.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 16 P16-5 — Scheduler
- Completed: Added `schedule` block family with block form (`schedule <name>` / `every N minutes|seconds|hours` / `call <action>`) and inline form (`schedule every 5 minutes call health check`). Emit `startPointSchedules()` + `setInterval` wrapper for Bun dev; `run ...` commands start schedules and keep process alive. Checker (`unknown-schedule-action`, `schedule-action-needs-inputs`, `duplicate-schedule`). Semantic refs (`schedule.*`, `schedule.*.call.*`), index/explain, formatter, VS Code grammar/snippet. Production cron preference documented in `docs/site/toolchain/run.md`.
- Verified: `bun test tests/schedule-emit.test.ts` — 6 pass; `bun test` — 207 pass (14 fail from parallel Wave 1 P16-1/P16-3 in flight); `point check` + `point build` on `examples/tools/health-check-schedule.point`.
- Syntax:
  ```point
  schedule health check tick
    every 5 minutes
    call health check

  schedule every 30 seconds call health check
  ```
- Example: `examples/tools/health-check-schedule.point` — periodic health check logs timestamp via `touches time`.
- Checkboxes marked: Phase 16 P16-5 scheduler.
- Next: Wave 2 P16-2 / P16-4.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 16 P16-1 — WebSocket server routes
- Completed: Added `stream route` semantic block (path, typed `message` record, `on connect` / `on message` / `on disconnect` handlers). Parse, desugar (per-handler functions), check (`invalid-stream-route-message`, `missing-stream-route-handler`), emit Bun.serve WebSocket upgrade + handlers integrated with HTTP route bootstrap. Effect metadata `touches network` on stream routes. Semantic refs `point://semantic/<module>/streamRoute.<name>` with check-json repair hints. General echo example and integration tests with live WebSocket client.
- Verified: `bun test tests/stream-routes.test.ts` — 7 pass; `bun test` — 221 pass; `point check` + `point build` on `examples/api/stream-echo.point`.
- Syntax:
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
- Example: `examples/api/stream-echo.point` — WebSocket echo server (not factory-themed).
- Files changed: `packages/point/src/semantic/ast.ts`, `parse.ts`, `desugar.ts`, `check-routes.ts`, `metadata.ts`, `format.ts`, `context.ts`, `naming.ts`, `packages/point/src/core/emit-routes.ts`, `emit-javascript.ts`, `emit-typescript.ts`, `ast.ts`, `semantic-source.ts`, `legacy-lowering.ts`, `examples/api/stream-echo.point`, `tests/stream-routes.test.ts`, `docs/phase16-plan.md`, parity skip lists.
- Checkboxes marked: Phase 16 P16-1 WebSocket server routes; Phase 16 exit gate stream route criterion.
- Next: Wave 2 P16-2 client realtime bindings.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 16 P16-3 — Workflow retry, timeout, guards
- Completed: Extended `workflow` step family with `retry N times`, `timeout after N seconds`, `require policy <name>`, and `on failure return ...`. Desugar emits retry loops, `pointIsError` checks, policy guards, and `pointWorkflowTimedStep` (`Promise.race` + `std.time` sleep). Checker `unknown-policy` with semantic refs and repair hints. General example `examples/workflow-retry.point` (signup/import flow). Tests in `tests/workflow-retry.test.ts`.
- Verified: `bun test` — 221 pass, 0 fail.
- Syntax samples:
  ```point
  step verified is await verify email(email)
    retry 3 times
    timeout after 5 seconds
    require policy can signup
    on failure return Error "Email verification failed"
  ```
- Checkboxes marked: Phase 16 P16-3 workflow retry, timeout, guards.
- Next: Wave 2 P16-2 / P16-4.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 16 P16-2 — Client stream subscriptions
- Completed: View/page `subscribe to "/ws"` or `subscribe to stream <name>` with optional `on message call <handler>`. Emits React `useEffect` WebSocket hook with `messages`/`connected` state and cleanup on unmount. Checker diagnostics with semantic refs and repair hints. General example `examples/app/log-viewer/log-viewer.point`. Tests in `tests/stream-subscribe.test.ts`.
- Verified: `bun test tests/stream-subscribe.test.ts` — 6 pass; `bun test` — 234 pass, 0 fail.
- Syntax:
  ```point
  view log stream panel
    subscribe to stream logs
    when connecting render "Connecting..."
    when disconnected render "Stream closed"
    each line in messages render line.line

  view log stream with handler
    input on log line: Handler Log Line
    subscribe to "/ws/logs"
    on message call on log line
    render "Streaming..."
  ```
- Example: `examples/app/log-viewer/log-viewer.point`
- Checkboxes marked: Phase 16 P16-2 client realtime bindings; Phase 16 exit gate client subscription criterion.
- Next: P16-4 subprocess streaming polish (if any remaining).
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 16 P16-4 — Subprocess streaming
- Completed: Extended `action` with `yield <expr>` for async-generator stream actions; `std/process.point` `stream lines from process` + runtime `processStreamLines`; `stream route` `on connect stream from action <name>` bridge emitting `pointPumpProcessStreamToWebSocket` with 64 KiB backpressure skip; general example `examples/app/log-viewer/` (demo shell loop → WS → view subscribe). Tests in `tests/process-stream.test.ts`.
- Verified: `bun test tests/process-stream.test.ts` — 6 pass; `bun test` — 234 pass, 0 fail; `point check` + `point build` on log-viewer.
- Syntax:
  ```point
  action tail demo logs
    output line: Text
    touches process
    yield stream lines raw("sh", ["-c", "echo demo-line"], [])

  stream route logs
    path "/ws/logs"
    message Log Line
    on connect stream from action tail demo logs
    on disconnect return none
  ```
- Example: `examples/app/log-viewer/` — README documents backpressure limits.
- Checkboxes marked: Phase 16 P16-4 subprocess streaming; Phase 16 exit gate subprocess streaming + log-viewer criteria.
- Next: Phase 16 exit gate remaining items.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 17 P17-4 — Generic DB client pattern
- Completed: Added `docs/site/ecosystem/database-interop.md` documenting non-Convex SQL interop via `external` + parameterized `action` blocks (security: no string concat, fixed templates + `List<Text>` params). Optional `std/sql.point` spike with `sql query` action and `@hatchingpoint/point/std/sql` runtime (Bun SQLite, `?` placeholder validation). General notes CRUD snippets in doc (not factory-themed).
- Verified: `bun test tests/std-runtime.test.ts` — sql test pass; `bun test` — 235 pass, 0 fail; `point check std/sql.point`; `point check-docs`.
- Doc: `docs/site/ecosystem/database-interop.md`
- std.sql: `std/sql.point` + `packages/point/src/std/sql.ts` (spike — SQLite only)
- Checkboxes marked: Phase 17 P17-4 generic DB client pattern (all items).
- Next: P17-2 server Convex emit or P17-1 client blocks.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 17 P17-2 — Server Convex emit
- Completed: Added `server query` / `server mutation` semantic blocks with DB statements (`query all`, `get`, `insert`, `patch`, `delete`). Emit module `packages/point/src/core/emit-convex.ts` writes Convex `query`/`mutation` handlers to `generated/convex/`. Optional `point.json` `convex.tables` maps record types to table names; `convex.outDir` overrides output path. Check/index/explain refs (`serverQuery.*`, `serverMutation.*`, `database` effects). General example `examples/app/notes/notes.point` (CRUD). Tests `tests/convex-server-emit.test.ts`.
- Verified: `bun test` — 241 pass, 0 fail; `point build-ts examples/app/notes/notes.point` writes `generated/convex/notes.ts`.
- Syntax:
  ```point
  server query get notes
    output notes: List Note
    query all from table notes as notes
    return notes

  server mutation create note
    input input: Create Note Input
    output id: Text
    insert into table notes from input as noteId
    return noteId
  ```
- Emit sample: `export const getNotes = query({ args: {}, handler: async (ctx) => { const notes = await ctx.db.query("notes").collect(); return notes; } });` with `// Convex validators:` comments on each export.
- Example: `examples/app/notes/` + `examples/app/notes/point.json` convex table map.
- Next: P17-1 client Convex blocks or P17-3 CLI sync.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 17 P17-1 — Client Convex blocks
- Completed: Added `use query get notes` / `use mutation create note` and alternate `query notes from server get notes` in views/pages. Emit module `packages/point/src/core/emit-convex-client.ts` imports `useQuery`/`useMutation` from `convex/react` and `api` from configurable path (`convex.apiImport`, `convex.apiModule` in `point.json`). Loading/error/empty states reuse Phase 15 `when loading render` / `when error render` / `when empty render`. Checker `check-convex-client.ts` with semantic refs. Wired `examples/app/notes/notes.point` with list + create form views, layout, navigation. Tests `tests/convex-client-emit.test.ts`.
- Verified: `bun test` — 257 pass, 0 fail.
- Syntax:
  ```point
  view notes list
    use query get notes
    when loading render "Loading notes..."
    when error render "Could not load notes"
    when empty render "No notes yet"
    each note in notes render note.title

  view note create form
    input draft: Create Note Input
    use mutation create note
    form
      bind field "Title" to draft.title
  ```
- Emit sample: `const notesResult = useQuery(api.notes.getNotes, {});` + `const createNote = useMutation(api.notes.createNote);`
- Example: `examples/app/notes/notes.point`
- Next: Phase 17 exit gate; schema interop / file storage action.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅
- Completed: `point convex sync` copies `generated/convex/*.ts` (or `convex.outDir`) to `convex/functions/` or `convex.syncDir` from `point.json`. `point convex check` validates emit files exist and parse as TypeScript via Bun transpiler. Module `packages/point/src/core/convex-cli.ts`. Docs `docs/site/ecosystem/convex.md`. Tests `tests/convex-sync-cli.test.ts`.
- Verified: `bun test` — pass (includes convex-sync-cli); `point convex check` from repo root; `point convex sync` in temp project.
- CLI: `point convex sync | point convex check`
- Config: `convex.outDir`, `convex.syncDir` in `point.json`
- Example: `examples/app/notes/` workflow documented in convex.md
- Next: P17-1 client Convex blocks; Phase 17 exit gate.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint P18-4 — Prompt library

- Completed: Added `prompt` semantic block with `version`, `input <record>`, and `template` text; `{placeholder}` interpolation validated against record fields; indexed in `point index` with `point://semantic/` refs; general example at `examples/prompts/support-greeting.point`; tests for missing placeholder and unknown record diagnostics.
- Verified: `bun test tests/prompt-library.test.ts` — pass (6/6); full suite 265 pass (3 pre-existing failures from parallel P18-5 ai-demo/check-docs).
- Example: `examples/prompts/support-greeting.point`
- Next: P18-1 pipeline blocks; P18-3 session + streaming.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint P18-5 — Provider external pack (std.ai)

- Completed: Added `std/ai.point` with `external openai provider` and `external anthropic provider` fetch shims; runtime `@hatchingpoint/point/std/ai` (complete + stream text for Chat Completions / Messages APIs); semantic actions load keys via `std.env` only (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`); general example `examples/tools/ai-demo.point`; docs `docs/site/ecosystem/ai-providers.md`; mocked-fetch tests in `tests/ai-providers.test.ts`; updated `std/README.md` and `docs/site/stdlib/overview.md`.
- Verified: `bun test tests/ai-providers.test.ts tests/check-docs.test.ts tests/semantic-desugar.test.ts tests/semantic-emit.test.ts` — pass; full suite 267 pass / 8 fail (parallel P18-1 pipeline fixtures incomplete).
- Example: `std/ai.point`, `examples/tools/ai-demo.point`
- Next: P18-1 pipeline blocks; P18-3 session + streaming.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint P18-1 — Pipeline blocks

- Completed: `pipeline` block with input/output, sequential `step` declarations, workflow step modifiers (retry, timeout, require policy, on failure). Emit: async orchestrator, typed `*PipelineEvent` unions, `pointPipelineEventJson` / `pointPipelineEventsJson`, `pointPipelineEmitLog`. Example `examples/pipelines/document-ingest.point`. Tests `tests/pipeline.test.ts`.
- Verified: `bun test` — 275 pass.
- Example: `examples/pipelines/document-ingest.point`
- Next: P18-2 guards; P18-3 session + streaming.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint P18-3 — Session and streaming

- Completed: `session` block with `message` record, `messages` list, `stream response from action` binding. Emit: session state type, `*SessionCreate` / `*SessionAddUserMessage`, async generator `*SessionStreamResponse` with `point.session.event.v1` events (start/chunk/complete/failure). Example `examples/agents/support-chat.point`. Tests `tests/session-stream.test.ts`.
- Verified: `bun test` — 291 pass.
- Example: `examples/agents/support-chat.point`
- Next: Phase 18 exit gate review.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint P19-1 — Python route emit

- Completed: Added `packages/point/src/core/emit-python-routes.ts` — stdlib `http.server` runtime with middleware stacks, typed query/body/header extraction, `point_json_response` lowering, and `start_routes_server()`. Extended `emit-python.ts` for route modules and `serve` commands; wired `@hatchingpoint/point/std/crypto` via existing `python_std` bootstrap. Example `examples/api/middleware-demo.point` → `generated/middleware-demo.py`. Tests `tests/python-route-emit.test.ts`. Documented stdlib vs FastAPI choice in `docs/python-emit-research.md`.
- Verified: `bun test` — 300 pass.
- Example: `examples/api/middleware-demo.point`
- Next: P19-2 workflow + command emit; P19-3 std mirror completion.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint P20-1 — point dev

- Completed: Added `point dev <entry.point> [--port N]` in `packages/point/src/core/dev.ts` — watches the entry module graph via `fs.watch`, incrementally checks through `.point-cache/manifest.json`, rebuilds JavaScript emit to `generated/`, and reloads route servers in-process (`startRoutesServer` + `server.stop`) or subprocess for schedules/run commands. CLI wired in `packages/point/src/core/cli.ts`. Docs in `docs/site/toolchain/run.md` and `docs/site/reference/cli.md`. Tests in `tests/point-dev.test.ts`.
- Verified: `bun test` — 329 pass.
- Example: `examples/api/middleware-demo.point`, temp route fixture in `tests/point-dev.test.ts`
- Next: P20-2 full-stack template + `point app new`.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint P19-5 — CI parity suite

- Completed: `bun run test:py-parity` via `scripts/py-parity.ts` — builds paired JS/Python for `examples/math.point`, `examples/tools/path-demo.point`, `examples/api/middleware-demo.point`, then runs `tests/python-parity-suite.test.ts` (pure logic, path std, middleware JWT + HTTP status/body). Optional GitHub Actions job `py-parity` in `.github/workflows/ci.yml` (Python 3.12); main `bun run ci` unchanged.
- Verified: `bun test` — 316 pass; `bun run test:py-parity` when Python available.
- Example: `examples/math.point`, `examples/tools/path-demo.point`, `examples/api/middleware-demo.point`
- Next: Phase 19 exit gate review.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint P19-4 — External shim registry

- Completed: Added `docs/python-emit-registry.md` — npm / std external → Python mapping for Point std modules, fetch/http, OpenAI/Anthropic, YAML (PyYAML), jose/crypto (stdlib HS256 JWT), optional Convex scope, and `node:fs` built-ins. Linked from `docs/python-emit-research.md`; updated limits table for std mirror + registry. Marked P19-4 checkboxes in `docs/phase19-plan.md`.
- Verified: `bun test` — 300 pass.
- Example: `examples/tools/yaml-config.point`, `examples/tools/ai-demo.point`, `examples/api/middleware-demo.point`
- Next: P19-2 workflow + command emit; P19-5 CI parity suite.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint P19-2 — Python workflow + command emit

- Completed: Added `packages/point/src/core/emit-python-workflow.ts` — `pointIsError`, `pointWorkflowTimedStep` (asyncio.wait_for), and timed-step call lowering. Extended `emit-python.ts` for async workflow functions (retry/timeout/policy/on-failure from Phase 16 desugar), command `if __name__ == "__main__"` entrypoints, and `isPureLogicProgram` now allows workflows/commands. `build-py` merges `use` dependency declarations (fixes `examples/tools/process-runner.point`). Tests `tests/python-workflow-emit.test.ts`.
- Verified: `bun test` — 316 pass.
- Example: `examples/workflow-retry.point`, `examples/command.point`, `examples/tools/process-runner.point`
- Next: Phase 19 exit gate review.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 20 P20-2 — Full-stack template + point app new

- Completed: Added `examples/full-stack-template/` (SaaS admin shell: layout `admin shell`, sidebar nav, three pages — settings, members list, member detail — navigation with path params, `action fetch members` + `load data`, `command admin demo`, `point.json` with Convex stub, README). `point app new <name> [directory]` via `packages/point/src/core/app-cli.ts` copies template and substitutes app name. Tests `tests/app-new-cli.test.ts` and `tests/point-core.test.ts`; CLI docs in `docs/site/reference/cli.md`.
- Verified: `bun test` — 324 pass; `point check` / `point build-ts` / `point run` on template; `point app new demo-saas` scaffold check+build.
- Example: `examples/full-stack-template/src/app.point`
- Next: P20-1 `point dev` or P20-3 integration tests.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint P20-4 — Registry publish docs (Phase 13)

- Completed: Expanded `docs/site/ecosystem/point-add.md` (publish→consume workflow, registry table, GitHub Packages consumer `.npmrc`, hosted-index note) and `docs/site/ecosystem/npm-packages.md` (full publish workflow: scaffold, `files`/`exports`, public npm + GitHub Packages publisher/CI, registry comparison). Marked Phase 13 registry checkbox and P20-4 items in `docs/phase13-plan.md` / `docs/phase20-plan.md`. Hosted package index remains manual/future.
- Verified: `bun test` — 329 pass.
- Example: `packages/point-logic/` (`@hatchingpoint/point-logic`), `point add logic npm:@hatchingpoint/point-logic`
- Next: P20-3 integration test harness or P20-5 deploy spike.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint P20-5 — Deploy spike

- Completed: `point build --production` / `build-js --production` via `parseBuildCliFlags` and `emitPointCoreJavaScript(program, { production: true })` — production header, compact blank lines, CLI log line. Docs `docs/site/toolchain/deploy.md` (Bun serve, Vercel split, optional `point convex sync`, no platform-specific deploy). Updated `docs/site/toolchain/build-emit.md` and `docs/site/reference/cli.md`. Tests `tests/point-build-production.test.ts`.
- Verified: `bun test`.
- Example: `examples/hello.point`, `examples/api/middleware-demo.point` (deploy doc)
- Next: P20-3 integration tests.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint P20-3 — Integration test harness

- Completed: Added `integration test` action convention (Bool actions whose semantic name starts with `integration test`, optional `base url: Text` input). `point test integration <file>` builds the module graph, starts `startRoutesServer()`, runs each integration test against the live base URL, and reports JSON results. Extended `std/http.point` and `@hatchingpoint/point/std/http` with `httpFetch`, `httpAssertStatus`, and `httpAssertJsonBody` snapshot helpers. Example `examples/api/middleware-integration.point` (routes + three HTTP assertions). Tests `tests/integration-harness.test.ts`; docs in `docs/site/toolchain/run-test-repl.md`, `docs/site/stdlib/overview.md`, and CLI reference. Graph-aware docs check for `use` imports.
- Verified: `bun test` — 341 pass.
- Example: `examples/api/middleware-integration.point`
- Next: P20-1 `point dev` polish.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint P21-2 — Performance benchmarks

- Completed: Added `scripts/benchmark-platform.ts` timing `check-all` and `build-all` on the repo module graph (58 fixtures, ~42 KB). Wired `benchmark:platform` in root `package.json`. Expanded `docs/performance.md` with reference timings, Big-O expectations, and incremental verification steps (`POINT_INCREMENTAL=1` warm run must report cached modules).
- Verified: `bun run benchmark:platform` passes incremental warm-run check; `bun test` — 341 pass.
- Example: `examples/full-stack-template/src/app.point` (largest multi-page app fixture in graph)
- Next: P21-3 spec and agent docs.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint P21-5 — Adoption postmortem v2

- Completed: Added v2 section to `docs/adoption-postmortem.md` — full-stack template pilot (`examples/full-stack-template/`), what works (`point app new`, `point dev`, dashboard block family at template scale), blockers table, external team checklist v2. Marked P21-5 and adoption exit gate in `docs/phase21-plan.md`.
- Verified: `bun test` — 360 pass; `examples/full-stack-template/` exists with README, `point.json`, multi-page `src/app.point`.
- Example: `examples/full-stack-template/src/app.point`
- Next: Recruit real external team for v2.1; P21-1 conformance / P21-3 spec docs.
- Blocked: none (real external adopter still open — recorded in postmortem, not a P21-5 gate failure)
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint P21-4 — Self-host increment

- Completed: Extended `compiler/passes/naming-lint.point` with fixture cases from `examples/cart-total.point` and `examples/math.point`, kind-specific validation calculations, suite test, and `compiler/passes/README.md`. Added self-hosting roadmap table to `docs/vision.md`; updated `docs/self-hosting.md` and `docs/phase21-plan.md`.
- Verified: `point test compiler/passes/naming-lint.point` — 5 tests pass; `bun test` — 360 pass.
- Example: `compiler/passes/naming-lint.point`
- Next: P21-1 conformance expansion or P21-3 spec docs.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 22 Wave 1 — Language breadth & dedomainization

- Completed: P22-1 neutral onboarding (README, quick-start, proof-of-concept, rules.md → cart/checkout). P22-2 split language docs (ui, workflows, agents, realtime + applications index). P22-4 cross-domain examples index. P22-5 `docs/language-primitive-audit.md`. Added `docs/phase22-plan.md` and `docs/codex-goal-phase22.md`.
- Verified: `point check-docs` — 57 snippets, 48 file refs; LandingPage `sync:point-docs` — 59 pages.
- Next: Wave 2 — P22-3 view syntax reference, P22-6 spec sync, P22-7 conformance fixtures.
- Blocked: none

## Checkpoint Phase 22 Wave 2 — View reference, spec sync, conformance

- Completed: P22-3 expanded `docs/site/language/ui.md` (form, tabs, modal, each, link, Handler). P22-6 removed stale `serverQuery`/`serverMutation` from `language-spec.md`; extended `semantic-language-design.md`. P22-7 added cross-domain conformance fixtures (cart-total, route, workflow, rich-view). P22-8 lite: point-logic README positioned as example adopter package.
- Verified: `point check-docs` — 62 snippets, 48 file refs; `bun test tests/conformance/conformance.test.ts` — 27 pass.
- Next: Optional P22-8 full catalog package; Phase 23 primitives from audit.
- Blocked: none

## Checkpoint Phase 23 Wave 1 — Map and Money primitives

- Completed: P23-1 `Map<Text, T>` with `map { "key": value }` literals and `lookup map key`; checker + JS/TS/Python emit; `examples/catalog/price-lookup.point`; conformance fixture. P23-2 `std/money.point` + types guide money section. Added `docs/phase23-plan.md`, `docs/codex-goal-phase23.md`.
- Verified: `bun test tests/map-types.test.ts` — 4 pass; conformance — 28 pass; `point check-docs` — 64 snippets, 50 file refs.
- Next: P23-3 Instant spike; Phase 13 Python route closure; v0.1.6 release.
- Blocked: none

## Checkpoint Phase 24 — Path B native full stack

- Completed: P24-1 `point dev` app mode (Vite UI + Bun API, `--api` flag). P24-2 `point serve` (static `dist/` + `/api/*`). P24-3 full-stack template upgrade (routes, `web/`, scripts). P24-4 deploy + quick-start docs. Wave 2: P24-5 `point build-app`, P24-6 `toolchain/dev.md` + CLI ref, P24-7 Dockerfile, P24-8 E2E tests.
- Verified: `bun test tests/point-dev.test.ts tests/point-serve.test.ts tests/point-build-app.test.ts`; `point check examples/full-stack-template/src/app.point`.
- Next: v0.1.7 release; optional HTTP data-load for members list; LandingPage docs sync.
- Blocked: none

## Checkpoint Phase 25 Lane A — HTTP data-load and Render deploy

- Completed: `load data from fetch GET ... field ... type List<T>` in views; template members list calls `/api/members`; `render.yaml` for Render; `tests/full-stack-template.test.ts`.
- Verified: `point check examples/full-stack-template/src/app.point`; full-stack template tests pass.
- Next: Phase 23 Wave 2 Instant; P22-8 catalog package; changelog site version sync.
- Blocked: none

## Checkpoint Phase 26 P26-1 — Field aliases and fuzzy diagnostics

- Completed: Added field-alias resolution for property access so camelCase accesses can map to spaced record fields when the alias is uniquely closest; ambiguous aliases now return `unknown-field` with narrowed candidate labels; unknown fields include edit-distance-based `Did you mean "..."?` repair hints.
- Verified: `bun test tests/field-alias.test.ts` passes.
- Checkboxes marked: Phase 26 P26-1 field access aliases and fuzzy diagnostics.
- Next: Phase 26 P26-2 variant exhaustiveness.

## Checkpoint Phase 26 P26-2 — Variant exhaustiveness

- Completed: Added semantic variant exhaustiveness checker (`missing-variant-case`) for `on Case return` dispatch sites in label/rule/calculation blocks when dispatching on a variant-typed input. Diagnostics now include uncovered cases and concrete repair branches.
- Verified: `bun test tests/variant-exhaustiveness.test.ts`.
- Example: `examples/variants/order-status.point` (now explicitly handles every declared `Order Status` case).
- Files: `packages/point/src/semantic/check-variants.ts`, `packages/point/src/core/check.ts`, `tests/variant-exhaustiveness.test.ts`, `docs/site/reference/diagnostics.md`, `examples/variants/order-status.point`.
- Next: Phase 26 P26-3 (`Maybe` presence narrowing).

## Checkpoint Phase 26 P26-3 — Maybe presence narrowing

- Completed: Added `when <expr> present` and `when <expr> is none` condition forms in label/rule/calculation bodies plus view guards, with parser desugaring to null checks. Core checker now narrows `Maybe<T>` to `T` inside present branches (including nested property paths) so `nullable-field-access` only appears when truly unsafe.
- Verified: `bun test tests/maybe-narrowing.test.ts` passes.
- Example: `examples/tools/maybe-narrow.point`
- Next: Phase 26 P26-4 tab/slot modifiers.

## Checkpoint Phase 26 P26-4 — Tab and layout slot modifiers

- Completed: Extended semantic parsing so `tab ... render ...` and `layout slot ... render ...` consume semantic style prefixes via shared style-prefix parsing; threaded tab/layout slot style metadata through desugar/core AST and TypeScript emit; tab content now emits through wrapper-class resolution with style/class support. Updated vercel template tabs to `render muted`, expanded style tests for tab and layout slots, and documented tab style modifiers in UI docs.
- Verified: `bun test tests/semantic-view-style.test.ts` (7 pass, 0 fail); `point check packages/point/templates/vercel-app/src/app.point` passes.
- Checkboxes marked: Phase 26 P26-4 tab and layout slot style modifiers.
- Next: Phase 26 Wave 2 (P26-5 onward).
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 26 Wave 2 — Pipeline I/O, money lint, load-data repairs

- Completed: P26-5 pipeline step I/O checker validates step argument types against action inputs and pipeline return output (`pipeline-step-type-mismatch`). P26-6 money lint flags Float on money-like record field names (`float-money-field`). P26-7 load-data repair hints now suggest full `load data from action` blocks with output types; views without load bindings get actionable missing-await repairs.
- Verified: `bun run ci` green; `tests/pipeline-step-types.test.ts`, `tests/money-lint.test.ts`, `tests/view-data-load.test.ts`, agent-repair `load-data-repair` fixture.
- Release: v0.1.19 tagged and pushed.
- Next: Phase 27 (see `docs/phase27-plan.md`).
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 27 P27-1 — Middleware ↔ route validation

- Completed: Route checker validates middleware `before` chains — unknown middleware, unavailable inputs (`middleware-input-unavailable`), and type mismatches (`middleware-input-type-mismatch`) against route inputs. Exported `routeProvidesInputLabel` for accurate HTTP/path binding checks.
- Verified: `bun test tests/middleware-routes.test.ts`; `bun run ci` green.
- Example: `examples/api/middleware-demo.point` (unchanged, still passes).
- Next: P27-2 view runtime source maps.
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 27 P27-2 — View runtime source maps

- Completed: TypeScript emit tags `when loading/error/empty render` guard lines and view `when … render` branches with `// @point <line>`. JavaScript emit tags conditional view `when … render` if/return lines. Spans flow from semantic parse through `viewDataLoad` metadata.
- Verified: `tests/view-source-map.test.ts`; `bun run ci` green.
- Docs: updated `docs/site/toolchain/run.md` limits for views/pages mapping.
- Next: P27-3 theme toggle API.
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 27 P27-3 — Theme toggle API

- Completed: Theme blocks accept `toggle` to enable explicit light/dark mode. Views use `toggle theme` (optional style modifiers) for a semantic switch control. Emits `PointThemeShell` with `data-point-theme`, `pointThemeToggle`, and localStorage persistence. CSS tokens for `[data-point-theme="light|dark"]`.
- Verified: `tests/semantic-theme.test.ts`; `bun run ci` green.
- Next: P27-4 record-backed schema / SQL codegen spike.
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 27 P27-4 — Record-backed SQL schema stub

- Completed: `point build-schema` emits portable `CREATE TABLE` DDL from `record` blocks (Text/Bool/Int/Float, List as JSON text, nested records as JSON text). `checkSemanticSqlSchema` validates mappable fields before emit.
- Verified: `tests/sql-schema.test.ts`; `bun run ci` green.
- Next: Phase 27 integrator — v0.1.20 release.
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 27 release — v0.1.20

- Shipped: Phase 27 complete (middleware validation, view source maps, theme toggle, `point build-schema`).
- Verified: `bun run ci` green before tag.
- Next: Phase 28 integrator when P28 exit gate passes.
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 28 P28-1 — Repair-plan ordering and multistep benchmarks

- Completed: Added `sortDiagnosticsForRepairPlan` so `point repair-plan` orders steps by source position; enriched empty `relatedRefs` from `point explain` on step refs. Extended `scripts/agent-repair-sufficiency.ts` with 3 new multistep fixtures (cart pricing, notes app, document pipeline) — 4 repair-plan loops total. Added `docs/site/ai/repair-plan.md` (when to use repair-plan vs check-json). Updated agent-repair tests, fixture README, and exported `benchmarks/agent-repair-cases.json` (17 cases).
- Verified: `bun test tests/agent-repair-sufficiency.test.ts tests/agent-repair-multistep.test.ts` — 24 pass; `bun run ci` green.
- Example: `tests/fixtures/agent-repair/feature-multistep-notes-broken.point` — load-action fix before nav page typo when ordered by line.
- Next: P28-2 index/explain coverage audit.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 28 P28-2 — Index and explain coverage audit

- Completed: Added `tests/agent-index-explain.test.ts` audit table for Phase 26–27 codes (variant exhaustiveness, pipeline step I/O, money lint, middleware inputs, load-data) plus top core codes (unknown-field, arity, operator, nullable). Improved `explainSemanticRef` summaries for pipeline steps, load-data bindings, routes, and middleware. Aligned pipeline/workflow/guard step diagnostic refs with index path convention (`.step.` not `/step.`). Documented diagnostic ref explain parity in `docs/site/ai/stable-refs.md`.
- Verified: `bun test tests/agent-index-explain.test.ts` — 13 pass; `bun run ci` green.
- Next: P28-3 agent repair fixture expansion.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 29 P29-1 — python_std json, path, env mirrors

- Completed: Verified `packages/point/python_std/point_std/{json,path,env}.py` mirror JS `@hatchingpoint/point/std/*` behavior. Extended `tests/python-std-parity.test.ts` with env runtime parity and emit coverage for `std/env.point` alongside existing path/json emit + parity tests.
- Verified: `bun test tests/python-std-parity.test.ts` — 4 pass; `bun run ci` green.
- Next: P29-2 wire `use std.*` imports in emit-python.ts and extend py-parity for one module.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 29 P29-2 — Wire Python emit to python_std

- Completed: Improved `emit-python.ts` std bootstrap to resolve `python_std` from monorepo layout or installed `@hatchingpoint/point` npm package. Rewrote `use std.*` import declarations to `point_std.*` imports with alias map (path joinPaths→pathJoin, etc.). Extended `tests/python-std-parity.test.ts` with `use std.json` build-py wiring and import-rewrite coverage. Added `std/json.point` to `tests/python-parity-suite.test.ts` and `scripts/py-parity.ts` for JS/Python json parity.
- Verified: `bun test tests/python-std-parity.test.ts tests/python-parity-suite.test.ts` — 16 pass; `bun run ci` green.
- Next: P29-3 `point build-py` CLI docs + process-runner Python run path.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 28/29 integrator — exit gate review (loop tick 1)

- Reviewed: `docs/phase28-plan.md` and `docs/phase29-plan.md` exit gates — **neither complete**.
- Phase 28 status: P28-1 done (repair-plan + 3 multistep fixtures). P28-2 done (index/explain audit). P28-3 partial (3 new multistep fixture pairs; need 5+ new pairs total). P28-4 LSP parity not started. P28-5 self-host increment not started.
- Phase 29 status: P29-1 done. P29-2 done (emit-python std wiring + json py-parity). P29-3/P29-4 not checkpointed.
- Verified: `bun run ci` green after P29-2 commit.
- Next: P29-3 build-py CLI docs; P28-3 fixture expansion.
- Blocked: none (work in progress on parallel tracks)

## Checkpoint Phase expansion — 2026-05-24 tick 1

- Analyzed: `point roadmap-analyze` — active phases 28/29 (7+8 open criteria), P27 spike complete, `nextSuggestedPhaseNumber: 30`, audit gaps unchanged (Map/Money/Result/dates deferred), 18 agent-repair cases
- Decision: **B — Draft new phase**
- Output: `docs/phase30-plan.md`, `docs/codex-goal-phase30.md`, `docs/phase-roadmap.md` (draft row + backlog reprioritized)
- Next expansion tick: **A** — reprioritize backlog after 28/29 exit gates; or **D** — draft Phase 31 for typed errors / Result audit gap if 28 agent-loop gaps remain
- Principles gate: N/A (planning only) — draft scoped to record block family + boring SQL emit; no ORM or product DSL

## Checkpoint Phase expansion — 2026-05-24 tick 2

- Analyzed: `point roadmap-analyze` — active 28/29/30 (7+8+8 open criteria), `nextSuggestedPhaseNumber: 31`, audit gaps unchanged, 18 agent-repair cases, 47 example `.point` files
- Decision: **A — Reprioritize backlog** (skipped B: Phase 30 draft already on disk)
- Output: `docs/phase-roadmap.md` — refreshed evidence table, analyze snapshot, deferred Phase 31-alt agent-loop split until P28 exit
- Next expansion tick: **D** — draft Phase 31 scope for typed domain errors / Result audit gap; or **B** if user promotes Phase 30 to execution first
- Principles gate: N/A (planning only)

## Checkpoint Phase 28/29 integrator — exit gate review (loop tick 2)

- Reviewed: exit gates still **neither complete** — all plan checkboxes remain `[ ]`.
- Phase 28: P28-1/P28-2 committed (`3805a2a`). P28-3 partial, P28-4/P28-5 not started.
- Phase 29: P29-1/P29-2 committed (`0be9963`). P29-3/P29-4 not checkpointed. Uncommitted `generated/*.py` + `cli.ts` edits in working tree.
- Verified: `bun run ci` green (509 pass).
- Action: No commit, no release. Still on **v0.1.20**.
- Note: Integrator loop shell aborted again (~2.5s); tick emitted before exit. P28/P29 worker loops continue on 45m cadence.

## Checkpoint Phase 28/29 integrator — exit gate review (loop tick 3)

- Reviewed: `docs/phase28-plan.md` and `docs/phase29-plan.md` exit gates — **neither complete** (all plan checkboxes still `[ ]`).
- Phase 28 gaps: P28-1/P28-2 done. P28-3 partial — 18 broken fixtures / 18 benchmark cases but candidate pairs (middleware-input, pipeline-step-type, float-money, missing-variant, invalid-view-bind) not yet added; need 5+ new pairs per gate. P28-4 LSP ↔ CLI parity matrix not started. P28-5 self-host increment (`compiler/passes/diagnostic-catalog.point` or equivalent) not started.
- Phase 29 gaps: P29-1/P29-2 done (`python_std/` has 10+ shims; emit-python rewrites `use std.*`). P29-3/P29-4 not checkpointed — `build-py` docs predate Phase 29; `point.json` `"target": "python"` spike not landed; `examples/tools/process-runner.point` Python path not verified end-to-end. Parity green for math, path-demo, std/json, middleware-demo (10 pass) but not full std surface.
- Verified: `bun run ci` green (512 pass); `bun run test:py-parity` green (10 pass).
- Action: **No commit, no release.** Still on **v0.1.20**.
- Next: P28-3 fixture expansion + P28-4 LSP spot-check; P29-3 build-py/process-runner docs + P29-4 std parity extension.
- Blocked: none (parallel worker loops continue)

## Checkpoint Phase 29 P29-3 — process std mirror + process-runner Python path

- Completed: Fixed `point_std/process.py` async generator syntax (invalid `return` with value). Extended `emit-python.ts` to auto-`await` async std calls in async actions, emit stream-action `yield` via `async for`, distinguish relative sibling imports (`./process`) from `std/*` → `point_std.*` bridge imports. Added process shim parity, std/process emit coverage, and `examples/tools/process-runner.point` JS/Python echo parity in `tests/python-parity-suite.test.ts`.
- Verified: `bun test tests/python-std-parity.test.ts tests/python-parity-suite.test.ts tests/python-workflow-emit.test.ts` — 30 pass; `bun run ci` green (517 pass).
- Example: `python3 generated/process-runner.py` path via `processRunnerDemoResult("hello")` returns `{stdout, stderr, exitCode}` matching JS `processSpawn`.
- Next: P29-4 extend parity tests (http, yaml, crypto shims as ready).
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase expansion — 2026-05-24 tick 3 (slice D)

- Analyzed: audit gap "Rich errors / Result" — generic primitive deferred; existing patterns in `order-status.point`, `std/process.point` (`or Error`), workflow `on failure return`
- Decision: **D — Close audit gap** (draft phase scope, no compiler changes)
- Output: `docs/phase31-plan.md`, `docs/codex-goal-phase31.md`, `docs/phase-roadmap.md` (draft row + backlog item 2 marked drafted)
- Scope: Variant-first outcomes (`variant` + `label` + action outputs); calculation `on failure return`; **non-goals:** try/catch, `Result<T,E>`
- Next expansion tick: **A** — reprioritize after 28/29 exit; or promote Phase 30/31 to execution chats
- Principles gate: N/A (planning only) — extends variant/label/action block families; no host exception syntax proposed

## Checkpoint Phase 29 P29-3 — build-py CLI docs + process-runner run path

- Completed: Added `docs/site/toolchain/build-py.md` (single/batch emit, std bridge, run examples). Linked from `docs/site/toolchain/build-emit.md` and `docs/site/reference/cli.md`. Extended `emit-python.ts` with sibling-import bootstrap (`sys.path` for `./process` batch emit without shadowing stdlib `http`/`math`). Added process-runner `python3` runtime smoke test in `tests/python-workflow-emit.test.ts`.
- Verified: `point build-py examples/tools/process-runner.point generated/process-runner.py` then `python3 -c "…processRunnerDemoResult('hello')…"` returns `{stdout, stderr, exitCode}`; `bun run ci` green (522 pass).
- Example: `examples/tools/process-runner.point` — documented end-to-end in build-py page.
- Next: P29-4 extend parity tests (http, yaml, crypto shims).
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 29 P29-4 — http, yaml, crypto parity extension

- Completed: Extended `tests/python-std-parity.test.ts` with runtime parity for `point_std.crypto`, `point_std.yaml` (PyYAML-gated), and `point_std.http` (async spawn against local server). Added `std/crypto.point` and `std/yaml.point` to `tests/python-parity-suite.test.ts` and `scripts/py-parity.ts`. Added urllib timeouts in `point_std/http.py`.
- Verified: `bun test tests/python-std-parity.test.ts tests/python-parity-suite.test.ts` — 28 pass; `bun run ci` green (527 pass).
- Example: crypto JWT sign/verify and yaml round-trip match JS `@hatchingpoint/point/std/*` outputs under `python3`.
- Next: Phase 29 integrator — optional `point.json` `"target": "python"` spike; release with 28 exit gate.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 29 integrator — point.json emit target spike

- Completed: `point.json` `"emit": "python"` project default and per-module `modules` overrides route `point build` to Python emit (same dependency merge as `build-py`). Documented in `docs/site/toolchain/build-py.md`. Tests in `tests/point-add.test.ts` and `tests/python-emit.test.ts`.
- Verified: `bun run ci` green (544 pass).
- Phase 29 exit gate: python_std mirror, std wiring, build-py docs, process-runner path, parity suite (crypto/yaml/http) — all checkpointed P29-1–P29-4 + manifest spike.
- Next: release integrator (v0.1.21+) when product owner requests tag; Phase 30 SQL productization.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 28 P28-3 — Agent repair fixture expansion

- Completed: Added 5 Phase 26–27 single-shot fixture pairs — `middleware-input-unavailable`, `middleware-input-type-mismatch`, `pipeline-step-type-mismatch`, `float-money-field`, `missing-variant-case`. Registered in `scripts/agent-repair-sufficiency.ts`. Exported `benchmarks/agent-repair-cases.json` (23 cases: 18 single-shot + 4 repair-plan loops). Updated `docs/site/ai/agent-repair-tests.md` and fixture README.
- Verified: `bun test tests/agent-repair-sufficiency.test.ts tests/agent-repair-multistep.test.ts` — 29 pass; `bun run ci` green.
- Example: `tests/fixtures/agent-repair/middleware-input-unavailable-broken.point` — middleware expects body but route only exposes query; one-line fix swaps middleware input to query.
- Next: P28-4 LSP vs check-json parity spot-check.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 28 P28-3 — invalid-view-bind-target fixture (completion)

- Completed: Added `invalid-view-bind-target` broken/fixed pair (settings form bound to input record instead of `settings.workspace name`). Enabled parse + check path: `check-views` now emits `expected` bind target on `invalid-view-bind-target`; `desugar` skips invalid bind targets instead of aborting parse. All six Phase 26–27 candidate pairs now registered — middleware-input (unavailable + type mismatch), pipeline-step-type, float-money, missing-variant, invalid-view-bind.
- Verified: `bun test tests/agent-repair-sufficiency.test.ts` — 24 pass; `bun scripts/export-agent-repair-cases.ts` (24 cases); `bun run ci` green.
- Example: `tests/fixtures/agent-repair/invalid-view-bind-target-broken.point` — one-line fix appends `.workspace name` to bind target.
- Next: P28-4 LSP vs check-json parity spot-check.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 28 P28-4 — LSP vs check-json parity spot-check

- Completed: LSP diagnostics now use `sortDiagnosticsForRepairPlan` (same order as `check-json`), expose `code` + `ref` + `repair` on the diagnostic object, append repair hints to the editor message, and set `source: "point"`. Added `tests/agent-lsp-check-json-parity.test.ts` matrix (10 cases: six Phase 26–27 agent-repair codes + core unknown-field/missing-await/arity/operator). Documented intentional LSP gaps (`expected`, `actual`, `relatedRefs`) in `docs/site/ai/check-json.md`.
- Verified: `bun test tests/agent-lsp-check-json-parity.test.ts tests/point-lsp.test.ts` — 20 pass.
- Example: `middleware-input-unavailable-broken.point` — LSP first diagnostic matches CLI `code` and `repair`.
- Next: P28-5 self-host increment.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 28 P28-5 — Self-host diagnostic catalog pass

- Completed: Added `compiler/passes/diagnostic-catalog.point` — Point-authored catalog of nine agent-ready diagnostic codes (middleware, pipeline, money lint, variants, view binds, unknown-field, missing-await) with suite test `test phase 26 27 agent catalog`. Wired into `tests/point-core.test.ts` and conformance fixture discovery. Updated `compiler/passes/README.md` and `docs/self-hosting.md`.
- Verified: `point test compiler/passes/diagnostic-catalog.point` — 5/5 pass; `bun test tests/point-core.test.ts -t self-hosted` — 2 pass.
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 28/29 integrator — v0.1.21 release

- Reviewed: `docs/phase28-plan.md` and `docs/phase29-plan.md` exit gates — **both complete** (all checkboxes marked `[x]`).
- Phase 28 shipped: repair-plan ordering, index/explain audit, 6 agent-repair fixture pairs (24 benchmark cases), LSP ↔ check-json parity matrix, `diagnostic-catalog.point` self-host pass.
- Phase 29 shipped: `python_std/` mirrors, emit-python `use std.*` wiring, build-py docs + process-runner Python path, crypto/yaml/http parity, `point.json` emit target for `point build`.
- Verified: `bun run ci` green (544 pass); `bun run test:py-parity` green (28 pass).
- Released: **v0.1.21** — CHANGELOG, version bump, tag pushed.
- Next: Phase 30 (SQL productization) or expansion loop backlog reprioritization.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 30 P30-1 — Relational FK mapping

- Completed: Nested record fields emit `field_id TEXT REFERENCES table(id)` instead of JSON blobs. Added `record-sql-fk-ambiguous` when target record lacks `id: Text`. `List<Record>` stays JSON with non-relational comment. Tests in `tests/sql-schema-fk.test.ts`.
- Verified: `bun test tests/sql-schema-fk.test.ts` — 6 pass.
- Example: `examples/data/schema-demo.point` — `Post.author: User` → `author_id TEXT REFERENCES user(id)`.
- Next: P30-2 nullable + Instant mapping.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 30 P30-2/P30-3/P30-4 — Dialect, migrations, multi-module schema

- Completed: `Maybe<T>` nullable columns and `Instant` → TIMESTAMP (postgres) / ISO TEXT (sqlite). CLI flags `--dialect`, `--migrations`, `--sequence`. Multi-module aggregation via dependency graph + directory input; `record-sql-duplicate-table` diagnostic. `docs/site/toolchain/build-schema.md` + notes app docs. Index/explain coverage for record-sql diagnostics in tests.
- Verified: `bun test tests/sql-schema.test.ts tests/sql-schema-fk.test.ts` — 9 pass; `bun run ci` green (551 pass).
- Example: `point build-schema --migrations migrations examples/data/schema-demo.point`.
- Next: Phase 30 integrator — v0.1.22 release.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 30 integrator — v0.1.22 release

- Reviewed: `docs/phase30-plan.md` exit gate — **complete** (all checkboxes `[x]`).
- Shipped: FK mapping, Maybe/Instant columns, postgres/sqlite dialects, migration output, multi-module aggregation, schema-demo example, build-schema docs.
- Verified: `bun run ci` green (551 pass); tag **v0.1.22** already on origin (includes Phase 30 + roadmap-analyze CI fix).
- Updated: CHANGELOG 0.1.22 entry with Phase 30 highlights.
- Next: Phase 31 (typed domain errors) or expansion loop backlog.
- Blocked: none
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 31 integrator — v0.1.23 (parallel waves P31-1–P31-4)

- Completed: Variant-first domain errors — `examples/variants/payment-outcome.point`, Domain outcomes docs, `action-outcome-not-exhaustive` diagnostic, calculation `on failure return` + `calculation-on-failure-type-mismatch`, Python variant `kind` dict emit, 2 agent-repair fixture pairs (26 benchmark cases).
- Verified: `bun run ci` green; `bun test tests/payment-outcome.test.ts tests/action-outcome-exhaustiveness.test.ts tests/calculation-on-failure.test.ts tests/python-payment-outcome.test.ts`.
- Released: **v0.1.23**
- Next: Phase 32 candidate (Map/dict or Money) via expansion loop.
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅

## Checkpoint Phase 32 integrator — v0.1.24 (parallel P32-1–P32-3)

- Completed: **Duration** opaque type (seconds at runtime), std.time duration helpers, `duration-demo.point`, build-schema Duration columns, audit sync (Map shipped, Money/errors patterns).
- Verified: `bun run ci` green; `bun test tests/duration-type.test.ts tests/duration-std.test.ts tests/sql-schema-duration.test.ts`.
- Released: **v0.1.24**
- Next: Phase 33 — Python route productization (Phase 13) or Money decimal type if author friction remains.
- Principles gate: Semantic ✅ Agent loop ✅ Block family ✅ Effects ✅ General example ✅ Boring emit ✅ No overfit ✅
