# Point runtime pivot — progress log

Agents append checkpoints after each R goal. Do not delete entries.

**Plan:** [point-runtime-pivot.md](./point-runtime-pivot.md) · **Goals:** [codex-goal-point-only.md](./codex-goal-point-only.md)

**Policy:** Hard pivot — no app-level externals, no permanent emit/React fallbacks on home base. Move fast, break things.

## Wave checklist

| Wave | Tracks | Status |
|------|--------|--------|
| **R0** | R0-A, R0-B, R0-C, R0-D | ✅ Done |
| **R1** | R1-A … R1-F | ✅ Done |
| **R2** | R2-A -> R2-B/C/D -> R2-E | ✅ Done |
| **R3** | R3-A, R3-B, R3-C | ✅ Done |
| **R4** | R4-A ... R4-E | ✅ Done |

---

## Wave R0 checklist

- [x] R0-A: Home-base app under `experiments/point-only/`; score test uses a named record calculation instead of passing an inline record literal to the rule
- [x] R0-B: Docs, goal registry, ownership table, and progress checklist verified
- [x] R0-C: Runtime package skeleton exists under `packages/point/runtime/`
- [x] R0-D: CI gate enforces no author JS in `experiments/point-only/`
- [x] Integrator: R0 closed — Codex sandbox could not spawn `point check`; parent shell verified both home-base files pass (see below)

---

## Wave R1 checklist

- [x] R1-A: In-memory eval moved to `packages/point/runtime/eval-js.ts`; `run-bridge.ts` delegates
- [x] R1-B: `runtime/builtins/text.ts` + `tests/runtime/builtins-text.test.ts`
- [x] R1-C: `runtime/builtins/collections.ts` + `tests/runtime/builtins-collections.test.ts`
- [x] R1-D: `runtime/builtins/crypto.ts` + `tests/runtime/builtins-crypto.test.ts`
- [x] R1-E: `point run` / `point test` for `experiments/point-only/**` hard-routed through runtime; home-base emit commands blocked
- [x] R1-F: `tests/runtime/experiment-parity.test.ts` — runtime vs emit+eval oracle
- [x] Integrator: parent shell verified home-base CLI + full runtime test suite (see below)

---

## Wave R2 checklist

- [x] R2-A: Runtime IR lowering and opcode contract under `packages/point/runtime/ir/`
- [x] R2-B/C: Bytecode interpreter covers records, calculations, rules, labels, loops, and Maybe branches
- [x] R2-D: Interpreter parity coverage exists for non-home-base pure fixtures
- [x] R2-E: `point run` / `point test` for `experiments/point-only/**` use interpreter by default
- [x] Integrator: Home-base emit oracle/fallback paths removed; R2 closed

---

## Wave R3 checklist

- [x] R3-A: `runtime/server.ts` — owned Bun HTTP server + `tests/runtime/server.test.ts`
- [x] R3-B: Route registry from checked programs; `GET /readiness` on home base; `tests/runtime/server-routes.test.ts`
- [x] R3-C: `point dev` for home base via runtime — no Vite spawn
- [x] Integrator: `point serve` hard-routed to runtime; home-base HTTP/dev/serve fully runtime-owned

---

## Wave R4 checklist

- [x] R4-A: Runtime SSR renderer for Point view/page/layout functions
- [x] R4-B: Runtime SSR form POST for the home-base readiness surface
- [x] R4-C: Runtime SSR navigation routes and view links without `react-router-dom`
- [x] R4-D: Home-base TypeScript/Vite app build path blocked
- [x] R4-E: Runtime experiment SSR e2e coverage
- [x] Integrator: Pivot exit gate closed for home base (see below)

---

## Post-pivot P1 checklist

- [x] P1-A: Site guide default path documents `runtime-app` and runtime-owned `point dev`
- [x] P1-B: CLI reference and product map document `runtime-app` as the `point create` default
- [x] P1-C: Standalone template docs identify `runtime-app` as the canonical npm-shipped default
- [x] Integrator: 0.2.1 docs consistently document the runtime-native default; legacy Vite/React templates are explicit opt-ins

---

## Post-pivot P2 checklist

- [x] P2-A: Runtime std dispatch contract for `std.text`, `std.json`, `std.http`, and `std.time`
- [x] P2-B: Interpreter resolves `std.text` and `std.json` through runtime std dispatch; runtime-owned app CLI coverage
- [x] P2-C: Async `std.http` helpers execute through awaited runtime interpreter paths
- [x] Integrator: Runtime-owned apps resolve `use std.*` through `packages/point/runtime/` only; no emitted std imports

---

## Post-pivot P3 checklist

- [x] P3-A: `runtime-saas-app` template is runtime-owned, has auth middleware + SQLite through runtime builtins, and scaffolds with `point create --template runtime-saas-app`

---

## Pivot exit gate (final)

- [x] `experiments/point-only/` contains no author TS/JS/React/Vite artifacts
- [x] `point run` / `point dev` / `point serve` / `point test` use `packages/point/runtime/` for experiment app
- [x] Interpreter default (post-R2) with home-base emit path cut
- [x] HTTP + SSR without React/Vite for experiment app
- [x] `bun run ci` green (repo-wide fmt-check-all on legacy `.point` files)

---

<!-- Append checkpoints below -->

## 2026-05-26 - R0-B Docs + goal registry

- Verified `docs/point-only-experiment.md` has complete wave ordering, parallel track list, plan-level wave checklist, per-track exit gate, and file ownership coverage for R0-B-owned docs.
- Updated R0-B ownership to include `docs/codex-progress-point-only*`, matching this track's responsibility to maintain the progress log.
- Added the Wave R0 checklist section to `docs/codex-progress-point-only.md`.
- Confirmed no compiler source/code changes were made and no compiler code was duplicated.
- `bun run ci` failed at `fmt-check-all` on pre-existing formatting issues across `examples/**/*.point`, `compiler/passes/*.point`, and `std/*.point`; R0-B changed docs only.

## 2026-05-26 - R0-C Runtime skeleton

- Added `packages/point/runtime/` with `index.ts` exporting `PointRuntime` and a stub `runModule(filePath)`.
- Added runtime README documenting the owned-runtime boundary and confirming no `point run` behavior change in R0.
- Wired `@hatchingpoint/point/runtime` through `packages/point/package.json` exports and package files.
- Verification: `bun run ci` failed at `fmt-check`; the formatter reported existing `.point` examples and std modules as unformatted before later CI steps ran.
- Additional verification: `bun test tests/point-only-experiment.test.ts` passed; focused Bun import and runtime fmt-check commands were blocked by intermittent `windows sandbox: spawn setup refresh` before the process started.

## 2026-05-26 - R0-D Point-only author-surface guard

- Added `tests/point-only-experiment.test.ts` to fail if `experiments/point-only/` contains `*.ts`, `*.tsx`, `vite.config.*`, `next.config.*`, generated emit artifacts, or files outside `.point`, `point.json`, `README.md`, and allowed asset extensions.
- Verified the current experiment app contains only `README.md`, `point.json`, `src/app.point`, and `tests/score.test.point` under the allowed author surface.
- `bun test tests/point-only-experiment.test.ts` passed.
- `bun run ci` was attempted but stopped at `bun run fmt-check`; existing `.point` files across `examples/` and `std/` were reported unformatted before the test suite could run.
- No commit was made.

## 2026-05-26 - R0-D guard follow-up

- Tightened the author-surface guard so allowed assets must live under `assets/`, `public/`, or `static/`; root manifests other than `point.json` now fail the test.
- Re-ran `bun test tests/point-only-experiment.test.ts`; it passed.
- Re-ran `bun run ci`; it still stops at `fmt-check-all` on pre-existing unformatted `.point` files in `compiler/passes/`, `examples/`, and `std/` before later CI steps run.
- No commit was made.

## 2026-05-26 - R0-D repeated CI blocker

- Reconfirmed `experiments/point-only/` contains only `point.json`, `README.md`, `src/app.point`, and `tests/score.test.point`.
- Re-ran `bun test tests/point-only-experiment.test.ts`; it passed.
- Re-ran `bun run ci`; for the third consecutive R0-D goal turn, CI stopped at `fmt-check-all` on repo-wide `.point` formatting outside the R0-D test/progress scope.
- No commit was made.

## 2026-05-26 - R0-A follow-up

- Updated `experiments/point-only/src/app.point` so `command smoke` uses the existing command-body `return` convention.
- Expanded `experiments/point-only/tests/score.test.point` to include the deploy readiness score rule plus label and tone threshold checks.
- File audit: `rg --files experiments/point-only` reports only `point.json`, `README.md`, `src/app.point`, and `tests/score.test.point`.
- Re-attempted `bun run point check experiments/point-only/src/app.point`; command startup still failed in the sandbox with `windows sandbox: spawn setup refresh` before Point could run.

## 2026-05-26 - R0-A blocked verification

- Reconfirmed `experiments/point-only/` contains only `point.json`, `README.md`, `src/app.point`, and `tests/score.test.point`.
- Reconfirmed `src/app.point` has deploy readiness scoring from `Deploy Signals`, threshold label and tone classifiers, `readiness summary`, and `command smoke`.
- Reconfirmed `tests/score.test.point` is a Point-only test hook covering the score rule and label/tone thresholds.
- `rg -n "external|React|Vite|vite|next|\.js|\.ts|\.tsx" experiments/point-only -S` found only README text documenting prohibited host files.
- Required verification remains blocked: both `bun run point check experiments/point-only/src/app.point` and `bun packages/point/src/cli.ts check experiments/point-only/src/app.point` fail before execution with `windows sandbox: spawn setup refresh`.

## 2026-05-26 - R0 integrator

