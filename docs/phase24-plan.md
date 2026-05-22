# Phase 24 — Path B native full stack

**Status:** Wave 1 complete  
**Prerequisite:** Phase 23 Wave 1 (Map, money) shipped in v0.1.6  
**North star:** Build and run a Next-equivalent *product* in Point without a Next host — Point-native SPA + Bun API, unified dev, production serve.

---

## Success criteria (Phase 24 exit gate)

- [x] **`point dev`** auto-detects full-stack apps (navigation + routes + `web/`) and runs Vite UI + Bun API together
- [x] **`point serve`** serves production static (`dist/`) + API from one Bun process
- [x] **Full-stack template** includes API routes, Vite scaffold, `npm run dev` / `build` / `serve`
- [x] **Docs** — deploy guide + quick-start Path B section
- [x] Tests for dev-app detection, build, and serve helpers

---

## Non-goals (Phase 24)

- SSR / SSG / RSC (client React remains)
- File-based App Router codegen
- Vercel deploy adapter (document Bun/Docker path instead)
- Rewriting data-load to HTTP fetch (actions can stay in-process for v1)

---

## Workstreams

### P24-1 — Combined dev server (Wave 1)

Extend `point dev`:

- Auto mode `{ kind: "app" }` when program has bootstrap navigation + routes + `web/vite.config.*`
- `--api` forces API-only (existing routes mode)
- Rebuild `.point` → emit JS (API) + TS (UI); API hot-reloads; Vite HMR for UI

### P24-2 — Production serve (Wave 1)

New `point serve <entry>`:

- Builds or uses existing `generated/*.js` + `dist/` static
- Single Bun listener: `/api/*` → route handler, else static + SPA fallback

### P24-3 — Template upgrade (Wave 1)

Upgrade `packages/point/templates/full-stack-app` and `examples/full-stack-template`:

- `route` blocks under `/api/*`
- `web/` — Vite + React mount calling generated `mountAdminApp()`
- `package.json` scripts: `dev`, `build`, `serve`, `preview`

### P24-4 — Docs (Wave 1)

- `docs/site/toolchain/deploy.md` — Path B production path
- Quick-start note for `point create` → `npm run dev`

---

## Parallel goals

See [codex-goal-phase24.md](./codex-goal-phase24.md).

---

## Wave 2 (complete)

### P24-5 — `point build-app`
One command: check + emit JS/TS + Vite build → `dist/`.

### P24-6 — Toolchain docs
`docs/site/toolchain/dev.md`, CLI reference updates, Docker in deploy guide.

### P24-7 — Docker template
`Dockerfile` in full-stack template for Bun production image.

### P24-8 — E2E tests
`tests/point-build-app.test.ts` — build-app + serve runtime smoke.
