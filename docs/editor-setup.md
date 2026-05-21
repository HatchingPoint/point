# Editor setup (any editor)

Point ships a Language Server in the same npm package as the CLI. Install once:

```bash
npm install -g @hatchingpoint/point
point lsp   # stdio server — editors start this automatically
```

## What `point lsp` provides

| LSP feature | Backed by |
|-------------|-----------|
| Diagnostics | `check` + semantic spans |
| Document outline | `index` |
| Go to definition | semantic symbol spans |
| Hover | `explain` |
| Format document | `fmt` |

No separate install, no cloud server. Updating `@hatchingpoint/point` updates the LSP.

## VS Code / Cursor

Install [Point Language](https://marketplace.visualstudio.com/items?itemName=hatchingpoint.point) from the Marketplace. The extension shells out to the CLI today; it works with global `point` on PATH.

Optional future: extension uses `point lsp` directly.

## Neovim (nvim-lspconfig)

```lua
vim.lsp.enable("point")

vim.lsp.config("point", {
  cmd = { "point", "lsp" },
  filetypes = { "point" },
  root_markers = { "point.json", ".git" },
})
```

Or with `lspconfig` if you use the older API:

```lua
require("lspconfig").point.setup({})
-- registers server named "point" when point-lspconfig plugin exists — use vim.lsp.config above for stock Neovim 0.11+
```

Ensure `point` is on PATH (`which point` / `where point`).

## Zed

Add to `settings.json`:

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

(Zed language name may vary — register `.point` extension if needed.)

## Terminal-only (no LSP)

```bash
point check myfile.point
point fmt myfile.point
point build-ts myfile.point generated/myfile.ts
```

## Syntax highlighting without VS Code

The TextMate grammar lives at `packages/point-vscode/syntaxes/point.tmLanguage.json`. Copy or symlink it into editors that support TextMate grammars (Sublime, some Vim plugins).

## Troubleshooting

- **No diagnostics:** confirm `point check-json file.point` works in the project root.
- **Server not found:** reinstall `npm install -g @hatchingpoint/point` and ensure Bun is on PATH (Point CLI runs on Bun).
- **Wrong cwd:** open the folder containing your `.point` files as the workspace root.