- Read `docs/point-runtime-pivot.md` and applied the no-fallback policy: no app-level JS shims, no home-base emit fallback, and no long-lived fallback flags.
- Re-ran `bun test tests/point-only-experiment.test.ts`; it passed.
- Updated `experiments/point-only/tests/score.test.point` to avoid passing an inline record literal into `deploy readiness`; `test perfect score` now calls a `complete signals()` calculation.
- Reconfirmed `experiments/point-only/` contains only `point.json`, `README.md`, `src/app.point`, and `tests/score.test.point`.
- Searched for home-base fallback/emit scaffolding. Findings were limited to policy/docs and legacy repo-wide transition emit code outside the home-base app; no fallback files under `experiments/point-only/` were present to delete.
- `bun run point check experiments/point-only/src/app.point` remains unverified because the command fails before Point starts with `windows sandbox: spawn setup refresh`.

## 2026-05-26 - R0 integrator retry

- Re-read `docs/point-runtime-pivot.md`; the no-fallback policy remains the active constraint.
- Reconfirmed `experiments/point-only/tests/score.test.point` uses `complete signals()` instead of passing an inline record literal into `deploy readiness`.
- Re-ran `bun test tests/point-only-experiment.test.ts`; it passed.
- Re-ran fallback search over `experiments/point-only`, `packages/point/runtime`, the guard test, and pivot docs. Matches are policy/guard text and runtime README only; no home-base fallback or emit scaffold exists under `experiments/point-only/`.
- Retried `bun run point check experiments/point-only/src/app.point` repeatedly; each attempt failed before Point starts with `windows sandbox: spawn setup refresh`.

## 2026-05-26 - R0 integrator blocked

- Re-ran `bun test tests/point-only-experiment.test.ts`; it passed.
- Reconfirmed the home-base app tree contains only `README.md`, `point.json`, `src/app.point`, and `tests/score.test.point`.
- Re-ran the home-base fallback/emit audit; findings are limited to policy/docs, the guard test, runtime README language, and README statements forbidding fallbacks.
- `bun run point check experiments/point-only/src/app.point`, `bun packages/point/src/cli.ts check experiments/point-only/src/app.point`, and `bun run point check experiments/point-only/tests/score.test.point` all fail before Point starts with `windows sandbox: spawn setup refresh`.
- R0 is not marked done because the required `point check` gate remains unverified.

## 2026-05-26 - R1-A eval bridge move

- Read `docs/point-runtime-pivot.md` and followed the no-fallback policy: runtime capability moved into `packages/point/runtime/`, with no app-tree shim or fallback.
- Moved in-memory JavaScript eval helpers from `packages/point/src/core/run-bridge.ts` to `packages/point/runtime/eval-js.ts`.
- Kept `packages/point/src/core/run-bridge.ts` as a thin compatibility re-export for existing CLI/tests imports.
- Exported the eval helpers from `packages/point/runtime/index.ts` as part of the owned runtime surface.
- Verification: `bun test tests/run-bridge.test.ts` passed.
- Additional nearby check: `bun test tests/std-runtime.test.ts` still fails on existing Windows path/process/temp-lock expectations unrelated to R1-A.
- No commit was made.

## 2026-05-26 - R2-A runtime IR lowering

- Read `docs/point-runtime-pivot.md` and kept the no-fallback policy: R2-A adds runtime-owned bytecode lowering, not app-tree emit or shims.
- Added `packages/point/runtime/ir/` with `lowerCheckedCoreProgramToBytecode`, `PointIrProgram`, opcode types, and `PointIrLoweringError`.
- Lowering runs `checkPointCore` first and rejects unchecked programs before bytecode generation.
- Documented `point.runtime.ir.v1` and the opcode set in the Runtime IR section of `docs/point-runtime-pivot.md`.
- Added `tests/runtime/ir-lowering.test.ts` for rule/label branch lowering, record construction via a named calculation, and unchecked-program rejection.
- Verification: `bun test tests/runtime/ir-lowering.test.ts tests/runtime/experiment-parity.test.ts tests/run-bridge.test.ts` passed.
- Verification: `bun run check` passed (`Point core check passed: 81 files`).
- `bun run ci` was attempted but stopped at the existing `fmt-check-all` gate for repo-wide unformatted `.point` files in `compiler/passes/`, `examples/`, and `std/` before later CI steps ran.
- No commit was made.

## 2026-05-26 - R2-B runtime interpreter

- Added `packages/point/runtime/interpreter/` for bytecode execution of records, calculations, rules, and labels.
- Added interpreter entrypoints for checked core programs and lowered IR programs, exported from `packages/point/runtime/index.ts`.
- Added `tests/runtime/interpreter.test.ts` with parity against `eval-js` on `examples/pure/math-only.point` and coverage for record construction, rule scoring, label thresholds, and calculation calls.
- Reconciled concurrent interpreter export changes by keeping the existing `interpretPointIrFunction` API and adding compatibility entrypoints around it.
- Verification: `bun test tests/runtime/interpreter.test.ts tests/runtime/ir-lowering.test.ts tests/runtime/experiment-parity.test.ts tests/run-bridge.test.ts` passed.
- Verification: `bun run check` passed (`Point core check passed: 81 files`).
- `bun run ci` was attempted; it stopped at the existing `fmt-check-all` gate for repo-wide unformatted `.point` files in `compiler/passes/`, `examples/`, and `std/` before later CI steps ran.
- No commit was made.

## 2026-05-26 - R2-E home-base interpreter default

- Changed `packages/point/runtime/index.ts` so `runModule` and `runPointRuntimeTests` execute through `interpretCoreProgramEntry` instead of eval-js.
- Kept home-base CLI routing in `packages/point/src/core/cli.ts`: `experiments/point-only/**` uses `runModule` for `point run`/`point launch` and `runPointRuntimeTests` for `point test`.
- Tightened `tests/point-only-experiment.test.ts` to assert the runtime entrypoint imports and calls `interpretCoreProgramEntry`, and no longer imports `emitPointCoreJavaScript`.
- Verification: `bun test tests/point-only-experiment.test.ts` passed, including CLI `point run experiments/point-only/src/app.point` and `point test experiments/point-only/tests/score.test.point`.
- Verification: `bun test tests/runtime/interpreter.test.ts tests/runtime/ir-lowering.test.ts tests/runtime/emit-interpret-parity.test.ts tests/runtime/interpreter-for-each-maybe.test.ts` passed.
- Verification: `bun run check` passed (`Point core check passed: 81 files`).
- `bun run ci` was attempted; it stopped at the existing `fmt-check-all` gate for repo-wide unformatted `.point` files in `compiler/passes/`, `examples/`, and `std/` before later CI steps ran.
- No commit was made.

## 2026-05-26 - R2 integrator

- Merged R2 interpreter tracks and marked R2 done in `docs/point-runtime-pivot.md` and the Wave R2 checklist above.
- Cut the home-base emit oracle from runtime tests: `tests/runtime/experiment-parity.test.ts` now checks `experiments/point-only/**` through the bytecode interpreter against direct expected values, not emitted JavaScript.
- Restricted `tests/runtime/emit-interpret-parity.test.ts` to non-home-base pure fixtures; home-base no longer participates in emit-vs-interpret parity.
- Removed eval-js helper exports from `packages/point/runtime/index.ts`; legacy eval remains behind `packages/point/src/core/run-bridge.ts` for non-home-base transition coverage.
- Re-ran the home-base/runtime fallback audit. Remaining emit/eval references are policy text, legacy eval bridge files, or non-home-base pure parity tests; home-base `runModule` and `runPointRuntimeTests` call `interpretCoreProgramEntry`.
- Verification: `bun test tests/point-only-experiment.test.ts tests/runtime/experiment-parity.test.ts tests/runtime/emit-interpret-parity.test.ts tests/runtime/interpreter-for-each-maybe.test.ts tests/runtime/interpreter.test.ts tests/runtime/ir-lowering.test.ts` passed.
- Verification: `bun run check` passed (`Point core check passed: 81 files`).
- `bun run ci` was attempted; it stopped at the existing `fmt-check-all` gate for repo-wide unformatted `.point` files in `compiler/passes/`, `examples/`, and `std/` before later CI steps ran.
- No commit was made.

## 2026-05-26 - R0 closed (parent shell verification)

- **Codex blocker (not a code failure):** Inside Codex on Windows, `bun run point check` and `bun packages/point/src/cli.ts check` fail before Point starts with `windows sandbox: spawn setup refresh`. This repeated across R0-A and three integrator continuations.
- **Parent shell verification (pass):**
  - `bun test tests/point-only-experiment.test.ts` — pass
  - `bun packages/point/src/cli.ts check experiments/point-only/src/app.point` — pass
  - `bun packages/point/src/cli.ts check experiments/point-only/tests/score.test.point` — pass
- **R0 deliverables present:** home-base app (4 files), runtime skeleton, author-surface guard, pivot docs. `score.test.point` uses `complete signals()` calculation.
- **Policy:** Treat R0 as done; launch Wave R1. For future goals inside Codex: if sandbox spawn fails, append blocker + rely on `bun test tests/point-only-experiment.test.ts` and parent `bun packages/point/src/cli.ts check` when user confirms.

## 2026-05-26 - R1-B Runtime text builtins

- Read `docs/point-runtime-pivot.md` and followed the no-fallback policy: no app-level externals, no runtime-to-emit fallback, and no CLI wiring in this track.
- Added `packages/point/runtime/builtins/text.ts` with runtime-owned `trim`, `lowercase`, `contains`, and `stripPrefix`.
- Added `tests/runtime/builtins-text.test.ts` covering whitespace trimming, lowercasing, substring checks, matching prefix stripping, nonmatching prefixes, and empty-prefix behavior.
- Verification passed: `bun test tests/runtime/builtins-text.test.ts`.
- Home-base author-surface gate passed: `bun test tests/point-only-experiment.test.ts`.
- Fallback audit over the new files and `experiments/point-only/` found only README policy text; no fallback code or author JS was introduced.
- No commit was made.

## 2026-05-26 - R1-C Runtime collections and integer builtins

