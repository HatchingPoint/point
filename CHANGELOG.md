# Changelog

## 0.1.43

### Added

- Phase 56: **Form controls** — `bind select "Label" to field options <list>`, `bind textarea "Label" to field`, `toast on success/error "..."` on forms with submit.
- Phase 56b: **Agent repair gate 27** — fixtures for refresh interval, table link column, terminal stream route, unknown load action; enriched diagnostics with `expected`.
- Phase 57: **Chart + datagrid** — `chart bar from data label field name value field count`; `datagrid item in data columns a, b sort by name` with sortable headers.
- Phase 57: **Operator dashboard example** — `examples/app/operator-dashboard/` with bar chart and sortable jobs grid.
- Phase 58: **`capabilities image`** — `std.image` metadata and resize via optional `sharp` dependency; `examples/tools/image-thumbnail.point`.
- Phase 59: **Apple toolkit example** — `examples/toolkit/apple-cli.point` for xcodebuild/simctl via `capabilities process`.

### Changed

- Phase 60: **Emit import pruning** — verified multi-module build emits minimal std imports (existing Phase 38 behavior; regression tests retained).

## 0.1.42

### Added

- Phase 51: **Job queue pattern** — `examples/app/job-queue/` with SQL-backed jobs table, enqueue/list/detail HTTP routes, workflow drain, admin form + table.
- Phase 52: **Live dashboard refresh** — `refresh every N seconds|minutes` on views/pages with `load data from action`; emit polls with `setInterval` cleanup.
- Phase 52: **Live dashboard example** — `examples/app/live-dashboard/` with auto-refreshing metrics panel.
- Phase 53: **`capabilities pty`** — `std.pty` spawn, write stdin, stream output lines (POSIX PTY with pipe fallback).
- Phase 54: **Terminal view** — `terminal subscribe to stream <route>` emits monospace terminal panel over WebSocket.
- Phase 54: **Script runner example** — `examples/app/script-runner/` streams subprocess stdout/stderr/exit to terminal view.

### Changed

- Phase 54: **Stream route runtime** — `pointPumpProcessStreamToWebSocket` encodes stdout/stderr/exit chunks when message record has `stream` + `text` fields.

## 0.1.41

### Added

- Phase 49: **Button primitive** — `button "Label" clear auth navigate "/path"` with `pointAuthClearToken()`.
- Phase 49: **Table primitive** — `table item in data columns name, role link name to "/path"` for admin list pages.
- Phase 49: **Login validation** — saas-app middleware rejects invalid password on `POST /api/login` with 401.
- Phase 49: **Stripe example** — `examples/billing/stripe-demo.point` shows external + action billing interop.

### Changed

- Phase 49: **saas-app members list** — uses semantic table instead of linked list rows; nav includes sign-out button.

## 0.1.40

### Added

- Phase 48: **Form submit POST** — `submit "Label" POST "/api/..." body record` inside forms; optional `with auth`, `save token field token`, `then navigate "/path"`.
- Phase 48: **Login + create-member UI** — saas-app login form saves Bearer token; create-member form POSTs with auth.
- Phase 48: **Deploy smoke** — `scripts/deploy-smoke.sh` + `tests/deploy-smoke.test.ts` (login → POST member → GET list).
- Phase 48: **Theme toggle** — enabled in saas-app template (`toggle` on theme block + nav control).

## 0.1.39

### Added

- Phase 47: **POST member INSERT** — saas-app `insert member` action persists to SQLite via RETURNING.
- Phase 47: **`sqlJsonMemberRow`** — decode first SQL row for typed `Member` externals.
- Phase 47: **Env JWT secret** — `JWT_SECRET` with demo fallback via fixed `env with default`.

### Fixed

- Phase 47: **`Maybe<Text>` narrowing** — present-branch returns unwrap to Text in checker.
- Phase 47: **`env with default`** std calculation — returns env value when set, not always default.
- Phase 47: **Onboarding smoke** — asserts seeded SQL member in `/api/members`; passes `DATABASE_URL`/`JWT_SECRET` to serve.

