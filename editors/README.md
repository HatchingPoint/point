# Editor configs (verified in repo)

Point uses **one LSP contract** (`point lsp` over stdio). Projects generated with `point create` or configured with `point init` include a **project-local launcher** at `.point/lsp.mjs` so any editor can find the CLI after `bun install` — no global install required.

Read `.point/editor.json` in a configured project for machine-readable hints.

## VS Code / Cursor / GitHub Copilot editors

1. Clone the project, run `bun install`
2. Open the folder — install **Point Language** when recommended (`.vscode/extensions.json`)
3. Open a `.point` file

Works in VS Code, Cursor, and other VS Code–compatible editors (including many Git GUIs with a built-in editor pane once the extension is installed).

## Neovim 0.11+

**Project-local (recommended after `point init`):**

```lua
-- init.lua when editing a Point project
local root = vim.fn.getcwd()
if vim.fn.filereadable(root .. "/.point/editors/neovim.lua") == 1 then
  dofile(root .. "/.point/editors/neovim.lua")
end
```

**Global fallback** (requires global `point` on PATH):

```bash
cp editors/neovim/point.lua ~/.config/nvim/lua/point.lua
```

In `init.lua`: `require("point")`

## Zed

**Project-local:** merge `.point/editors/zed.json` from the repo into Zed workspace settings.

**Global fallback:** merge `editors/zed/settings.json` and ensure `point` is on PATH.

## Any other LSP-capable editor

Run the project launcher (after `bun install`):

```bash
bun .point/lsp.mjs lsp
```

Wire that command in your editor's LSP settings (same args as Zed/Neovim above).

## Terminal-only (no LSP)

GitKraken and other Git clients without LSP still work for **running** Point:

```bash
bun install
bun run check
point fmt src/app.point
point run src/app.point
```

Use your editor for text; use the terminal for check/format/run.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `point: command not found` in terminal | Run `bun install` in the project, or `bun install -g @hatchingpoint/point` |
| No diagnostics in VS Code | Install Point Language extension; run `bun install`; check `.vscode/settings.json` |
| No diagnostics in Neovim/Zed | Use `.point/lsp.mjs` launcher, not bare `point` on PATH |
| Bun missing | Install [Bun](https://bun.sh) |

See also: [Installation guide](../docs/site/guide/installation.md), [examples/adopters/starter-labs/README.md](../examples/adopters/starter-labs/README.md).
