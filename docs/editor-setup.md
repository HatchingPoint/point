# Editor setup (any editor)

Point ships a Language Server in the same npm package as the CLI. Install once:

```bash
bun install -g @hatchingpoint/point
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

Install [Point Language](https://marketplace.visualstudio.com/items?itemName=hatchingpoint.point) from the Marketplace. The extension starts **`point lsp`** — the same server as Neovim and Zed. Format on save is enabled by default for `.point` files.

## Neovim (nvim-lspconfig)

**Verified config:** `editors/neovim/point.lua` in the Point repo.

```bash
cp editors/neovim/point.lua ~/.config/nvim/lua/point.lua
```

In `init.lua`: `require("point")`

Or inline:

Ensure `point` is on PATH (`which point` / `where point`).

## Zed

**Verified config:** merge `editors/zed/settings.json` into your Zed settings.

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
- **Server not found:** reinstall `bun install -g @hatchingpoint/point` and ensure Bun is on PATH (Point CLI runs on Bun).
- **Wrong cwd:** open the folder containing your `.point` files as the workspace root.
