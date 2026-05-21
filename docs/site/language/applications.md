---
title: Applications
description: view, route, workflow, and command blocks for UI, HTTP, orchestration, and CLI.
quadrant: Reference
---

## Summary

Application blocks connect product logic to frameworks. They still lower through core IR to TypeScript or JavaScript emit targets.

## view

React-oriented UI (first target):

See `examples/view.point`.

Callable expressions in `render` and `when ... render` clauses emit as JSX text children (`<>{expression}</>`). Use `point build-ts` for React/Next.js targets; default `point build` emits plain strings for views.

### Readiness widget (dogfood)

`examples/adopters/hatchingpoint/readiness-widget.point` combines listing score rules with a `readiness widget` view. Build TypeScript:

```bash
point build-ts examples/adopters/hatchingpoint/readiness-widget.point generated/readiness-widget.ts
```

### Embed in Next.js

1. Emit with `point build-ts` (or `bun run build:ts` in the monorepo).
2. Copy or import `generated/readiness-widget.ts` into your Next.js app (e.g. `components/ReadinessWidget.tsx` after renaming if desired).
3. Ensure the app has React types (`JSX.Element`); add `"jsx": "react-jsx"` in `tsconfig.json` if needed.
4. Import and render as a controlled component — parent state owns `ListingSignals`:

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
  return (
    <section>
      <label>
        <input
          type="checkbox"
          checked={signals.hasScreenshots}
          onChange={(e) =>
            setSignals((s) => ({ ...s, hasScreenshots: e.target.checked }))
          }
        />
        Screenshots
      </label>
      {readinessWidgetView(signals)}
    </section>
  );
}
```

Doc pages can mount this component in MDX (`<ReadinessWidget />`) after syncing generated output in CI.

## page

Full-page shells for Next.js app routes (Phase 10 spike). A `page` block wraps a title, optional description, and a `main render` slot in semantic HTML (`<main>`, `<header>`, `<section>`).

See `examples/adopters/hatchingpoint/readiness-page.point` — listing readiness logic plus a `readiness page` page that embeds the widget view in the main slot.

Build TypeScript:

```bash
point build-ts examples/adopters/hatchingpoint/readiness-page.point generated/readiness-page.ts
```

### Embed in Next.js

1. Emit with `point build-ts`.
2. Import `readinessPage` from the generated file into an app route or client wrapper.
3. Pass `ListingSignals` from parent state (same shape as the widget example).

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
  return (
    <div>
      {/* Optional controls above the Point-authored page shell */}
      {readinessPage(signals)}
    </div>
  );
}
```

Use `view` for embeddable fragments; use `page` when you want a document shell with title and main content regions.

## route

HTTP handlers (Hono-first target):

See `examples/route.point`.

## workflow

Multi-step async orchestration:

See `examples/workflow.point`.

## command

CLI entrypoints for `point run`:

`point run` prefers zero-argument `command` blocks, then `main`, then other zero-arg entrypoints. See `examples/command.point` and `examples/app/todo.point`.

## Lowering

- Views emit JSX-oriented functions
- Pages emit JSX page shells with title and main slots
- Routes emit handler functions with method/path metadata
- Workflows emit async functions with step bindings
- Commands emit async or sync CLI entry functions

## Common mistakes

- Defining a run entrypoint with required inputs (run needs zero-arg command/action/calculation)
- Forgetting `await` between workflow steps that call actions

## Agent diagnostic notes

- Application blocks appear in `point index` with semantic kinds `view`, `page`, `route`, `workflow`, `command`
- Demo app: `examples/app/todo.point` for end-to-end patterns

## See also

- [Effects](/point/language/effects)
- [CLI reference](/point/reference/cli)
- [Replaces TypeScript and Python](/point/concepts/replaces-typescript-and-python)