## 0.1.38

### Added

- Phase 46: **`sqlJsonRowsList`** — decode SQL JSON row text into runtime arrays for typed `List<Record>` externals.
- Phase 46: **SQL-backed saas-app members** — `fetch members` reads seeded SQLite rows (no `sample members()`).
- Phase 46: **SaaS build + integration tests** — `point build` inlines capabilities; init db → serve → GET members e2e.

### Fixed

- Phase 46: **`point build` / `build-js`** — emits self-contained JS for `capabilities` modules (no broken `./auth` imports).

## 0.1.37

### Added

- Phase 45: **SaaS action wiring** — `action fetch members` + dashboard-style view load; route awaits fetch members.
- Phase 45: **`auth-bearer` repair case** — agent benchmark gate min 23 single-shot fixtures.
- Phase 45: **SaaS integration test** — HTTP health, members GET, POST auth 401/201.
- Phase 45: **`scripts/pilot-quickstart.sh`** — one-script external evaluator path.

### Fixed

- Phase 45: **Async route emit** — routes with `await` in `return json` emit as async functions.
- Phase 45: **Agent repair check** — fixture checks resolve `capabilities` std modules like CLI check.
- Phase 45: **`semanticCallables` in check-json** — unknown-function hints list spaced std names for agents.

## 0.1.36

### Added

- Phase 44: **`saas-app` template** — `point create --template saas-app` with auth, SQL, DB init workflow, protected POST route.
- Phase 44: **Onboarding smoke** — `scripts/onboarding-smoke.sh` + `tests/onboarding-smoke.test.ts` (scaffold, check, launch, serve).
- Phase 44: **External pilot checklist** — `docs/external-pilot-checklist.md`.
- Phase 44: **Bundled std modules** — `packages/point/std/*.point` synced on publish for npm `capabilities` resolution.

### Fixed

- Phase 44: **Std module resolution** — absolute paths from `modulePathFromLock`; `capabilities` work from scaffolded project directories.
- Phase 44: **`point run` / `point launch`** — emit cache under project `.point-cache/` so `node_modules` resolves for std imports.

## 0.1.35

### Added

- Phase 43: **`std/auth` capability** — bearer tokens, JWT auth checks, unauthorized responses (15th built-in capability).
- Phase 43: **`point demo [file]`** — golden path: check, box, capabilities, commands, next steps for dev/launch/repair.
- Phase 43: **`point repair`** — alias for `repair-plan`.
- Phase 43: **LSP repair enrichment** — ordered repair steps with `[repair N/M]` prefix and related refs in diagnostics.
- Phase 43: **Agent repair fixtures** — `auth-bearer-broken` / `auth-bearer-fixed`.
- Phase 43: **`examples/tools/auth-demo.point`** — auth capability demo with middleware.

### Changed

- Phase 43: `middleware-integration.point` uses `capabilities auth http` instead of manual crypto externals.
- Phase 43: Legacy lowering supports `middleware` declarations and `Maybe Text` type normalization.

## 0.1.34

### Changed

- Phase 42: **Application logic** terminology replaces "product logic" across README, site docs, and vision.
- Phase 42: Removed external brand comparisons from plans and changelog; Point-native voice only.
- Phase 42: Clarified **frontend is native App blocks** (`view`, `page`, `layout`) — not capability imports.

## 0.1.33

### Added

- Phase 41: **Golden app demo** — evaluator walkthrough (`docs/site/guide/golden-app-demo.md`).
- Phase 41: **Doc graph wiring** — Point in 60 seconds + golden demo as default entry across tutorials, FAQ, concepts, examples.

### Changed

- Phase 41: quick-start, installation, run-test-repl, in-the-box — launch-first UX.
- Phase 41: examples.md — golden path table with `point launch` commands.

