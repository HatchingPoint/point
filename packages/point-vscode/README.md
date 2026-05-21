# Point Language

Cursor and VS Code support for [Point](https://github.com/HatchingPoint/point) — an AI-first language for building software with coding agents.

## Install

1. Install [Bun](https://bun.sh).
2. Install the Point compiler:
   ```bash
   npm install -g @hatchingpoint/point
   ```
3. Install **Point Language** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=hatchingpoint.point) (works in Cursor too).
4. Open a `.point` file.

The extension starts `point lsp` automatically. For monorepo development, set **Point: Cli Path** to your local `cli.ts`.

## Features

- `.point` language registration
- Syntax highlighting for semantic Point source
- Snippets for `record`, `calculation`, `rule`, `label`, and more
- Point file icon theme
- **Language Server (`point lsp`)** — same server as Neovim and Zed:
  - Diagnostics (live, not only on save)
  - Document outline
  - Go to definition
  - Hover docs
  - Completion
  - Rename symbol
  - Format on save

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `point.cliPath` | empty | Path to `cli.ts` or `point` executable |
| `point.runtime` | `auto` | `auto`, `bun`, or `point` when using `cliPath` |
| `point.trace.server` | `off` | LSP trace: `off`, `messages`, or `verbose` |

Format on save is enabled by default for `.point` files.

## Requirements

- **Bun** on PATH (Point CLI runs on Bun)
- **Point CLI** — `@hatchingpoint/point` globally, or a local `cli.ts` via `point.cliPath`

## File icons

Choose **Point File Icons** as the active file icon theme to show the Point logo on `.point` files.

## Links

- [Point on GitHub](https://github.com/HatchingPoint/point)
- [Editor setup (Neovim, Zed)](https://github.com/HatchingPoint/point/blob/main/editors/README.md)
- [Hatching Point](https://www.hatchingpoint.com/)
