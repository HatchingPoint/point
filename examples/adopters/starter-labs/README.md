# Starter Labs — External adopter example

This folder models a **first external adopter**: a small team using Point with only the global CLI and LSP — no monorepo checkout required.

## Who

**Starter Labs** (example adopter) — subscription pricing logic for a SaaS product.

## Setup (external developer)

```bash
bun install -g @hatchingpoint/point
point check subscription-tier.point
point fmt subscription-tier.point
point build-ts subscription-tier.point generated/subscription-tier.ts
```

## Editor (Neovim)

Copy `editors/neovim/point.lua` from the Point repo into your config, or:

```lua
vim.lsp.enable("point")
vim.lsp.config("point", {
  cmd = { "point", "lsp" },
  filetypes = { "point" },
  root_markers = { ".git" },
})
```

## What we learned (postmortem notes)

| Area | Result |
|------|--------|
| Onboarding | Global npm install + one `.point` file is enough |
| LSP | Diagnostics and completion work without VS Code |
| Emit | Generated TS drops into existing Node/Bun billing service |
| Gaps | No Point package registry yet — copy `.point` files or use git submodules |

## Agent prompt that worked

```text
Extend subscription-tier.point with a rule that applies a 10% loyalty discount when seats >= 10.
Run point check-json after edits. Use point://semantic/ refs from point index.
```

## Checklist for real external adopters

1. Add module under `examples/adopters/<your-team>/`
2. Include this README pattern (install, check, build, editor)
3. Open a PR or send postmortem notes for `docs/adoption-postmortem.md`
