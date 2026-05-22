---
title: UI
description: view, page, layout, and navigation blocks for React-oriented applications.
quadrant: Reference
---

## Summary

UI blocks connect product logic to React-style components and multi-page app shells — still checked as Point source first.

## view

React-oriented UI (first target). See `examples/view.point`.

Callable expressions in `render` and `when ... render` clauses produce dynamic content in views. Use `point build` when a host framework consumes the output — see [Build and emit](/point/toolchain/build-emit).

### Tailwind styling bridge

View nodes accept an optional `class "..."` modifier after `render`. The compiler adds a wrapper with that class — authors stay in Point syntax.

```point
view counter
  input count: Int
  when count > 0 render class "text-lg font-semibold text-green-700" "Counter ready"
  render class "text-muted" "Counter empty"
```

Pages can style the main content region with `main render class "..."`:

```point
page demo page
  title "Dashboard"
  main render class "space-y-4 prose" dashboardView()
```

See `examples/view.point` for a minimal styled view.

### Data loading on mount

Views and pages can load data from an action on mount. The compiler generates the hook wiring — authors declare the action and binding only.

```point
action fetch items
  output result: Text
  touches none
  return "alpha, beta, gamma"

view items list
  load data from action fetch items
  when loading render "Loading items..."
  when error render "Could not load items"
  when empty render "No items yet"
  render "Items: " + data
```

- `load data from action <name>` or `on mount call <name>` binds the action result to `data` for render expressions.
- `when loading render`, `when error render`, and `when empty render` are semantic state modifiers (optional).
- Calling the load action directly in `render` without `await` is a `missing-await` diagnostic — use the `data` binding instead.

See `examples/app/dashboard/dashboard.point` for a list view that loads from `action fetch items`.

### Controlled inputs and callbacks

Views can declare callback props with `Handler T` and bind controlled checkboxes to record fields:

```point
record Item Flags
  featured: Bool

view item editor
  input flags: Item Flags
  input on flags change: Handler Item Flags
  on change call on flags change
  bind checkbox "Featured" to flags.featured
  render "Edit item"
```

- `Handler Item Flags` — callback input for parent-controlled state
- `bind checkbox "Label" to record.field` — controlled checkbox bound to a record field
- `on change call on flags change` wires checkbox updates to the named callback input (optional when there is exactly one `Handler` input).

### Rich components and lists

Multi-page apps use `form`, `tabs`, `modal`, and `each item in data render` for settings pages, member lists, and detail views. See `examples/app/dashboard/dashboard.point` and `examples/full-stack-template/src/app.point`.

### Embed in a host app

1. Run `point build` (or typed build — see [Build and emit](/point/toolchain/build-emit)).
2. Import the generated module into your host app.
3. Ensure the app has React types (`JSX.Element`); add `"jsx": "react-jsx"` in `tsconfig.json` if needed.
4. Pass props from parent state for views with `input` bindings.

### Adopter example (interactive checklist)

`examples/adopters/hatchingpoint/readiness-widget.point` is a **dogfood demo** (App Store listing checklist) using the same controlled-input patterns. See the [live demo](https://hatchingpoint.com/point/examples#live-demo) or build locally:

```bash
point build examples/adopters/hatchingpoint/readiness-widget.point generated/readiness-widget.js
```

## layout and navigation

App shells use named slots and a route registry:

```point
module App

layout app shell
  slot sidebar render "Nav"
  slot main render "Select a page"

page settings page
  layout app shell
  title "Settings"
  main render "Settings"

page members list page
  layout app shell
  title "Members"
  main render "Members"

navigation dashboard app
  path "/settings" page settings page
  path "/members" page members list page
  bootstrap router
```

Pages bind to layouts with `layout app shell`, `title`, and `main render`. See `examples/app/dashboard/dashboard.point`.

## page

Full-page shells for Next.js app routes. A `page` block wraps a title, optional description, and a `main render` slot in semantic HTML (`<main>`, `<header>`, `<section>`).

See `examples/app/dashboard/dashboard.point` for settings and list pages inside a layout shell.

Use `view` for embeddable fragments; use `page` when you want a document shell with title and main content regions. Pages forward `Handler` callback props to embedded views in `main render` call expressions.

## Database in views

Load persisted data through actions — not vendor-specific hooks:

```point
module Notes

action list notes
  output rows: Text
  touches database
  return "[]"

view notes list
  load data from action list notes
  when loading render "Loading..."
  render "Notes loaded"
```

Wire real queries with `std.sql` or an `external` driver — see [Database interop](/point/ecosystem/database-interop) and `examples/app/notes/notes.point`.

## Common mistakes

- Building SQL from concatenated user input — use parameterized actions only
- Calling load actions directly in `render` without the `data` binding

## See also

- [Routes](/point/language/routes)
- [Realtime](/point/language/realtime)
- [Applications index](/point/language/applications)
- [Database interop](/point/ecosystem/database-interop)
