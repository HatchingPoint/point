# Codex goals — Point runtime pivot (home base)

**Plan:** [point-runtime-pivot.md](./point-runtime-pivot.md)  
**Progress:** [codex-progress-point-only.md](./codex-progress-point-only.md)

**Hard pivot** — not a soft launch. No app-level externals. No permanent emit/React/Vite fallbacks for `experiments/point-only/`. When stuck, extend `packages/point/runtime/`; **move fast, break things.**

Launch **one `/goal` per Codex chat**. Run from **point-1 repo root**.

## Run without approval spam

```powershell
cd c:\Users\mcarr\Documents\clones\point-1
codex
```

Repo `.codex/config.toml` sets `approval_policy = "never"` + `workspace-write`.

**Universal contract (every goal):**

- Read `docs/point-runtime-pivot.md` — **No fallback policy** is non-negotiable
- Respect file ownership; do not edit paths owned by another parallel track
- Home base = `.point` only; host code only in `packages/point/runtime/`
- Do **not** add author JS shims, `external` to local files, or `if (!runtime) emit` on home base
- Prefer deleting superseded dual-path code over keeping Plan B
- Append checkpoint to `docs/codex-progress-point-only.md`
- **Do NOT commit or push unless user asked**

**Windows Codex sandbox:** If `point check` fails with `windows sandbox: spawn setup refresh` before Point runs, that is an environment blocker — not a pivot failure. Run `bun test tests/point-only-experiment.test.ts` and note the blocker. Parent/outside-Codex verification: `bun packages/point/src/cli.ts check experiments/point-only/src/app.point`.

---

## Wave R0 (parallel — launch now)

Open **four** Codex chats. Paste one goal each.

### Track A — R0-A Experiment app scaffold

```text
/goal Execute docs/point-runtime-pivot.md R0-A: Create experiments/point-only/ with point.json, README.md, and src/app.point — deploy-readiness-style pure rules (score from signals record, label + tone from score thresholds). Add command smoke entry. Add experiments/point-only/tests/score.test.point or root test hook documented in README. No TS/JS/React/Vite in experiments/point-only/. bun run point check experiments/point-only/src/app.point. Append docs/codex-progress-point-only.md. Do NOT commit unless user asked.
```

### Track B — R0-B Docs + goal registry

```text
/goal Execute docs/point-runtime-pivot.md R0-B: Verify docs/point-runtime-pivot.md wave checklist and ownership table are complete. Ensure codex-goal-point-only.md and codex-progress-point-only.md match plan. Add Wave R0 checklist section to progress log if missing. Do not duplicate compiler code. Append checkpoint. Do NOT commit unless user asked.
```

### Track C — R0-C Runtime package skeleton

```text
/goal Execute docs/point-runtime-pivot.md R0-C: Add packages/point/runtime/ with index.ts exporting PointRuntime type, runModule(filePath) stub, and README explaining owned-runtime boundary. Wire package.json exports if needed for @hatchingpoint/point/runtime or subpath — follow monorepo conventions. No behavior change to point run yet. bun run ci. Append docs/codex-progress-point-only.md. Do NOT commit unless user asked.
```

### Track D — R0-D CI gate (no author JS)

```text
/goal Execute docs/point-runtime-pivot.md R0-D: Add tests/point-only-experiment.test.ts that fails if experiments/point-only/ contains *.ts, *.tsx, vite.config.*, next.config.*, or generated/ with author-visible emit artifacts. Test passes when only .point + point.json + README + allowed assets exist. bun test tests/point-only-experiment.test.ts. bun run ci. Append docs/codex-progress-point-only.md. Do NOT commit unless user asked.
```

### Integrator — Wave R0

```text
/goal Integrator Point runtime pivot Wave R0: Merge R0-A through R0-D. Run bun run ci where possible. Fix conflicts. Delete any home-base fallback or emit scaffolding. Update docs/point-runtime-pivot.md Wave R0 checkboxes and progress log (R0 done). Do NOT commit unless user asked.
```

---

## Wave R1 (parallel — after R0 integrator)

### Track A — R1-A Move run-bridge into runtime

```text
/goal Execute docs/point-runtime-pivot.md R1-A: Move in-memory eval from packages/point/src/core/run-bridge.ts into packages/point/runtime/eval-js.ts. Keep thin re-export or delegate from run-bridge for backward compat. Tests in tests/run-bridge.test.ts must stay green. bun run ci. Append progress log. Do NOT commit unless user asked.
```

