# Phase 8 — Product and Compiler (Code Only)

**Status:** Active as of 2026-05-21.  
**Prerequisite:** Phases 0–7 complete. npm (`@hatchingpoint/point@0.0.9`) and VS Code Marketplace (`hatchingpoint.point@0.0.9`) published. GitHub Actions publish pipeline green.

Everything in this phase is **code and tests in the repo**. No credentials, marketplace setup, or GitHub secret work required.

---

## Goal

Make Point usable **without VS Code** — terminal, CI, and any editor — then polish the VS Code extension on top of shared tooling.

---

## 8.0 Editor-agnostic tooling (priority)

Point already works from the terminal (`point check`, `fmt`, `build`, `run`, `test`, `repl`). What non–VS Code users lack is **editor integration**.

Today the VS Code extension is **not** a real LSP server — it shells out to CLI commands (`check-json`, `index`). There is no `point lsp` for Neovim, Emacs, Zed, JetBrains, or VSCodium.

- [x] **`point lsp`** — stdio Language Server Protocol server wrapping existing CLI:
  - publish diagnostics (`check-json`)
  - document symbols + go-to-definition (`index`)
  - hover (`explain`)
  - format document (`fmt`)
- [x] **Terminal workflow docs** — [editor-setup.md](./editor-setup.md)
- [ ] **Neovim (or one non-VS Code editor) recipe** — config in [editor-setup.md](./editor-setup.md); verify manually on real editor
- [ ] **Open VSX publish** (optional) — same VSIX for VSCodium users who avoid Microsoft Marketplace
- [ ] **Share syntax assets** — document how to use `point.tmLanguage.json` in TextMate-compatible editors

**Verify:** Neovim or `vscode-langservers-extracted`-style client connects to `point lsp`; diagnostics and symbols work without the VS Code extension.

---

## 8.1 VS Code extension polish (after 8.0)

Build on the same CLI/LSP surface — do not duplicate logic in `extension.js`.

- [ ] Format on save (`point fmt` or LSP `textDocument/formatting`)
- [ ] Hover docs from `explain`
- [ ] Quick-fix stub from `repair-plan`
- [ ] Optional: thin VS Code client that speaks to `point lsp` instead of spawning CLI per feature

**Verify:** manual test in VS Code/Cursor.

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

**Verify:** adopter can run with global `point` on PATH — editor optional (CLI + LSP if they use an editor).

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

## 8.7 Documentation site (priority — parallel track)

Public docs at hatchingpoint.com/point should match official language doc UX (sidebar, reference, philosophy, AI engineering). **Not** two flat pages linking to GitHub.

- [ ] **D1** — Docs shell in LandingPage (`PointDocsLayout`, sidebar, TOC)
- [ ] **D2** — Philosophy + AI engineering + install content in `docs/site/`
- [ ] **D3** — Language guide (one page per block)
- [ ] **D4** — CLI + grammar + diagnostics reference
- [ ] **D5** — FAQ, examples gallery, ecosystem links

**Plan:** [docs-site-plan.md](./docs-site-plan.md)  
**Codex goals:** [codex-goal-docs.md](./codex-goal-docs.md) — pipe [codex-goal-docs.prompt.txt](./codex-goal-docs.prompt.txt)

---

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
