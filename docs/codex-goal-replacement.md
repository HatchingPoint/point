# Codex Goals — Phase 9 Replace TS/Python

Launch **parallel agents** for maximum speed. Each goal is one Codex session — do not combine unless noted.

**Master plan:** [phase9-replacement-plan.md](./phase9-replacement-plan.md)  
**Progress log:** [codex-progress.md](./codex-progress.md)  
**Python notes:** [python-emit-research.md](./python-emit-research.md)

---

## Sanity check

```bash
cd c:\Users\mcarr\Documents\clones\point-1
bun install && bun run ci
```

Expected: 91+ tests pass.

---

## Launch order (ASAP)

| Priority | Goal | Agent focus | Can parallelize |
|----------|------|-------------|-----------------|
| 1 | **R1** | JS-default `run`/`build` | ✅ yes |
| 1 | **R2** | Python emit `math.point` | ✅ yes |
| 1 | **R3** | Docs site content D2–D4 | ✅ yes (LandingPage + point repo) |
| 1 | **R4** | `point check-docs` | ✅ yes |
| 2 | **R5** | npm package from `.point` only | after R1 |
| 2 | **R6** | Richer `view` / doc widget spike | ✅ yes |
| 2 | **R7** | Dogfood API service in Point | ✅ yes |
| 3 | **R8** | Vision doc + site page | ✅ yes |

### Four-window parallel start

```text
Window 1: Execute Goal R1 — JS-default run and build.
Window 2: Execute Goal R2 — Python emit for math.point.
Window 3: Execute Goal R3 — docs/site language + reference pages.
Window 4: Execute Goal R4 — point check-docs command.
```

---

## Goal R1 — JS-default run/build (hide TypeScript from authors)

**Repo:** point only

```text
/goal Execute docs/phase9-replacement-plan.md Goal R1: Make point run and point build use direct JavaScript emit by default. point build-ts remains opt-in. Update CLI, tests, docs/site/guide/quick-start.md, and README. Authors should not need generated .ts for daily workflow. Run bun run ci. Append checkpoint to docs/codex-progress.md. Do not change semantic syntax.
```

**Acceptance:**
- `point run examples/hello.point` works without writing `.ts` to disk (temp files OK)
- `point build` defaults to JS; `build-ts` explicit
- `build-all` / CI updated if needed
- Tests prove behavior

---

## Goal R2 — Python emit (pure logic)

**Repo:** point only

```text
/goal Execute docs/phase9-replacement-plan.md Goal R2: Implement minimal Python emitter for pure logic modules. Start with examples/math.point → generated/math.py. Types: Text→str, Int→int, Bool→bool, List, Maybe. Add point build-py CLI command. Add tests comparing outputs for math.point vs existing TS/JS semantics. Document limits in docs/python-emit-research.md. Run bun run ci. Append checkpoint.
```

**Acceptance:**
- `point build-py examples/math.point generated/math.py` succeeds
- pytest or `python -c` smoke test documented
- No regression to TS/JS emit

---

## Goal R3 — Docs content (finish public story)

**Repos:** point (`docs/site/`) + LandingPage (wire pages if not done)

```text
/goal Execute docs/codex-goal-docs.md Goals D2 + D3 + D4: Fill docs/site/ with philosophy, AI, language guide (all blocks), CLI reference, grammar summary, toolchain/lsp.md. Sync to LandingPage per existing sync script or MDX import pattern. Include page "Point replaces TypeScript and Python" under concepts/ — explain authoring vs emit honestly. Run bun run ci in point repo; npm run build in LandingPage. Append checkpoint.
```

---

## Goal R4 — `point check-docs`

**Repo:** point only

```text
/goal Execute docs/phase9-replacement-plan.md Goal R4: Add point check-docs command that scans docs/site/**/*.md for fenced ```point blocks and point file references, extracts or resolves paths, runs parse+check on each snippet/file. Add tests. Wire into bun run ci or document as check-docs step. Append checkpoint.
```

---

## Goal R5 — npm library from Point only

**Repo:** point only (after R1)

```text
/goal Execute docs/phase9-replacement-plan.md Goal R5: Create packages/point-logic/ (or examples/npm-package/) containing only .point sources + point.json. Build script emits JS to dist/ for npm publish. No hand-written TypeScript in src/. Export store-readiness or subscription-tier logic. Document consumer install. Tests prove npm pack contents. Append checkpoint. Run bun run ci.
```

---

## Goal R6 — View / doc widget spike

**Repo:** point + optional LandingPage embed doc

```text
/goal Execute docs/phase9-replacement-plan.md Goal R6: Extend view emission OR add examples/adopters/hatchingpoint/readiness-widget.point — interactive readiness score UI emitting React. Document embedding generated component in Next.js doc page. Minimal syntax changes only if required; prefer existing view blocks. Tests + example. Append checkpoint. Run bun run ci.
```

---

## Goal R7 — Dogfood HTTP service in Point

**Repo:** point only

```text
/goal Execute docs/phase9-replacement-plan.md Goal R7: Expand examples/adopters/hatchingpoint/store-readiness.point into a runnable Bun service: routes return real JSON using listing score logic, README with curl examples, integration test. No hand-written TS in the module. Append checkpoint. Run bun run ci.
```

---

## Goal R8 — Authoring vs runtime vision doc

**Repo:** point only

```text
/goal Write docs/site/concepts/authoring-vs-runtime.md and docs/vision.md explaining: Point replaces TS/Python for new logic; emit targets are invisible; roadmap to Python + richer UI. Link from docs/site/guide/introduction.md. No compiler changes. Append checkpoint.
```

---

## Windows: run without paste

```powershell
Get-Content c:\Users\mcarr\Documents\clones\point-1\docs\codex-goal-replacement.prompt.txt -Raw | codex exec -
```

Then:

```text
Execute Goal R1 — JS-default run and build.
```

---

## Hard rules (all R goals)

- Public `.point` stays semantic — no `fn`/`let`/`type` in author source
- Production path: parsePointSource → semantic AST → desugar → core IR → check → emit
- Run `bun run ci` before done (LandingPage: `npm run build` when touching site)
- One goal per session; append checkpoint to docs/codex-progress.md
- Do not change git config; do not force push
