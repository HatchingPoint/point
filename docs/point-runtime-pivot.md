# Point runtime pivot (home base)

**Status:** Pivot complete for home base — **hard pivot**, not a soft launch  
**Repo:** `point-1` only  
**North star:** Rewrite Point **from the inside out**. Authors depend on **Point only**. All execution lives in **`packages/point/runtime/`**. No app-level externals. No permanent emit/React/Vite fallbacks for the home-base app.

> **Former name:** “Point-only experiment.” Renamed because this is the product direction, not an optional side track.

---

## No fallback policy (non-negotiable)

Agents and humans **must not** treat the home-base app as “try runtime, else emit.”

| Forbidden | Do instead |
|-----------|------------|
| Author `external ... from "../foo.js"` or `*-runtime.js` shims | Extend `packages/point/runtime/` or `std` builtins |
| `if (!runtime) use emit` for `experiments/point-only/**` | Runtime **is** the path — fix runtime |
| `POINT_RUNTIME=0` or long-lived feature flags on home base | Home base always runtime (R1-E+); then global default; then delete old path |
| Duplicating rule logic in TS “for compatibility” | One source: `.point` |
| Keeping React/Vite/Next as Plan B for home base | Remove at R4; SSR in runtime |
| Parity dual-path forever | Emit-vs-interpret tests are **temporary** until R2-E; then cut emit for home base |

**When stuck:** add capability to **runtime**, not JS in the app tree. **Move fast, break things** — delete superseded emit paths for home base rather than maintaining two stacks.

**Legacy emit** may remain elsewhere in the repo **only until replaced** — that is transition coverage for CI, not the destination.

---

## Move fast, break things

- **Parallel Codex goals** per wave; integrator merges and deletes dead dual-path code on home base.
- Prefer **breaking** home-base emit over preserving it “just in case.”
- Prefer **deleting** `experiments/point-only/generated/` and blocking re-creation (R0-D) over documenting workarounds.
- Full-repo `bun run ci` protects unrelated surfaces; **home-base runtime tests** are the pivot gate when CI is noisy elsewhere.
- After each wave integrator: remove fallback wiring added “temporarily” for that wave.

---

## What “Point-only” / in-the-box means

| Layer | Rule |
|-------|------|
| **Home-base app** (`experiments/point-only/`) | Only `.point`, `point.json`, assets, README — no author `*.ts`, `*.tsx`, Vite/Next configs, no author `external` |
| **Rest of repo (transition)** | Old emit/dev paths stay until each wave replaces them — **not** available to home base |
| **Host code** | **Only** `packages/point/runtime/` (+ migrate `src/std/` into runtime over R1) |
| **Emit** | Internal + short-lived parity oracle (R1–R2); **not** the author workflow for home base |
| **Run** | `point run` / `point dev` / `point test` → runtime entrypoint |

---

## Architecture (inside-out rewrite)

```text
OLD (outside-in):  .point → emit JS/TS → Bun/React/npm → app
NEW (inside-out):  .point → check → packages/point/runtime → (engine room you own)

experiments/point-only/*.point     ← authors
packages/point/runtime/            ← interpreter, builtins, server, SSR
packages/point/src/core/           ← parse, check, lower
```

| Wave | Delivers |
|------|----------|
| **R0** | Home-base app + runtime skeleton + no-author-JS CI gate |
| **R1** | Runtime owns execution + std builtins; **no emit in author tree** |
| **R2** | Interpreter default; emit = test oracle only, then **cut home-base emit** |
| **R3** | Owned HTTP — no emitted `Bun.serve` for home base |
| **R4** | Owned SSR UI — **no React/Vite/Next** for home base |

WASM/native binary: deferred per [native-target-research.md](./native-target-research.md). **Runtime package is the owned product boundary now.**

---

## Runtime IR

R2 introduces `packages/point/runtime/ir/`: a checked-core-program lowering pass that produces stack bytecode for the runtime interpreter. The IR is serializable data, not emitted JavaScript, and it is the contract R2-B/R2-C interpreter work consumes.

**Schema:** `point.runtime.ir.v1`

