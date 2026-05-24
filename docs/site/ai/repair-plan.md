---
title: Repair plan
description: When to use point repair-plan vs check-json alone, and how ordered steps work.
quadrant: Explanation
---

## Summary

`point repair-plan` turns diagnostics into **ordered repair steps** with stable semantic refs, repair text, expected values, and related refs. Use it when a file has more than one error or when fixes should follow source order.

## When to use repair-plan vs check-json

| Situation | Command |
|-----------|---------|
| One obvious error, single-shot fix | `point check-json` — read the first diagnostic |
| Multiple errors in one file | `point repair-plan` — follow steps top to bottom |
| Unsure which symbol a diagnostic refers to | `point explain <file> <ref>` on the step ref |
| After each patch | `point check-json` again until `ok: true` |

**check-json alone** is enough when the fixture has a single localized mistake (typo in a rule field, one missing `await`). CI agent-repair sufficiency tests prove that one diagnostic plus `expected` / `repair` / `relatedRefs` reaches a passing check.

**repair-plan** is for multi-step loops: scaffolded features where the agent left two or more wiring bugs. The plan orders steps by **source position** (line, then column) so upstream mistakes (unknown field in a rule) are fixed before downstream ones (operator mismatch in a label that calls the rule).

## Example

```bash
point repair-plan tests/fixtures/agent-repair/feature-multistep-broken.point
```

Sample output:

```json
{
  "schemaVersion": "point.core.repair-plan.v1",
  "ok": false,
  "steps": [
    {
      "ref": "point://semantic/LaunchApp/rule.launch readiness",
      "code": "unknown-field",
      "repair": "Use one of: has bundle id, submitted for review, has passing tests.",
      "relatedRefs": [
        "point://semantic/LaunchApp/record.Launch Signals.field.has bundle id"
      ]
    },
    {
      "ref": "point://semantic/LaunchApp/label.score band",
      "code": "operator-type-mismatch",
      "repair": "Use numeric expressions on both sides of >=.",
      "relatedRefs": [
        "point://semantic/LaunchApp/label.score band.input.score"
      ]
    }
  ]
}
```

Fix step 1, run `point check-json` again (or re-run `repair-plan`), then fix step 2.

## relatedRefs

Each step may include `relatedRefs` — sibling fields, inputs, or actions that clarify the fix:

- **unknown-field** — lists record field refs the agent can paste from.
- **missing-await** — links the action ref that must be awaited.
- **unknown-load-action** / **unknown-nav-page** — links the view or navigation block.

When a diagnostic omits `relatedRefs`, `repair-plan` enriches them from `point explain` on the step ref.

## Agent loop

1. `point repair-plan path/to/file.point` — read all steps.
2. Patch step 1 using `ref`, `repair`, and `relatedRefs`.
3. `point check-json path/to/file.point` — confirm progress; repeat from step 1 if new steps appear.
4. Stop when `ok: true`.

For single-error files, skip straight to `check-json` — fewer tokens, same outcome.

## CI gate

`bun run benchmark:agent-repair:gate` runs after `benchmark:agent-repair` in `bun run ci`. It enforces agent-repair sufficiency without an LLM:

| Threshold | Value |
|-----------|-------|
| Single-shot fixtures | ≥ 22 |
| Multistep (repair-plan) fixtures | ≥ 4 |
| Pass rate | **100%** — every case must reach a passing `point check` |

Single-shot cases prove one `check-json` diagnostic plus golden line repair is sufficient. Multistep cases prove the repair-plan loop reaches a passing check in the expected number of steps. If any case fails or fixture counts drop below the minimum, CI exits non-zero.

Reproduce locally:

```bash
bun run benchmark:agent-repair:gate
bun test tests/agent-repair-gate.test.ts
```

When adding fixtures, register them in `scripts/agent-repair-sufficiency.ts` and bump the minimum counts in `scripts/agent-repair-gate.ts` if the registry grows.

## See also

- [check-json](/point/ai/check-json)
- [Repair loops](/point/ai/repair-loops)
- [Agent repair tests](/point/ai/agent-repair-tests)
- [Stable refs](/point/ai/stable-refs)
