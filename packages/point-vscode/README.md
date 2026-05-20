# Point Language Extension

Cursor and VS Code language support for Point.

## Features

- `.point` language registration.
- TextMate syntax highlighting for Point declarations, semantic UI blocks, types, strings, interpolation, style tokens, collections, and field access.
- Language configuration for comments, brackets, auto-closing pairs, and folding.
- Editor snippets for `page`, `component`, `ui`, `state`, `data`, and `form`.
- Point file icon theme using the Point logo mark.

## Local Use In Cursor (folder install)

Until this is published, install it as a local extension:

1. Open the command palette.
2. Run `Developer: Install Extension from Location...`.
3. Choose `packages/point-vscode`.
4. Reload Cursor.

## Automatic Team Setup

At the repo root, `bun install` now runs editor setup automatically:

- packages this extension to a VSIX
- installs it into detected Cursor/VS Code-family editors (`cursor`, `code`, `code-insiders`, `codium`)

If your environment should skip this (CI, containers, or custom setup):

```bash
POINT_EDITOR_SETUP=0 bun install
```

## Package A VSIX

From the repo root:

```bash
bun run point:vscode:package
```

This writes a `.vsix` file into `packages/point-vscode`.

## Install From VSIX In Cursor

1. Open the command palette.
2. Run `Extensions: Install from VSIX...`.
3. Pick the `.vsix` file from `packages/point-vscode`.
4. Reload Cursor.

For file icons, choose `Point File Icons` as the active file icon theme. VS Code and Cursor only allow one active file icon theme at a time, so the publish-ready version should either become a full icon theme or document how to map `.point` inside a popular theme such as Material Icon Theme.

## Future Publish Path

This package is shaped to become a public extension package later:

- marketplace id: `point-lang.point`
- extension package name: `point`
- extension display name: `Point Language`

When publishing, remove `private: true`, add a license, package with `vsce`, and publish to Open VSX / VS Code Marketplace.
