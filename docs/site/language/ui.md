---
title: UI
description: view, page, layout, and navigation blocks for React-oriented applications.
quadrant: Reference
---

## Summary

UI blocks connect application logic to React-style components and multi-page app shells — still checked as Point source first.

## view

React-oriented UI (first target). See `examples/view.point`.

Callable expressions in `render` and `when ... render` clauses produce dynamic content in views. Use `point build` when a host framework consumes the output — see [Build and emit](/point/toolchain/build-emit).

### Semantic styling

View nodes accept semantic style modifiers after `render`. The compiler maps them to shipped `point-ui.css` classes — authors stay in Point syntax with no separate stylesheet.

```point
module Counter

view counter
  input count: Int
  when count > 0 render emphasized large "Counter ready"
  render muted "Counter empty"
```

Pages can style the main content region:

```point
module Demo

view dashboard view
  render "Dashboard body"

page demo page
  title "Dashboard"
  main render padded dashboardView()
```

Forms accept layout modifiers:

```point
module Demo

record Settings
  name: Text

view settings form
  input settings: Settings
  input on settings change: Handler Settings
  on change call on settings change
  form compact
    bind field "Name" to settings.name
```

Modifiers: `emphasized`, `muted`, `danger`, `success`, `large`, `small`, `compact`, `padded`, `centered`, `card`, `stack`, `badge`, `panel`, `spaced`.

### Theme presets

Declare one theme block per module to apply accent, density, and radius tokens on layout roots and router mount wrappers:

```point
module Demo

record Placeholder
  id: Text

theme app theme
  accent indigo
  density comfortable
  radius medium
```

Accents: `indigo`, `emerald`, `rose`, `slate`. Density: `compact`, `comfortable`. Radius: `soft`, `medium`, `sharp`.

Import styles in your web entry (full-stack apps):

```css
@import "@hatchingpoint/point/ui/point-ui.css";
```

Unknown modifiers produce a `unknown-view-style` diagnostic with a repair hint listing valid modifiers.

### Raw class escape hatch

View nodes still accept `class "..."` after `render` for custom CSS classes when semantic modifiers are not enough:

```point
module Demo

view counter
  input count: Int
  when count > 0 render class "my-custom-class" "Counter ready"
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
- `load data from fetch GET "/api/items" field items type List<Item>` fetches JSON over HTTP in the client (Path B full-stack apps).
- `when loading render`, `when error render`, and `when empty render` are semantic state modifiers (optional).
- Calling the load action directly in `render` without `await` is a `missing-await` diagnostic — use the `data` binding instead.

### Periodic refresh (polling)

After `load data from action …`, `on mount call …`, or `load data from fetch …`, add **`refresh every <N> seconds`** or **`refresh every <N> minutes`**. The compiler emits `setInterval` refetches and clears the timer on unmount. Background refreshes do not toggle the loading state (initial load still does).

Multiple `refresh every` lines on one view are a `duplicate-refresh-interval` error; `refresh every` without a data-load binding is `refresh-without-load`.

Example: **`examples/app/live-dashboard/live-dashboard.point`**.

See `examples/app/dashboard/dashboard.point` for a list view that loads from `action fetch items`.

### Rich components and lists

See `examples/app/dashboard/dashboard.point` and `examples/full-stack-template/src/app.point` for full apps. Syntax reference:

#### Links

```point
view dashboard nav
  link "Settings" to "/settings"
  link "Items" to "/items"
  render "Dashboard"
```

#### Lists (`each`)

Requires a `List` input or the `data` binding from `load data from action`:

```point
module DashboardApp

record Item
  id: Text
  title: Text

action fetch items
  output items: List<Item>
  touches none
  return [{ id: "alpha", title: "Alpha" }]

view items list
  load data from action fetch items
  when loading render "Loading items..."
  each item in data render link item.title to "/items/" + item.id
```

Optional Tailwind on list rows: `each item in data render class "text-sm" link item.title to "/path"`.

#### Forms

A `form` block groups controlled fields. Use `bind field` for text inputs and `bind checkbox` for booleans:

```point
module DashboardApp

record WorkspaceSettings
  workspace name: Text
  notifications enabled: Bool

view settings form
  input settings: WorkspaceSettings
  input on settings change: Handler<WorkspaceSettings>
  on change call on settings change
  form
  bind field "Workspace name" to settings.workspace name
  bind checkbox "Email notifications" to settings.notifications enabled
  render "Settings"
```

#### Tabs

At least two `tab` lines inside a `tabs` block:

```point
module DashboardApp

record WorkspaceSettings
  workspace name: Text
  theme: Text

view settings tabs
  input settings: WorkspaceSettings
  tabs
  tab "General" render muted "Theme: " + settings.theme
  tab "Advanced" render emphasized "Workspace-wide notification settings"
```

Optional classes: `tab "General" render class "font-bold" "General settings"`.
Tabs also accept semantic style modifiers before the render expression, using the same modifier list as view `render` lines.

#### Modals

```point
module DashboardApp

record WorkspaceSettings
  notifications enabled: Bool

view settings modal hint
  input settings: WorkspaceSettings
  modal "Notifications enabled" when settings.notifications enabled render "Email alerts are active"
```

Forms:

- `modal "Title" render expression`
- `modal "Title" when condition render expression`
- `modal "Title" render class "..." expression` (optional Tailwind on the dialog shell)

#### Controlled inputs and `Handler T`

Views can declare callback props with `Handler T` or `Handler<T>` and bind controlled checkboxes to record fields:

```point
record Item Flags
  featured: Bool

view item editor
  input flags: Item Flags
  input on flags change: Handler<Item Flags>
  on change call on flags change
  bind checkbox "Featured" to flags.featured
  render "Edit item"
```

- `Handler Item Flags` / `Handler<Item Flags>` — callback input for parent-controlled state
- `bind checkbox "Label" to record.field` — controlled checkbox bound to a record field
- `on change call on flags change` wires checkbox updates to the named callback input (optional when there is exactly one `Handler` input)

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
