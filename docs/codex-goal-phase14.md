# Codex Goals — Phase 14 Wave 1

**Master plan:** [phase14-plan.md](./phase14-plan.md)  
**Platform vision:** [platform-vision-plan.md](./platform-vision-plan.md)  
**Progress log:** [codex-progress.md](./codex-progress.md)

---

## Sanity check

```bash
cd /Users/pla_cebro/clones/point
bun install && bun run ci
```

Expected: 150+ tests pass (Phase 12 complete).

---

## Launch order

| Priority | Goal | Agent focus | Parallel? |
|----------|------|-------------|-----------|
| 1 | **P14-1** | `std.path` module + shim | ✅ |
| 1 | **P14-2** | Route middleware + typed request | ✅ |
| 1 | **P14-3** | Enum / variant types | ✅ |
| 1 | **P14-4** | Statement-level source maps | ✅ |
| 2 | **P14-5** | `std.process` | after P14-1 |
| 2 | **P14-6** | `std.crypto` | after P14-2 |
| 2 | **P14-7** | `std.yaml` + `std.stream` | after P14-1 |

### Four-window parallel start (Wave 1)

```text
Window 1: Execute Goal P14-1 — std.path module and runtime shim.
Window 2: Execute Goal P14-2 — route middleware and typed request/response.
Window 3: Execute Goal P14-3 — enum or variant types with discriminated union emit.
Window 4: Execute Goal P14-4 — statement-level source maps for point run errors.
```

---

## Goal P14-1 — std.path

```text
/goal Execute docs/phase14-plan.md P14-1: Add std/path.point with join, basename, dirname, extname, resolve, is absolute. Add runtime shim packages/point/src/std/path.ts and export @hatchingpoint/point/std/path. Tests, examples/tools/path-demo.point, update docs/site/stdlib/overview.md. Run bun run ci. Append checkpoint to docs/codex-progress.md. Commit: "Phase 14 P14-1: std.path module."
```

**Acceptance:**
- `point check std/path.point` passes
- Bun can `import ... from "@hatchingpoint/point/std/path"`
- General-purpose example (not App Store themed)

---

## Goal P14-2 — route middleware

```text
/goal Execute docs/phase14-plan.md P14-2: Extend route blocks with middleware chain, typed query/body/headers inputs, JSON response helpers. Emit composable Bun fetch handler stack. Add examples/api/middleware-demo.point and integration tests. Document in docs/site/language/routes.md. Minimal semantic syntax only. Run bun run ci. Append checkpoint. Commit: "Phase 14 P14-2: route middleware and typed requests."
```

**Acceptance:**
- Middleware runs in defined order
- Type errors for mismatched body/query records
- Example route returns JSON with auth middleware

---

## Goal P14-3 — variant types

```text
/goal Execute docs/phase14-plan.md P14-3: Implement enum or variant blocks (pick one, document in docs/language-spec.md). Support pattern dispatch. Emit TypeScript discriminated unions. Add examples/variants/order-status.point, grammar, LSP, conformance fixture. Run bun run ci. Append checkpoint. Commit: "Phase 14 P14-3: variant types."
```

**Acceptance:**
- Checker rejects invalid variant access
- Emit uses typed discriminated union
- No domain-specific variants in language core

---

## Goal P14-4 — statement source maps

```text
/goal Execute docs/phase14-plan.md P14-4: Map runtime errors to expression-level lines in .point source (extend beyond declaration-level maps). Wire into JS emit and point run error formatting. Tests with deliberate runtime failure inside calculation/action body. Document limits in docs/site/toolchain/run.md. Run bun run ci. Append checkpoint. Commit: "Phase 14 P14-4: statement-level source maps."
```

**Acceptance:**
- `point run` error cites line inside block body, not only block header
- Tests prove mapping

---

## Goal P14-5 — std.process

```text
/goal Execute docs/phase14-plan.md P14-5: Add std/process.point with spawn, exit code, env, stdout capture. Runtime shim using Bun.spawn. Effect touches process. Add examples/tools/process-runner.point. Tests with echo subprocess. Run bun run ci. Append checkpoint. Commit: "Phase 14 P14-5: std.process module."
```

---

## Goal P14-6 — std.crypto

```text
/goal Execute docs/phase14-plan.md P14-6: Add std/crypto.point with sha256, hmac, jwt sign/verify via external jose or crypto shim. Wire into middleware-demo JWT example. Document secret handling. Tests with known vectors. Run bun run ci. Append checkpoint. Commit: "Phase 14 P14-6: std.crypto module."
```

---

## Goal P14-7 — std.yaml and std.stream

```text
/goal Execute docs/phase14-plan.md P14-7: Add std/yaml.point (parse/stringify) and std/stream.point (read/write lines). Runtime shims. Tests. Update std overview docs. Run bun run ci. Append checkpoint. Commit: "Phase 14 P14-7: std.yaml and std.stream."
```

---

## Hard rules (all P14 goals)

- Public `.point` stays semantic — no `fn`/`let`/`type` in author source
- **Pass [point-principles-gate.md](./point-principles-gate.md)** — append gate line to checkpoint
- Production path: parsePointSource → semantic AST → desugar → core IR → check → emit
- Every feature: tests + general-purpose example (not Surgent/factory-specific syntax)
- Run `bun run ci` before done
- One goal per session; append checkpoint to docs/codex-progress.md
- Do not change git config; do not force push

---

## After Wave 1

When P14-1 through P14-4 land, run Wave 2 (P14-5–P14-7). When Phase 14 exit gate passes, open [phase15-plan.md](./phase15-plan.md) and create `codex-goal-phase15.md`.
