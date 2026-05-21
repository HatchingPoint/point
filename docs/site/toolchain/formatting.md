---
title: Formatting
description: Canonical formatting for .point files.
quadrant: Reference
---

## Summary

Point has a canonical formatter so source stays stable for people, tools, and agents.

## Format one file

```bash
point fmt myfile.point
```

## Check formatting

```bash
point fmt-check myfile.point
point fmt-check-all
```

Use `fmt-check` in CI when you want formatting drift to fail the build.

## Why formatting matters

Stable formatting makes semantic refs and repair plans easier to follow. Agents should run formatting after changing `.point` source, then run checks again.

## See also

- [CLI reference](/point/reference/cli)
- [Repair loops](/point/ai/repair-loops)