## 0.1.32

### Added

- Phase 40: **Point in 60 seconds** — `docs/site/guide/point-in-60-seconds.md` (three daily moves).
- Phase 40: **Presentation rings** — daily / build / agent / advanced CLI grouping.
- Phase 40: **Build decision tree** — logic / app / SQL paths in build-emit guide.
- Phase 40: **Honest boundaries** — canonical what-you-write vs what-runs paragraph across README, vision, introduction.

### Changed

- Phase 40: README, introduction, five-minute tour — fix run story (`check` for logic, `launch` for commands).
- Phase 40: AI overview — "compiler is the agent's IDE" tagline elevated.
- Phase 40: Full-stack template README — `point box`, `point launch`, what's already wired.
- Phase 40: Version/test sync — v0.1.32, 607 tests across vision, README, site changelog, CLI ref.

## 0.1.31

### Added

- Phase 39: **`capabilities http json`** — one-line import sugar for built-in std modules (parse, format, scan).
- Phase 39: **`point commands`** — catalog of runnable `command` blocks with copy-paste run lines.
- Phase 39: **`point launch`** — alias for `point run` with required command name.
- Phase 39: **`point box`** — capabilities + commands for one file in one screen (`--json` for agents).
- Phase 39: **`point run <file> <command name>`** — run a named command entrypoint.
- Phase 39: **In-the-box guide** — `docs/site/language/in-the-box.md`.

## 0.1.30

### Added

- Phase 38: **Emit import pruning** — JS/TS/Python emit imports only referenced dependency symbols (matches selective use merge).
- Phase 38: **Five-minute tour** — `docs/site/guide/five-minute-tour.md` for evaluators; template README link.

### Fixed

- Single-file `point build` / `build-ts` use pruned cross-module imports when `use` is present.

## 0.1.29

### Added

- Phase 37: **Selective use merge** — `use time` / capability imports merge only referenced declarations (+ type/external closure); fixes bloated std graphs.
- Phase 37: **Domain outcomes guide** — `docs/site/language/domain-outcomes.md` (variant-first success/failure pattern).
- Phase 37: **Template capabilities** — full-stack template README documents `use http` / `point capabilities`.

## 0.1.28

### Added

- Phase 36: **Built-in capabilities** — `use http` shorthand for `use std.http`; `point capabilities` catalog (`--json` for agents).
- Phase 36: **Product packaging** — README rewrite (five block families), `docs/product-map.md`, capabilities docs, vision/cli/changelog sync.
- Phase 36: **`scripts/publish-github-releases.sh`** — create GitHub releases from CHANGELOG sections.

## 0.1.27

### Added

- Phase 35: **Agent repair CI gate** — `benchmark:agent-repair:gate` enforces 100% sufficiency (22 single-shot + 4 multistep cases).
- Phase 35: **Timezone std pattern** — `format instant in timezone` via `std/time` (Intl/zoneinfo); `timezone-demo.point`.
- Phase 35: **LSP cross-module `use`** — document URI resolves imports like CLI; `money-demo` diagnostics clean in editor.

### Fixed

- Removed unused `use std.time` from `todo.point` (prevented pulling entire std/time surface into unrelated apps).

## 0.1.26

### Added

- Phase 34: **Cross-module `use` resolution** — relative imports resolve from the importing file; single-file `point check`/`test` merge dependency symbols.
- Phase 34: `examples/tools/money-demo.point` links `std/money` with working `money from cents` / `money display` calls.
- Phase 34: `point test` runs from `generated/.point-tests/` so workspace std imports resolve.

## 0.1.25

### Added

- Phase 33: **`std/money`** format helpers — `formatCentsUsd` JS/Python shims, `money display` calculation (`$10.05` from cents).
- Phase 33: **`std/text`** — `text from int`, `text pad start` for general formatting.
- Phase 33: Python **pipeline** emit — step event logging, retry/policy/timeout parity with workflows.
- Phase 33: Phase 13 closed — Python routes marked shipped; [standalone template](./docs/site/ecosystem/standalone-template.md) docs.

