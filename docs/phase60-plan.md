# Phase 60 — Emit import pruning

**Status:** Complete — v0.1.43 (verified Phase 38 emit import pruning; regression tests retained)  
**Prerequisite:** Phase 57 (avoid parse conflicts)  
**North star:** JS emit imports only what each module uses from dependencies.

## Success criteria

- [ ] **P60-1** Extend use-merge or emit-typescript to prune unused exports from imported modules
- [ ] **P60-2** Tests: multi-module fixture asserts minimal import lines in emit output
- [ ] **P60-3** No regression on build-all / semantic-emit snapshots

## File ownership

emit-typescript.ts, use-merge.ts, tests/emit-import-prune.test.ts

## Non-goals

- Tree-shaking bundler (host concern)
