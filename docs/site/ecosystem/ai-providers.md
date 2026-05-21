---
title: AI provider interop
description: OpenAI and Anthropic HTTP providers through external blocks and semantic actions — no platform-specific CLI wrappers.
quadrant: Explanation
---

## Summary

Point does **not** ship Codex, Claude Code, or other IDE CLI wrappers. LLM calls belong in typed **`external`** boundaries that wrap provider HTTP APIs, then **`action`** blocks with explicit `touches network` metadata.

The **`std.ai`** module (`std/ai.point`) documents the pattern for OpenAI Chat Completions and Anthropic Messages — complete and stream text with minimal surface area.

## The pattern in one picture

```text
Author (.point)              Compiler                 Runtime
──────────────────────────────────────────────────────────────────
use std.ai            →   check types + effects  →   import from @hatchingpoint/point/std/ai
action complete …     →   async action fn        →   fetch provider HTTP API
get env var           →   envGet import          →   OPENAI_API_KEY / ANTHROPIC_API_KEY
```

Semantic blocks stay on the left. Provider URLs, headers, and SSE parsing stay in the runtime shim — not in calculations or rules.

## Step 1 — declare provider externals

`std/ai.point` declares two provider blocks:

```point
external openai provider
  openai complete raw(key: Maybe<Text>, prompt: Text, model: Text): Text or Error from "@hatchingpoint/point/std/ai" as openaiComplete
  openai stream raw(key: Maybe<Text>, prompt: Text, model: Text): Text or Error from "@hatchingpoint/point/std/ai" as openaiStream

external anthropic provider
  anthropic complete raw(key: Maybe<Text>, prompt: Text, model: Text): Text or Error from "@hatchingpoint/point/std/ai" as anthropicComplete
  anthropic stream raw(key: Maybe<Text>, prompt: Text, model: Text): Text or Error from "@hatchingpoint/point/std/ai" as anthropicStream
```

Application modules import the semantic surface with `use std.ai` instead of repeating provider URLs.

## Step 2 — wrap HTTP in actions

Actions load API keys through **`std.env`** only — never hard-code secrets in `.point` source. From `std/ai.point`:

```point
module StdAi

external openai provider
  openai complete raw(key: Maybe<Text>, prompt: Text, model: Text): Text or Error from "@hatchingpoint/point/std/ai" as openaiComplete

external point std env
  env get raw(name: Text): Maybe<Text> from "@hatchingpoint/point/std/env" as envGet

action complete text with openai
  input prompt: Text
  input model: Text
  output text: Text or Error
  touches network
  return openai complete raw(env get raw("OPENAI_API_KEY"), prompt, model)
```

Available actions today:

| Action | Provider | Mode |
|--------|----------|------|
| `complete text with openai` | OpenAI | Chat completion |
| `stream text with openai` | OpenAI | SSE stream → joined text |
| `complete text with anthropic` | Anthropic | Messages API |
| `stream text with anthropic` | Anthropic | SSE stream → joined text |

## Step 3 — host wiring (outside Point)

Set environment variables in your deploy or local shell:

| Variable | Provider |
|----------|----------|
| `OPENAI_API_KEY` | OpenAI |
| `ANTHROPIC_API_KEY` | Anthropic |

Read keys only through `std.env` (`env get raw("OPENAI_API_KEY")` inside actions). Do **not** embed production keys in `.point` files, generated output, or logs.

Example tool module: `examples/tools/ai-demo.point` (policy guards). Full provider surface: `std/ai.point`.

## Custom provider packs

Need a different vendor or model routing? Copy the `std.ai` pattern into your own module under `examples/externals/` or a private package:

1. Declare `external <vendor> provider` with narrow raw fetch helpers.
2. Wrap each call in an `action` with `touches network`.
3. Load secrets with `std.env` — one env var name per provider.
4. Keep request/response parsing in the JavaScript shim (`@hatchingpoint/point/std/*` style), not in rules.

Point stays provider-agnostic: HTTP interop, not platform CLI spawn.

## Security checklist

| Do | Don't |
|----|-------|
| Load keys with `std.env` at runtime | Hard-code API keys in `.point` |
| Fixed provider URLs in the shim | Pass arbitrary URLs from user input without policy |
| Return `{ message }` errors on HTTP failure | Swallow provider error bodies |
| Use actions for network IO | Call externals from pure calculations |

## Agent diagnostic notes

- Provider actions appear in `point index` with `effects: ["network"]`.
- Missing keys return structured errors mentioning the env var name.
- Prefer semantic action names (`complete text with openai`) in repair plans — not raw shim identifiers.

## See also

- [Effects](/point/language/effects) — `external`, `action`, and `touches`
- [Stdlib bridge](/point/stdlib/bridge) — how `std/*.point` maps to runtime shims
- [Stdlib overview](/point/stdlib/overview) — `use std.ai` import form
