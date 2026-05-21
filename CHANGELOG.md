# Changelog

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
