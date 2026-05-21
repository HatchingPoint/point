# Codex Goals — Phase 10 Language depth

Launch **parallel agents** for maximum speed. Each goal is one Codex session.

**Master plan:** [phase10-plan.md](./phase10-plan.md)  
**Progress log:** [codex-progress.md](./codex-progress.md)

---

## Sanity check

```bash
cd c:\Users\mcarr\Documents\clones\point-1
bun install && bun run ci
```

Expected: 117+ tests pass.

---

## Launch order (ASAP)

| Priority | Goal | Focus | Parallel |
|----------|------|-------|----------|
| 1 | **P10-1** | `page` / `layout` block spike | ✅ |
| 1 | **P10-3** | Python emit for `action` blocks | ✅ |
| 1 | **P10-4** | `point build-py-all` | ✅ |
| 1 | **P10-7** | LandingPage deploy + widget embed | ✅ |
| 2 | **P10-2** | Richer view props / state | after P10-1 |
| 2 | **P10-5** | point-logic publish in CI | ✅ |
| 2 | **P10-6** | Stdlib bridge documentation | ✅ |

---

## Goal P10-1 — page/layout spike

```text
/goal Execute docs/phase10-plan.md P10-1: Design minimal page or layout semantic block (or extend view with layout slots). Add examples/adopters/hatchingpoint/readiness-page.point that emits a Next.js-embeddable page shell. Tests + docs/site/language/applications.md update. Run bun run ci. Append checkpoint.
```

---

## Goal P10-3 — Python action emit

```text
/goal Execute docs/phase10-plan.md P10-3: Extend emit-python.ts for action blocks (async def, basic await). Target examples/action.point → generated/action.py. Smoke test with python. Document limits in docs/python-emit-research.md. Run bun run ci. Append checkpoint.
```

---

## Goal P10-4 — build-py-all

```text
/goal Execute docs/phase10-plan.md P10-4: Add point build-py-all CLI mirroring build-all for pure-logic fixtures. Wire into package.json scripts. Tests. Run bun run ci. Append checkpoint.
```

---

## Goal P10-7 — LandingPage live

**Repo:** LandingPage

```text
/goal Commit LandingPage Point docs site (sync + routes + components). Run npm run sync:point-docs only — do NOT require npm run build. Push to main. Append checkpoint in point repo codex-progress.md noting LandingPage commit hash.
```

---

## Goal P10-5 — point-logic publish pipeline

```text
/goal Execute docs/phase10-plan.md P10-5: Add packages/point-logic to publish workflow or document npm publish step. Ensure build:logic in CI. Add test that npm pack from point-logic succeeds. Append checkpoint.
```

---

## Goal P10-6 — Stdlib bridge doc

```text
/goal Write docs/site/stdlib/bridge.md and docs/site/ecosystem/npm-packages.md covering external blocks, @hatchingpoint/point-logic, and Python interop. Run point check-docs. Append checkpoint.
```

---

## Hard rules

- Public `.point` stays semantic
- Run `bun run ci` before done
- One goal per session; append checkpoint to docs/codex-progress.md
