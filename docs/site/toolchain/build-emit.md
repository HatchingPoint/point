---
title: Build and emit
description: Generate JavaScript, TypeScript, Python, or AST output from Point source.
quadrant: Reference
---

## Summary

Point source is the maintained artifact. Build commands emit target files for runtimes and surrounding stacks.

## JavaScript default

```bash
point build myfile.point generated/myfile.js
```

Use this for daily execution in Bun or Node.

## TypeScript

```bash
point build-ts myfile.point generated/myfile.ts
```

Use TypeScript emit when a surrounding project wants `.ts` imports or typechecking through `tsc`.

## Python

```bash
point build-py examples/math.point generated/math.py
```

Python emit currently targets pure logic modules. Actions, routes, views, and richer runtime integrations still emit through JavaScript or TypeScript.

## AST output

```bash
point build-ast myfile.point generated/myfile.ast.json
```

AST output is for debugging and tooling, not normal app execution.

## See also

- [Pipeline](/point/concepts/pipeline)
- [Authoring vs runtime](/point/concepts/authoring-vs-runtime)
- [CLI reference](/point/reference/cli)