## 0.1.24

### Added

- Phase 32: opaque **`Duration`** type (integer seconds at runtime) with JS/TS/Python emit parity.
- Phase 32: `std.time` duration helpers — `duration from seconds`, `duration to seconds`, `duration minutes`.
- Phase 32: `examples/tools/duration-demo.point`; `Duration` → BIGINT/INTEGER in `build-schema`.
- Phase 32: `language-primitive-audit.md` synced — Map shipped, Money/errors patterns documented.

## 0.1.23

### Added

- Phase 31: variant-first domain outcomes — `examples/variants/payment-outcome.point`, Domain outcomes docs, `action-outcome-not-exhaustive` diagnostic for `* Outcome` variant dispatch.
- Phase 31: calculation `on failure return` with `calculation-on-failure-type-mismatch` checking; `on Case` dispatch in calculations.
- Phase 31: Python emit variant dict convention (`kind` + payload keys); agent-repair fixtures for outcome exhaustiveness and on-failure type mismatch.

## 0.1.22

### Added

- Phase 30: `point build-schema` productization — nested record FK columns (`author_id REFERENCES user(id)`), `Maybe<T>` nullable columns, `Instant` → TIMESTAMP mapping.
- Phase 30: `--dialect postgres|sqlite`, `--migrations <dir>`, multi-module schema aggregation, `record-sql-fk-ambiguous` / `record-sql-duplicate-table` diagnostics.
- Phase 30: `examples/data/schema-demo.point` and `docs/site/toolchain/build-schema.md`.

### Fixed

- Ship `roadmap-analyze.ts` on the CLI module graph so `point fmt-check-all` and CI pass on clean checkout (`point roadmap-analyze`).

## 0.1.21

### Added

- Phase 28: repair-plan ordering (`sortDiagnosticsForRepairPlan`), multistep agent-repair benchmarks, and `docs/site/ai/repair-plan.md`.
- Phase 28: index/explain audit for Phase 26–27 diagnostic codes (`tests/agent-index-explain.test.ts`).
- Phase 28: six new agent-repair fixture pairs (middleware inputs, pipeline step I/O, money lint, variant exhaustiveness, invalid view bind) — 24 benchmark cases exported.
- Phase 28: LSP ↔ `check-json` parity matrix (`tests/agent-lsp-check-json-parity.test.ts`); repair hints in editor diagnostics.
- Phase 28: self-hosted `compiler/passes/diagnostic-catalog.point` for agent-ready diagnostic codes.
- Phase 29: `packages/point/python_std/` mirrors for path, process, json, env, yaml, crypto, http, fs, time, text, and related std modules.
- Phase 29: Python emit rewrites `use std.*` to `point_std.*` imports; `docs/site/toolchain/build-py.md`.
- Phase 29: `examples/tools/process-runner.point` Python run path; crypto/yaml/http JS/Python parity tests.
- Phase 29: `point.json` `"emit": "python"` / per-module target selection for `point build`.

## 0.1.20

### Added

- Phase 27: middleware ↔ route validation (`middleware-input-unavailable`, `middleware-input-type-mismatch`).
- Phase 27: view runtime source map tags for `when … render` and load-data guard branches.
- Phase 27: theme toggle API (`toggle` in theme blocks, `toggle theme` in views, `PointThemeShell` + `data-point-theme`).
- Phase 27: `point build-schema` — record-backed SQL DDL stub with `record-sql-unsupported-type` validation.

## 0.1.19

### Added

- Phase 26 Wave 2: pipeline step I/O checking (`pipeline-step-type-mismatch`), money field lint (`float-money-field`), and richer `missing-await` repair hints for views that should use `load data from action`.

## 0.1.18

### Added

