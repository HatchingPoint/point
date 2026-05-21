# Native Binary Target Research

## Decision

Point will **not** ship a native binary compiler or VM in Phase 6. Execution remains **transpile-first** to JavaScript via Bun/Node.

## Options Considered

| Target | Pros | Cons |
|--------|------|------|
| JavaScript via Bun | Works today, full npm ecosystem | Not a standalone language runtime |
| WebAssembly | Portable, fast | Needs JS host for externals/effects today |
| LLVM / native binary | True standalone executables | Large effort, new runtime, stdlib rewrite |
| Bytecode VM | Control over execution | New tooling, debugger, package story |

## Recommended Sequence

1. **Now:** TypeScript and direct JavaScript emit
2. **Phase 7:** Semantic AST + desugar (shared IR for all backends)
3. **Next:** Optimize JS emit and incremental builds
4. **Later:** WASM for pure logic modules if a performance case appears
5. **Last:** Native binary only if Point needs fully standalone distribution without Bun/Node

## WASM Feasibility

Pure Point modules without `external`, `action`, or framework targets could compile to WASM for compute-heavy workloads. Effectful code would still call out to a host through imports.

## Native Binary Feasibility

A native target requires:

- Owned runtime (GC, async, modules)
- Debug symbols and source maps back to `.point`
- Package format and linker
- Platform matrix (Windows, macOS, Linux)

That is a multi-year platform project, not a Phase 6 deliverable.

## Current Recommendation

Treat Bun/Node as Point's runtime bridge. Invest in AST modernization and direct JS emit before researching native compilation further.
