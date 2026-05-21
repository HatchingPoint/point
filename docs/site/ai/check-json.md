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

## See also

- [Diagnostics](/point/reference/diagnostics)
- [Repair loops](/point/ai/repair-loops)
- [Stable refs](/point/ai/stable-refs)
