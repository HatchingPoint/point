---
title: Installation
description: Install Point for the terminal, VS Code or Cursor, and any editor that can launch an LSP server.
quadrant: Tutorial
---

## Summary

Install the Point CLI once, then use it from the terminal, an LSP-capable editor, VS Code, or Cursor. Point is **Bun-first** — use Bun to install; npm, pnpm, and yarn work from the same registry.

## Install the CLI

```bash
bun install -g @hatchingpoint/point
point --help
```

Alternative (same registry):

```bash
npm install -g @hatchingpoint/point
```

Point runs on Bun. If the CLI cannot start, install [Bun](https://bun.sh) and make sure it is on `PATH`.

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

Install Point Language from the Marketplace for VS Code or Cursor. The extension starts `point lsp`, so it uses the same language server as other editors.

The extension is optional. The CLI and LSP are the portable contract.

## See also

- [Toolchain: LSP](/point/toolchain/lsp)
- [CLI reference](/point/reference/cli)
- [AI overview](/point/ai/overview)
