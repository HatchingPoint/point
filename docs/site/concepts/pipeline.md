---
title: Pipeline
description: How a .point file becomes checked output and runnable target code.
quadrant: Explanation
---

## Summary

Point compiles semantic source through a typed pipeline: parse, semantic AST, core IR, check, and emit.

## Compile path

```text
.point source -> semantic AST -> core IR -> check -> emit -> JavaScript | TypeScript | Python
```

The semantic AST preserves public declarations and spans. The core IR is produced in memory and gives the checker and emitters a normalized representation.

## Checks

The checker validates names, types, field access, optional values, result values, loops, awaits, effects, and callable signatures. Diagnostics surface through terminal output, LSP, and `check-json`.

## Emit

`point build` emits JavaScript by default for daily use. `point build-ts` emits TypeScript for typed JavaScript stacks. `point build-py` emits Python for pure logic modules.

Generated files should not be hand-edited to fix product behavior. Repair `.point` source and rebuild.

## See also

- [CLI reference](/point/reference/cli)
- [Build and emit](/point/toolchain/build-emit)
- [Diagnostics](/point/reference/diagnostics)
