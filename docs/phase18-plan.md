# Phase 18 — Agent Orchestration

**Status:** Complete.  
**Prerequisite:** Phase 16 exit gate (streaming + workflow retries).  
**North star:** Point expresses **multi-step AI and automation pipelines** as first-class semantic blocks — not ad-hoc TypeScript orchestrators.

**Master plan:** [platform-vision-plan.md](./platform-vision-plan.md)  
**Principles gate:** [point-principles-gate.md](./point-principles-gate.md)

---

## Point principles gate

Every P18 deliverable must pass [point-principles-gate.md](./point-principles-gate.md). Pipelines and sessions are inspectable semantic modules with `policy` guards — not opaque CLI wrappers.

---

## Success criteria (Phase 18 exit gate)

- [x] **`pipeline` block** — named steps, inputs/outputs, sequential and parallel steps
- [x] **Step guards** — `policy` + `guard file` / `guard path` patterns (configurable deny list)
- [x] **Retry/timeout** — reuse Phase 16 workflow semantics inside pipelines
- [x] **`session` block** — agent conversation state, message record types, streaming events
- [x] **`prompt` library** — records + text templates with `{interpolation}` (not LLM-specific keywords)
- [x] **Provider externals** — OpenAI/Anthropic as std or documented external pack
- [x] **General example:** `examples/pipelines/document-ingest.point` — fetch → parse → classify → store
- [x] **General example:** `examples/agents/support-chat.point` — session + streaming responses
- [x] `bun run ci` passes

---

## P18-1 — Pipeline blocks

- [ ] `pipeline` with `step` declarations calling actions/workflows
- [ ] Input/output records for pipeline
- [ ] Emit async orchestrator function with typed events
- [ ] Machine-readable event log for agents (`check-json` style for runtime)
- [ ] Tests

---

## P18-2 — Guards and policies for automation

- [ ] `guard` block listing protected paths/globs
- [ ] Pipeline steps declare `touches file` scope
- [ ] Violations return structured Error
- [ ] Example: pipeline refuses to write outside `output/`
- [ ] Tests

---

## P18-3 — Session and streaming

- [ ] `session` with message record, role enum, content Text
- [ ] `stream response from` action binding
- [ ] Emit event iterator or WS integration (Phase 16)
- [ ] support-chat example
- [ ] Tests with mock provider

---

## P18-4 — Prompt library

- [ ] `prompt` block or record template with validated placeholders
- [ ] Version field for prompt records
- [ ] Index prompts in `point index` for agents
- [ ] Tests

---

## P18-5 — Provider pack (std.ai or examples/externals/ai)

- [x] `external openai` / `external anthropic` documented pack
- [x] Actions: complete, stream, embed (minimal surface)
- [x] No API keys in source — `std.env` only
- [x] Tests with mocked fetch

---

## Parallel tracks

```text
Wave 1:  P18-1, P18-4, P18-5
Wave 2:  P18-2, P18-3
```

---

## Non-goals

- Built-in Codex/Claude CLI wrapper (use process spawn + guard)
- Surgent auto_build pipeline as single blessed module (provide general pipeline; adopters copy)

---

## After Phase 18

Phase 19 — Python full parity for automation scripts.
