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

The extension finds `point` on PATH automatically. For monorepo development, set **Point: Cli Path** to your local `cli.ts`.

## Features

- `.point` language registration
- Syntax highlighting for semantic Point source
- Snippets for `record`, `calculation`, `rule`, `label`, and more
- Point file icon theme
- Diagnostics on save via `point check-json`
- Go-to-definition and document outline via `point index`

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `point.cliPath` | empty | Path to `cli.ts` or `point` executable |
| `point.runtime` | `auto` | `auto`, `bun`, or `point` when using `cliPath` |

## Requirements

- **Bun** on PATH (Point CLI runs on Bun)
- **Point CLI** — `@hatchingpoint/point` globally, or a local `cli.ts` via `point.cliPath`

## File icons

Choose **Point File Icons** as the active file icon theme to show the Point logo on `.point` files.

## Links

- [Point on GitHub](https://github.com/HatchingPoint/point)
- [Hatching Point](https://www.hatchingpoint.com/)