- Phase 26 Wave 1: camelCase field alias resolution and fuzzy unknown-field hints, variant exhaustiveness (`missing-variant-case`), `Maybe` presence narrowing (`when expr present` / `is none`), tab and layout slot semantic style modifiers.

## 0.1.17

### Added

- Phase 25 Wave 2: `theme` blocks (accent, density, radius), new style modifiers (`card`, `stack`, `badge`, `panel`, `spaced`), and theme classes on layout/router mount.
- `point build-app` writes `generated/app.tsx` for Vite hosts.
- Route handler emits when routes exist without a `command serve` block.
- NavLink active state for navigation links (`point-link-active`).
- `vercel-app` template for Vercel deploy (`point create my-app --template vercel-app`).

## 0.1.16

### Added

- Fix invalid JSX when views emit multiple render lines.

## 0.1.15

### Added

- Fix multi-render view emit; add point-nav layout styles to point-ui.css.

## 0.1.13

### Added

- Fix CI tests that mkdir gitignored `tests/tmp` before creating temp project dirs.

## 0.1.12

### Added

- Fix CI test suite: Instant/`use std.*` parsing, `point run` prefers non-serve commands, ephemeral ports for test HTTP servers.

## 0.1.11

### Added

- Fix check-docs CI for modules.md snippets and restore `@hatchingpoint/point` in the published full-stack template.

## 0.1.6

### Added

- Phase 22 dedomainized docs and language guide split; Phase 23 adds `Map<Text, T>` with `lookup` and `std/money` pattern.

## 0.1.5

### Added

- Bun-first install docs and npm messaging; `point add` prefers `bun add` with npm fallback.

## 0.1.4

### Added

- Four full-app agent benchmark cases with notes and refactor fixtures, paired next-notes scaffold, and home-page-ready export.

## 0.1.3

### Added

- Full-app agent benchmarks with paired Next.js scaffolds, measured TS context, model eval harness, and proof:agent-app.

## 0.1.2

### Added

- point create scaffolds full-stack apps from npm-bundled templates; point app new remains as alias

## 0.1.1

### Fixed

- **Agent repair diagnostics** — `check-json` `expected` and `repair` hints for unknown-field errors now list Point source field syntax (e.g. `has bundle id`) instead of internal camelCase names, so coding agents apply valid `.point` lines on the first try.

### Added

- **Agent repair tests** — CI sufficiency fixtures, model benchmark harness, and docs hub for measured vs estimated agent context claims.

## 0.1.0

### Added

- **Platform Phases 14–21** — application platform, realtime, data interop, agent orchestration, Python parity, dev tooling, and hardening (339 tests).
- **Application platform (Phase 15)** — `layout`, `navigation`, `load data from action`, rich views (`form`, `tabs`, `modal`, `each`), Tailwind `class` bridge.
- **Realtime & processes (Phase 16)** — `stream route`, view `subscribe to`, workflow retry/timeout/policy, `schedule`, subprocess streaming.
- **Data interop (Phase 17)** — any database via `action` + `external` or `std.sql`; `load data from action` in views. No vendor-specific DB syntax.
- **Agent orchestration (Phase 18)** — `pipeline`, `session`, `prompt`, `guard output paths`, `std.ai`.
- **Python parity (Phase 19)** — routes, workflows, commands, full `python_std/` mirror; `bun run test:py-parity`.
- **Dev platform (Phase 20)** — `point dev`, `point app new`, `point test integration`, `point build --production`, full-stack template.
- **Language foundations (Phase 14)** — `std.path`, `std.process`, `std.crypto`, `std.yaml`, `std.stream`; route middleware; typed query/body/headers; `variant` types with `on Case` dispatch; statement-level source maps for `point run`.
- **Examples** — `examples/app/dashboard/`, `examples/app/notes/`, `examples/app/log-viewer/`, `examples/full-stack-template/`, pipelines, agents, prompts.

### Removed

