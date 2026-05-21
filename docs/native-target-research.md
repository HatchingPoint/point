# Native Binary Target Research

## Phase 12 decision (2026-05)

Point **does not** ship an owned VM, GC, or native binary compiler in Phase 12. Execution stays **transpile-first**: semantic `.point` → JavaScript (default), with Bun/Node as the host runtime.

**What ships in Phase 12 (P12-3 spike):**

- **Author-standalone `point run`** — checks `.point` source and runs a zero-arg entrypoint without writing emit files into the author project (`generated/` stays opt-in via `point build`).
- **In-memory bundle path** — for pure logic modules (no imports, externals, views, routes, workflows, commands), `point run` evaluates emitted JS via `Function()` instead of a visible OS temp `.js` file. `point run --bundle` forces this path; `--no-bundle` forces the temp-module import path.
- **Research timeline** — see [Recommended sequence](#recommended-sequence) below; WASM and native binary remain post–Phase 12.

**Honest limits (not hidden):**

| Area | Today | Not today |
|------|--------|-----------|
| Author workflow | Write `.point` only; run/build without maintaining TS/JS by hand | Zero host — still needs Bun or Node |
| `point run` | Temp file only when bundle path cannot apply (imports, `external`, UI/route/command modules) | Sandboxed WASM VM |
| `point run --bundle` | Pure logic + simple actions in-process | npm `import`, `fetch`, `node:fs`, route servers |
| Distribution | `point build` → `.js` you ship; npm packages via `point add` | Single-file native `.exe` / static binary |
| Debug | Runtime errors mapped to `.point` declaration lines (declaration-level) | Statement-level source maps in owned VM |
| Python | `point build-py` for pure logic | Python as default runtime for apps |

Example: `examples/pure/math-only.point` — `point run` prints `120` with no project emit artifacts.

## Decision (historical)

Point will **not** ship a native binary compiler or VM in Phase 6–11. That holds through Phase 12.

## Options Considered

| Target | Pros | Cons |
|--------|------|------|
| JavaScript via Bun | Works today, full npm ecosystem | Not a standalone language runtime |
| In-memory JS bundle (`point run`) | No temp file for pure modules; proves bridge | Still Bun/Node; no imports/externals |
| WebAssembly | Portable, fast | Needs JS host for externals/effects today |
| LLVM / native binary | True standalone executables | Large effort, new runtime, stdlib rewrite |
| Bytecode VM | Control over execution | New tooling, debugger, package story |

## Recommended Sequence

1. **Now (Phases 9–12):** TypeScript and direct JavaScript emit; `point run` / `point build` as runtime bridge
2. **Phase 12 (done spike):** Document standalone path; in-memory run for pure logic; `point add` npm deps
3. **Phase 13+:** Package registry service; richer stdlib; external starter template
4. **Later:** WASM for pure logic modules if a performance case appears
5. **Last:** Native binary only if Point needs fully standalone distribution without Bun/Node

## WASM Feasibility

Pure Point modules without `external`, `action`, or framework targets could compile to WASM for compute-heavy workloads. Effectful code would still call out to a host through imports. Phase 12 does not implement WASM emit.

## Native Binary Feasibility

A native target requires:

- Owned runtime (GC, async, modules)
- Debug symbols and source maps back to `.point`
- Package format and linker
- Platform matrix (Windows, macOS, Linux)

That is a multi-year platform project, not a Phase 12 deliverable.

## Current Recommendation

Treat Bun/Node as Point's runtime bridge. Use `point run` (auto-bundle when eligible) and `point build` for distribution. Invest in ecosystem (`npm:` deps, std shims, registry) before an owned VM or native compiler.