- Read `docs/point-runtime-pivot.md` and followed the no-fallback policy: capability was added under `packages/point/runtime/`, with no app-level shim, author external, or runtime-to-emit fallback.
- Added `packages/point/runtime/builtins/collections.ts` with runtime-owned `listLength`, `countMatching`, `maxInt`, `roundInt`, and `clampInt`.
- Added `tests/runtime/builtins-collections.test.ts` covering empty/nonempty list length, predicate counts, integer max, rounding, and inclusive integer clamping.
- Verification passed: `bun test tests/runtime/builtins-collections.test.ts`.
- Runtime builtins suite passed: `bun test tests/runtime`.
- Home-base author-surface gate passed: `bun test tests/point-only-experiment.test.ts`.
- `bun run ci` was attempted; it still stops at `fmt-check-all` on pre-existing unformatted `.point` files in `compiler/passes/`, `examples/`, and `std/` before later CI steps run.
- Fallback audit over `packages/point/runtime`, `tests/runtime`, and pivot/progress docs found policy text and R1-A eval-bridge references only; no new fallback flag, app-level external, or author JS was introduced by R1-C.
- No commit was made.

## 2026-05-26 - R1-D Runtime crypto builtin

- Added `packages/point/runtime/builtins/crypto.ts` with runtime-owned `sha256(value: string): string`, using Node SHA-256 hex output for stable idempotency-key material.
- Added `tests/runtime/builtins-crypto.test.ts` with known SHA-256 vectors, deterministic idempotency-key material coverage, and UTF-8 stability coverage.
- No fallback wiring, app-level externals, generated home-base artifacts, or long-lived runtime flags were introduced.
- Verification passed: `bun test tests/runtime/builtins-crypto.test.ts`; `bun test tests/runtime` also passed with the current R1 runtime tests.
- `bun run ci` was attempted and still stops at `fmt-check-all` on pre-existing repo-wide `.point` formatting issues before later gates run.
- No commit was made.

## 2026-05-26 - R1-E Home-base CLI hard route

- Wired `point run experiments/point-only/**` through `packages/point/runtime/index.ts` via `runModule(...)`; the home-base branch does not call the legacy temp-module run path.
- Wired `point test experiments/point-only/**` through `runPointRuntimeTests(...)`; home-base tests no longer write `generated/.point-tests/*.js`.
- Blocked home-base emit commands (`build`, `build-js`, `build-ast`, `build-ts`, `build-py`) with an explicit runtime-only error, and blocked legacy `point dev` for home base until runtime dev exists.
- Expanded `tests/point-only-experiment.test.ts` to cover runtime CLI routing, `point run` output, `point test` JSON success, and build emit blocking.
- Verification passed: `bun test tests/point-only-experiment.test.ts tests/runtime tests/run-bridge.test.ts`.
- File audit after verification: `rg --files experiments/point-only` reports only `point.json`, `README.md`, `src/app.point`, and `tests/score.test.point`; no generated or cache directory was created in the author tree.
- No commit was made.

## 2026-05-26 - R1-F Runtime experiment parity

- Added `tests/runtime/experiment-parity.test.ts` for the home-base experiment. It parses/checks `experiments/point-only/src/app.point`, evaluates deploy-readiness rule/label/calculation exports through `packages/point/runtime/`, and compares outputs against the existing core run-bridge emit+eval path.
- Covered complete, partial, and empty `Deploy Signals` inputs plus readiness label/tone threshold outputs.
- Fixed the runtime barrel export so direct `packages/point/runtime/index.ts` imports do not duplicate `bundleJavaScriptForEval`, `canBundleRunInMemory`, and `executeBundledEntry`.
- Added an in-process check assertion for `experiments/point-only/tests/score.test.point`; it required no changes.
- Verification:
  - `bun test tests/runtime/experiment-parity.test.ts` passed with the score-test check and runtime parity cases.
  - `bun test tests/runtime` passed.
  - `bun test tests/point-only-experiment.test.ts` passed.
- Direct `point check` retries for `experiments/point-only/src/app.point` and `experiments/point-only/tests/score.test.point` still fail before Point starts with `windows sandbox: spawn setup refresh`.
- Fallback audit over `experiments/point-only` and the new parity test found only policy README text and normal compiler/runtime imports; no app-level fallback or author JS was added.
- No commit was made.

## 2026-05-26 - R1 integrator (closed)

- Merged R1-A through R1-F. Home base runs **only** via `packages/point/runtime/index.ts` for `point run` and `point test`; emit build commands are blocked for `experiments/point-only/**`.
- **Parent shell verification (pass):**
  - `bun test tests/runtime/ tests/point-only-experiment.test.ts tests/run-bridge.test.ts` — 29 pass
  - `bun packages/point/src/cli.ts run experiments/point-only/src/app.point smoke` — `ready`
  - `bun packages/point/src/cli.ts test experiments/point-only/tests/score.test.point` — 5/5 pass
  - `bun packages/point/src/cli.ts check experiments/point-only/src/app.point` — pass
- Home-base author tree unchanged: `point.json`, `README.md`, `src/app.point`, `tests/score.test.point` only.
- **R1 note:** Runtime still uses emit+in-memory eval internally; builtins exist but are not wired to `std` yet — that is R2+ work.
- **Next:** Wave R2 (interpreter default, cut home-base emit internally).
- No commit was made.

## 2026-05-26 - R2-C Interpreter for-each and Maybe

- Read `docs/point-runtime-pivot.md` and kept the no-fallback policy: interpreter capability was added under `packages/point/runtime/`, with no app-level shim, author external, CLI fallback, or generated home-base artifact.
- Added `packages/point/runtime/interpreter/index.ts` with bytecode execution for stack values, records, calls, conditionals, assignments, `ITER_START`/`ITER_NEXT` for for-each loops, and `null` as the runtime value for `Maybe`/`none`.
- Exported `interpretPointIrFunction` and `PointRuntimeValue` from `packages/point/runtime/index.ts`.
- Added `tests/runtime/interpreter-for-each-maybe.test.ts` covering for-each accumulation parity, Maybe present/none parity, and experiment app rule/label parity through the bytecode interpreter against the existing emit oracle.
- Verification passed: `bun test tests/runtime/interpreter-for-each-maybe.test.ts`.
- Regression verification passed: `bun test tests/runtime/ir-lowering.test.ts tests/runtime/experiment-parity.test.ts tests/point-only-experiment.test.ts`.
- `bun run ci` was attempted and still stops at repo-wide `fmt-check-all` on pre-existing unformatted `.point` files in `compiler/passes/`, `examples/`, and `std/` before later CI stages run.
- Fallback audit over the new interpreter/test files and `experiments/point-only/` found only README/policy wording and a normal label branch named `"fallback"` in an inline Maybe test; no fallback code was introduced.
- No commit was made.

## 2026-05-26 - R2-D Emit/interpret parity

- Read `docs/point-runtime-pivot.md` and kept the no-fallback policy: R2-D adds runtime interpreter parity coverage, not app-tree JS, author externals, or runtime-to-emit fallback behavior.
- Added `tests/runtime/emit-interpret-parity.test.ts` covering every current `.point` file under `examples/pure/` and `experiments/point-only/`.
- The parity test compares JavaScript emit oracle results against `lowerCheckedCoreProgramToBytecode(...)` plus the runtime bytecode interpreter for pure math, home-base readiness rules/labels/command, and home-base score test helpers.
- Filled missing runtime interpreter exports needed by the parity surface (`interpretIrProgramEntry`, `interpretPointIrEntry`, `interpretCoreProgramEntry`, `PointInterpreterError`) while preserving the existing `interpretPointIrFunction` API.
- Verification passed:
  - `bun test tests/runtime/emit-interpret-parity.test.ts`
  - `bun test tests/runtime`
  - `bun test tests/point-only-experiment.test.ts`
  - `bun run check`
- `bun run ci` was attempted; it still stops at `fmt-check-all` on repo-wide unformatted `.point` files in `compiler/passes/`, `examples/`, and `std/` before later CI steps run.
- Fallback audit over the new parity test, runtime interpreter, and `experiments/point-only/` found only README policy text; no fallback flag, app-level external, generated home-base artifact, or author JS was introduced.
- No commit was made.

## 2026-05-26 - R2 closed (parent shell verification)

- **Parent shell verification (pass):**
  - `bun test tests/runtime/ tests/point-only-experiment.test.ts` — 29 pass
  - `bun packages/point/src/cli.ts run experiments/point-only/src/app.point smoke` — `ready`
  - `bun packages/point/src/cli.ts test experiments/point-only/tests/score.test.point` — 5/5 pass
  - `bun packages/point/src/cli.ts check experiments/point-only/src/app.point` — pass
- Home base now runs through `interpretCoreProgramEntry` (bytecode interpreter); no emit+eval in `runtime/index.ts`.
- **Next:** Wave R3 (owned HTTP + `point dev` without Vite for home base).
- No commit was made.

## 2026-05-26 - R3-C Home-base runtime dev branch

- Read `docs/point-runtime-pivot.md` and kept the no-fallback policy: `point dev experiments/point-only/**` now enters `packages/point/runtime/` directly, not legacy emit/dev or Vite.
- Added runtime-owned dev serving via `runPointRuntimeDev(...)` and `createPointRuntimeDevFetchHandler(...)` in `packages/point/runtime/server.ts`, preserving the existing runtime route registry.
- Updated `packages/point/src/core/cli.ts` so home-base `point dev` loads/checks the Point program and calls `runPointRuntimeDev(...)`; non-home-base dev still uses the existing `runPointDev(...)` path.
- Expanded `tests/point-only-experiment.test.ts` to spawn `point dev experiments/point-only/src/app.point`, fetch the runtime dev JSON endpoint, invoke the `smoke` command through `/runtime/command/smoke`, and confirm no generated author artifact appears.
- Verification passed:
  - `bun test tests/point-only-experiment.test.ts`
  - `bun test tests/runtime`
  - `bun test tests/point-dev.test.ts`
  - `bun run check`
- `bun run ci` was attempted; it still stops at repo-wide `fmt-check-all` on unformatted `.point` files in `compiler/passes/`, `examples/`, and `std/` before later CI steps run.
- Fallback/Vite audit over the changed runtime server, runtime index, CLI, home-base guard test, and `experiments/point-only/` confirmed the home-base branch calls `runPointRuntimeDev(...)` before `runPointDev(...)`; Vite references remain only in legacy non-home-base dev code and policy/guard text.
- No commit was made.

