---
title: Build and emit
description: Optional build commands when a host project needs generated modules — not required for check, fmt, or point run.
quadrant: Reference
---

## Summary

Most workflows stay on `.point` source plus `point check` and `point run`. Use the commands on this page when something outside Point imports compiled files from `generated/`.

Do not hand-edit build output. Repair `.point` and rebuild.

## Default build

```bash
point build myfile.point generated/myfile.js
point build --production myfile.point generated/myfile.js
```

Use for Bun/Node hosts. Add `--production` for deploy-oriented output — see [Deploy](/point/toolchain/deploy).

Batch:

```bash
point build-all
```

## Typed build (optional)

```bash
point build-ts myfile.point generated/myfile.ts
point build-ts-all
```

Use when a host stack wants `.ts` imports or `tsc` in CI.

## Python build (optional, advanced)

```bash
point build-py examples/math.point generated/math.py
point build-py-all
```

Covers logic, actions, routes, workflows, and commands where a Python runtime consumes output. Application UI, views, and most client code still use the default JavaScript build. See [Python build (build-py)](/point/toolchain/build-py) for run examples (including `examples/tools/process-runner.point`) and std bridge details.

## AST output (tooling)

```bash
point build-ast myfile.point generated/myfile.ast.json
```

For debugging and tooling — not normal app execution.

## See also

- [Dev and serve](/point/toolchain/dev)
- [How Point runs](/point/concepts/how-point-runs)
- [Run, test, REPL](/point/toolchain/run-test-repl)
- [Python build (build-py)](/point/toolchain/build-py)
- [Deploy](/point/toolchain/deploy)
- [CLI reference](/point/reference/cli)
