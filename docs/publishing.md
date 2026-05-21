# Publishing Point

Publishing requires credentials:

- `NPM_TOKEN` for npm package publish.
- `VSCE_PAT` for VS Code Marketplace / Open VSX publishing.

Release command:

```bash
bun run publish:release
```

The script runs CI first, then publishes `@hatchingpoint/point` and packages the VS Code extension. It exits before publishing when credentials are missing.

## Blocked / pending publish

If credentials are not configured, Phase 6 publish steps remain **pending**. This does not block language, conformance, or compiler work. Configure tokens locally in the shell environment (not committed to git) when ready to publish.

`.env.local` is gitignored but is **not** loaded automatically by `publish:release`. Export variables in your shell or load them before running publish.

## Versioning

Point uses semver:

- Patch: diagnostics, docs, examples, bug fixes.
- Minor: backward-compatible language features.
- Major: breaking language or generated-target changes.

## Changelog

Every release updates `CHANGELOG.md` with:

- Added
- Changed
- Fixed
- Migration notes, when needed
