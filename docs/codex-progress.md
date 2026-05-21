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
