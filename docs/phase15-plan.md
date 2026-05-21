# Phase 15 — Application Platform

**Status:** Complete (Wave 1 + Wave 2).  
**Prerequisite:** Phase 14 exit gate.  
**North star:** Authors build **multi-page applications** in Point — not embeddable widgets in a hand-written React shell.

**Master plan:** [platform-vision-plan.md](./platform-vision-plan.md)  
**Codex goals:** [codex-goal-phase15.md](./codex-goal-phase15.md)  
**Principles gate:** [point-principles-gate.md](./point-principles-gate.md) — required for every P15 goal

---

## Point principles gate

Every P15 deliverable must pass [point-principles-gate.md](./point-principles-gate.md). Phase 15 is the highest drift risk (UI → React soup). **Non-negotiable:** `layout`, `navigation`, and styling are semantic blocks with refs and repair metadata — not JSX authors maintain.

---

## Success criteria (Phase 15 exit gate)

- [x] **`layout` block** — slots (header, sidebar, main, footer), nested layouts
- [x] **`navigation` / client routes** — route registry, path params, lazy page loading (emit React Router or equivalent)
- [x] **Data loading for views** — `load`/`query` pattern binding actions to view props (emit TanStack Query or lightweight hook)
- [x] **Styling bridge** — semantic `class "..."` on view nodes → Tailwind/CSS emit (no raw JSX in author source)
- [x] **Rich view components** — list, table, form, modal, tabs (semantic blocks, not one-offs)
- [x] **General example:** `examples/app/dashboard/` — settings + item list + detail (3 pages)
- [ ] **Upgrade:** `examples/app/todo.point` → multi-page or reference dashboard example (dashboard supersedes)
- [x] Docs: `docs/site/language/applications.md` — full app authoring
- [x] `bun run ci` passes

---

## P15-1 — Layout blocks

- [x] `layout` syntax with named slots and default content
- [x] Pages declare which layout they use
- [x] Emit React layout components with `{children}` / slot props
- [x] Example shell: sidebar + main
- [x] Tests + grammar

---

## P15-2 — Client navigation

- [x] `navigation` registry or `app` block listing routes → pages/views
- [x] Path params (`/items/:id`) typed on page inputs
- [x] Emit client router config (React Router 7 compatible)
- [x] Link component in view syntax
- [x] Tests for param typing

---

## P15-3 — Data loading pattern

- [x] `on mount call` or `load data from action` binding for views/pages
- [x] Loading/error/empty states as semantic view modifiers
- [x] Emit async hook + suspense or query wrapper
- [x] Example: dashboard list loads from `action fetch items`
- [x] Tests for missing await diagnostics

---

## P15-4 — Styling bridge

- [x] `class "tailwind classes"` on view nodes
- [ ] Optional `theme` record for design tokens
- [x] Emit `className` in TSX/JSX
- [x] Document coexistence with host Tailwind config
- [x] Tests

---

## P15-5 — Rich view components (pick 4 minimum)

- [x] `list` / `each` rendering (may extend existing)
- [x] `form` with field bindings
- [x] `modal` / `dialog`
- [x] `tabs`
- [x] Emit accessible React primitives
- [x] Example usage in dashboard app

---

## Parallel tracks

```text
Wave 1:  P15-1, P15-2, P15-4
Wave 2:  P15-3 (after actions stable), P15-5 (after layout)
```

**Codex goals:** [codex-goal-phase15.md](./codex-goal-phase15.md)

---

## Non-goals

- WebSocket live data (Phase 16 — use polling stub OK in Phase 15)
- Replacing Next.js docs site
- 3D / canvas / xterm (use `external` until demand clear)

---

## After Phase 15

Phase 16 — Realtime & processes: WebSockets, subprocess streaming UI, workflow retries.
