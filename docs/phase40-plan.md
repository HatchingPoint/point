# Phase 40 — Presentation alignment (Apple surface / Aston Martin hood)

**Status:** Complete — v0.1.32

Align showroom to engine: Apple-simple daily UX on the surface, elite agent/compiler power under the hood — without version drift, run-story oversell, or complexity leaks.

## Principles

1. **Ring 1 daily:** `capabilities` → `check` → `box` → `launch` → `dev`
2. **Ring 2 build:** one decision tree (logic / app / SQL) — hide emit sprawl
3. **Ring 3 agent:** compiler is the agent's IDE — elevate repair loop
4. **Honest boundaries:** one canonical paragraph on what Point authors vs what hosts run
5. **Trust polish:** one version, one test count, synced everywhere

## Deliverables

## P40-1 Trust polish
- [x] Sync `docs/vision.md`, README, `docs/site/changelog.md`, `docs/site/reference/cli.md` → v0.1.32 / 607 tests
- [x] Update `docs/phase-roadmap.md` active/completed

### P40-2 Point in 60 seconds + README
- [x] New `docs/site/guide/point-in-60-seconds.md` — three moves, no block laundry list
- [x] Rewrite README: fix run story, elevate agent loop, honest boundaries, link 60-second guide
- [x] Sync `packages/point/README.md`

### P40-3 Introduction + tour
- [x] Rewrite `docs/site/guide/introduction.md` — lead with example, progressive families link
- [x] Fix `docs/site/guide/five-minute-tour.md` — `point check` for logic, `point launch` for commands, remove product-map link, `capabilities` line

### P40-4 Build decision tree + CLI rings
- [x] Add build decision tree to `docs/site/toolchain/build-emit.md`
- [x] Add CLI "rings" section to `docs/site/reference/cli.md` (daily / build / agent / advanced)
- [x] Update `docs/site/toolchain/run.md` for launch-first story

### P40-5 Template + product map + AI
- [x] Update full-stack template README (box, launch, what's wired)
- [x] Add presentation rings to `docs/product-map.md`
- [x] Elevate agent tagline in `docs/site/ai/overview.md`

## Verify

```bash
bun run ci
point box examples/capabilities-demo.point
```

## Ship

Version **0.1.32**, tag, push, npm publish via CI.