## 2026-05-26 - R3-B Runtime route registry

- Read `docs/point-runtime-pivot.md` and kept the no-fallback policy: route handling stays in `packages/point/runtime/`, with no app-level JS, generated home-base server, or emitted `Bun.serve` string in `experiments/point-only/`.
- Extended the runtime interpreter with runtime-owned `pointJsonResponse(...)` handling for `return json` route bodies.
- Added/extended `packages/point/runtime/server.ts` route registration over checked programs: semantic routes are matched by method/path, middleware `before` chains run before handlers, route inputs are built from path/query/body/headers, and handlers execute through `interpretCoreProgramEntry`.
- Exported `registerRuntimeRoutes` and `createPointRuntimeFetchHandler` from `packages/point/runtime/index.ts`.
- Added `GET /readiness` to `experiments/point-only/src/app.point`, returning JSON with deploy readiness `score`, `label`, and `tone` from Point rules/labels.
- Added `tests/runtime/server-routes.test.ts` covering middleware registration, route handler execution, the experiment JSON route, and absence of `Bun.serve` strings in the experiment app tree.
- Verification passed: `bun test tests/runtime/server-routes.test.ts`.
- Regression verification passed: `bun test tests/point-only-experiment.test.ts tests/runtime/interpreter.test.ts tests/runtime/emit-interpret-parity.test.ts`.
- Full runtime suite passed: `bun test tests/runtime`.
- Core check passed: `bun run check`.
- Focused CLI check of `experiments/point-only/src/app.point` could not start in the Codex Windows sandbox (`windows sandbox: spawn setup refresh`), but the server route test parses and checks the same file with `checkPointCore` before registering routes.
- `bun run ci` was attempted and still stops at repo-wide `fmt-check-all` on pre-existing unformatted `.point` files in `compiler/passes/`, `examples/`, and `std/` before later CI stages run.
- Fallback audit over `experiments/point-only/` found no `Bun.serve`, generated artifacts, app-level JS externals, runtime shims, fallback flags, or emit fallback strings.
- No commit was made.

## 2026-05-26 - R3-A Runtime-owned HTTP server

- Added `startPointRuntimeServer(...)` in `packages/point/runtime/server.ts` as the runtime-owned Bun HTTP server surface over `createPointRuntimeFetchHandler(...)`.
- Exported `startPointRuntimeServer`, `PointRuntimeServer`, and `PointRuntimeServerOptions` from `packages/point/runtime/index.ts`.
- Added `tests/runtime/server.test.ts` covering route metadata discovery, direct runtime fetch handling, 404s, and a real ephemeral Bun server for `examples/route.point`.
- Verification passed: `bun test tests/runtime/server.test.ts tests/runtime/server-routes.test.ts`.
- Focused runtime/home-base verification passed: `bun test tests/point-only-experiment.test.ts tests/runtime/server.test.ts tests/runtime/server-routes.test.ts tests/runtime/experiment-parity.test.ts tests/runtime/emit-interpret-parity.test.ts tests/runtime/interpreter-for-each-maybe.test.ts tests/runtime/interpreter.test.ts tests/runtime/ir-lowering.test.ts`.
- Core check passed: `bun run check`.
- `bun run ci` was attempted and still stops at repo-wide `fmt-check-all` on pre-existing unformatted `.point` files in `compiler/passes/`, `examples/`, and `std/` before later CI stages run.
- No commit was made.

## 2026-05-26 - R3 integrator

- Closed the remaining home-base HTTP fallback gap by routing `point serve experiments/point-only/**` through `runPointRuntimeServe(...)` in `packages/point/runtime/server.ts` instead of legacy `runPointServe(...)`.
- Added process-level coverage that starts `point serve experiments/point-only/src/app.point`, fetches `/readiness`, verifies the runtime JSON route response, and confirms no generated author artifact appears.
- Marked R3 done in `docs/point-runtime-pivot.md` and the wave checklist above.
- Verification passed: `bun test tests/point-only-experiment.test.ts tests/runtime/server.test.ts tests/runtime/server-routes.test.ts`.
- R3 regression verification passed: `bun test tests/runtime tests/point-only-experiment.test.ts tests/point-dev.test.ts`.
- Core check passed: `bun run check`.
- `bun run ci` was attempted and still stops at repo-wide `fmt-check-all` on pre-existing unformatted `.point` files in `compiler/passes/`, `examples/`, and `std/` before later CI stages run.
- Fallback audit found home-base `dev` and `serve` branch to runtime before legacy dev/serve; remaining emit/Vite matches are legacy non-home-base paths, runtime test guard text, runtime eval-oracle files not exported for home-base execution, and policy docs.
- No commit was made.

## 2026-05-26 - R3 closed (parent shell verification)

- **Parent shell verification (pass):**
  - `bun test tests/runtime/ tests/point-only-experiment.test.ts` — 38 pass (includes `point dev` + `point serve` guard tests)
  - `bun packages/point/src/cli.ts run experiments/point-only/src/app.point smoke` — `ready`
  - `bun packages/point/src/cli.ts test experiments/point-only/tests/score.test.point` — 5/5 pass
  - `bun packages/point/src/cli.ts check experiments/point-only/src/app.point` — pass
- Home base: run, test, dev, serve, and HTTP routes all through `packages/point/runtime/` — no author-tree emit.
- **Next:** Wave R4 (owned SSR — no React/Vite for home base).
- No commit was made.

## 2026-05-26 - R4-B Runtime SSR form POST

- Read `docs/point-runtime-pivot.md` and kept the no-fallback policy: form handling stays in `packages/point/runtime/ssr/`, with no app-level JS, React/Vite/Next fallback, or generated home-base artifacts.
- Added a Point-authored readiness form/page to `experiments/point-only/src/app.point`; the form posts release-signal checkboxes to `/` with `submit "Check readiness" POST "/" body signals`.
- Reconciled `renderPointRuntimePage(...)` in `packages/point/runtime/ssr/index.ts` so runtime SSR keeps existing navigation GET rendering and handles the home-base readiness form POST in the same owned SSR entrypoint.
- Runtime SSR POST parsing reads `application/x-www-form-urlencoded` / multipart form data, converts checkbox fields into the `Deploy Signals` record shape, and evaluates `deploy readiness`, `readiness label`, and `readiness tone` through `interpretCoreProgramEntry`; rule logic remains in `.point`.
- Verification passed: `bun test tests/runtime/experiment-e2e.test.ts`.
- Regression verification passed: `bun test tests/runtime/server.test.ts tests/runtime/server-routes.test.ts`.
- Full runtime suite passed: `bun test tests/runtime`.
- Home-base author-surface guard passed: `bun test tests/point-only-experiment.test.ts`.
- Core check passed: `bun run check`.
- `bun run ci` was attempted and still stops at repo-wide `fmt-check-all` on pre-existing unformatted `.point` files in `compiler/passes/`, `examples/`, and `std/` before later CI stages run.
- Fallback audit over `experiments/point-only/`, runtime SSR, and runtime server found no app-level JS, generated home-base artifacts, React/Vite/Next fallback, runtime shim, fallback flag, or emitted server string in the experiment path; `Bun.serve` remains only inside `packages/point/runtime/server.ts`.
- No commit was made.

## 2026-05-26 - R4-D Block home-base TypeScript/Vite path

- Read `docs/point-runtime-pivot.md` and applied the no-fallback policy: home base must not fall through to emitted TypeScript or Vite app tooling.
- Updated `packages/point/src/core/cli.ts` so `point build-app experiments/point-only/**` calls `blockHomeBaseEmit(...)` before `runPointBuildApp(...)`, preventing the app builder from invoking `emit-typescript` or spawning Vite for home base.
- Extended `tests/point-only-experiment.test.ts` to enforce the branch order, block `point build-ts experiments/point-only/src/app.point`, block `point build-app experiments/point-only/src/app.point`, and assert the `build-app` error is the runtime-only block rather than a Vite config/build error.
- Verification passed: `bun test tests/point-only-experiment.test.ts`.
- `bun run ci` was attempted and still stops at repo-wide `fmt-check-all` on pre-existing unformatted `.point` files in `compiler/passes/`, `examples/`, and `std/` before later CI stages run.
- No commit was made.

## 2026-05-26 - R4-E Runtime experiment e2e

- Added `tests/runtime/experiment-e2e.test.ts`; it starts `startPointRuntimeServer(...)`, fetches the experiment SSR page, submits the readiness form, and asserts the rendered Point rule output (`100 ready positive`).
- Wired the runtime server to serve an owned SSR/form response for the home-base readiness surface from `packages/point/runtime/ssr/index.ts`; no app-tree JS, React, Vite, or generated author artifact was added.
- Verification passed:
  - `bun test tests/runtime/experiment-e2e.test.ts`
  - `bun test tests/runtime/server.test.ts tests/runtime/server-routes.test.ts`
  - `bun test tests/runtime tests/point-only-experiment.test.ts`
  - `bun test tests/runtime/ssr.test.ts tests/runtime/experiment-e2e.test.ts`
  - `bun run check`
- Fallback/author audit passed: `rg --files experiments/point-only` still reports only `point.json`, `README.md`, `src/app.point`, and `tests/score.test.point`; search found only policy text/imports and runtime-owned server code.
- `bun run ci` was attempted and still stops at repo-wide `fmt-check-all` on pre-existing unformatted `.point` files in `compiler/passes/`, `examples/`, and `std/` before later CI stages run.
- No commit was made.

## 2026-05-26 - R4-A Runtime SSR renderer

