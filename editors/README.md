# Editor configs (verified in repo)

Copy-paste configs for non–VS Code editors. Requires `point` on PATH (`npm install -g @hatchingpoint/point`).

## Neovim 0.11+

```bash
# From Point repo root
mkdir -p ~/.config/nvim/lua
cp editors/neovim/point.lua ~/.config/nvim/lua/point.lua
```

In `init.lua`:

```lua
require("point")
```

Features: LSP diagnostics, hover, go-to-definition, completion, rename, format-on-save.

Verify:

```bash
which point
point lsp   # should wait on stdin — Ctrl+C to exit
nvim examples/math.point
```

## Zed

Merge `editors/zed/settings.json` into your Zed `settings.json` (Settings → Open settings file).

Ensure `point` is on PATH. Open any `.point` file — Zed starts `point lsp` automatically.

## VS Code / Cursor

Install [Point Language](https://marketplace.visualstudio.com/items?itemName=hatchingpoint.point) from the Marketplace. Optional: future versions may use `point lsp` directly.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `point: command not found` | `npm install -g @hatchingpoint/point` and ensure npm global bin is on PATH |
| No diagnostics | Run `point check-json file.point` in terminal first |
| Bun missing | Install [Bun](https://bun.sh) — Point CLI runs on Bun |

See also: [examples/adopters/starter-labs/README.md](../examples/adopters/starter-labs/README.md) for external-developer workflow.
