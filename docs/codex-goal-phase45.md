# Codex goals — Phase 45 (SaaS depth burst)

**Plan:** [phase45-plan.md](./phase45-plan.md)

---

## Wave 1 (parallel — all five)

### Track A — SQL wiring (P45-1)
```
/goal Execute docs/phase45-plan.md P45-1: saas-app action fetch members from query member rows, route await fetch members, members list view load from action. Verify point check. Do NOT commit unless user asked.
```

### Track B — Auth-bearer benchmark (P45-2)
```
/goal Execute docs/phase45-plan.md P45-2: auth-bearer case in agent-repair-sufficiency, gate min single-shot 23, regenerate benchmarks/agent-repair-cases.json. Do NOT commit unless user asked.
```

### Track C — SaaS integration test (P45-3)
```
/goal Execute docs/phase45-plan.md P45-3: tests/saas-app-integration.test.ts — health, members GET, POST auth 401/201. Wire in CI. Do NOT commit unless user asked.
```

### Track D — Pilot quickstart (P45-4)
```
/goal Execute docs/phase45-plan.md P45-4: scripts/pilot-quickstart.sh — create saas-app, check, demo, init db with DATABASE_URL, print serve/deploy next steps. Use POINT_CLI like onboarding-smoke.sh. Do NOT commit unless user asked.
```

### Track E — Docs + ship prep (P45-5)
```
/goal Execute docs/phase45-plan.md P45-5: phase45-plan, codex-goal-phase45, phase-roadmap Phase 45 entry. Do NOT commit unless user asked.
```

---

## Wave 2 — Integrator
```
/goal Phase 45 integrator: bun run ci. CHANGELOG v0.1.37. Bump versions. Commit tag v0.1.37 when user asked.
```
