---
title: Installation
description: Install Point for the terminal, VS Code or Cursor, and any editor that can launch an LSP server.
quadrant: Tutorial
---

## Summary

Point projects work best with **Bun + a local `@hatchingpoint/point` devDependency**. After `bun install`, the CLI and LSP resolve from `node_modules` — no global install required for team members cloning your repo.

**New here?** [Point in 60 seconds](/point/guide/point-in-60-seconds) → [Golden app demo](/point/guide/golden-app-demo).

For greenfield work, `point create` scaffolds a project with editor configs. For an existing repo, run **`point init`**.

## Clone an existing Point project

```bash
git clone <repo>
cd <repo>
bun install
```

If the repo includes `.vscode/` and `.point/` (from `point init` or `point create`):

- **VS Code / Cursor** — install the recommended **Point Language** extension when prompted; LSP uses the local package automatically.
- **Neovim / Zed / any LSP editor** — read `.point/editor.json` for the project-local launcher (`bun .point/lsp.mjs lsp`).
- **Terminal only** — `bun run check`, `point fmt`, `point box`, `point launch`.

No global CLI required when `@hatchingpoint/point` is in `package.json` and you use the bundled editor configs.

## Add Point to an existing repo

From the project root (where your `.point` files live):

```bash
point init
bun install
```

`point init` adds `@hatchingpoint/point`, `.vscode/extensions.json`, `.vscode/settings.json`, `.point/lsp.mjs`, and editor hints for Neovim/Zed. Use `--skip-install` to only write config files.

## Install the CLI globally (optional)

Useful for `point create`, ad-hoc checks outside a Node project, or editors without project-local resolution:

```bash
bun install -g @hatchingpoint/point
point box src/app.point
```

## Terminal-only workflow

```bash
point check myfile.point
point fmt myfile.point
point launch myfile.point my command    # when file has command blocks
point dev src/app.point                 # full-stack app
```

For CI or agent scripts:

```bash
point check-json myfile.point
point repair-plan myfile.point
point index myfile.point
```

## LSP for any editor

The package includes a stdio language server:

```bash
point lsp
```

Editors start this command automatically. It provides diagnostics, document outline, go to definition, hover, and document formatting.

## VS Code and Cursor

Install **Point Language** from the Marketplace (or accept the workspace recommendation from `.vscode/extensions.json`).

The extension auto-detects, in order:

1. `point.cliPath` workspace setting (set by `point init`)
2. `node_modules/@hatchingpoint/point` in the workspace
3. Global `point` on PATH

## See also

- [Point in 60 seconds](/point/guide/point-in-60-seconds)
- [Golden app demo](/point/guide/golden-app-demo)
- [Toolchain: LSP](/point/toolchain/lsp)
- [CLI reference](/point/reference/cli)