### Track B — R1-B Runtime builtins: text

```text
/goal Execute docs/point-runtime-pivot.md R1-B: Add packages/point/runtime/builtins/text.ts implementing trim, lowercase, contains, stripPrefix needed by experiment + std.text parity. Document API. Add tests/runtime/builtins-text.test.ts. Do NOT wire cli yet if conflicts with R1-E — append progress. bun run ci. Do NOT commit unless user asked.
```

### Track C — R1-C Runtime builtins: collections + math

```text
/goal Execute docs/point-runtime-pivot.md R1-C: Add packages/point/runtime/builtins/collections.ts (listLength, countMatching, maxInt, roundInt, clampInt). Add tests/runtime/builtins-collections.test.ts. bun run ci. Append progress log. Do NOT commit unless user asked.
```

### Track D — R1-D Runtime builtins: crypto hash

```text
/goal Execute docs/point-runtime-pivot.md R1-D: Add packages/point/runtime/builtins/crypto.ts wrapping sha256 for stable idempotency keys. Add tests/runtime/builtins-crypto.test.ts. bun run ci. Append progress log. Do NOT commit unless user asked.
```

### Track E — R1-E point run/test → runtime

```text
/goal Execute docs/point-runtime-pivot.md R1-E: Wire point run and point test so experiments/point-only/** ALWAYS uses packages/point/runtime/index.ts — no emit to author tree, no feature-flag fallback to legacy emit for home base. Delete or block any home-base generated/ emit path. bun run ci where possible; append progress. Do NOT commit unless user asked.
```

### Track F — R1-F Parity tests

```text
/goal Execute docs/point-runtime-pivot.md R1-F: Add tests/runtime/experiment-parity.test.ts — experiments/point-only rules produce same outputs via runtime path vs existing emit+eval path. bun run ci. Append progress log. Do NOT commit unless user asked.
```

### Integrator — Wave R1

```text
/goal Integrator Point runtime pivot Wave R1: Merge R1-A–R1-F. Home base runs ONLY via runtime — remove dual-path emit for experiments/point-only. bun run ci where possible. Mark R1 done in progress log. Do NOT commit unless user asked.
```

---

## Wave R2 (after R1 — opcode contract first, then parallel)

### R2-A — IR / bytecode lowering (run first solo)

```text
/goal Execute docs/point-runtime-pivot.md R2-A: Add packages/point/runtime/ir/ lowering from checked core program to bytecode. Document opcode set in docs/point-runtime-pivot.md IR section. Add tests/runtime/ir-lowering.test.ts. bun run ci. Append progress. Do NOT commit unless user asked.
```

### R2-B — Interpreter core

```text
/goal Execute docs/point-runtime-pivot.md R2-B: Add packages/point/runtime/interpreter/ for records, calculations, rules, labels. Parity vs eval-js on examples/pure/math-only.point. bun run ci. Append progress. Do NOT commit unless user asked.
```

### R2-C — Interpreter loops + Maybe

```text
/goal Execute docs/point-runtime-pivot.md R2-C: Extend interpreter for for-each and Maybe/none. Parity tests on experiment app. bun run ci. Append progress. Do NOT commit unless user asked.
```

### R2-D — Emit vs interpret parity suite

```text
/goal Execute docs/point-runtime-pivot.md R2-D: Add tests/runtime/emit-interpret-parity.test.ts covering examples/pure/* and experiments/point-only/. bun run ci. Append progress. Do NOT commit unless user asked.
```

### R2-E — Experiment defaults to interpreter

```text
/goal Execute docs/point-runtime-pivot.md R2-E: Make experiments/point-only use interpreter-by-default in point run/test. bun run ci. Append progress. Do NOT commit unless user asked.
```

### Integrator — Wave R2

```text
/goal Integrator Point runtime pivot Wave R2: Merge interpreter tracks. Cut home-base emit path — interpreter only for experiments/point-only. Delete dual-path fallback code. Mark R2 done. Do NOT commit unless user asked.
```

---

## Wave R3 (parallel — after R2)

### R3-A — Runtime HTTP server

```text
/goal Execute docs/point-runtime-pivot.md R3-A: Add packages/point/runtime/server.ts — owned HTTP server (Bun allowed inside runtime only). tests/runtime/server.test.ts. bun run ci. Append progress. Do NOT commit unless user asked.
```

### R3-B — Route registration

