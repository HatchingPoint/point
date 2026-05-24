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
point launch examples/command.point hello cli
point run examples/command.point hello cli   # same; default when one command
```

**`launch` requires a command name** — the simple path. List commands first:

```bash
point commands src/app.point
point box src/app.point
```

Logic-only files use `point check` only.

## Agent toolchain

```bash
point check-json myfile.point
point repair-plan myfile.point
point index myfile.point
```

## See also

- [Point in 60 seconds](/point/guide/point-in-60-seconds)
- [Golden app demo](/point/guide/golden-app-demo)
- [Capabilities](/point/language/capabilities)
- [CLI reference](/point/reference/cli)
