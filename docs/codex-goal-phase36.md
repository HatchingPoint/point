# Codex goals — Phase 36 (parallel burst)

**Plan:** [phase36-plan.md](./phase36-plan.md)  
**Principles gate:** [point-principles-gate.md](./point-principles-gate.md)

Paste **one block per chat**. Do not edit files owned by another track.

---

## Wave 1 (parallel — start all four)

### Track A — README + product map

```
/goal Execute docs/phase36-plan.md P36-1: Rewrite root README.md with five block families (Logic, App, Agent, Data, Toolchain), install, 30-second example, CLI groups, agent loop, emit targets (JS/TS/Python/SQL), link docs/site. Add docs/product-map.md as internal marketing source. Refresh packages/point/README.md. Append codex-progress checkpoint. Do NOT commit unless user asked.
```

### Track B — Built-in capabilities

```
/goal Execute docs/phase36-plan.md P36-2: Add packages/point/src/core/capabilities.ts registry. Shorthand `use http` (lowercase, no from) normalizes to `use std.http` in semantic/parse.ts and cli parseUseDeclarations. Add `point capabilities` CLI (JSON catalog). examples/capabilities-demo.point + tests/capabilities.test.ts. Improve unknown-capability error to suggest `point capabilities`. Append codex-progress. Do NOT commit unless user asked.
```

### Track C — Docs sync

```
/goal Execute docs/phase36-plan.md P36-3: Sync docs/vision.md to v0.1.28 reality. Update docs/site/reference/cli.md (version, capabilities command). docs/site/changelog.md through 0.1.28. New docs/site/language/capabilities.md. Update modules.md, stdlib/overview.md, introduction.md to lead with `use http` shorthand. Append codex-progress. Do NOT commit unless user asked.
```

### Track D — GitHub releases

```
/goal Execute docs/phase36-plan.md P36-4: Add scripts/publish-github-releases.sh that creates GitHub releases from CHANGELOG sections for v0.1.21–v0.1.28. Document usage in script header. Try gh release list; report status. Append codex-progress. Do NOT commit unless user asked.
```

---

## Wave 2 — Integrator (single chat, after A+B+C+D green)

```
/goal Phase 36 integrator: Run bun run ci. Mark phase36-plan.md checkboxes. CHANGELOG v0.1.28. Bump package versions. Update phase-roadmap.md. Append codex-progress integrator checkpoint. Commit and tag v0.1.28 when user asked.
```
