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

## Pivot exit gate (final)

- [x] `experiments/point-only/` contains no author TS/JS/React/Vite artifacts
- [x] `point run` / `point dev` / `point serve` / `point test` use `packages/point/runtime/` for experiment app
- [x] Interpreter default (post-R2) with home-base emit path cut
- [x] HTTP + SSR without React/Vite for experiment app
- [ ] `bun run ci` green (repo-wide fmt-check-all on legacy `.point` files)

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

## 2026-05-26 - R4 integrator (pivot complete)

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
