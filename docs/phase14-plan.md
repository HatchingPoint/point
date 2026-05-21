# Phase 14 — Language Foundations

**Status:** Complete (Wave 1 + Wave 2).  
**Prerequisite:** Phase 12 complete (v0.0.15). Phase 13 may run in parallel — no hard dependency.  
**North star:** Point has the stdlib, HTTP depth, and type primitives expected of a general-purpose language — without any platform-specific syntax.

**Master plan:** [platform-vision-plan.md](./platform-vision-plan.md)  
**Codex goals:** [codex-goal-phase14.md](./codex-goal-phase14.md)

---

## Why this phase exists

Point v0.0.15 is strong at semantic logic but weak at **systems programming** and **production HTTP**. A factory dashboard, a SaaS admin panel, and a CLI automation tool all need the same foundations: paths, processes, crypto, structured config, typed HTTP, and precise runtime errors.

---

## Success criteria (Phase 14 exit gate)

- [x] **Four new std modules** — `std.path`, `std.process`, `std.crypto`, `std.yaml` (+ runtime shims)
- [x] **`std.stream`** — read/write stream wrappers for actions (file + HTTP bodies)
- [x] **Route depth** — middleware chain, typed query/body/headers, JSON response helpers
- [x] **Enum / variant types** — tagged unions for general-purpose modeling
- [x] **Statement-level source maps** — runtime errors map to expression lines in `.point`
- [x] **General example:** `examples/tools/process-runner.point` — CLI that spawns a subprocess and streams output
- [x] **General example:** `examples/api/middleware-demo.point` — authenticated JSON route
- [x] `bun run ci` passes

---

## P14-1 — `std.path`

- [x] Semantic module `std/path.point` with join, basename, dirname, extname, resolve, is absolute
- [x] Runtime shim `packages/point/src/std/path.ts`
- [x] Export via `@hatchingpoint/point/std/path`
- [x] Tests + update `docs/site/stdlib/overview.md`

**Verify:** `point check std/path.point` and runtime import work under Bun.

---

## P14-2 — Route middleware and typed requests

- [x] `middleware` block or route-level `before` chain (document choice in semantic-language-design.md)
- [x] Route inputs: `query`, `body`, `headers` with record types
- [x] Response helpers: JSON, status, headers (via std.http extension or route sugar)
- [x] Emit composable Bun fetch handler stack
- [x] Example: `examples/api/middleware-demo.point`
- [x] Tests for middleware order and type errors

**Verify:** Integration test hits route with query/body and middleware rejection.

---

## P14-3 — Enum / variant types

- [x] `enum` or `variant` block syntax (pick one; document in language-spec)
- [x] Pattern match or `label`-style dispatch on variants
- [x] Emit TypeScript discriminated unions
- [x] Example: `examples/variants/order-status.point`
- [x] Grammar + LSP + conformance fixture

**Verify:** Checker rejects invalid variant access; emit is typed.

---

## P14-4 — Statement-level source maps

- [x] Map core IR expressions back to semantic source spans
- [x] Wire into JS emit and `point run` error formatting
- [x] Document boundaries (views may stay declaration-level initially)
- [x] Tests: runtime error points to correct `.point` line inside a calculation/action

**Verify:** Deliberate divide-by-zero or throw in example reports line inside block body.

---

## P14-5 — `std.process`

- [x] `std/process.point` — spawn, exec, exit code, env for child, stdin/stdout as Text or stream
- [x] Runtime shim with `Bun.spawn` / Node `child_process`
- [x] Effect metadata: `touches process`
- [x] Example: `examples/tools/process-runner.point`
- [x] Tests with echo/cat subprocess

**Verify:** `point run examples/tools/process-runner.point` prints child output.

---

## P14-6 — `std.crypto`

- [x] Hash (sha256), HMAC, JWT sign/verify wrappers via `external` + shim
- [x] Document secret handling — never log keys; use `std.env`
- [x] Example: JWT gate in middleware-demo
- [x] Tests with known test vectors

**Verify:** Middleware-demo rejects bad JWT, accepts valid test token.

---

## P14-7 — `std.yaml` and `std.stream`

**std.yaml**

- [x] Parse/stringify YAML for config-driven apps
- [x] Runtime shim (yaml package external)
- [x] Tests

**std.stream**

- [x] Read stream to Text, write Text to stream, line iterator
- [x] Used by process-runner and future WebSocket work
- [x] Tests

**Verify:** Load `examples/starter-template/point.json`-like YAML in an example.

---

## Parallel tracks

```text
Wave 1 (launch now):     P14-1, P14-2, P14-3, P14-4
Wave 2 (after P14-1):    P14-5, P14-6, P14-7
```

P14-2 and P14-4 are independent. P14-6 depends on P14-2 for JWT middleware demo.

---

## Non-goals

- WebSocket server blocks (Phase 16)
- Full app shell / client routing (Phase 15)
- Vendor-specific database syntax (Phase 17 uses generic `action` + `external`)
- Python emit for new std modules (Phase 19 — JS shims first)

---

## After Phase 14

Phase 15 — Application platform: layout, navigation, data loading for views, styling bridge.