- Added `packages/point/runtime/ssr/index.ts` with runtime-owned HTML rendering for checked Point view, page, and layout functions.
- SSR now evaluates core expressions, calls non-UI Point functions through the runtime interpreter when needed, renders view return fragments with class/style tokens, renders page title/description/main sections, composes layout slots, escapes text/attributes, and exposes navigation-backed page responses via `renderPointRuntimePage(...)`.
- Exported `pointSsrRenderables`, `renderPointViewToHtml`, `renderPointPageToHtml`, and `renderPointSsrEntryToHtml` from `packages/point/runtime/index.ts`.
- Added `tests/runtime/ssr.test.ts` covering escaped view HTML, conditional view branches, page/layout HTML composition, and rendering by semantic or function entry.
- Verification passed: `bun test tests/runtime/ssr.test.ts`.
- Runtime suite passed: `bun test tests/runtime` (36 pass, including existing runtime SSR e2e coverage).
- Home-base guard passed: `bun test tests/point-only-experiment.test.ts`.
- Core check passed: `bun run check`.
- Broader combined run `bun test tests/runtime tests/point-only-experiment.test.ts tests/point-dev.test.ts` had all runtime/home-base tests pass but `tests/point-dev.test.ts` still failed its legacy non-home-base dev reload case with `ConnectionRefused`; rerunning `tests/point-dev.test.ts` alone reproduced the same startup failure.
- `bun run ci` was attempted and still stops at repo-wide `fmt-check-all` on pre-existing unformatted `.point` files in `compiler/passes/`, `examples/`, and `std/` before later CI stages run.
- No commit was made.

## 2026-05-26 - R4-C Runtime SSR navigation and links

- Added runtime-owned SSR link rendering in `packages/point/runtime/ssr/index.ts`: Point view `link` declarations now emit normal `<a>` tags with `point-link` / `point-link-active` classes and no client router dependency.
- Kept `renderPointRuntimePage(...)` on the runtime boundary: GET navigation routes render Point pages with the request path threaded through SSR for active links, while the existing home-base `/` readiness form fallback and POST handling remain intact.
- Added `/readiness-ui` to `experiments/point-only/src/app.point` as a Point-authored navigation route that links to the SSR page and the `/readiness` JSON route.
- Extended `tests/runtime/ssr.test.ts` and `tests/runtime/experiment-e2e.test.ts` to assert SSR navigation links, active state, and absence of `react-router-dom`, `NavLink`, and `RouterProvider`.
- Verification passed:
  - `bun test tests/runtime/ssr.test.ts tests/runtime/experiment-e2e.test.ts`
  - `bun test tests/runtime`
  - `bun test tests/point-only-experiment.test.ts`
  - `bun run check`
- React Router audit passed for runtime/home-base/test touchpoints: `rg -n "react-router-dom|NavLink|RouterProvider" packages/point/runtime experiments/point-only tests/runtime/ssr.test.ts tests/runtime/experiment-e2e.test.ts` found only negative test assertions.
- `bun run ci` was attempted and still stops at repo-wide `fmt-check-all` on pre-existing unformatted `.point` files in `compiler/passes/`, `examples/`, and `std/` before later CI stages run.
- No commit was made.

## 2026-05-26 - Transition: runtime-app default template

- Added `packages/point/templates/runtime-app/` and set `point create` default to `runtime-app` (`point.json` `runtime: "owned"`).
- Generalized CLI routing from `experiments/point-only/**` path checks to manifest-based `isRuntimeNativeInput` / `blockRuntimeNativeEmit`.
- Updated quick-start, external pilot checklist, and pivot docs for runtime-native default; legacy templates remain via `--template full-stack-app` / `saas-app`.
- Added `tests/runtime-project.test.ts` and onboarding coverage for runtime-app scaffold + run/test.

- Merged R4-A through R4-E. Home base is fully in-box: interpreter + HTTP + SSR + forms + navigation, no author JS, no React/Vite, no emit fallbacks.
- **Parent shell verification (pass):**
  - `bun test tests/runtime/ tests/point-only-experiment.test.ts` — 45 pass (includes SSR e2e, Vite/TS build blocks)
  - Home-base author tree: `point.json`, `README.md`, `src/app.point`, `tests/score.test.point` only
- **Pivot exit gate:** all home-base criteria met except repo-wide `bun run ci` fmt noise.
- **Next phase:** expand owned runtime to templates/product, interpreter coverage, std wiring, release.
- No commit was made.

## 2026-05-26 - R4 integrator verification refresh

- Re-read the pivot and progress gates; R4-A through R4-E are present, and the progress-log pivot exit gate is marked complete for the home-base invariants.
- Updated `docs/point-runtime-pivot.md` status to "Pivot complete for home base."
- Current author-tree audit passed: `rg --files experiments/point-only` reports only `README.md`, `point.json`, `src/app.point`, and `tests/score.test.point`.
- Current runtime/home-base verification passed: `bun test tests/runtime tests/point-only-experiment.test.ts` (45 pass).
- Current core check passed: `bun run check`.
- Current full CI attempt still stops at repo-wide `fmt-check-all` on pre-existing unformatted `.point` files in `compiler/passes/`, `examples/`, and `std/`; this remains outside the home-base pivot exit criteria documented in the plan.
- Direct CLI proof commands for home-base `check`, `run`, and `test` were retried in Codex but failed before Point started with the Windows sandbox `spawn setup refresh` error; the passing home-base guard test covers those runtime-routed CLI paths.
- No commit was made.

## 2026-05-26 - Post-pivot P1-B docs: runtime default

- Updated `docs/site/reference/cli.md` so `point create` defaults to `runtime-app`, documents `point.json` `runtime: "owned"` as the app ownership boundary, and explains that run/test/dev/serve use `packages/point/runtime/` for runtime-owned apps.
- Documented legacy template flags in the CLI reference: `--template full-stack-app`, `--template saas-app`, and `--template vercel-app` keep the Vite/React/generated-host workflow during transition.
- Updated `docs/product-map.md` so product messaging names runtime-owned apps as the default workflow, adds a runtime-app target row, and records `point.json` `runtime: "owned"` as the ownership switch.
- No code changes or commits were made for this docs-only checkpoint.

## 2026-05-26 - Post-pivot P1-A site guide defaults

- Updated `docs/site/guide/quick-start.md`, `docs/site/guide/point-in-60-seconds.md`, and `docs/site/guide/golden-app-demo.md` so the default scaffold path is `point create <app>` with the runtime-owned `runtime-app` template and `point dev src/app.point`.
- Removed default-path `localhost:5173` / Vite UI guidance from those three guide pages; the default instructions now tell users to open the URL printed by `point dev`.
- Documented legacy React/Vite templates as explicit opt-ins: `point create <app> --template full-stack-app` and `point create <app> --template saas-app`.
- Verification: `rg -n 'point create|point dev|5173|3456|Vite|vite|React|full-stack-app|saas-app|runtime-app' docs/site/guide/quick-start.md docs/site/guide/point-in-60-seconds.md docs/site/guide/golden-app-demo.md` shows Vite/React only in legacy-template context and no `5173`/`:5173` hits.
- No commit was made.

## 2026-05-26 - Post-pivot P1-C Standalone template docs

- Updated `docs/site/ecosystem/standalone-template.md` so `runtime-app` is documented as the canonical `point create` default.
- Reframed `full-stack-app` as the opt-in legacy emit + Vite template, with explicit `--template full-stack-app` usage.
- Updated monorepo references: canonical runtime template is `packages/point/templates/runtime-app/`; legacy full-stack remains `packages/point/templates/full-stack-app/`.
- Wording audit passed: `rg -n "full-stack-app.*default|default.*full-stack-app|runtime-app|legacy emit \\+ Vite|full-stack-app" docs/site/ecosystem/standalone-template.md` shows `runtime-app` as default and `full-stack-app` only as legacy.
- `bun run check-docs` was attempted twice but failed before Bun started with the Windows sandbox `spawn setup refresh` error.
- No commit was made.
## 2026-05-26 - Post-pivot P1-B Docs runtime app default

- Updated `docs/site/reference/cli.md` to document `runtime-app` as the default `point create` template, `point.json` `runtime: "owned"` as the runtime-owned app boundary, and legacy host templates as explicit `--template full-stack-app` / `saas-app` / `vercel-app` opt-ins.
- Updated CLI command rows for `dev`, `serve`, and `build-app`: runtime-owned apps run through `packages/point/runtime/`; legacy apps keep Vite/static emit paths; runtime-owned app-build/emit paths are blocked.
- Updated `docs/product-map.md` so runtime-owned apps are the default app workflow, JavaScript/TypeScript emit are legacy/non-runtime targets, and the product map has a runtime ownership section for `point.json`.
- Verification: documentation search confirmed `runtime-app`, `runtime: "owned"`, and legacy template flags are present in both requested docs.
- No commit was made.

## 2026-05-26 - Post-pivot P2-B Runtime std.text/std.json dispatch

- Wired the interpreter to resolve IR externals through `packages/point/runtime/std-dispatch.ts` before looking for Point functions, using each external's std module path and import alias; runtime-owned execution no longer needs emitted std imports for `std.text` or `std.json`.
- Added runtime-owned `std.json` builtins and completed the `std.text` runtime builtin names used by `std/text.point` (`textLength`, `textContains`, `textSplit`, `textTrim`, `textFromInt`, `textPadStart`).
- Added `tests/runtime/std-text-json.test.ts`; it loads a real `capabilities text json` Point module through the module graph, checks it, lowers it, confirms std externals are present, and interprets text/json calls against runtime builtin parity expectations.
- Verification passed:
  - `bun test tests/runtime/std-text-json.test.ts`
  - `bun test tests/runtime/interpreter.test.ts tests/runtime/server-routes.test.ts`
  - `bun test tests/runtime`
  - `bun test tests/point-only-experiment.test.ts`
  - `bun run check`
- Audit: search over `packages/point/runtime/interpreter`, `packages/point/runtime/std-dispatch.ts`, runtime builtins, and the new test found no `emitPointCoreJavaScript` or `bundleJavaScriptForEval` dependency in the runtime std dispatch path.
- No commit was made.

## 2026-05-26 - Post-pivot P2-A Runtime std dispatch contract

