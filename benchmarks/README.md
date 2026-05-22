# Agent repair model benchmark

Runs the CI agent-repair fixtures against popular LLMs under two workflows:

1. **Point** — `check-json` diagnostic only (~130–260 tokens of context)
2. **TypeScript** — TS paste + tsc error + full `.point` file (~1k–3k tokens)

Success means the model returns a `fixedLine` that passes `point check` and matches the golden CI fixture.

## Run locally

```bash
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
export GEMINI_API_KEY=...

bun run benchmark:agent-repair-models
# optional subset:
bun run benchmark:agent-repair-models -- --models=gpt-4o-mini,claude-3-5-haiku-latest
```

Output: `benchmarks/agent-repair-model-results.json`

Sync to the public site (LandingPage repo):

```bash
cd ../LandingPage && bun run sync:agent-repair-results
```

## Models (default)

| Model | Provider | Env var |
|-------|----------|---------|
| GPT-4o mini | OpenAI | `OPENAI_API_KEY` |
| GPT-4o | OpenAI | `OPENAI_API_KEY` |
| Claude Sonnet 4 | Anthropic | `ANTHROPIC_API_KEY` |
| Claude Haiku 3.5 | Anthropic | `ANTHROPIC_API_KEY` |
| Gemini 2.0 Flash | Google | `GEMINI_API_KEY` |

Only models whose provider key is set are run.

## CI

`.github/workflows/agent-repair-models.yml` runs on `workflow_dispatch` when repository secrets are configured.

---

# Agent app model benchmark

Full-app fixtures (~84–105 lines) paired with `benchmarks/next-dashboard/` Next.js scaffolds.

1. **Point** — `check-json` + numbered broken app (app-repair: single `fixedLine`; feature-add: multi-edit JSON)
2. **TypeScript** — measured Next scaffold paste + tsc error + numbered `.point` file

Success means the model's edit(s) pass `point check` (same gate as CI).

## Run locally

```bash
bun run benchmark:agent-app-models
bun run proof:agent-app -- --skip-models   # CI proof without API keys
```

Output: `benchmarks/agent-app-model-results.json`, `benchmarks/agent-app-proof-report.json`

`.github/workflows/agent-app-models.yml` — optional live model run on `workflow_dispatch`.
