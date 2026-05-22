# Agent repair sufficiency fixtures

Broken `.point` files used to prove that `check-json` alone carries enough
information to reach a passing `point check` after a localized fix.

CI runs:

```bash
bun test tests/agent-repair-sufficiency.test.ts
bun test tests/agent-repair-multistep.test.ts
bun run benchmark:agent-repair
bun run export:agent-repair-cases
bun run benchmark:agent-repair-models   # needs OPENAI / ANTHROPIC / GEMINI keys
```

## Scenario types

### Typo fix (8 cases)

Single-line mistakes in rules, labels, calculations, actions.

### Feature build (5 single-shot + 1 multi-step)

Simulates **AI auto-coding**: the agent scaffolded a multi-block feature and made one wiring mistake (or two for the repair-plan case).

| ID | What the agent built | Bug |
|----|----------------------|-----|
| `feature-dashboard-load` | Dashboard with items list + routing | Called action in view instead of load binding |
| `feature-pipeline-await` | Document ingest pipeline | Missing `await` on first step |
| `feature-notes-crud` | Notes list app shell | Wrong action in `load data from action` |
| `feature-nav-routes` | Settings app routing | Typo'd page name in navigation |
| `feature-guard-policy` | Guarded file-write pipeline | Wrong policy name on pipeline step |
| `feature-multistep-launch` | Launch app (rule + label + calc) | **2 bugs** — CI loops check-json → fix → check |

Token reduction vs illustrative TS paste: **79–93%** (avg **87%**).
