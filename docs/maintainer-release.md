# Maintainer release guide

**Audience:** HatchingPoint org maintainers only. Contributors do not need any of this.

## What contributors need vs maintainers

| Action | Contributor | Maintainer |
|--------|-------------|------------|
| Clone, fork, PR | Yes | Yes |
| `bun run ci` locally | Yes | Yes |
| Merge to `main` | Via PR review | Yes |
| Publish npm on tag | No | CI + `NPM_TOKEN` |
| Publish VS Code extension | No | CI + `VSCE_PAT` / `OPENVSX_PAT` |
| GitHub org settings | No | Org admin |

## Release flow

1. Land changes on `main`; `bun run ci` green.
2. Bump version: `bun run version:patch` (or minor/major).
3. Commit, tag, push:

```bash
git tag v0.1.50
git push origin main
git push origin v0.1.50
```

4. GitHub Actions **Publish** workflow runs on tag push:
   - Runs CI again
   - Publishes `@hatchingpoint/point` and `@hatchingpoint/point-logic` to npm
   - Publishes VS Code extension if secrets are set

## Required GitHub org secrets

Configure under **HatchingPoint/point → Settings → Secrets and variables → Actions**:

| Secret | Purpose |
|--------|---------|
| `NPM_TOKEN` | npm publish for `@hatchingpoint/point` |
| `VSCE_PAT` | [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage) publish |
| `OPENVSX_PAT` | [Open VSX](https://open-vsx.org/) publish (Cursor / VSCodium) |

Optional (model benchmark workflows only — not required for releases):

- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`

If `VSCE_PAT` is missing, CI skips Marketplace publish. Manual fallback:

```bash
bun run vscode:package
# Upload packages/point-vscode/point-*.vsix at marketplace.visualstudio.com/manage
```

## npm scope

`@hatchingpoint/point` is **public** on npm. The scoped name does not require org membership to install.

## LandingPage docs site

After shipping language/docs changes, sync the marketing site (separate repo):

```bash
cd ../LandingPage
npm run sync:point-docs
npm run build
git push
```
