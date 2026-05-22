# Agent repair sufficiency fixtures

Broken `.point` files used to prove that `check-json` alone carries enough
information to reach a passing `point check` after a localized fix.

CI runs:

```bash
bun test tests/agent-repair-sufficiency.test.ts
bun run benchmark:agent-repair
bun run benchmark:agent-repair-models   # needs OPENAI / ANTHROPIC / GEMINI keys
```

Each case pairs `*-broken.point` with `*-fixed.point`. Tests assert:

- diagnostics include `ref`, `expected`, `repair`, and `span`
- the chosen fix field appears in `expected`
- replacing the diagnostic line with the golden line passes `checkPointCore`