- Added `packages/point/runtime/std-dispatch.ts` as the runtime-owned dispatch table for `use std.text`, `use std.json`, `use std.http`, and `use std.time`; module names plus std external import aliases resolve to functions under `packages/point/runtime/builtins/`.
- Added runtime-owned `std.http` and `std.time` builtin modules, exported the dispatch surface from `packages/point/runtime/index.ts`, and kept existing `std.text` / `std.json` runtime dispatch compatibility.
- Documented the dispatch contract in `docs/point-runtime-pivot.md`: std dispatch stays inside runtime, unknown modules/functions return `undefined`, async std host boundaries must be awaited by interpreter wiring, and new std capabilities extend runtime builtins rather than app-tree shims or emit fallbacks.
- Added `tests/runtime/std-dispatch.test.ts` covering the four-module dispatch table, npm-style std source normalization, lowered core call aliases, and unknown std entries.
- Verification passed:
  - `bun test tests/runtime/std-dispatch.test.ts tests/runtime/std-text-json.test.ts`
  - `bun test tests/runtime`
- Audit over the new dispatch/builtin/test/doc touchpoints found no runtime dependency on emit JavaScript, emit TypeScript, eval bundling, or Vite outside policy text.
- No commit was made.

## 2026-05-26 - Post-pivot P2-B verification follow-up

- Cleaned duplicate `std.text` runtime builtin declarations so each std text function has one runtime-owned implementation.
- Updated the existing runtime-owned app guard to expect async interpreter entrypoints after std host-boundary support.
- Fixed the existing `tests/runtime/std-http.test.ts` inline Point module to load its real `use std.http` dependency graph before checking/interpreting, matching the P2-B std text/json parity setup.
- Final verification passed:
  - `bun test tests/runtime/std-text-json.test.ts`
  - `bun test tests/runtime/std-text-json.test.ts tests/runtime/std-dispatch.test.ts tests/runtime/builtins-text.test.ts`
  - `bun test tests/runtime/std-http.test.ts`
  - `bun test tests/runtime`
  - `bun test tests/point-only-experiment.test.ts`
  - `bun run check`
- No commit was made.

## 2026-05-26 - Post-pivot P2-C Runtime std.http helpers

- Wired runtime execution for `std.http` fetch/response helpers through `packages/point/runtime/`: HTTP helper functions live under `runtime/builtins/http.ts`, resolve through `runtime/std-dispatch.ts`, and are executed by async runtime interpreter entrypoints.
- Updated runtime app execution paths (`runModule`, runtime tests, and runtime HTTP/dev route execution) to await `interpretCoreProgramEntryAsync(...)`, so runtime-owned apps can cross async std host boundaries without falling back to emit.
- Added `tests/runtime/std-http.test.ts` covering runtime-owned helper behavior (`httpFetch`, `httpGet`, `httpPost`, status/body assertions) and a real `use std.http` Point module interpreted through the runtime dependency graph.
- Verification passed:
  - `bun test tests/runtime/std-http.test.ts`
  - `bun test tests/runtime/std-dispatch.test.ts tests/runtime/std-text-json.test.ts`
  - `bun test tests/runtime`
  - `bun test tests/point-only-experiment.test.ts`
  - `bun run check`
- A direct `bun -e` runtime barrel import smoke command was retried but failed before Bun started with the Windows sandbox `spawn setup refresh` error; the runtime test suite imports the same runtime barrel successfully.
- No commit was made.

## 2026-05-26 - Post-pivot P2 integrator

- Merged the post-pivot std wiring state: `std.text`, `std.json`, `std.http`, and `std.time` resolve through `packages/point/runtime/std-dispatch.ts` to runtime-owned builtins.
- Confirmed runtime-owned execution paths (`point run`, `point test`, runtime dev command endpoint, runtime HTTP routes) use async interpreter entrypoints so `use std.*` does not require emitted npm imports.
- Expanded `tests/runtime/std-text-json.test.ts` with a runtime-owned app boundary check: a temporary `point.json` `runtime: "owned"` app using `capabilities text json` runs through `point run` and leaves no app-tree `generated/` or `.point-cache`.
- Marked P2 done in `docs/point-runtime-pivot.md` and the post-pivot checklist above.
- Verification passed:
  - `bun test tests/runtime/std-text-json.test.ts`
  - `bun test tests/runtime`
  - `bun test tests/point-only-experiment.test.ts`
  - `bun run check`
- Audit found no `emitPointCoreJavaScript` or `bundleJavaScriptForEval` dependency in the runtime std dispatch/interpreter/builtin path.
- No commit was made.

## 2026-05-26 - Post-pivot P1 integrator

- Verified 0.2.1 runtime-native default wording across README, package README, site guide pages, CLI reference, standalone-template docs, dev/deploy docs, product map, vision, changelog, and external pilot checklist.
- Updated remaining stale public docs so `point create` defaults to `runtime-app` / `point.json` `runtime: "owned"`; legacy Vite/React templates are documented as explicit `--template full-stack-app` / `--template saas-app` opt-ins.
- Strict stale-wording audit passed with no hits for the old full-stack/Vite/0.1.55 default-path phrases.
- Remaining `:5173`, Vite, and React references are scoped to legacy template or historical docs.
- Marked P1 done in the post-pivot checklist above.
- `bun run check-docs` was retried three times but failed before Bun started with the Windows sandbox `spawn setup refresh` error; a direct `bun --version` smoke command failed the same way.
- No commit was made.

## 2026-05-27 - Post-pivot P3-A Runtime SaaS template

- Added `packages/point/templates/runtime-saas-app/` with `point.json` `runtime: "owned"`, Point-only `src/app.point`, package scripts, README, and `.gitignore`; the template has no `web/` directory, Vite host, or generated app tree.
- Wired `point create --template runtime-saas-app` through `packages/point/src/core/app-cli.ts` and documented the template in README/package README, CLI reference, standalone-template docs, and product map.
- Added runtime-owned std dispatch for `std.auth` and `std.sql`; SQLite now runs through `packages/point/runtime/builtins/sql.ts`, with auth helpers in `packages/point/runtime/builtins/auth.ts`.
- Added `tests/runtime-saas-template.test.ts` covering scaffold shape, CLI `point create --template runtime-saas-app`, runtime-owned `point run`, SQLite init/query, login token issuance, auth middleware rejection, protected member creation, and member listing through the runtime route handler.
- Updated `tests/app-new-cli.test.ts` and `tests/runtime/std-dispatch.test.ts` for the new template and std dispatch modules.
- Verification passed:
  - `bun test tests/runtime-saas-template.test.ts tests/runtime/std-dispatch.test.ts`
  - `bun test tests/app-new-cli.test.ts -t 'runtime SaaS|runtime-saas-app'`
  - `bun run check`
  - `git diff --check -- packages/point/src/core/app-cli.ts packages/point/runtime/std-dispatch.ts packages/point/runtime/builtins/sql.ts packages/point/runtime/builtins/auth.ts packages/point/templates/runtime-saas-app tests/runtime-saas-template.test.ts tests/app-new-cli.test.ts tests/runtime/std-dispatch.test.ts README.md packages/point/README.md docs/site/reference/cli.md docs/site/ecosystem/standalone-template.md docs/product-map.md`
- Direct `bun packages/point/src/cli.ts create --list-templates` and `bun run check-docs` smoke commands were retried but failed before Bun started with the Windows sandbox `spawn setup refresh` error; the runtime-saas test covers the CLI create template path directly.
- No commit was made.

## 2026-05-27 - Post-pivot P4-A fmt-check-all start

- Captured the authoritative `bun run fmt-check` failure list. All reported unformatted files are in the requested scope: `compiler/passes/*.point`, `examples/**/*.point`, and `std/*.point`.
- `bun run check` passed after the fmt-check failure, confirming the current blocker is formatting rather than Point semantic checks.
- Formatting commands (`bun run fmt`, `bun packages/point/src/cli.ts fmt-all`, and targeted `point fmt` loops) were retried but repeatedly failed before Bun started with the Windows sandbox `spawn setup refresh` error.
- Follow-up retries confirmed the same blocker: `fmt-check` can sometimes start and still reports the same all-in-scope list, but `fmt-all`, targeted `fmt`, temporary Bun formatter runners, and temporary PowerShell normalization runners fail before execution with `spawn setup refresh`.
- P4-A remains open until the formatter can run, `bun run fmt-check` passes, and the full `bun run ci` gate is verified.
- No commit was made.

## 2026-05-27 - Post-pivot P4-A closed (parent shell)

- **Codex blocker (not a code failure):** `fmt-all` / targeted `point fmt` failed in Windows Codex with `spawn setup refresh` before Bun started.
- **Parent shell:** `bun packages/point/src/cli.ts fmt-all` wrote 81 files; `bun run fmt-check` and `bun run check` both pass.
- P4-A formatting gate is green; full `bun run ci` not re-run here.
- Formatted `.point` files are unstaged until user requests commit.
- No commit was made.

## 2026-05-27 - Post-pivot P4 integrator

- P4-B legacy deprecation notes present in `app-cli.ts`, `full-stack-app/README.md`, and `vercel-app/README.md`.
- P4-A fmt gate closed via parent shell (see above).
- **Post-pivot P4:** done pending commit + optional full CI run.

## 2026-05-27 - Post-pivot P4-B Legacy template deprecation notes

- Updated `packages/point/src/core/app-cli.ts` template-list descriptions so `full-stack-app` and `vercel-app` are explicitly legacy emit + Vite compatibility templates.
- Added deprecation notes to `packages/point/templates/full-stack-app/README.md` and `packages/point/templates/vercel-app/README.md`, pointing new apps to `runtime-app` or `runtime-saas-app`.
- Verification: targeted documentation/code search confirmed both legacy template descriptions and README deprecation notes are present.
- No commit was made.

## 2026-05-27 - Post-pivot P6-A Runtime fs/env/path std dispatch

