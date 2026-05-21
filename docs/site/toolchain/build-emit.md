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
point build --production myfile.point generated/myfile.js
```

Use this for daily execution in Bun or Node. Add `--production` for deploy-oriented emit (production header, compact spacing). Pair with your host minifier or bundler — see [Deploy](/point/toolchain/deploy).

## TypeScript

```bash
point build-ts myfile.point generated/myfile.ts
```

Use TypeScript emit when a surrounding project wants `.ts` imports or typechecking through `tsc`.

## Python

```bash
point build-py examples/api/middleware-demo.point generated/middleware-demo.py
point build-py-all
```

Python emit covers logic, actions, routes, workflows, and commands where the backend supports them. Views, layouts, navigation, and realtime client code still target JavaScript or TypeScript. See `docs/python-emit-registry.md` in the repo for the full mapping.

## AST output

```bash
point build-ast myfile.point generated/myfile.ast.json
```

AST output is for debugging and tooling, not normal app execution.

## See also

- [Deploy](/point/toolchain/deploy)
- [Pipeline](/point/concepts/pipeline)
- [Authoring vs runtime](/point/concepts/authoring-vs-runtime)
- [CLI reference](/point/reference/cli)
