# Changelog

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