- **Convex integration** — `server query`, `use query`, `point convex sync`, and Convex emit removed as overfit to one vendor. Use generic database interop (`std.sql` + external drivers) instead.

### Changed

- **Docs site** — `docs/site/` updated for 0.1.0: platform vision, database interop, deploy guide, CLI reference, language overview.

## 0.0.15

### Added

- **Starter template** — `examples/starter-template/` self-contained Point app.
- **Open VSX publish** — `publish:openvsx` + optional CI step with `OPENVSX_PAT`.
- **Live readiness demo** — interactive checklist on hatchingpoint.com/point/examples.
- **`@hatchingpoint/point-logic@0.0.3`** — npm tarball includes `.point` source for `point add npm:…`.

## 0.0.14

### Added

- **`npm:` in `point add`** — install registry Point packages, pin `node_modules/` paths in `point.lock`.
- **Std shims** — `@hatchingpoint/point/std/fs`, `env`, `time`, `text` (plus existing json/http).
- **`point run --bundle`** — in-memory eval for pure logic modules (no emit files in project).
- **`examples/pure/math-only.point`** — demo of bundled run.

## 0.0.13

### Added

- **`page` block** — Next.js-embeddable page shells; readiness-page example.
- **`point build-py-all`** — batch Python emit for logic and action fixtures.
- **`point add`** — workspace/file dependency resolution with `point.lock`.
- **Std runtime shims** — `@hatchingpoint/point/std/json` and `std/http`.
- **Controlled views** — `Handler` callbacks and `bind checkbox` for interactive React emit.
- **`@hatchingpoint/point-logic@0.0.2`** — publishes from CI on tag push alongside `@hatchingpoint/point`.

## 0.0.12

### Added

- **JS-default workflow** — `point build` / `point run` / `point test` emit JavaScript; `build-ts` opt-in.
- **`point build-py`** — minimal Python emit for pure logic (`examples/math.point` → `generated/math.py`).
- **`point check-docs`** — validates fenced `.point` in `docs/site/`; wired into CI.
- **`@hatchingpoint/point-logic`** — npm package authored only from `.point` sources.
- **Dogfood HTTP service** — `store-readiness.point` Bun routes with real JSON + integration tests.
- **Readiness widget** — React view example for Next.js embedding.
- **Public docs** — `docs/site/` language guide, CLI reference, LSP toolchain, authoring vs runtime story.

## 0.0.11

### Added

- VS Code extension uses `point lsp` via bundled LanguageClient (shared with Neovim/Zed).
- LSP completion and rename; format-on-save default for `.point` files.
- Dogfood module: App Store listing readiness (`examples/adopters/hatchingpoint/`).
- External adopter example: Starter Labs subscription pricing (`examples/adopters/starter-labs/`).
- Verified Neovim and Zed editor configs under `editors/`.

## 0.0.10

### Added

- `point lsp` — stdio Language Server (diagnostics, symbols, go-to-definition, hover, format) for any LSP editor.
- Editor setup guide and documentation site planning for hatchingpoint.com/point.

## 0.0.9

### Added

- Fix Marketplace publish by uploading pre-built VSIX instead of repackaging monorepo.

## 0.0.8

### Added

- Verify automated npm and Marketplace publish with VSCE_PAT.

## 0.0.7

### Added

- Automated npm publish via GitHub Actions on tag push.

## 0.0.6

### Added

- VS Code Marketplace extension published (`hatchingpoint.point`) with Point logo and install docs.
- `publish:npm` script, `publish:marketplace` script, `version:patch|minor|major` bump script, and GitHub Actions publish on tag (npm + Marketplace).
- npm publish auth fix via temporary `.npmrc` for local and CI releases.

## 0.0.5

### Added

- Semantic language phases through application-layer prototypes.
- Standard library modules and std import ergonomics.
- Runtime commands: `point run`, `point test`, and `point repl`.
- Publish pipeline scaffold requiring `NPM_TOKEN` and `VSCE_PAT`.
