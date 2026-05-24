# Codex goals — Phase 29 (Python std mirror)

**Runs in parallel with Phase 27 and 28.** Read [phase29-plan.md](./phase29-plan.md) file ownership first.

**Do not touch:** theme/SQL (27), agent-repair fixtures/benchmarks (28).

---

## Wave 1

```
/goal Execute docs/phase29-plan.md P29-1: Create packages/point/python_std/ mirrors for std.json, std.path, std.env (match JS std behavior). Tests. point-principles-gate. Append codex-progress. Do NOT commit unless user asked.
```

```
/goal Execute docs/phase29-plan.md P29-2: Wire emit-python.ts use std.* imports to python_std. Extend py-parity for one module. Append checkpoint.
```

---

## Wave 2

```
/goal Execute docs/phase29-plan.md P29-3: point build-py CLI + docs. examples/tools/process-runner.point Python run path. Append checkpoint.
```

```
/goal Execute docs/phase29-plan.md P29-4: Extend parity tests (http, yaml, crypto shims as ready). bun run ci. Integrator release ritual if 27/28 also complete.
```
