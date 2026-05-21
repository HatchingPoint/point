# Point Documentation Site — Master Plan

**Goal:** Public documentation at [hatchingpoint.com/point](https://www.hatchingpoint.com/point) with the same **containerized, sidebar-driven UI** as major language doc sites (Vue, TypeScript, Rust, Go) — not two flat marketing pages linking to GitHub markdown.

**Repos involved:**

| Repo | Role |
|------|------|
| [HatchingPoint/point](https://github.com/HatchingPoint/point) | Source of truth for content, examples, CLI reference |
| [HatchingPoint/LandingPage](https://github.com/HatchingPoint/LandingPage) | Next.js site, layout shell, routing, deploy |

**Do not** replace the compiler repo’s internal plans (`full-language-plan.md`, `phase8-plan.md`). This plan is **user-facing documentation** only.

---

## Documentation model (Diátaxis)

Follow the [Diátaxis framework](https://diataxis.fr/) — standard for language docs:

| Quadrant | Point docs section | Reader need |
|----------|-------------------|-------------|
| **Tutorial** | Getting started | “Help me do my first thing” |
| **How-to** | Guides (tasks) | “Help me solve a specific problem” |
| **Reference** | Language reference, CLI | “Give me the facts” |
| **Explanation** | Concepts, philosophy, AI engineering | “Help me understand” |

Every page must declare which quadrant it serves. Avoid mixing tutorial tone into reference pages.

---

## Target information architecture

```text
/point                          → Docs home (hero + install CTA + nav into docs)
/point/guide/introduction       → What is Point, who it’s for
/point/guide/quick-start        → First .point file in 10 minutes
/point/guide/installation       → npm, Bun, extension, LSP, any editor
/point/concepts/philosophy      → Semantic vs imperative; AI-first thesis
/point/concepts/why-point-exists → Why create Point; when to adopt
/point/concepts/proof-of-concept → Side-by-side PoC, in-the-box tooling, benchmarks
/point/concepts/how-point-is-novel
/point/concepts/semantic-vs-core
/point/concepts/pipeline        → parse → AST → desugar → check → emit
/point/language/overview        → Blocks at a glance
/point/language/records
/point/language/calculations
/point/language/rules
/point/language/labels
/point/language/types
/point/language/control-flow    → loops, mutation, conditionals
/point/language/modules         → module, use, multi-file
/point/language/effects         → action, external, policy, async
/point/language/applications    → view, route, workflow, command
/point/ai/overview              → Why agents need structured tooling
/point/ai/vs-other-languages  → Point vs TS/Python/DSLs for AI engineering
/point/ai/stable-refs
/point/ai/check-json
/point/ai/repair-loops
/point/ai/agent-workflow        → Recommended loop for coding agents
/point/toolchain/cli
/point/toolchain/formatting
/point/toolchain/build-emit
/point/toolchain/run-test-repl
/point/toolchain/lsp            → point lsp, Neovim, Zed
/point/toolchain/vscode         → extension (optional path)
/point/stdlib/overview
/point/examples                 → Linked gallery → GitHub examples
/point/reference/grammar        → EBNF summary (from language-spec)
/point/reference/cli            → All commands, flags, exit codes
/point/reference/diagnostics    → Error codes + repair hints
/point/ecosystem/npm
/point/ecosystem/marketplace
/point/ecosystem/integrations   → React, Vue, Bun, Hono
/point/faq
/point/changelog                → Link or embed from repo CHANGELOG
```

**Minimum viable doc site (Phase 1 exit):** at least **Introduction**, **Quick start**, **Installation**, **Philosophy**, **AI overview**, **Language overview**, **CLI reference**, **Stable refs** — all inside the container UI with working sidebar nav.

---

## UI requirements (match official language docs)

Implement in **LandingPage** — reuse existing Point brand tokens (`Point.module.css` colors/fonts) but upgrade layout:

### Shell (`DocsLayout` or `PointDocsLayout`)

- **Top bar:** logo → Point docs home, version badge (`0.0.x`), links: Guide | Reference | API (CLI) | GitHub | npm | Extension
- **Left sidebar:** collapsible sections matching IA above; active route highlighted; sticky on desktop
- **Main column:** max-width ~720px prose; syntax-highlighted `point` code blocks; copy button on code
- **Right rail (desktop):** in-page “On this page” TOC from headings
- **Mobile:** hamburger sidebar; TOC collapses below title
- **Footer:** prev/next doc links, edit on GitHub link

### Visual reference (behavior, not clone)

- [Vue.js docs](https://vuejs.org/guide/introduction.html) — sidebar + content + TOC
- [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — section grouping
- [Rust book](https://doc.rust-lang.org/book/) — linear + reference split

Do **not** import Vue’s design system. Use Hatching Point CSS variables and lowercase display titles already on `/point`.

### Content rendering options (pick one in Phase 1)

1. **MDX pages in LandingPage** — fastest; content lives in LandingPage repo (risk: drift from point repo)
2. **MDX + sync script** — markdown in `point/docs/site/**/*.md`, script copies to LandingPage at build (recommended)
3. **next-mdx-remote** — fetch markdown from GitHub raw at build time (couples deploy to GitHub)

**Recommended:** `point/docs/site/` as source; LandingPage imports or copies at build. Single source of truth in point repo.

---

## Content standards (general-purpose language docs)

Every guide page should include where relevant:

1. **One-sentence summary** at top
2. **Runnable example** from `examples/` (verified against current compiler)
3. **“See also”** links to reference + related guides
4. **Agent note** (optional callout) when `check-json` / refs matter

### Philosophy pages must answer

- What problem Point solves (semantic product logic, not another Python/TS syntax)
- Why **semantic blocks** (`record`, `rule`, `label`) instead of `class` / `def`
- How Point **lowers** to typed core without authors writing core syntax
- Why **stable refs** beat line numbers for AI repair loops
- How Point **interops** today (TS emit) vs long-term (more targets)
- Honest limits (not a standalone VM yet; expression-level source maps partial)

**Vision / PoC pages (public):**

- `concepts/why-point-exists.md` — origin story, when to adopt, bleeding-edge thesis
- `concepts/proof-of-concept.md` — side-by-side examples, agent loop, adopters, benchmarks
- `ai/vs-other-languages.md` — comparison table vs TS/Python/Rust/DSLs/prompt-only

### AI engineering pages must answer

- The agent repair loop: `check-json` → read `ref` + `repair` → patch → re-check
- When to use `point://semantic/` vs core refs
- `index`, `explain`, `repair-plan` with copy-paste examples from `examples/math.point`
- Contrast with “paste entire file into LLM and hope”

### Reference pages must

- Stay normative and version-stamped (`@hatchingpoint/point@x.y.z`)
- Pull from `docs/language-spec.md` — do not fork grammar in two places without sync note
- List CLI commands from actual `cli.ts` behavior

---

## Source material map (point repo → public pages)

| Public page | Primary source in point repo |
|-------------|------------------------------|
| Philosophy | `docs/semantic-language-design.md`, README |
| Pipeline | `docs/phase7-complete-review.md` |
| AI engineering | `docs/ai-reference-system.md`, `docs/agent-quick-reference.md` |
| Grammar / types | `docs/language-spec.md` |
| CLI / LSP | `docs/editor-setup.md`, CLI source |
| Stdlib | `std/`, `examples/std-usage.point` |
| Applications | `examples/view.point`, `route.point`, `app/todo.point` |
| Install / publish | README, `docs/publishing.md` |
| Ecosystem | npm, Marketplace URLs |

Internal-only docs stay in repo root `docs/` — do not publish `full-language-plan.md`, `codex-progress.md`, or phase plans to the public site.

---

## Quality gates

Before marking a doc phase complete:

```bash
# point repo
cd point-1 && bun run ci

# LandingPage (after UI changes)
cd LandingPage && npm run build
```

Manual checks:

- [ ] `/point` loads docs home (not redirect to `/app/point`)
- [ ] Sidebar navigates all Phase 1 pages without 404
- [ ] Code samples match current syntax (semantic refs, not stale `point://core/` in user-facing examples)
- [ ] Mobile layout usable
- [ ] All external links work (npm, Marketplace, GitHub)

---

## Phased delivery

### Phase D1 — Shell + IA (LandingPage)

- `PointDocsLayout` component + sidebar config
- Routes for Phase 1 pages (can be stub content)
- Prev/next + GitHub edit link pattern
- Preserve `keepLegacy: point` in `next.config.js`

### Phase D2 — Core content (point repo → site)

- Migrate/create markdown in `docs/site/`
- Introduction, quick start, installation, philosophy, AI overview
- Sync or import into LandingPage

### Phase D3 — Language guide

- One page per block type with examples from `examples/`
- Types, control flow, modules, effects, application layer

### Phase D4 — Reference

- CLI reference, diagnostic codes, grammar appendix
- Generated or checked against `language-spec.md`

### Phase D5 — Polish

- Example gallery, FAQ, changelog
- Search (optional: Pagefind or Algolia later)
- Link from hatchingpoint.com homepage prominently

---

## Out of scope (for this goal)

- Changing compiler behavior (unless docs reveal a doc bug)
- Translations / i18n
- Interactive playground in browser (future)
- Hosting docs separately from LandingPage (stay on hatchingpoint.com/point)

---

## Success criteria

A new developer who **does not use VS Code** can:

1. Land on hatchingpoint.com/point
2. Install via documented steps
3. Understand **why** Point exists and how it helps AI-assisted development
4. Learn the language from the guide without opening GitHub
5. Look up any CLI command and semantic block in reference
6. Configure Neovim/Zed via LSP docs

An agent given only the public doc URLs can follow the documented repair loop without repo access.
