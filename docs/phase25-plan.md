# Phase 25 — Native semantic styling

Ship in-the-box UI styling with Tailwind-like ergonomics but no author-maintained CSS files.

## Wave 1 (this release)

- Closed modifier set: `emphasized`, `muted`, `danger`, `success`, `large`, `small`, `compact`, `padded`, `centered`
- Syntax: `render emphasized large "text"`, `when count > 0 render muted count`, `form compact`, `main render padded view()`
- Escape hatch: `render class "..."` unchanged
- Shipped `point-ui.css` via `@hatchingpoint/point/ui/point-ui.css`
- Checker diagnostic `unknown-view-style` with repair hint listing valid modifiers

## Deferred

- `theme` blocks (palette, accent, density)
- Tab-level semantic modifiers in parser (class escape hatch still works)
- Dark/light theme switching beyond `prefers-color-scheme`
