# Phase 8 — Product and Compiler (Code Only)

**Status:** Active as of 2026-05-21.  
**Prerequisite:** Phases 0–7 complete. npm (`@hatchingpoint/point@0.0.9`) and VS Code Marketplace (`hatchingpoint.point@0.0.9`) published. GitHub Actions publish pipeline green.

Everything in this phase is **code and tests in the repo**. No credentials, marketplace setup, or GitHub secret work required.

---

## Goal

Prove Point in daily use and tighten the developer experience so new contributors can ship features without touching compiler plumbing.

---

## 8.1 Editor experience

- [ ] Format on save in VS Code extension (`point fmt` on document save)
- [ ] Hover docs from `point explain` for symbols under cursor
- [ ] Quick-fix or code action stub from `repair-plan` diagnostics
- [ ] Extension README: install from Marketplace, global `point` on PATH requirement

**Verify:** manual test in VS Code/Cursor; extension tests if added.

---

## 8.2 Real-world module (dogfood)

- [ ] One non-demo module used for a Hatching Point product concern (pricing, readiness, billing, or API handler)
- [ ] Lives under `examples/` or `examples/adopters/hatchingpoint/`
- [ ] README with `point check`, `point build-ts`, `point run` / import into TS app
- [ ] Added to conformance or `point-core.test.ts` smoke coverage

**Verify:** `bun run ci` passes; module runs on Bun.

---

## 8.3 External adopter

- [ ] One module from someone outside the core team under `examples/adopters/<team>/`
- [ ] Local README + postmortem notes in `docs/adoption-postmortem.md`

**Verify:** adopter can run with global `point` + extension only (no monorepo paths).

---

## 8.4 Self-hosting (incremental)

- [ ] Second compiler lint pass in `compiler/passes/` (effects, missing await, or import boundaries)
- [ ] Pass included in CI via existing self-host test pattern

**Verify:** `bun run ci`; `point test compiler/passes/*.point`.

---

## 8.5 Expression-level diagnostics (optional)

- [ ] Runtime/check errors map to expression spans where feasible (document remaining gaps)

**Verify:** tests in `tests/semantic-diagnostics.test.ts` or point-core.

---

## 8.6 Python emit spike (optional — only if prioritized)

- [ ] Minimal Python emitter for `examples/math.point` only
- [ ] Limitations documented in `docs/python-emit-research.md`

**Verify:** end-to-end emit + documented scope; TS emit unchanged.

---

## Phase 8 Exit Gate

- [ ] Every checkbox in 8.1–8.4 is checked (8.5–8.6 optional)
- [ ] `bun run ci` passes
- [ ] At least one dogfood module and one external adopter module documented
- [ ] Extension improvements shipped in a published VSIX version bump

---

## Codex / Cursor prompt

```text
Execute docs/phase8-plan.md section [8.X] only.

Read first: docs/phase8-plan.md, docs/phase7-complete-review.md, docs/codex-progress.md.

Rules:
- Public .point source stays semantic. No fn/let/type in author-facing syntax.
- Production path: parsePointSource → semantic AST → desugar → core AST → check → emit.
- Add tests for every behavior change. Run bun run ci before marking checkboxes done.
- Append checkpoint to docs/codex-progress.md.
- Do not change publish scripts or GitHub workflows unless the section requires it.
```
