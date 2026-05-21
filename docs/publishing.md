# Publishing Point

Publishing requires credentials:

- `NPM_TOKEN` — npm access token for `@hatchingpoint/point`
- `VSCE_PAT` — Visual Studio Marketplace personal access token for publisher **hatchingpoint**

Release command:

```bash
bun run publish:release
```

The script loads `.env.local` if present (gitignored), runs CI, publishes the npm package, packages the VSIX, and publishes the extension with `@vscode/vsce`.

---

## One-time setup

### 1. npm package (`@hatchingpoint/point`)

1. Create an npm account and join org **hatchingpoint** (or create the scope).
2. Generate an **Automation** or **Publish** access token at [npmjs.com](https://www.npmjs.com/settings/~youruser/tokens).
3. Add to `.env.local` at repo root (never commit):

```env
NPM_TOKEN=your_npm_token_here
```

### 2. VS Code Marketplace publisher

1. Sign in at [Azure DevOps](https://dev.azure.com) (same Microsoft account as VS Code Marketplace).
2. Create organization if prompted.
3. Open [Marketplace publisher management](https://marketplace.visualstudio.com/managecreatorpublisher) → **Create publisher**.
   - Publisher ID: `hatchingpoint` (must match `packages/point-vscode/package.json`)
   - Display name: Hatching Point (or your preference)
4. Create a **Personal Access Token**:
   - Azure DevOps → User settings → Personal access tokens
   - Scope: **Marketplace** → **Manage**
5. Add to `.env.local`:

```env
VSCE_PAT=your_marketplace_pat_here
```

Do not use the literal string `VSCE_PAT` as the value — the publish script rejects that placeholder.

### 3. Local extension baseline (before or after publish)

**Option A — monorepo dev (what you tried)**

1. `Developer: Install Extension from Location...` → `packages/point-vscode`
2. Bun on PATH
3. Extension auto-finds `packages/point/src/cli.ts`

**Option B — VSIX without npm**

```bash
bun run vscode:package
```

Install `packages/point-vscode/point-0.0.5.vsix` in Cursor. Set **Point: Cli Path** to your local `packages/point/src/cli.ts` (required — VSIX does not bundle the compiler).

**Option C — published baseline (recommended after release)**

```bash
npm install -g @hatchingpoint/point   # requires Bun on PATH
```

Install extension from marketplace (or VSIX). Extension finds `point` on PATH automatically.

**Settings** (optional):

| Setting | Purpose |
|---------|---------|
| `point.cliPath` | Override CLI path |
| `point.runtime` | `auto`, `bun`, or `point` |

---

## Publish

```bash
bun run publish:release
```

Steps performed:

1. `bun run ci`
2. `npm publish` from `packages/point` → `@hatchingpoint/point`
3. `bun run vscode:package` → `packages/point-vscode/point-*.vsix`
4. `vsce publish` → `hatchingpoint.point` on VS Code Marketplace

### Dry run (no upload)

```bash
bun run ci
bun run vscode:package
cd packages/point && npm publish --dry-run
cd packages/point-vscode && bunx @vscode/vsce publish --dry-run
```

---

## Versioning

Point uses semver:

- Patch: diagnostics, docs, examples, bug fixes.
- Minor: backward-compatible language features.
- Major: breaking language or generated-target changes.

Bump `version` in **both** `packages/point/package.json` and `packages/point-vscode/package.json` before release. Update `CHANGELOG.md`.

## Changelog

Every release updates `CHANGELOG.md` with Added, Changed, Fixed, and migration notes when needed.