```text
/goal Execute docs/point-runtime-pivot.md R3-B: Register route/middleware handlers from checked program onto runtime server — no emitted Bun.serve strings in experiment path. Add JSON route to experiments/point-only exposing rule output. bun run ci. Append progress. Do NOT commit unless user asked.
```

### R3-C — point dev single process

```text
/goal Execute docs/point-runtime-pivot.md R3-C: Branch point dev for experiments/point-only to runtime serve only — no Vite spawn. bun run ci. Append progress. Do NOT commit unless user asked.
```

### Integrator — Wave R3

```text
/goal Integrator Point runtime pivot Wave R3: Home base HTTP via runtime only. No emit server fallback. Mark R3 done. Do NOT commit unless user asked.
```

---

## Wave R4 (parallel — after R3)

### R4-A — SSR view renderer

```text
/goal Execute docs/point-runtime-pivot.md R4-A: Add packages/point/runtime/ssr/ rendering view/page blocks to HTML strings. tests/runtime/ssr.test.ts. bun run ci. Append progress. Do NOT commit unless user asked.
```

### R4-B — Forms POST to routes

```text
/goal Execute docs/point-runtime-pivot.md R4-B: Wire form POST handling in runtime SSR for experiment app. bun run ci. Append progress. Do NOT commit unless user asked.
```

### R4-C — Navigation without React Router

```text
/goal Execute docs/point-runtime-pivot.md R4-C: Implement navigation/links in runtime SSR without react-router-dom for experiment app. bun run ci. Append progress. Do NOT commit unless user asked.
```

### R4-D — Disable React/Vite path for experiment

```text
/goal Execute docs/point-runtime-pivot.md R4-D: Ensure experiments/point-only never invokes emit-typescript or Vite — enforce in tests/point-only-experiment.test.ts. bun run ci. Append progress. Do NOT commit unless user asked.
```

### R4-E — End-to-end golden

```text
/goal Execute docs/point-runtime-pivot.md R4-E: Add tests/runtime/experiment-e2e.test.ts — start runtime server, fetch page, submit form, assert rule output. bun run ci. Append progress. Do NOT commit unless user asked.
```

### Integrator — Wave R4

```text
/goal Integrator Point runtime pivot Wave R4: Pivot complete — home base in-box, no React/Vite/author JS. Mark pivot exit gate in progress log. Do NOT commit unless user asked.
```

---

## Quick launcher

| Wave | Chats to open |
|------|----------------|
| **R0** | R0-A, R0-B, R0-C, R0-D → integrator |
| **R1** | R1-A … R1-F → integrator |
| **R2** | R2-A solo → R2-B, R2-C, R2-D parallel → R2-E → integrator |
| **R3** | R3-A, R3-B, R3-C → integrator |
| **R4** | R4-A … R4-E → integrator |

**Loop:** paste [codex-goal-point-only.prompt.txt](./codex-goal-point-only.prompt.txt) into `/loop`.

---

## Post-pivot P7 (product depth)

### P7-A1 — Runtime SSR datagrid

```text
/goal Post-pivot P7-A1: Add runtime SSR datagrid with sort/filter in packages/point/runtime/ssr/. tests/runtime/ssr-datagrid.test.ts. bun test tests/runtime. Append docs/codex-progress-point-only.md. Do NOT commit unless user asked.
```

### P7-A2 — Runtime SSR forms (bind select/textarea, toast)

```text
/goal Post-pivot P7-A2: Add runtime SSR bind select, bind textarea, toast on success/error in packages/point/runtime/ssr/. tests/runtime/ssr-forms.test.ts. bun test tests/runtime. Append progress. Do NOT commit unless user asked.
```

### P7-B — Runtime deploy docs

```text
/goal Post-pivot P7-B: Verify docs/site/ecosystem/runtime-deploy.md covers owned-runtime deploy (Render/Railway/Fly, Docker, env vars, runtime-saas). Link from quick-start and deploy.md. bun run check-docs. Append progress. Do NOT commit unless user asked.
```

### P7-C — Manifest-only routing

```text
/goal Post-pivot P7-C: Remove experiments/point-only hard-code from packages/point/src/core/runtime-project.ts; rely on point.json runtime:owned only. Update tests/runtime-project.test.ts. bun test tests/runtime-project.test.ts. Append progress. Do NOT commit unless user asked.
```

### P7-D — LandingPage live demo

```text
/goal Post-pivot P7-D: In ../LandingPage add or update /point/examples with runtime-native demo narrative (owned SSR, not Vite). npm run build. Commit and push LandingPage. Append progress with commit hash.
```
