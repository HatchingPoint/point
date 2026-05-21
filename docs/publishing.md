# Publishing Point

## Release flow (recommended)

```bash
# 1. Bump semver + CHANGELOG (patch | minor | major)
bun run version:patch --note "Describe the release"

# 2. Commit and tag (version must match tag)
git add -A
git commit -m "Release v0.0.7"
git tag v0.0.7
git push && git push origin v0.0.7
```

Pushing a `v*.*.*` tag triggers **GitHub Actions** to run CI and publish `@hatchingpoint/point` and `@hatchingpoint/point-logic` to npm.

If `VSCE_PAT` is set in GitHub secrets, the extension is also published to Marketplace automatically. **If not** (or if Azure DevOps org setup is blocked), upload the VSIX manually — see below.

Requires GitHub Actions secret: `NPM_TOKEN` (required). `VSCE_PAT` (optional).

---

## Credentials

| Secret / env | Used for |
|--------------|----------|
| `NPM_TOKEN` | npm publish for `@hatchingpoint/point` and `@hatchingpoint/point-logic` (local `.env.local` or GitHub Actions secret) |
| `VSCE_PAT` | Marketplace CLI publish (optional — local `.env.local` or GitHub secret) |

Local publish loads `.env.local` if present (gitignored).

---

## One-time setup

### npm (`@hatchingpoint/point`, `@hatchingpoint/point-logic`)

1. npm account with publish access to `@hatchingpoint` scope.
2. Generate an **Automation** or **Publish** token at [npmjs.com](https://www.npmjs.com/settings/~youruser/tokens).
3. Local: add to `.env.local`:
   ```env
   NPM_TOKEN=npm_...
   ```
4. GitHub: repo **Settings → Secrets and variables → Actions → New repository secret** → `NPM_TOKEN`.

### VS Code Marketplace (`hatchingpoint.point`)

**Manual upload (no Azure DevOps needed)** — what you used for 0.0.6:

1. `bun run vscode:package`
2. Open [Marketplace publisher page](https://marketplace.visualstudio.com/manage/publishers/hatchingpoint)
3. **Point Language** → Update → upload `packages/point-vscode/point-*.vsix`

**Automated CLI publish (optional)** needs `VSCE_PAT`:

1. Publisher **hatchingpoint** must exist (done).
2. Azure DevOps Personal Access Token with **Marketplace → Manage** scope.
3. Local `.env.local` or GitHub secret `VSCE_PAT`.

#### If automated publish fails with `TF400813` / `not authorized`

The PAT is reaching Azure DevOps but is **not allowed to publish** for publisher `hatchingpoint`. Fix:

1. Sign in to [Marketplace publisher management](https://marketplace.visualstudio.com/manage/publishers/hatchingpoint) as **jamlets@protonmail.com** (same account that created the publisher).
2. **Members** tab → confirm your account is **Owner**.
3. Create a **new** PAT at [dev.azure.com/hatchingpoint/_usersSettings/tokens](https://dev.azure.com/hatchingpoint/_usersSettings/tokens) while signed in as that same account.
4. Scopes: **Custom defined** → **Marketplace** → check **Manage** (full publish access).
5. Organization access: **All accessible organizations** (or at least **hatchingpoint**).
6. Copy the token once — no quotes, no trailing spaces.
7. GitHub → delete and recreate secret `VSCE_PAT` with the new value.
8. Test locally before re-running CI:
   ```bash
   bun run vscode:package
   SKIP_CI=1 bun run publish:marketplace
   ```

Until PAT works, upload `point-0.0.9.vsix` manually on the publisher page (npm 0.0.9 is already live).

#### If Azure DevOps “Continue” is broken

You do **not** need Azure DevOps to upload VSIX files manually. Only automated `vsce publish` needs a PAT.

Things to try if you want the PAT later:

- Direct token page (after sign-in): [dev.azure.com/_usersSettings/tokens](https://dev.azure.com/_usersSettings/tokens)
- Different browser (Edge), incognito, ad blockers off
- Mobile browser or another device
- Skip for now — manual VSIX upload per release is fine

---

## Local commands

| Command | What it does |
|---------|----------------|
| `bun run version:patch` | Bump patch in all package.json files + CHANGELOG |
| `bun run version:minor` | Bump minor |
| `bun run version:major` | Bump major |
| `bun run publish:npm` | CI + npm publish `@hatchingpoint/point` and `@hatchingpoint/point-logic` |
| `bun run publish:logic` | CI + npm publish `@hatchingpoint/point-logic` only |
| `bun run publish:marketplace` | CI + VSIX + Marketplace publish |
| `bun run publish:release` | CI + npm + Marketplace (needs both tokens) |
| `bun run vscode:package` | Build `.vsix` for manual Marketplace upload |

Optional flag for publish scripts when CI already ran:

```bash
SKIP_CI=1 bun run publish:npm
```

---

## Versioning

Point uses semver across:

- `package.json` (repo root)
- `packages/point/package.json` (`@hatchingpoint/point`)
- `packages/point-vscode/package.json` (Marketplace extension)

Keep the first three in sync. Git tag must match: tag `v0.0.7` ↔ package version `0.0.7`.

`packages/point-logic/package.json` (`@hatchingpoint/point-logic`) uses **independent semver** — bump its version when the library changes, then publish via tag push (with `@hatchingpoint/point`) or `bun run publish:logic`.

- **Patch** — fixes, docs, extension tweaks
- **Minor** — backward-compatible language features
- **Major** — breaking language or emit changes

Update `CHANGELOG.md` on every release (bump script prepends a section).

---

## User install path (after publish)

```bash
npm install -g @hatchingpoint/point   # requires Bun on PATH
npm install @hatchingpoint/point-logic   # store readiness logic (JS emit from Point)
```

Install **Point Language** from [Marketplace](https://marketplace.visualstudio.com/items?itemName=hatchingpoint.point) (VS Code / Cursor).

---

## Dry run

```bash
bun run ci
bun run vscode:package
cd packages/point && npm publish --dry-run
cd packages/point-logic && npm pack --dry-run
cd packages/point-vscode && bunx @vscode/vsce publish --dry-run
```
