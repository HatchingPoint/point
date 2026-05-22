# Codex Goals — Phase 22 (Language breadth & dedomainization)

**Master plan:** [phase22-plan.md](./phase22-plan.md)  
**Progress log:** [codex-progress.md](./codex-progress.md)

**Context:** Grammar is general-purpose; onboarding and language-guide examples overfit to App Store readiness dogfood. Surgent is a benchmark only — no vendor syntax.

---

## Wave 1 (launch in parallel)

### P22-1 — Dedomainize onboarding

```text
/goal Execute docs/phase22-plan.md P22-1: Replace readiness-first examples in README.md, docs/site/guide/quick-start.md, docs/site/concepts/proof-of-concept.md, and docs/site/language/rules.md with neutral domains (cart-total, subscription-tier, order-status). Keep examples/adopters/hatchingpoint/ as the readiness home. Run point check-docs. Commit: "Phase 22 P22-1: neutral onboarding examples."
```

### P22-2 — Split language docs (UI + workflows + agents + realtime)

```text
/goal Execute docs/phase22-plan.md P22-2: Split docs/site/language/applications.md into ui.md, workflows.md, agents.md, realtime.md. Update docs site sidebar/nav and docs/site/language/overview.md block map. Keep applications.md as a short index with links. Run point check-docs. Commit: "Phase 22 P22-2: split language docs taxonomy."
```

### P22-4 — Cross-domain examples index

```text
/goal Execute docs/phase22-plan.md P22-4: Revise docs/site/examples.md so Start here highlights hello, cart-total, route, and one agent/workflow example — readiness under adopters only. Update any broken links. point check-docs. Commit: "Phase 22 P22-4: cross-domain examples index."
```

### P22-5 — Language primitive audit (research doc)

```text
/goal Execute docs/phase22-plan.md P22-5: Write docs/language-primitive-audit.md covering Map/dict, money/decimal, typed errors, and date/time author surface. For each: current workaround, implement vs defer recommendation, and example from examples/ if one exists. No compiler changes unless trivial. Commit: "Phase 22 P22-5: language primitive audit."
```

---

## Wave 2 (after Wave 1 or non-conflicting)

### P22-3 — View syntax reference

```text
/goal Execute docs/phase22-plan.md P22-3: In docs/site/language/ui.md (from P22-2), document form, tabs, modal, each item in data render, load data from action, bind checkbox, Handler T — match packages/point/src/semantic/parse.ts. Use examples/app/dashboard/ and examples/app/notes/ not readiness-widget. point check-docs. Commit: "Phase 22 P22-3: view syntax reference."
```

### P22-6 — Spec sync

```text
/goal Execute docs/phase22-plan.md P22-6: Remove stale serverQuery/serverMutation from docs/language-spec.md EBNF. Extend docs/semantic-language-design.md with routes, middleware, workflow, pipeline, view/page blocks through Phase 21. Commit: "Phase 22 P22-6: spec and semantic design sync."
```

### P22-7 — Cross-domain conformance fixtures

```text
/goal Execute docs/phase22-plan.md P22-7: Add or tag one examples/*.point per block family from non-readiness domains (cart rule, support prompt, health schedule, notes page). Wire into tests/conformance or check-all discovery if applicable. bun test. Commit: "Phase 22 P22-7: cross-domain conformance fixtures."
```

### P22-8 — npm logic positioning (optional)

```text
/goal Execute phase22 optional: Add packages/point-logic/README positioning as "example adopter package" OR scaffold packages/point-logic-catalog/ with cart/subscription modules. Update docs/site/ecosystem/npm-packages.md. Do not break @hatchingpoint/point-logic consumers. Commit: "Phase 22 P22-8: diversify published logic examples."
```

---

## Docs truth (parallel, append-only)

```text
/goal Update docs/phase22-plan.md checkboxes as goals land. Append checkpoint to docs/codex-progress.md. Run point check-docs when docs/site changes.
```

---

## Sanity check

```bash
cd c:\Users\mcarr\Documents\clones\point-1
bun install
bun packages/point/src/cli.ts check-docs
bun test
```

Expected: all tests pass; check-docs clean after site edits.
