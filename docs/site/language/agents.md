---
title: Agents
description: pipeline, session, prompt, and guard blocks for agent orchestration.
quadrant: Reference
---

## Summary

Agent blocks orchestrate multi-step LLM flows, conversational sessions, versioned prompts, and scoped file writes — checked like any other Point source.

## pipeline

Multi-step flows with typed events. See `examples/pipelines/document-ingest.point` for `step ... is await action(...)` with retry and policy guards.

## session

Conversational state with streaming actions. See `examples/agents/support-chat.point`.

## prompt

Versioned templates with record placeholders. See `examples/prompts/support-greeting.point`:

```point
module SupportGreeting

record Support Context
  user name: Text
  tier: Text

prompt support greeting
  version 1
  input Support Context
  template "Hello {user name}, thank you for contacting support. Your {tier} plan is ready to help."
```

## guard output paths

Scope file writes in pipelines. See `examples/pipelines/guarded-output.point`:

```point
module GuardedOutput

guard output paths
  allow "output/**"
  allow "tmp/*"
```

## std.ai providers

Use `std.ai` for OpenAI and Anthropic provider actions. See [AI provider interop](/point/ecosystem/ai-providers).

## See also

- [Workflows](/point/language/workflows)
- [Effects](/point/language/effects)
- [AI overview](/point/ai/overview)
