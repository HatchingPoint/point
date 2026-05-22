# Phase 25 — Native semantic styling

Ship in-the-box UI styling with Tailwind-like ergonomics but no author-maintained CSS files.

## Wave 1 (shipped 0.1.14)

- Closed modifier set: `emphasized`, `muted`, `danger`, `success`, `large`, `small`, `compact`, `padded`, `centered`
- Syntax: `render emphasized large "text"`, `when count > 0 render muted count`, `form compact`, `main render padded view()`
- Escape hatch: `render class "..."` unchanged
- Shipped `point-ui.css` via `@hatchingpoint/point/ui/point-ui.css`
- Checker diagnostic `unknown-view-style` with repair hint listing valid modifiers

## Wave 2 (shipped 0.1.17)

- `theme` blocks: `theme app theme` with `accent`, `density`, and `radius` presets
- Theme classes emitted on layout roots and router mount wrappers
- Additional modifiers: `card`, `stack`, `badge`, `panel`, `spaced`
- `point build-app` writes `generated/app.tsx` alongside `.ts` for Vite hosts
- Route handler emits when routes exist (no `command serve` required)
- NavLink active state for sidebar links (`point-link-active`)
- `vercel-app` template: Vite host + Edge API adapter + theme tokens

## Deferred

- Tab-level semantic modifiers in parser (class escape hatch still works)
- Dark/light theme switching beyond `prefers-color-scheme`
