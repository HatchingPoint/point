# Phase 38 — Emit import pruning + golden demo

**Status:** Complete — v0.1.30  
**Prerequisite:** Phase 37 complete (v0.1.29)  
**North star:** Check-time selective merge extends to emit — importers import only what they use; evaluators get a crisp demo path.

---

## Success criteria

- [x] **P38-1 Emit import pruning** — `programWithTypeScriptImports` uses filtered dependency symbols; single-file `build` matches
- [x] **P38-2 Golden demo guide** — `docs/site/guide/five-minute-tour.md` + template README
- [x] **P38-3 Tests** — `tests/emit-import-prune.test.ts` for instant-demo imports
- [x] `bun run ci` passes; release **v0.1.30**
