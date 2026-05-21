# Phase 9 — Replace TypeScript & Python (Authoring Round)

**Status:** Active — launch parallel Codex agents.  
**Prerequisite:** Phases 0–8 core complete (compiler AST pipeline, LSP, npm/Marketplace, adoption examples).

**North star:** Authors write **only `.point`**. They do **not** hand-edit TypeScript or Python. Generated targets are build artifacts — like `.js` from `.ts` today, but Point is the source of truth.

**Honest scope for this round:** Full replacement of *every* TS/Python file (Next.js docs chrome, numpy, native binary) is **not** one sprint. This phase makes **application logic** replaceable **now** and lays **Python parity** for pure modules.

---

## What “replace TypeScript/Python” means

| Layer | Replace with Point **this round** | Still interop / later |
|-------|-------------------------------------|------------------------|
| Business logic (records, rules, calculations, labels) | ✅ Already | — |
| HTTP routes, actions, workflows, commands | ✅ Already (emit TS/JS) | — |
| `point run` / `point build` without author seeing TS | 🎯 **R1** | — |
| Libraries published from `.point` only | 🎯 **R5** | — |
| Pure logic Python modules (`math.point` → `math.py`) | 🎯 **R2** | actions/views in Python later |
| Rich UI / docs layout containers | ⚠️ Partial (**R6** spike) | full page model Phase 10+ |
| Compiler itself in Point | 📋 **R7** incremental | full self-host years |
| Standalone VM (no Bun/Node) | ❌ Not this round | native-target-research.md |

---

## Success criteria (Phase 9 exit gate)

- [ ] **`point run` uses JS emit by default** — no temp `.ts` on author path; TS emit opt-in (`--target ts` or `build-ts`)
- [ ] **`examples/math.point` emits runnable `math.py`** with tests proving parity vs TS/JS on pure logic
- [ ] **One npm-exportable package** built entirely from `.point` (no hand-written TS in `src/`)
- [ ] **One Hatching Point service module** dogfooded end-to-end (check → build → import/run)
- [ ] **`point check-docs`** validates fenced `.point` in `docs/site/**/*.md`
- [ ] **Public docs** state clearly: Point replaces TS/Python for new logic; emit is invisible
- [ ] `bun run ci` passes

---

## Parallel agent tracks

```text
Track A — Runtime (hide TS)          R1, R5
Track B — Python target              R2
Track C — Docs & truth               R3, R4, R8
Track D — UI / dogfood               R6, R7
```

Launch **R1 + R2 + R3 + R4** in parallel (four Codex sessions). **R5** after R1. **R6–R8** anytime.

**Codex goals:** [codex-goal-replacement.md](./codex-goal-replacement.md)  
**Router prompt:** [codex-goal-replacement.prompt.txt](./codex-goal-replacement.prompt.txt)

---

## Architecture (unchanged)

```text
.point (author) → semantic AST → core IR → check → emit → JS | TS | PY (targets)
```

Public source stays **semantic**. Never expose `fn`/`let`/`type` in `.point`.

---

## Non-goals (this round)

- Native binary / WASM production target
- Full Python emit for views/routes/actions
- Rewriting LandingPage docs shell in Point
- Replacing Bun as the primary JS runner (Python uses `python3` for R2)

---

## After Phase 9

- Phase 10: `page` / `layout` blocks or richer `view` for UI replacement
- Phase 10: Python emit for actions + stdlib bridge
- Phase 11: Package registry for Point libraries
- Long-term: optional standalone runtime (see native-target-research.md)
