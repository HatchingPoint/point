# Codex Goal — Point Documentation Site

Build public language documentation with an official-docs-style container UI on hatchingpoint.com/point.

**Master plan:** [docs-site-plan.md](./docs-site-plan.md)  
**Progress log:** [codex-progress.md](./codex-progress.md)  
**Content sources:** [language-spec.md](./language-spec.md), [semantic-language-design.md](./semantic-language-design.md), [ai-reference-system.md](./ai-reference-system.md), [editor-setup.md](./editor-setup.md), [agent-quick-reference.md](./agent-quick-reference.md)

---

## Sanity check

```bash
# point repo
cd c:\Users\mcarr\Documents\clones\point-1
bun install && bun run ci

# LandingPage (when editing site)
cd c:\Users\mcarr\Documents\clones\LandingPage
npm install && npm run build
```

---

## Goal D1 — Docs shell (LandingPage)

**Repo:** `HatchingPoint/LandingPage`  
**Do not** change compiler behavior.

```text
/goal Execute docs/docs-site-plan.md Phase D1 only.

Create a Vue-docs-style container for Point documentation on hatchingpoint.com/point:

1. Add PointDocsLayout: top bar, sticky left sidebar, main prose column, right-rail TOC on desktop, prev/next footer.
2. Reuse Point brand from src/styles/Point.module.css — do not clone Vue styling.
3. Add sidebar config matching docs-site-plan.md IA (routes can stub "Coming soon" except migrate existing /point and /point/guide content).
4. Route structure: /point (docs home), /point/guide/[slug], /point/concepts/[slug], etc. Use Next.js pages under src/pages/point/.
5. Keep point in keepLegacy in next.config.js — no redirect to /app/point.
6. npm run build must pass.

Do not write all content yet — shell + navigation + 2–3 real pages (introduction, quick-start) ported from existing index.tsx/guide.tsx.

Append checkpoint to point repo docs/codex-progress.md (note LandingPage commit hash if pushed).
```

```powershell
Get-Content c:\Users\mcarr\Documents\clones\point-1\docs\codex-goal-docs.prompt.txt -Raw | codex exec -
# Then: Execute Goal D1 — docs shell in LandingPage.
```

---

## Goal D2 — Philosophy & AI engineering content

**Repos:** point (content) + LandingPage (render)

```text
/goal Execute docs/docs-site-plan.md Phase D2 only.

In point repo, create docs/site/ markdown for:
- guide/introduction.md
- guide/quick-start.md
- guide/installation.md (npm, Bun, VS Code optional, point lsp for Neovim/Zed)
- concepts/philosophy.md (semantic product logic, general-purpose but not Python/TS clone)
- concepts/how-point-is-novel.md (AI-first, stable refs, repair loops)
- ai/overview.md + ai/stable-refs.md + ai/repair-loops.md

Pull facts from docs/semantic-language-design.md, docs/ai-reference-system.md, docs/phase7-complete-review.md, README. Use point://semantic/ refs in examples (not stale core refs). Every page: summary, runnable example where applicable, see-also links.

Wire LandingPage to render docs/site/ (MDX import or build sync script — pick one, document in LandingPage README).

Run bun run ci in point repo. npm run build in LandingPage. Append checkpoint to docs/codex-progress.md.
```

---

## Goal D3 — Language guide (all blocks)

```text
/goal Execute docs/docs-site-plan.md Phase D3 only.

Create docs/site/language/*.md — one page per block: records, calculations, rules, labels, types, control-flow, modules, effects, applications. Each page: syntax, semantics, lowering summary (plain English), example from examples/*.point, common mistakes, agent diagnostic notes.

Do not duplicate full EBNF — link to reference/grammar.md. Run bun run ci. LandingPage build must pass. Append checkpoint.
```

---

## Goal D4 — Reference section

```text
/goal Execute docs/docs-site-plan.md Phase D4 only.

Create docs/site/reference/cli.md (every cli.ts command), reference/diagnostics.md (error codes from tests/fixtures), reference/grammar.md (summary from language-spec.md, version-stamped).

Add docs/site/toolchain/lsp.md from docs/editor-setup.md. Verify CLI docs against packages/point/src/core/cli.ts. Append checkpoint.
```

---

## Goal D5 — Polish & link ecosystem

```text
/goal Execute docs/docs-site-plan.md Phase D5 only.

Add FAQ, examples gallery (links to GitHub examples/), ecosystem/npm.md, ecosystem/marketplace.md, changelog page. Update hatchingpoint.com homepage to link Point docs prominently. Fix any stale VS Code-only language in public pages. Append checkpoint.
```

---

## Goal D-Audit — Content review only

```text
/goal Read docs/docs-site-plan.md and the live or staged hatchingpoint.com/point pages. Audit against Diátaxis and general-purpose language doc standards. List gaps: missing topics, stale refs, VS Code bias, philosophy clarity, AI engineering story. Output markdown in chat only — no file changes unless I ask.
```

---

## Recommended order

1. **D1** — shell (unblocks everything visual)
2. **D2** — philosophy + AI story (your priority)
3. **D3** — language guide
4. **D4** — reference
5. **D5** — polish

Run **one goal per Codex session**. Each session should finish with a working `npm run build` on LandingPage.

---

## Windows: run without paste

```powershell
Get-Content c:\Users\mcarr\Documents\clones\point-1\docs\codex-goal-docs.prompt.txt -Raw | codex exec -
```

Follow up:

```text
Execute Goal D1 — Point docs shell in LandingPage repo.
```

Or for content-first in point repo only:

```text
Execute Goal D2 — create docs/site/ philosophy and AI pages; stub LandingPage routes if needed.
```

---

## Hard rules (all doc goals)

- Public docs use **semantic** syntax only in examples.
- Prefer `point://semantic/` refs in agent-facing examples.
- Do not publish internal phase plans (`full-language-plan.md`, `codex-progress.md` internals) as user docs.
- Do not change git config, force push, or skip hooks.
- Point repo: run `bun run ci` when touching examples or claiming compiler accuracy.
- LandingPage: run `npm run build` before done.
- Keep `/point` out of `/app/` redirect (next.config.js `keepLegacy`).
