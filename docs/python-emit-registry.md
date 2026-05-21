# Python Emit — External Shim Registry

**Master plan:** [phase19-plan.md](./phase19-plan.md) (P19-4)  
**Emit research:** [python-emit-research.md](./python-emit-research.md)  
**Principles gate:** [point-principles-gate.md](./point-principles-gate.md)

Point Python emit resolves `external` declarations to readable Python imports or inline shims. Authors declare the same semantic `external` blocks in `.point` source regardless of target; the compiler picks the Python mapping at emit time.

## Resolution order

1. **`@hatchingpoint/point/std/*`** — mapped to `point_std.*` under `packages/point/python_std/` (bootstrap inserts `python_std` on `sys.path` relative to the emitted file).
2. **`node:fs` `readFileSync`** — inline `pathlib.Path.read_text()` shim (legacy direct external, not std).
3. **Everything else** — emits a Python `from … import …` using the external module string with `/` → `_` (usually invalid until a mapping is added).

See `packages/point/src/core/emit-python.ts` (`emitExternal`).

---

## Point std modules

Semantic source lives in `std/*.point`. JavaScript emit imports `@hatchingpoint/point/std/<module>`; Python emit imports `point_std.<module>`.

| Point std module | JS / npm runtime | Python shim | Python deps |
|------------------|------------------|-------------|-------------|
| `std/path` | `node:path` | `point_std.path` (`os.path`) | stdlib |
| `std/json` | `JSON` | `point_std.json` (`json`) | stdlib |
| `std/text` | native string ops | `point_std.text` | stdlib |
| `std/time` | `Date`, timers | `point_std.time` | stdlib |
| `std/env` | `process.env` | `point_std.env` (`os.environ`) | stdlib |
| `std/fs` | `node:fs` | `point_std.fs` (`pathlib.Path`) | stdlib |
| `std/http` | global `fetch` | `point_std.http` (`urllib.request`) | stdlib |
| `std/crypto` | `node:crypto` (HS256 JWT) | `point_std.crypto` (`hashlib`, `hmac`, `base64`) | stdlib |
| `std/process` | `node:child_process` | `point_std.process` (`subprocess`) | stdlib |
| `std/yaml` | npm `yaml` | `point_std.yaml` | **PyYAML** (`pip install pyyaml`) |
| `std/stream` | `node:fs` / streams | `point_std.stream` | stdlib |
| `std/sql` | `node:sqlite` / driver | `point_std.sql` (`sqlite3`) | stdlib |
| `std/ai` | global `fetch` to provider APIs | `point_std.ai` (`urllib.request`) | stdlib |

**Examples:** `std/path.point`, `std/crypto.point`, `examples/tools/yaml-config.point`, `examples/tools/ai-demo.point`.

**Parity tests:** `tests/python-std-parity.test.ts` (path + json today; extend as modules stabilize).

---

## fetch / HTTP

| JS / Bun surface | Used by | Python equivalent | Notes |
|------------------|---------|-------------------|-------|
| Global `fetch` | `std/http`, `std/ai`, route middleware | `urllib.request` + `asyncio.to_thread` | Same error shape: `{ message: string }` on failure |
| `node:http` / Bun server | route emit (JS target) | `http.server` stdlib | Python route emit — see [python-emit-research.md](./python-emit-research.md) |
| npm `node-fetch` | uncommon direct external | `urllib.request` or `httpx` (optional) | Prefer `use std.http` actions instead of raw externals |

`std.http` functions:

| Point external | JS | Python |
|----------------|-----|--------|
| `http get raw(url)` | `fetch(url)` | `point_std.http.httpGet` |
| `http post raw(url, body)` | `fetch(url, { method: "POST", body })` | `point_std.http.httpPost` |

---

## OpenAI / Anthropic (Phase 18 pack)

Authors use semantic actions (`complete text with openai`, `stream text with anthropic`) backed by narrow `external` raw helpers on `@hatchingpoint/point/std/ai`.

