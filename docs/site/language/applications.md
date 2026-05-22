---
title: Applications
description: view, route, workflow, and command blocks for UI, HTTP, orchestration, and CLI.
quadrant: Reference
---

## Summary

Application blocks connect product logic to HTTP, UI, orchestration, and CLI entrypoints — still checked as Point source first.

## view

React-oriented UI (first target):

See `examples/view.point`.

Callable expressions in `render` and `when ... render` clauses produce dynamic content in views. Use `point build` (or typed build — see [Build and emit](/point/toolchain/build-emit)) when a host framework consumes the output.

### Tailwind styling bridge

View nodes accept an optional `class "..."` modifier after `render`. The compiler adds a wrapper with that class — authors stay in Point syntax.

```point
view counter
  input count: Int
  when count > 0 render class "text-lg font-semibold text-green-700" "Counter ready"
  render class "text-muted" "Counter empty"
```

Conditional branches can each carry their own classes. Host apps keep their Tailwind config; Point only forwards class strings into generated TSX.

Pages can style the main content region with `main render class "..."`:

```point
page demo page
  title "Dashboard"
  main render class "space-y-4 prose" dashboardView()
```

The emitted section keeps the `point-page-main` shell class and appends author classes (`className="point-page-main space-y-4 prose"`).

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
module Example

record Listing Signals
  has screenshots: Bool

view readiness widget
  input signals: Listing Signals
  input on signals change: Handler Listing Signals
  on change call on signals change
  bind checkbox "Screenshots" to signals.has screenshots
  render "Ready"
```

- `Handler Listing Signals` — callback input for parent-controlled state
- `bind checkbox "Label" to record.field` — controlled checkbox bound to a record field
- `on change call on signals change` wires checkbox updates to the named callback input (optional when there is exactly one `Handler` input).

### Readiness widget (dogfood)

`examples/adopters/hatchingpoint/readiness-widget.point` combines listing score rules with interactive checkboxes and a `readiness widget` view. Build when embedding in a host app:

```bash
point build examples/adopters/hatchingpoint/readiness-widget.point generated/readiness-widget.js
```

For typed host imports, see [Build and emit](/point/toolchain/build-emit).

### Embed in Next.js

1. Run `point build` (or typed build — see [Build and emit](/point/toolchain/build-emit)).
2. Import the generated module into your host app.
3. Ensure the app has React types (`JSX.Element`); add `"jsx": "react-jsx"` in `tsconfig.json` if needed.
4. Import and render as a controlled component — parent state owns `ListingSignals` and passes `onSignalsChange`:

```tsx
"use client";

import { useState } from "react";
import {
  readinessWidgetView,
  type ListingSignals,
} from "../generated/readiness-widget";

const emptySignals: ListingSignals = {
  hasScreenshots: false,
  hasDescription: false,
  hasPrivacyPolicy: false,
  hasSupportUrl: false,
  hasAgeRating: false,
};

export function ReadinessWidget() {
  const [signals, setSignals] = useState(emptySignals);
  return readinessWidgetView(signals, setSignals);
}
```

The generated view includes checkbox controls and the readiness summary; no manual checkbox JSX is required in the host app.

Doc pages can mount this component in MDX (`<ReadinessWidget />`) after syncing generated output in CI.

### Rich components and lists

Multi-page apps use `form`, `tabs`, `modal`, and `each item in data render` for settings pages, member lists, and detail views. See `examples/app/dashboard/dashboard.point` and `examples/full-stack-template/src/app.point`.

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

Full-page shells for Next.js app routes (Phase 10 spike). A `page` block wraps a title, optional description, and a `main render` slot in semantic HTML (`<main>`, `<header>`, `<section>`).

See `examples/adopters/hatchingpoint/readiness-page.point` — listing readiness logic plus a `readiness page` page that embeds the widget view in the main slot.

Build for host embedding:

```bash
point build examples/adopters/hatchingpoint/readiness-page.point generated/readiness-page.js
```

### Embed in a host app

1. Run `point build` (see [Build and emit](/point/toolchain/build-emit) for typed output).
2. Import the page entry from the generated module into your app route.
3. Pass `ListingSignals` and `onSignalsChange` from parent state (same shape as the widget example).

```tsx
"use client";

import { useState } from "react";
import {
  readinessPage,
  type ListingSignals,
} from "../generated/readiness-page";

const emptySignals: ListingSignals = {
  hasScreenshots: false,
  hasDescription: false,
  hasPrivacyPolicy: false,
  hasSupportUrl: false,
  hasAgeRating: false,
};

export default function ReadinessRoute() {
  const [signals, setSignals] = useState(emptySignals);
  return readinessPage(signals, setSignals);
}
```

Use `view` for embeddable fragments; use `page` when you want a document shell with title and main content regions. Pages forward `Handler` callback props to embedded views in `main render` call expressions.

## route

HTTP handlers with middleware chains, typed query/body/headers inputs, and JSON response helpers. See [Routes](/point/language/routes) and `examples/api/middleware-demo.point`. Basic example: `examples/route.point`.

## stream route

WebSocket servers with typed message handlers. Views subscribe with `subscribe to <stream route>` or `subscribe to "/ws/path"`. See `examples/api/stream-echo.point` and `examples/app/log-viewer/log-viewer.point`.

## schedule

Periodic jobs that call actions on an interval:

```point
module Jobs

action health check
  output status: Text
  touches none
  return "ok"

schedule health check tick
  every 5 minutes
  call health check
```

See `examples/tools/health-check-schedule.point`.

## workflow

Multi-step async orchestration:

See `examples/workflow.point`. Workflows support retry, timeout, and `on failure` policies — see `examples/workflow-retry.point`.

## pipeline, session, prompt, guard

Agent orchestration blocks:

- **`pipeline`** — multi-step flows with typed events (`examples/pipelines/document-ingest.point`)
- **`session`** — conversational state with streaming actions (`examples/agents/support-chat.point`)
- **`prompt`** — versioned templates with record placeholders (`examples/prompts/support-greeting.point`)
- **`guard output paths`** — scope file writes in pipelines (`examples/pipelines/guarded-output.point`)

Use `std.ai` for OpenAI and Anthropic provider actions. See [AI provider interop](/point/ecosystem/ai-providers).

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

## command

CLI entrypoints for `point run`:

`point run` prefers zero-argument `command` blocks, then `main`, then other zero-arg entrypoints. See `examples/command.point` and `examples/app/todo.point`.

## Compiler note

Application blocks share the same check and ref model as logic blocks. Views, routes, pipelines, and commands appear in `point index` with distinct semantic kinds for agent navigation.

## Common mistakes

- Defining a run entrypoint with required inputs (run needs zero-arg command/action/calculation)
- Forgetting `await` between workflow steps that call actions
- Building SQL from concatenated user input — use parameterized actions only

## Agent diagnostic notes

- Application blocks appear in `point index` with semantic kinds `view`, `page`, `layout`, `navigation`, `route`, `streamRoute`, `workflow`, `pipeline`, `session`, `command`
- Demo apps: `examples/app/dashboard/`, `examples/app/notes/`, `examples/full-stack-template/`

## See also

- [Effects](/point/language/effects)
- [Database interop](/point/ecosystem/database-interop)
- [CLI reference](/point/reference/cli)
- [Platform vision](/point/concepts/platform-vision)
- [How Point runs](/point/concepts/how-point-runs)
