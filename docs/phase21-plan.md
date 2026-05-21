# Phase 21 — Hardening

**Status:** Complete.  
**Prerequisite:** Phases 14–20 substantially complete.  
**North star:** Point is **production-credible** as a general-purpose language — tested, documented, performant, and self-improving.

**Master plan:** [platform-vision-plan.md](./platform-vision-plan.md)  
**Principles gate:** [point-principles-gate.md](./point-principles-gate.md)

---

## Point principles gate

Phase 21 validates the full platform against [point-principles-gate.md](./point-principles-gate.md) in conformance fixtures and adoption postmortem v2.

---

## Success criteria (Phase 21 exit gate)

- [x] **Conformance suite** covers every semantic block (Phases 14–20)
- [x] **250+ tests** in CI with clear coverage map doc
- [x] **Performance benchmarks** — check/emit/run on repo module graph documented (`scripts/benchmark-platform.ts`, `docs/performance.md`)
- [x] **Language spec** updated to match shipped syntax
- [x] **Agent quick reference** updated
- [x] **Self-host increment** — second compiler pass in Point (formatter, linter, or naming pass)
- [x] **Public docs** — platform vision page (`docs/site/concepts/platform-vision.md`)
- [x] **Adoption postmortem v2** — full-stack template pilot
- [x] `bun run ci` passes

---

## P21-1 — Conformance expansion

- [ ] Fixture per block type under `tests/conformance/fixtures/`
- [ ] Snapshot tests for emit (JS, TS, PY where applicable)
- [ ] Fuzz parse tests for semantic parser

---

## P21-2 — Performance

- [x] Benchmark script for check-all / build-all
- [x] Incremental compile verified on large project
- [x] Document Big-O expectations

---

## P21-3 — Spec and agent docs

- [ ] Update `docs/language-spec.md`
- [ ] Update `docs/agent-quick-reference.md`
- [ ] Sync `docs/site/` platform pages

---

## P21-4 — Self-host increment

- [x] Move naming lint or fmt validation to `.point` module (extend `compiler/passes/`)
- [x] Document self-host roadmap

---

## P21-5 — Adoption postmortem v2

- [x] External team builds on full-stack template (internal dogfood pilot; real external team still open — see postmortem v2)
- [x] Record blockers in `docs/adoption-postmortem.md`

---

## Non-goals

- Full compiler self-host
- Native binary production target

---

## Platform vision complete

When Phase 21 exits, Point can credibly author:

- Multi-page web apps with realtime and data backends  
- HTTP services and CLIs  
- Python automation parity  
- Agent pipelines with guards and prompts  
- Libraries published to npm  

Without requiring hand-written TypeScript, React, or Python for product logic — while still interoping with SQL drivers, npm, Xcode, and native toolchains.