| Point external | JS runtime | Python shim | Optional SDK |
|----------------|------------|-------------|--------------|
| `openai complete raw` | `fetch` → OpenAI chat completions | `point_std.ai.openaiComplete` | `openai` PyPI package (not required) |
| `openai stream raw` | `fetch` (SSE body parse) | `point_std.ai.openaiStream` | same |
| `anthropic complete raw` | `fetch` → Anthropic messages | `point_std.ai.anthropicComplete` | `anthropic` PyPI package (not required) |
| `anthropic stream raw` | `fetch` (SSE body parse) | `point_std.ai.anthropicStream` | same |

Default Python shims use **stdlib HTTP only** (mirrors JS `fetch`-based std). Teams that want retries, tool calling, or official SDK types can add a future registry row mapping `@hatchingpoint/point/std/ai` to `openai.AsyncOpenAI` / `anthropic.AsyncAnthropic` — not wired in emit v1.

**Example:** `examples/agents/support-chat.point`, `examples/tools/ai-demo.point`.

---

## YAML

| JS / npm | Python shim | Install |
|----------|-------------|---------|
| npm package `yaml` (`parse`, `stringify`) | `point_std.yaml` wrapping **PyYAML** `safe_load` / `safe_dump` | `pip install pyyaml` |

Wire format matches JS: parse returns compact JSON text; stringify accepts JSON text input.

**Example:** `examples/tools/yaml-config.point` → `generated/yaml-config.py`.

---

## jose / crypto (JWT and HMAC)

Phase 14 documented JWT via `jose` on JS; Point std **`std/crypto`** uses **`node:crypto`** (HS256 only) — no `jose` import in author source.

| Capability | JS (`@hatchingpoint/point/std/crypto`) | Python (`point_std.crypto`) |
|------------|----------------------------------------|-----------------------------|
| SHA-256 hex | `node:crypto` `createHash` | `hashlib.sha256` |
| HMAC-SHA256 hex | `node:crypto` `createHmac` | `hmac` + `hashlib` |
| JWT sign (HS256) | `createHmac` + base64url | same algorithm in pure stdlib |
| JWT verify | `timingSafeEqual` | `hmac.compare_digest` |
| `check jwt valid` | `cryptoJwtIsValid` | `checkJwtValid` |

Optional future mapping for direct `external … from "jose"` declarations: **`PyJWT`** or **`python-jose`** — not in emit v1; use `use std.crypto` instead.

**Example:** `examples/api/middleware-demo.point` (JWT middleware) → `generated/middleware-demo.py`.

---

## Node built-ins (non-std externals)

| External `from` | JS import | Python emit today |
|-----------------|-----------|-------------------|
| `node:fs` `readFileSync` | `readFileSync` | inline `Path(path).read_text()` |
| `node:fs` (other) | — | unmapped — use `std/fs` |
| `node:path` | — | unmapped — use `std/path` |
| `node:crypto` | — | unmapped — use `std/crypto` |

---

## Database actions (Phase 17)

Database IO uses **`action`** blocks with `touches database`, calling **`external`** driver shims or **`std.sql`**. Python emit generates the same action functions as JavaScript — wire your driver in the host bootstrap.

| Surface | JS emit | Python status |
|---------|---------|---------------|
| `action` + `external` driver | async action fn + ES import | async action fn + Python import (when mapped in registry) |
| `std.sql` | `@hatchingpoint/point/std/sql` | SQLite via stdlib shim (spike) |

See [docs/site/ecosystem/database-interop.md](./site/ecosystem/database-interop.md).

---

## Route HTTP frameworks (future externals)

Python route emit uses **stdlib `http.server`** (zero deps). Optional future registry entries:

| npm / JS pattern | Python alternative | When |
|------------------|-------------------|------|
| Bun `fetch` handler stack | `http.server` (current) | default |
| FastAPI / Starlette | `fastapi` + uvicorn | OpenAPI, async middleware, WebSockets |
| Express-style npm middleware | — | not planned for Python emit |

Declare interest via `point.json` `python.routeRuntime` (future) — not implemented in Phase 19.

---

## Adding a new mapping

1. Implement shim in `packages/point/python_std/point_std/<module>.py` (or extend `emitExternal` for one-off `node:*` shims).
2. Add parity test in `tests/python-std-parity.test.ts` or fixture-specific emit test.
3. Append a row to this registry.
4. General example under `examples/tools/` or `examples/api/`.

Keep author surface in `.point` `external` blocks — no Python-specific syntax in semantic source ([point-principles-gate.md](./point-principles-gate.md)).
