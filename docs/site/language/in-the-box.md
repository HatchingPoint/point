---
title: In the box
description: Capabilities, commands, and stupid-simple launch syntax.
quadrant: Reference
---

## Summary

Point ships **capabilities** (import), **commands** (run), and **toolchain skills** (agent fix). Three discover commands, three launch patterns.

## Discover

```bash
point box <file>              # everything in one screen
point capabilities            # built-in std modules
point commands <file>         # runnable command blocks
```

Add `--json` for agent scripts.

## Import (capabilities)

One line:

```point
module Demo

capabilities http json time

calculation noop
  output value: Text
  return "ok"
```

Same as:

```point
module Demo

use http
use json
use time

calculation noop
  output value: Text
  return "ok"
```

## Run (commands)

```bash
point run examples/tools/instant-demo.point instant demo
point launch examples/tools/instant-demo.point instant demo   # alias
```

`launch` requires a command name. `run` picks the default command when omitted.

List commands first:

```bash
point commands src/app.point
```

## Agent toolchain

```bash
point check-json myfile.point
point repair-plan myfile.point
point index myfile.point
```

## See also

- [Capabilities](/point/language/capabilities)
- [Five-minute tour](/point/guide/five-minute-tour)
- [CLI reference](/point/reference/cli)