- Added runtime-owned builtins for `std.fs`, `std.path`, and `std.env` under `packages/point/runtime/builtins/`, mirroring the raw exports from `packages/point/std/fs.point`, `packages/point/std/path.point`, and `packages/point/std/env.point`.
- Extended `packages/point/runtime/std-dispatch.ts` with `std.fs`, `std.path`, and `std.env` dispatch tables plus lowered call aliases for `readFileRaw`, `writeFileRaw`, `joinPaths`, `pathBasename`, `pathDirname`, `pathExtname`, `resolvePath`, `pathIsAbsolute`, and `envGetRaw`.
- Exported the new runtime builtins from `packages/point/runtime/index.ts`.
- Added `tests/runtime/builtins-fs-env-path.test.ts` covering direct builtin behavior and Point modules using `capabilities fs env path` through the runtime interpreter.
- Updated `tests/runtime/std-dispatch.test.ts` to assert the expanded dispatch table and alias resolution.
- Verification passed:
  - `bun test tests/runtime/builtins-fs-env-path.test.ts tests/runtime/std-dispatch.test.ts`
  - `bun run check`
  - `git diff --check -- packages/point/runtime/builtins/fs.ts packages/point/runtime/builtins/path.ts packages/point/runtime/builtins/env.ts packages/point/runtime/std-dispatch.ts packages/point/runtime/index.ts tests/runtime/builtins-fs-env-path.test.ts tests/runtime/std-dispatch.test.ts`
- Broader `bun test tests/runtime` was attempted; the new fs/env/path runtime tests passed, but two existing `runtime-saas-app` tests still fail while checking/parsing `sql json rows list(await query member rows())`.
- No commit was made.

## 2026-05-27 - Post-pivot P6-D Runtime SaaS std.sql cleanup

- Rewrote `packages/point/templates/runtime-saas-app/src/app.point` so the scaffolded app uses `capabilities auth sql` and no longer declares local `external point std sql` imports from `@hatchingpoint/point/std/...`.
- Moved SQL row/member JSON decode helpers behind `std.sql` Point declarations in both `std/sql.point` and `packages/point/std/sql.point`, so the template can call `sql json rows list(...)` and `sql json member row(...)` through capabilities.
- Extended `tests/runtime-saas-template.test.ts` to assert scaffolded runtime SaaS app source contains `capabilities auth sql` and does not contain `@hatchingpoint/point/std/` or `external point std`.
- Verification passed:
  - `bun test tests/runtime-saas-template.test.ts`
  - `rg -n "@hatchingpoint/point/std/|external point std" packages/point/templates/runtime-saas-app/src/app.point` returned no matches.
- No commit was made.

## 2026-05-27 - Post-pivot P5 integrator

- Ran `bun run ci` in the parent shell; the gate passed end to end: fmt/check/docs, JS/TS/AST/Python builds, point tests, 847 Bun tests, benchmark gates, VS Code build, and VSIX package.
- Closed the pivot exit-gate CI checkbox above.
- Updated `docs/product-map.md` release anchor to `v0.2.2`.
- No commit was made.

## 2026-05-27 - Post-pivot P6-B1 Runtime crypto/yaml std dispatch

- Expanded `packages/point/runtime/builtins/crypto.ts` to mirror `packages/point/std/crypto.point` raw exports: `cryptoSha256`, `cryptoHmacSha256`, `cryptoJwtSign`, `cryptoJwtVerify`, and `cryptoJwtIsValid`, while preserving the existing `sha256` helper.
- Added `packages/point/runtime/builtins/yaml.ts` mirroring `packages/point/std/yaml.point` raw exports: `yamlParse` and `yamlStringify`.
- Extended `packages/point/runtime/std-dispatch.ts` with `std.crypto` and `std.yaml` dispatch tables plus lowered aliases for the raw std import names.
- Exported the new runtime crypto/yaml helpers from `packages/point/runtime/index.ts`.
- Added `tests/runtime/builtins-crypto-yaml.test.ts` covering direct runtime helper behavior and Point modules using `capabilities crypto yaml` through the runtime interpreter.
- Updated `tests/runtime/std-dispatch.test.ts` for the expanded runtime std module set; preserved existing `std.money` and `std.stream` entries already present in the worktree.
- Verification passed:
  - `bun test tests/runtime/builtins-crypto-yaml.test.ts tests/runtime/std-dispatch.test.ts tests/runtime/builtins-crypto.test.ts`
  - `bun test tests/runtime` (58 pass)
  - `git diff --check -- packages/point/runtime/builtins/crypto.ts packages/point/runtime/builtins/yaml.ts packages/point/runtime/std-dispatch.ts packages/point/runtime/index.ts tests/runtime/builtins-crypto-yaml.test.ts tests/runtime/std-dispatch.test.ts`
- No commit was made.

## 2026-05-27 - Post-pivot P6-B2 Runtime money/stream std dispatch

- Added runtime-owned `packages/point/runtime/builtins/money.ts` with `formatCentsUsd(...)`, mirroring `packages/point/std/money.point` / `packages/point/src/std/money.ts`.
- Added runtime-owned `packages/point/runtime/builtins/stream.ts` with `streamReadText`, `streamWriteText`, `streamReadLines`, `streamWriteLines`, and `streamJoinLines`, mirroring `packages/point/std/stream.point` / `packages/point/src/std/stream.ts`.
- Extended `packages/point/runtime/std-dispatch.ts` with `std.money` and `std.stream` dispatch tables plus lowered raw aliases: `formatCentsUsdRaw`, `streamReadTextRaw`, `streamWriteTextRaw`, `streamReadLinesRaw`, `streamWriteLinesRaw`, and `streamJoinLinesRaw`.
- Added `tests/runtime/builtins-money-stream.test.ts` covering direct builtin behavior, dispatch table exports, normalized package std resolution, and lowered alias dispatch.
- Verification passed:
  - `bun test tests/runtime/builtins-money-stream.test.ts`
  - `bun test tests/runtime` (58 pass)
- No commit was made.

## 2026-05-27 - Post-pivot P6-C Runtime process/image/pty/ai std dispatch

- Added runtime-owned builtins for `std.process`, `std.image`, `std.pty`, and `std.ai` under `packages/point/runtime/builtins/`, mirroring the raw host exports from the corresponding `packages/point/std/*.point` modules.
- Extended `packages/point/runtime/std-dispatch.ts` with dispatch tables and lowered-call aliases for process spawn/streaming, image metadata/resize, PTY spawn/write/streaming, and OpenAI/Anthropic complete/stream calls.
- Exported the new runtime builtin surfaces from `packages/point/runtime/index.ts`.
- Added tests:
  - `tests/runtime/builtins-process-pty.test.ts`
  - `tests/runtime/builtins-image-ai.test.ts`
  - extended `tests/runtime/std-dispatch.test.ts`
- Verification passed:
  - `bun test tests/runtime/builtins-process-pty.test.ts tests/runtime/builtins-image-ai.test.ts tests/runtime/std-dispatch.test.ts`
  - `bun run check`
- No commit was made.

## 2026-05-27 - Post-pivot P6-E Runtime-owned template author-surface guard

- Added `tests/runtime-owned-author-surface.test.ts` to scan both runtime-owned templates:
  - `packages/point/templates/runtime-app`
  - `packages/point/templates/runtime-saas-app`
- The guard fails on forbidden runtime-owned author-surface patterns: `@hatchingpoint/point/std/`, `external point std`, author `*.ts` / `*.tsx`, and `vite.config.*`.
- Kept the existing home-base author-surface coverage in `tests/point-only-experiment.test.ts` intact; the new test extends the same policy to shipped runtime templates.
- Verification passed:
  - `bun test tests/runtime-owned-author-surface.test.ts`
  - `bun test` (854 pass)
- No commit was made.

## 2026-05-27 - Post-pivot P7-B Runtime deploy docs

- Added `docs/site/ecosystem/runtime-deploy.md` for owned-runtime production deploy (Render/Railway/Fly, Docker, env vars, runtime-saas checklist).
- Updated `docs/site/toolchain/deploy.md` and `docs/site/guide/quick-start.md` to lead with owned runtime and link the new page.
- Verification: `bun run check-docs` passed.

## 2026-05-27 - Post-pivot P7-C Manifest-only runtime routing

- Removed `experiments/point-only` path hard-code from `packages/point/src/core/runtime-project.ts`; `isRuntimeNativeInput` now relies on `point.json` `runtime: "owned"` only.
- Updated `tests/runtime-project.test.ts` to assert home base detection via manifest.
- Verification: `bun test tests/runtime-project.test.ts` passed.

## 2026-05-27 - Post-pivot P7 docs reframe (UI + stdlib bridge)

- Updated `docs/site/language/ui.md` — owned runtime SSR as default; React emit scoped to legacy templates.
- Updated `docs/site/stdlib/bridge.md` — runtime std-dispatch path for owned apps; emit bridge labeled legacy.
- Updated `docs/point-runtime-pivot.md` post-pivot checklist through P6; added P7/P8 tracks and P7 goals in `docs/codex-goal-point-only.md`.

## 2026-05-27 - Post-pivot P7-A Runtime SSR datagrid + forms

- Added `packages/point/runtime/ssr/view-extras.ts` — datagrid (sort, filter markup, pagination, link columns), form controls (text/checkbox/select/textarea, submit, toast hints), and action-backed data-load prep.
- Wired view semantic extras into `packages/point/runtime/ssr/index.ts` so owned-runtime views render datagrid/form HTML before the view body.
- Added tests:
  - `tests/runtime/ssr-datagrid.test.ts`
  - `tests/runtime/ssr-forms.test.ts`
- Verification passed:
  - `bun test tests/runtime/ssr-datagrid.test.ts tests/runtime/ssr-forms.test.ts tests/runtime/ssr.test.ts`
  - `bun run check`
- No commit was made.

## 2026-05-27 - Post-pivot P7-E Runtime-saas UI language surface

- Upgraded `packages/point/templates/runtime-saas-app/src/app.point` from text-only summaries to owned-runtime UI: `load data`, datagrid, settings/login/create-member forms (bind field/select/checkbox, toast, submit).
- Added `tests/runtime/ssr-data-load.test.ts` for action-backed `load data` + datagrid and empty-state SSR.
- Extended `tests/runtime-saas-template.test.ts` to assert `/members` SSR renders SQLite-backed datagrid rows.
- Verification passed:
  - `bun test tests/runtime/ssr-data-load.test.ts tests/runtime-saas-template.test.ts`
  - `bun run check`
