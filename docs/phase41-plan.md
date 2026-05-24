# Phase 41 — Doc graph completion

**Status:** Complete — v0.1.33

## Goal

Wire **Point in 60 seconds** as the default doc entry, add the **golden app demo** walkthrough, and sync remaining pages to launch-first UX.

## Deliverables

### P41-1 Plan + roadmap
- [x] `docs/phase41-plan.md`, `docs/codex-goal-phase41.md`
- [x] Update `docs/phase-roadmap.md` (Phase 40 done, Phase 41 active)

### P41-2 Golden app demo
- [x] New `docs/site/guide/golden-app-demo.md` — evaluator walkthrough of full-stack template
- [x] Link from README, examples.md, five-minute tour

### P41-3 Tutorial entry sync
- [x] Update `quick-start.md`, `installation.md`, `run-test-repl.md` — box/launch, 60-second first link

### P41-4 Concept + FAQ wiring
- [x] Update `faq.md`, `proof-of-concept.md`, `how-point-runs.md`, `authoring-vs-runtime.md`, `replaces-typescript-and-python.md`

### P41-5 Examples + in-the-box + language overview
- [x] Update `examples.md`, `in-the-box.md`, `language/overview.md` — golden path, launch syntax

## Verify

```bash
bun run ci
```

## Ship

Version **0.1.33**, tag, push.
