---
title: Check JSON
description: Structured diagnostics for scripts, editors, CI, and coding agents.
quadrant: Explanation
---

## Summary

`point check-json` returns machine-readable diagnostics so tools can repair `.point` files without scraping terminal text.

## Run it

```bash
point check-json examples/math.point
```

Successful output marks the file as ok. Failed output includes diagnostics with fields such as `code`, `message`, `ref`, `expected`, `actual`, `repair`, and `relatedRefs`.

## What agents should read

Use `code` to identify the problem class. Use `ref` to find the declaration or field. Use `repair` as the first patch hint. Use `relatedRefs` when the fix depends on another symbol.

## Follow-up commands

```bash
point index examples/math.point
point explain examples/math.point point://semantic/Math/rule.launch readiness
point repair-plan examples/math.point
```

`check-json` is the diagnostic source. `index`, `explain`, and `repair-plan` add context around the same semantic refs.

## VS Code / LSP parity

The Point language server (`point lsp`, used by the VS Code extension) runs the same checker as `check-json`. For each diagnostic:

| Field | `check-json` | LSP / editor |
|-------|--------------|--------------|
| `code` | yes | yes (`Diagnostic.code`) |
| `message` | yes | yes |
| `repair` | yes | yes — appended to the LSP message after ` — ` |
| `ref` | yes | yes — exposed on the LSP diagnostic object; hover on the symbol resolves the same ref via `explain` |
| `expected` / `actual` | yes | **no** — use `check-json` or `repair-plan` for structured expected lists |
| `relatedRefs` | yes | **no** — use `check-json` or `point explain` on each ref |

Intentional gaps: agents and CI should prefer `check-json` for the full machine-readable payload. Editors surface enough for human triage (`code`, message, repair hint) without duplicating every JSON field in the LSP wire format.

Spot-check matrix: `tests/agent-lsp-check-json-parity.test.ts` (Phase 26–27 codes + core agent-loop fixtures).

## See also

- [Diagnostics](/point/reference/diagnostics)
- [Repair loops](/point/ai/repair-loops)
- [Stable refs](/point/ai/stable-refs)
