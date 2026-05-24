# Point product map

Internal source of truth for README, site copy, and release notes. Sync when shipping packaging phases.

## One sentence

Point is a **general-purpose, AI-first language** for product logic — semantic blocks humans read, a compiler agents repair, JavaScript/Python the machine runs.

## Five families (market language)

| Family | Blocks | Pitch |
|--------|--------|-------|
| **Logic** | `record`, `variant`, `calculation`, `rule`, `label` | Rules and data in plain blocks |
| **Effects** | `external`, `action`, `policy` | Typed host boundaries |
| **App** | `view`, `page`, `layout`, `navigation`, `route`, `middleware`, `stream route` | Full-stack UI + HTTP |
| **Agent** | `pipeline`, `session`, `prompt`, `guard`, `workflow`, `schedule`, `command` | Runnable automation |
| **Data** | `std.sql`, `build-schema`, records | Schema + queries without ORM soup |

**Toolchain** (not blocks): `check`, `build`, `run`, `dev`, `serve`, `test`, `lsp`, `repair-plan`.

## Built-in capabilities (std shorthand)

Authors import batteries with one line or one word:

```point
capabilities http json time
```

Same as separate `use http` lines. Run `point capabilities` for the full catalog (14 modules). Run `point box <file>` for capabilities + commands together.

Expand with:

- **`point add npm:…`** — lockfile packages
- **`use Module from "./file.point"`** — your modules
- **`command` / `pipeline`** — discoverable entrypoints

## Emit targets

| Target | Command | Use |
|--------|---------|-----|
| JavaScript | `point build` | Default run/deploy |
| TypeScript | `point build-ts` | React/Vite/tsc |
| Python | `point build-py` | Automation parity |
| SQL DDL | `point build-schema` | Postgres/SQLite migrations |

## Agent loop (differentiator)

```text
index → explain point://… → check-json → repair-plan → patch → check
```

26+ repair benchmark cases; CI gate at 100% sufficiency.

## CLI groups (user-facing)

| Group | Commands |
|-------|----------|
| Quality | `check`, `check-all`, `check-json`, `fmt`, `fmt-check` |
| Emit | `build`, `build-ts`, `build-py`, `build-schema`, `build-ast` |
| Run | `run`, `launch`, `test`, `test integration`, `repl` |
| App | `create`, `init`, `dev`, `serve`, `build-app` |
| Discover | `capabilities`, `commands`, `box`, `index`, `explain`, `repair-plan` |
| Ecosystem | `add` |
| Editor | `lsp` |

## Templates

- `full-stack-app` — Vite + routes + pages
- `vercel-app` — deploy-oriented variant

## Version anchor

Update this line each release: **v0.1.31** — Phase 39 in-the-box launch syntax.
