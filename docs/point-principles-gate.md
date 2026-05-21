# Point Principles Gate

Use this checklist before marking **any** phase goal or checkbox done. Applies to Phases 14–21 and all Codex goals.

## North star

Point is the **next-gen language for AI engineering**: semantic source humans and agents inspect, compiler APIs that enable repair loops, boring emit to existing runtimes. **Water-like** = one semantic layer that adapts across logic, HTTP, UI, data, agents, and automation — without becoming TypeScript-with-keywords or a product-specific DSL.

## Required gates

| Gate | Requirement | Verify |
|------|-------------|--------|
| **Semantic** | Feature is a named block or extension of an existing block family — not host-framework boilerplate in author source | Agent can say "edit the `layout sidebar` block" |
| **Agent loop** | Stable `point://semantic/` refs; structured `check-json` diagnostics with repair hints; `index` and `explain` coverage | Run `point index` and `point explain` on new construct |
| **Block family** | Prefer `record`, `rule`, `label`, `policy`, `action`, `view`, `page`, `variant`, `workflow` patterns over new syntax | Document which family was extended in checkpoint |
| **Effect honesty** | Side effects declare `touches` or live in `external` — no silent IO | Effect metadata visible in index |
| **General proof** | Ship a non-factory example with the feature | Example path in checkpoint |
| **Boring emit** | Generated JS/TS/Python is readable glue; novelty stays in `.point` | Review emit snapshot in tests |
| **No overfit** | No product-specific keywords (no `auto_build`, `asc_upload`, etc.) | Example works for arbitrary domain |

## Fail criteria

Mark the goal **not done** if:

- Authors must hand-edit generated files for normal use
- Feature only works via opaque `external` with no semantic block
- Diagnostics point at generated identifiers instead of semantic names
- No tests and no general-purpose example

## Codex session rule

Append to every checkpoint in `docs/codex-progress.md`:

```text
Principles gate: Semantic ✅/❌ Agent loop ✅/❌ Block family ✅/❌ Effects ✅/❌ General example ✅/❌ Boring emit ✅/❌ No overfit ✅/❌
```
