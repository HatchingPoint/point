# Codex Goals — Phase 15 Wave 1

**Master plan:** [phase15-plan.md](./phase15-plan.md)  
**Platform vision:** [platform-vision-plan.md](./platform-vision-plan.md)  
**Principles gate:** [point-principles-gate.md](./point-principles-gate.md) — **required for every goal**  
**Progress log:** [codex-progress.md](./codex-progress.md)

---

## Sanity check

```bash
cd /Users/pla_cebro/clones/point
bun install && bun test
```

Expected: 179+ tests pass (Phase 14 complete).

---

## Launch order

| Priority | Goal | Agent focus | Parallel? |
|----------|------|-------------|-----------|
| 1 | **P15-1** | `layout` blocks with slots | ✅ |
| 1 | **P15-2** | Client `navigation` / route registry | ✅ |
| 1 | **P15-4** | Styling bridge `class "..."` on views | ✅ |
| 2 | **P15-3** | Data loading for views/pages | after Wave 1 |
| 2 | **P15-5** | Rich views (form, modal, tabs, list) | after P15-1 |

### Three-window parallel start (Wave 1)

```text
Window 1: Execute Goal P15-1 — layout blocks with named slots.
Window 2: Execute Goal P15-2 — client navigation and route registry.
Window 3: Execute Goal P15-4 — styling bridge class attribute on view nodes.
```

---

## Goal P15-1 — layout blocks

```text
/goal Execute docs/phase15-plan.md P15-1: Implement layout block with named slots (header, sidebar, main, footer). Pages declare which layout they use. Emit React layout components with slot props. Example shell sidebar+main in examples/app/dashboard/ (start directory). Tests, grammar, LSP snippets. MUST pass point-principles-gate.md (semantic refs, check-json, general example). Run bun test. Append checkpoint with principles gate line. Do NOT commit.
```

**Acceptance:**
- `layout app shell` with `slot sidebar render ...` / `slot main render ...`
- `page settings page` uses `layout app shell`
- `point index` shows layout in semantic refs
- Emit TSX with slot composition, not hand-authored JSX in .point

---

## Goal P15-2 — client navigation

```text
/goal Execute docs/phase15-plan.md P15-2: Implement navigation registry or app block listing client routes to pages. Path params /items/:id typed on page inputs. Emit React Router 7 compatible config. Add link syntax in views (e.g. navigate to "/items" or link "Items" to "/items"). General example routes in examples/app/dashboard/. Tests for param typing. MUST pass point-principles-gate.md. Run bun test. Append checkpoint. Do NOT commit.
```

**Acceptance:**
- `navigation` or `app` block registers at least 2 pages
- Typed path params checked
- Link emit in views

---

## Goal P15-4 — styling bridge

```text
/goal Execute docs/phase15-plan.md P15-4: Add class "tailwind classes" on view render nodes. Emit className in TSX. Optional theme record doc stub. Tests for class emit. Update docs/site/language/applications.md. MUST pass point-principles-gate.md. Run bun test. Append checkpoint. Do NOT commit.
```

**Acceptance:**
- `render class "text-lg font-bold" "Hello"` or equivalent minimal syntax
- Emitted JSX includes className
- No raw JSX in author source

---

## Goal P15-3 — data loading (Wave 2)

```text
/goal Execute docs/phase15-plan.md P15-3: Add on mount call or load data from action for views/pages. Loading/error/empty semantic modifiers. Emit async hook. Example in dashboard. MUST pass point-principles-gate.md. Run bun test. Append checkpoint. Do NOT commit.
```

---

## Goal P15-5 — rich views (Wave 2)

```text
/goal Execute docs/phase15-plan.md P15-5: Add semantic form, modal, tabs, list (4 minimum). Emit accessible React. Use in examples/app/dashboard/. MUST pass point-principles-gate.md. Run bun test. Append checkpoint. Do NOT commit.
```

---

## Hard rules (all P15 goals)

- Public `.point` stays semantic — no `fn`/`let`/`type` in author source
- **Pass [point-principles-gate.md](./point-principles-gate.md)** — append gate line to checkpoint
- General-purpose dashboard example — NOT App Store/factory themed
- Run `bun test` before done
- One goal per session
- Do NOT commit

---

## After Wave 1

Launch Wave 2: P15-3 + P15-5. Complete dashboard example with 3 pages (settings, list, detail). Mark Phase 15 exit gate when all pass.
