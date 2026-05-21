# Changelog

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
