---
title: Platform vision
description: Point as a general-purpose language for entire applications — logic, UI, HTTP, realtime, data, agents, and automation.
quadrant: Explanation
---

## Summary

Point is a **general-purpose, AI-first language** for entire applications: logic, UI, HTTP, realtime, data, agents, and automation — authored in semantic `.point`, emitted to JavaScript (default) or Python (opt-in), with native toolchain interop (Bun, React, SQL drivers, npm) at the edges.

Authors do **not** hand-maintain TypeScript, React, Next.js glue, or Python factory scripts for product code. Generated targets are build artifacts.

## One sentence

Point lets teams and coding agents author product logic, application UI, HTTP services, agent pipelines, and automation in one checked semantic layer — then emit boring JavaScript or Python that runs on existing runtimes.

## What Point owns

| Capability | Semantic blocks |
|------------|-----------------|
| Data modeling | `record`, `variant` |
| Business logic | `calculation`, `rule`, `label`, `policy` |
| Side effects | `action`, `external`, `workflow` |
| HTTP services | `route`, `middleware`, `stream route` |
| Web applications | `view`, `page`, `layout`, `navigation` |
| Realtime & jobs | `schedule`, workflow retry/timeout |
| Agent orchestration | `pipeline`, `session`, `prompt`, `guard` |
| Database access | `action` + `external` or `std.sql` (`touches database`) |
| CLI & dev platform | `command`, `point dev`, integration tests |

## What stays outside Point (by design)

| Layer | Why |
|-------|-----|
| Xcode, Swift, iOS apps | Native platform; Point **invokes** via externals/commands |
| Apple signing, simulators, store upload | macOS toolchain |
| Database engines | PostgreSQL, SQLite, etc. — you run the server; Point calls drivers via `external` |
| Third-party SaaS APIs | OpenAI, FAL, etc. — `external` or std packs, not reimplemented runtimes |

Point composes with these layers. It does not replace them.

## Architecture

```text
.point (author) → semantic AST → core IR → check → emit → JS | TS | PY
                                                      ↓
                              Bun/Node runtime · React emit · SQL drivers · externals
```

Public source stays **semantic**. Internal core syntax (`fn`, `let`, `type`) is a compiler implementation detail and must not appear in author `.point` files.

## Platform phases (14–21)

| Phase | Focus |
|-------|-------|
| 14 | Language foundations — stdlib, route middleware, variant types |
| 15 | Application platform — `layout`, `navigation`, data loading |
| 16 | Realtime & processes — `stream route`, workflow retry/timeout |
| 17 | Data interop — `std.sql` + external database drivers (any DB) |
| 18 | Agent orchestration — `pipeline`, `session`, `prompt`, `guard` |
| 19 | Python full parity |
| 20 | Dev platform — `point dev`, full-stack template |
| 21 | Hardening — conformance, performance, docs |

## Connect any database

Point does **not** ship an ORM. Persist data with:

1. **`std.sql`** — local SQLite via parameterized queries
2. **`external postgres driver`** (or any driver) — fixed SQL templates + `List<Text>` params
3. **`load data from action`** — views call your database actions

See [Database interop](/point/ecosystem/database-interop).

## Principles

New features must pass the principles gate: semantic blocks, agent refs, effect honesty, boring emit, no vendor overfit.

## See also

- [Why Point exists](/point/concepts/why-point-exists)
- [Authoring vs runtime](/point/concepts/authoring-vs-runtime)
- [Database interop](/point/ecosystem/database-interop)
- [Applications](/point/language/applications)
- [CLI reference](/point/reference/cli)
