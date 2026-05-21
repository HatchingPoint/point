---
title: Language Server (LSP)
description: Run point lsp in any editor for diagnostics, navigation, hover, and format.
quadrant: Reference
---

## Summary

`point lsp` is a stdio Language Server in the same npm package as the CLI. Install once; any LSP-capable editor can use it without a separate download.

## Install

```bash
npm install -g @hatchingpoint/point
point lsp
```

Updating `@hatchingpoint/point` updates the LSP. No cloud server is required.

## Features

| LSP feature | Backed by |
|-------------|-----------|
| Diagnostics | `check-json` with semantic spans |
| Document symbols | `index` |
| Go to definition | Semantic symbol spans |
| Hover | `explain` |
| Format document | `fmt` |
| Completion, rename | Built into LSP server |

## VS Code and Cursor

Install [Point Language](https://marketplace.visualstudio.com/items?itemName=hatchingpoint.point) from the Marketplace. The extension starts `point lsp` — the same server as Neovim and Zed. Format on save is enabled by default for `.point` files.

The extension is optional. The CLI and LSP are the portable contract.

## Neovim

Verified config: `editors/neovim/point.lua` in the Point repository.

```bash
cp editors/neovim/point.lua ~/.config/nvim/lua/point.lua
```

In `init.lua`: `require("point")`

Ensure `point` is on PATH (`which point` / `where point`).

## Zed

Merge `editors/zed/settings.json` from the Point repository into your Zed settings:

```json
{
  "lsp": {
    "point": {
      "command": "point",
      "args": ["lsp"],
      "languages": ["Point"]
    }
  }
}
```

Register the `.point` extension if your Zed build requires it.

## Terminal-only

Without LSP:

```bash
point check myfile.point
point fmt myfile.point
point check-json myfile.point
```

## Syntax highlighting

TextMate grammar: `packages/point-vscode/syntaxes/point.tmLanguage.json`. Copy or symlink into editors that support TextMate grammars.

## Troubleshooting

- **No diagnostics:** run `point check-json myfile.point` from the project root
- **Server not found:** reinstall the npm package; ensure Bun is on PATH (CLI runs on Bun)
- **Wrong workspace:** open the folder that contains your `.point` files as the editor root

## See also

- [Installation](/point/guide/installation)
- [CLI reference](/point/reference/cli)
- [AI overview](/point/ai/overview)
