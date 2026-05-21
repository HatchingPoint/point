---
title: VS Code
description: Use the optional Point Language extension in VS Code or Cursor.
quadrant: Reference
---

## Summary

The VS Code extension is optional. It provides editor integration by starting the same `point lsp` server used by other editors.

## Install

Install Point Language from the VS Code Marketplace. Cursor can use the same extension.

## Features

- Syntax highlighting and file icons
- Diagnostics from the Point checker
- Document outline
- Go to definition
- Hover explanations
- Format document

## CLI still matters

The extension expects the `point` CLI on `PATH`. Install it with npm:

```bash
npm install -g @hatchingpoint/point
```

## See also

- [LSP](/point/toolchain/lsp)
- [Installation](/point/guide/installation)
- [Formatting](/point/toolchain/formatting)