- No commit was made.

## 2026-05-27 - Post-pivot P7-F Runtime SSR form interactivity

- Added `packages/point/runtime/ssr/form-client.ts` — owned-runtime form submit client (`fetch` JSON POST, Bearer token from localStorage, save token field, toast, navigate).
- Updated `renderViewControlsHtml` to emit `data-point-form-submit` + `data-point-field` metadata instead of native form POST.
- Navigation SSR pages inject the form client script when interactive forms are present (`wrapSsrHtmlDocument`).
- Upgraded `runtime-saas-app` login/create-member submits to use `save token field`, `with auth`, and `then navigate`.
- Added tests: `tests/runtime/ssr-form-client.test.ts`; extended `ssr-forms.test.ts` and `runtime-saas-template.test.ts`.
- Verification passed:
  - `bun test tests/runtime/ssr-forms.test.ts tests/runtime/ssr-form-client.test.ts tests/runtime-saas-template.test.ts`
  - `bun run check`
- No commit was made.

## 2026-05-27 - Post-pivot P7-G Runtime SSR buttons, chart, tabs, modal

- Extended `packages/point/runtime/ssr/view-extras.ts` with owned-runtime HTML for view buttons (`clear auth navigate`), bar charts, tabs, and conditional modals.
- Extended `packages/point/runtime/ssr/form-client.ts` UI client script for sign-out buttons and tab switching (injected when pages use interactive controls).
- Upgraded `runtime-saas-app`: sign-out in nav, settings tabs/modal, member-detail modal.
- Added `tests/runtime/ssr-view-extras.test.ts`; extended form-client and runtime-saas template tests.
- Verification passed:
  - `bun test tests/runtime/ssr-view-extras.test.ts tests/runtime/ssr-form-client.test.ts tests/runtime-saas-template.test.ts tests/runtime/ssr.test.ts`
  - `bun run check`
- No commit was made.

## 2026-05-27 - Post-pivot P7-D LandingPage owned-runtime demo

- Added `scripts/export-runtime-demo-ssr.ts` — exports owned-runtime SSR HTML + readiness evaluation matrix + SaaS login/datagrid fragments for the public site.
- Added `tests/export-runtime-demo-ssr.test.ts`.
- Updated `docs/site/examples.md` live demo narrative for owned runtime (not React widget).
- LandingPage (`../LandingPage`):
  - `scripts/sync-point-runtime-demo.js` + `sync:point-runtime-demo` prebuild hook
  - `RuntimeOwnedDemo` component on `/point/examples`
  - `src/content/pointRuntimeDemo.generated.json` synced from point runtime
- Verification passed:
  - `bun test tests/export-runtime-demo-ssr.test.ts`
  - `npm run build` in LandingPage
- No commit was made.

## 2026-05-27 - Post-pivot P8-A Legacy template opt-in gate

- Added `LEGACY_APP_TEMPLATE_IDS` and `--legacy` requirement for `point create --template full-stack-app|saas-app|vercel-app`.
- Legacy scaffolds emit a deprecation warning pointing to `runtime-app` / `runtime-saas-app`.
- Added `tests/legacy-template-gate.test.ts`; updated app-new and onboarding smoke tests.
- Verification passed:
  - `bun test tests/legacy-template-gate.test.ts tests/app-new-cli.test.ts tests/onboarding-smoke.test.ts`
  - `bun run check`
- No commit was made.

## 2026-05-27 - Post-pivot P8-B Remove legacy templates from npm package

- Added `packages/point/.npmignore` and narrowed `packages/point/package.json` `files` to ship only `templates/runtime-app` and `templates/runtime-saas-app`.
- `listAppTemplates()` hides legacy templates when they are not bundled; clearer error when legacy scaffold is requested from npm-only installs.
- Added `tests/point-package.test.ts` (npm pack layout + npm-style mini package rejection).
- Updated `tests/app-new-cli.test.ts` npm-style layout to copy runtime templates only.
- Updated `docs/site/ecosystem/standalone-template.md` and pivot checklist P8-B.
- Verification passed:
  - `bun test tests/point-package.test.ts tests/legacy-template-gate.test.ts tests/app-new-cli.test.ts`
  - `bun run check`
- No commit was made.

## 2026-05-27 - Post-pivot P8-C Legacy Vite dev/serve/build-app gate

- Added `legacy-app-workflow.ts` — detects emit/Vite app hosts (`web/vite.config.*`) outside runtime-owned projects.
- `point dev`, `point serve`, and `point build-app` require `--legacy` for those hosts; route-only dev without `web/` remains available.
- Added `tests/legacy-vite-workflow-gate.test.ts`; updated `tests/point-build-app.test.ts`.
- Verification passed:
  - `bun run check`
- No commit was made.

## 2026-05-27 - Post-pivot P9-A Theme toggle SSR

- Added `packages/point/runtime/ssr/theme-ssr.ts` and `document.ts` for theme shell wrapping, `/point-ui.css` serving, and localStorage-backed light/dark toggle client script.
- Wired `toggle theme` rendering in SSR view extras; runtime HTTP serves `packages/point/ui/point-ui.css`.
- Upgraded `runtime-saas-app` template with `theme app theme` + nav `toggle theme`.
- Added `tests/runtime/ssr-theme.test.ts`; updated `tests/runtime/ssr-form-client.test.ts`.
- Verification passed:
  - `bun test tests/runtime/ssr-theme.test.ts tests/runtime/ssr-form-client.test.ts tests/runtime-saas-template.test.ts`
  - `bun run check`
- No commit was made.

## 2026-05-27 - Post-pivot P9-B Refresh every in owned SSR

- Added `packages/point/runtime/ssr/refresh-ssr.ts` — live region wrapper, `X-Point-Refresh: view` fragment responses, and client polling script.
- Views with `load data` + `refresh every N seconds|minutes` poll the current page for updated HTML without a full reload.
- Fixed truncated `form-client.ts` and refresh client snippet semicolons.
- Added `tests/runtime/ssr-refresh.test.ts`.
- Verification passed:
  - `bun test tests/runtime/ssr-refresh.test.ts tests/runtime/ssr-data-load.test.ts tests/runtime/ssr-theme.test.ts tests/runtime/ssr-form-client.test.ts`
  - `bun run check`
- No commit was made.

## 2026-05-27 - Post-pivot P9-C SSE subscribe in owned runtime

- Added `packages/point/runtime/sse-routes.ts` for owned SSE route handling and stream pumping.
- Added async `YIELD` / `interpretCoreStreamActionAsync` so stream actions can drive SSE responses.
- Added `packages/point/runtime/ssr/sse-ssr.ts` for `subscribe to sse` pages (EventSource client + connecting/disconnected shell).
- Wired SSE routes into `packages/point/runtime/server.ts`; added `renderViewEachHtml` for static each lists in SSR.
- Added `tests/runtime/sse-routes.test.ts`.
- Verification passed:
  - `bun test tests/runtime/sse-routes.test.ts tests/runtime/ssr-refresh.test.ts tests/runtime/ssr-theme.test.ts tests/runtime/ssr-form-client.test.ts tests/runtime/ssr-data-load.test.ts`
  - `bun run check`
- No commit was made.

## 2026-05-27 - Post-pivot P9-D WebSocket and terminal views in owned runtime

- Added `packages/point/runtime/stream-routes.ts` for owned WebSocket stream routes (upgrade, connect/message/disconnect handlers, process stream pumping).
- Added `packages/point/runtime/ssr/ws-ssr.ts` for `subscribe to stream` and `terminal subscribe to stream` pages (WebSocket client + terminal line rendering).
- Wired WebSocket handlers into `startPointRuntimeServer` / runtime dev serve; extended SSR view rendering and UI client script injection.
- Added `tests/runtime/stream-routes.test.ts`.
- Verification passed:
  - `bun test tests/runtime/stream-routes.test.ts tests/runtime/sse-routes.test.ts tests/runtime/ssr-refresh.test.ts tests/runtime/ssr-theme.test.ts tests/runtime/ssr-form-client.test.ts tests/runtime/server.test.ts`
  - `bun run check`
- No commit was made.

## 2026-05-26 - Post-pivot P10 Runtime-only execution

- Routed `point run`, `point launch`, `point test`, and `point test-all` through `packages/point/runtime/` interpreter (`runModule`, `runPointRuntimeTests`).
- Removed legacy emit/Vite templates (`full-stack-app`, `saas-app`, `vercel-app`) and `--legacy` create gate; `point create` ships only `runtime-app` and `runtime-saas-app`.
- Removed legacy Vite `dev` / `serve` / `build-app` paths; runtime HTTP/SSR is the only app host.
- Added `tests/p10-runtime-only.test.ts`, `tests/runtime/interpreter-workflow.test.ts`; migrated deploy/saas smoke to `runtime-saas-app`.
- Updated docs (`run.md`, `dev.md`, `product-map.md`, `standalone-template.md`, quick-start, deploy, golden-app-demo); removed `sync:app-template` from CI/npm prepublish.
- Verification: `bun run ci`
- No commit was made.

## 2026-05-28 - Post-pivot P11 Runtime-owned proof cases

- Added agent-repair fixture `unknown-stream-subscribe-path` for owned-runtime WebSocket subscribe paths.
- Added agent-app fixtures `runtime-saas-members-load` and `runtime-saas-create-member-wiring` from `runtime-saas-app` template.
- Improved theme/stream diagnostics (`path`, `expected` on theme and stream subscribe path checkers).
- Bumped gates: 37 single-shot repair + 4 multistep; 15 agent-app cases.
- Updated `docs/site/ai/agent-repair-tests.md`, `docs/product-map.md`, fixture READMEs; regenerated proof reports and exports.
- Verification passed:
  - `bun test tests/agent-repair-sufficiency.test.ts tests/agent-repair-gate.test.ts tests/agent-app-benchmark.test.ts tests/agent-app-gate.test.ts tests/agent-app-model-eval.test.ts`
  - `bun run proof:agent-repair -- --skip-models`
  - `bun run proof:agent-app -- --skip-models`
- No commit was made.
