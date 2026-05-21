# Phase 8 — Product and Compiler (Code Only)

**Status:** Complete — superseded by Phases 9–11. See [phase9-replacement-plan.md](./phase9-replacement-plan.md), [phase10-plan.md](./phase10-plan.md), [phase11-plan.md](./phase11-plan.md). Active: [phase12-plan.md](./phase12-plan.md).

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
  - completion + rename (LSP v2)
- [x] **Terminal workflow docs** — [editor-setup.md](./editor-setup.md)
- [x] **Neovim / Zed configs** — [editors/](../editors/) verified in repo
- [ ] **Open VSX publish** (optional) — same VSIX for VSCodium users who avoid Microsoft Marketplace
- [ ] **Share syntax assets** — document how to use `point.tmLanguage.json` in TextMate-compatible editors

**Verify:** Neovim or `vscode-langservers-extracted`-style client connects to `point lsp`; diagnostics and symbols work without the VS Code extension.

---

## 8.1 VS Code extension (LSP client)

Build on the same CLI/LSP surface — shared with Neovim and Zed.

- [x] Extension starts `point lsp` via `vscode-languageclient`
- [x] Format on save default for `[point]`
- [x] LSP trace setting (`point.trace.server`)
- [ ] Quick-fix stub from `repair-plan` (future LSP codeAction)

**Verify:** manual test in VS Code/Cursor — diagnostics, hover, completion, rename, format.

---

## 8.2 Real-world module (dogfood)

- [x] App Store listing readiness — `examples/adopters/hatchingpoint/store-readiness.point`
- [x] README with check/build steps
- [x] CI smoke via `point-core.test.ts`

**Verify:** `bun run ci` passes.

---

## 8.3 External adopter

- [x] Starter Labs example — `examples/adopters/starter-labs/subscription-tier.point`
- [x] README + postmortem notes in `docs/adoption-postmortem.md`

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

## 8.6 Python emit spike (optional — only if prioritized)

- [ ] Minimal Python emitter for `examples/math.point` only
- [ ] Limitations documented in `docs/python-emit-research.md`

**Verify:** end-to-end emit + documented scope; TS emit unchanged.

---

## Phase 8 Exit Gate

- [ ] Every checkbox in 8.0–8.3 is checked (8.4–8.6 optional; 8.7 docs site parallel)
- [x] `bun run ci` passes
- [x] At least one dogfood module and one external adopter module documented
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