| Opcode | Stack effect | Purpose |
|--------|--------------|---------|
| `PUSH_CONST` | `-> value` | Push Text/Int/Float/Bool/null literals |
| `LOAD_LOCAL` / `LOAD_GLOBAL` | `-> value` | Read a function local/param or module global |
| `STORE_LOCAL` / `STORE_GLOBAL` | `value ->` | Assign `=`, `+=`, or `-=` targets |
| `MAKE_LIST` | `items... -> list` | Build list literals |
| `MAKE_RECORD` | `fieldValues... -> record` | Build record literals with ordered field names |
| `GET_FIELD` | `record -> value` | Read a record field |
| `CALL` | `args... -> result` | Call a Point function/external by name |
| `AWAIT` | `promise -> value` | Await action/workflow results |
| `BINARY` | `left right -> value` | Apply arithmetic, comparison, or Bool operators |
| `POP` | `value ->` | Discard expression-statement results |
| `RETURN` | `value? -> exit` | Return from a function |
| `YIELD` | `value? ->` | Yield stream/workflow values |
| `LABEL` | no stack change | Jump target marker |
| `JUMP` | no stack change | Unconditional branch |
| `JUMP_IF_FALSE` | `condition ->` | Conditional branch for `if`/label chains |
| `ITER_START` | `iterable -> iterator` | Create loop iterator state |
| `ITER_NEXT` | `iterator -> item?` | Advance loop or jump to done label |

Lowering rejects unchecked programs by running `checkPointCore` before bytecode generation. Unsupported host boundaries remain declarations (`externals`) for later runtime/builtin tracks; R2-A does not add app-tree shims or emit fallbacks.

---

## Runtime std dispatch

Post-pivot runtime std imports are resolved inside `packages/point/runtime/std-dispatch.ts`, not through emitted npm imports.

Contract:

- `use std.text`, `use std.json`, `use std.http`, and `use std.time` map to runtime-owned builtin functions under `packages/point/runtime/builtins/`.
- Dispatch keys are the std module name (`std.text`, `std.json`, `std.http`, `std.time`) plus the external import alias from the matching `std/*.point` file, such as `textTrim`, `jsonParse`, `httpFetch`, or `instantNow`.
- `resolveRuntimeStdBuiltin(moduleName, importName)` returns the builtin function when the runtime owns that std function, and `undefined` when the module/function is outside the dispatch table.
- Async builtins such as `httpFetch`, `httpGet`, `httpPost`, and `sleep` remain async host boundaries; interpreter wiring must await them instead of falling back to emit.
- Adding a new std runtime capability means extending `packages/point/runtime/builtins/` and this dispatch table. Do not add app-tree shims, generated std wrappers, or emit/Vite fallbacks for runtime-native apps.

---

## Home-base app

**Path:** `experiments/point-only/`

| Wave | Capability |
|------|------------|
| R0 | Pure rules + `command` smoke + `.point` tests |
| R1 | `use std.*` via runtime builtins (no emitted npm imports) |
| R2 | Interpreter-only execution |
| R3 | JSON HTTP routes from rules |
| R4 | SSR pages + forms |

---

## Parallel waves

**Goals:** [codex-goal-point-only.md](./codex-goal-point-only.md)  
**Progress:** [codex-progress-point-only.md](./codex-progress-point-only.md)

| Wave | Tracks | Notes |
|------|--------|-------|
| **R0** | R0-A … R0-D | ✅ Done |
| **R1** | R1-A … R1-F | ✅ Done — home base hard-routed to runtime |
| **R2** | R2-A solo → B/C/D → R2-E | ✅ Done — home base interpreter-only |
| **R3** | R3-A, B, C | ✅ Done — home base HTTP routes through runtime |
| **R4** | R4-A … E | ✅ Done — home base SSR in-box |

---

## Wave checklist

- [x] **R0:** scaffold, docs, runtime skeleton, CI gate, integrator
- [x] **R1:** run-bridge → runtime, builtins, CLI **hard-routes home base to runtime**, parity tests, integrator
- [x] **R2:** IR, interpreter, cut home-base emit, integrator
- [x] **R3:** owned HTTP + dev, integrator
- [x] **R4:** SSR + e2e, **no React/Vite on home base**, integrator
- [x] **Pivot complete (home base):** fully in-box — expand to templates/product next
- [x] **Product default:** `point create` scaffolds `runtime-app` (`point.json` `runtime: "owned"`)

---

## Post-pivot checklist

