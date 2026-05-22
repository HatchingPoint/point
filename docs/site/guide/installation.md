---
title: Installation
description: Install Point for the terminal, VS Code or Cursor, and any editor that can launch an LSP server.
quadrant: Tutorial
---

## Summary

Point projects work best with **Bun + a local `@hatchingpoint/point` devDependency**. After `bun install`, the CLI and LSP resolve from `node_modules` — no global install required for team members cloning your repo.

For greenfield work, `point create` scaffolds a project with editor configs. For an existing repo (Surgetn Marketing, a monorepo folder, etc.), run **`point init`**.

## Clone an existing Point project

```bash
git clone <repo>
cd <repo>
bun install
```

If the repo includes `.vscode/` and `.point/` (from `point init` or `point create`):

- **VS Code / Cursor** — install the recommended **Point Language** extension when prompted; LSP uses the local package automatically.
- **Neovim / Zed / any LSP editor** — read `.point/editor.json` for the project-local launcher (`bun .point/lsp.mjs lsp`).
- **Terminal only** (GitKraken, basic editors, CI) — `bun run check`, `point fmt`, `point run`.

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
point --help
```

## Terminal-only workflow

You can use Point without an editor extension:

```bash
point check myfile.point
point fmt myfile.point
point build myfile.point generated/myfile.js
point run myfile.point
```

For CI or agent scripts, prefer structured commands:

```bash
point check-json myfile.point
point index myfile.point
point repair-plan myfile.point
```

## LSP for any editor

The package includes a stdio language server:

```bash
point lsp
```

Editors start this command automatically. It provides diagnostics, document outline, go to definition, hover, and document formatting. Neovim and Zed can both use the same server.

## VS Code and Cursor

Install **Point Language** from the Marketplace (or accept the workspace recommendation from `.vscode/extensions.json`).

The extension auto-detects, in order:

1. `point.cliPath` workspace setting (set by `point init`)
2. `node_modules/@hatchingpoint/point` in the workspace
3. Global `point` on PATH

Syntax highlighting works once the extension is installed. Hover, diagnostics, and completion require the CLI resolve step above — satisfied automatically after `bun install` in a configured project.

## See also

- [Toolchain: LSP](/point/toolchain/lsp)
- [CLI reference](/point/reference/cli)
- [AI overview](/point/ai/overview)