- [x] **P1:** Runtime-owned app is the documented/default `point create` path; legacy emit/Vite templates are explicit opt-ins
- [x] **P2:** Runtime-owned apps resolve `use std.*` through `packages/point/runtime/std-dispatch.ts` and runtime builtins only; no emitted std imports
- [x] **P3:** `runtime-saas-app` template ships with auth + SQLite via owned runtime
- [x] **P4:** Repo-wide fmt gate green; legacy template deprecation notes
- [x] **P5:** Full CI green; product-map and public version anchors through 0.2.4
- [x] **P6:** Full capability catalog in runtime std dispatch; owned-template author-surface guards
- [x] **P7:** Product depth — SSR parity, deploy docs, manifest-only routing, live site demo
- [x] **P8:** Legacy sunset — delete dual emit/Vite app path
  - [x] P8-A: `point create --legacy` required for emit/Vite templates (`full-stack-app`, `saas-app`, `vercel-app`)
  - [x] P8-B: Remove legacy templates from npm package
  - [x] P8-C: Cut Vite dev/serve for app workflows globally (`--legacy` opt-in)

- [x] **P9:** Owned-runtime UX parity
  - [x] P9-A: Theme toggle SSR (`theme` block + `toggle theme`, `/point-ui.css`, localStorage persistence)
  - [x] P9-B: `refresh every N seconds` in owned SSR (live region polling via `X-Point-Refresh`)
  - [x] P9-C: SSE `subscribe to sse` in owned runtime
  - [x] P9-D: WebSocket / terminal views in owned runtime

- [x] **P10:** Runtime-only execution (kill dual stack)
  - [x] P10-A: `point run` / `point test` / `point test-all` always use `packages/point/runtime/` interpreter
  - [x] P10-B: Remove legacy emit/Vite templates (`full-stack-app`, `saas-app`, `vercel-app`) and `--legacy` create gate
  - [x] P10-C: Remove legacy Vite `dev` / `serve` / `build-app` paths; runtime HTTP/SSR is the only app host
  - [x] P10-D: Interpreter + workflow/SaaS integration tests; migrate deploy/saas smoke to `runtime-saas-app`
  - [x] P10-E: Docs/product-map sync; CI green

- [x] **P11:** Runtime-owned proof cases (agent repair + app benchmarks)
  - [x] P11-A: Runtime-owned agent-repair fixtures (stream subscribe path)
  - [x] P11-B: Runtime-saas agent-app proof cases (members load, create form wiring)
  - [x] P11-C: Proof reports + site sync (`proof:agent-repair`, `proof:agent-app`, LandingPage)
  - [x] P11-D: CI green; docs/agent-repair-tests counts updated

---

## File ownership

| Track | May edit | Must not edit |
|-------|----------|---------------|
| R0-A | `experiments/point-only/**` | `packages/point/runtime/`, `cli.ts` |
| R0-B | `docs/point-runtime-pivot.md`, `docs/codex-goal-point-only*`, `docs/codex-progress-point-only*` | compiler src |
| R0-C | `packages/point/runtime/**` | `experiments/`, emit-* |
| R0-D | `tests/point-only-experiment.test.ts` | runtime impl |
| R1-A | `runtime/eval-js.ts`, `run-bridge.ts` delegate | builtins/* |
| R1-B | `runtime/builtins/text.ts` | collections, crypto |
| R1-C | `runtime/builtins/collections.ts` | text, crypto |
| R1-D | `runtime/builtins/crypto.ts` | text, collections |
| R1-E | `cli.ts`, `runtime/index.ts` — **home base always runtime** | vite spawn for home base |
| R1-F | `tests/runtime/**` | — |
| R2-* | `runtime/ir/*`, `runtime/interpreter/*` | SSR until R4 |
| R3-* | `runtime/server.ts`, route registry, `dev.ts` home-base branch | emit-typescript for home base |
| R4-* | `runtime/ssr/*` | global template deletion (later) |

Integrator: merge, **delete home-base fallback paths**, update checkboxes, append progress.

---

## Per-track exit gate

- [x] Home base still has **no** author TS/JS (`tests/point-only-experiment.test.ts`)
- [x] No new fallback flags or author externals introduced
- [x] Checkpoint in `docs/codex-progress-point-only.md`
- [x] **Do NOT commit or push unless user asked**

---

## Non-goals

- Surgent `@point/logic` migration (paused)
- Keeping dual emit+runtime for home base after R2 integrator
- npm publish until R2+ integrator green → **done at 0.2.0**; default `point create` is now `runtime-app` (0.2.1+)

---

## See also

- [codex-goal-point-only.md](./codex-goal-point-only.md)
- [codex-goal-point-only.prompt.txt](./codex-goal-point-only.prompt.txt)
- [native-target-research.md](./native-target-research.md)
