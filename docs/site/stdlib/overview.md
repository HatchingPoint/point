---
title: Stdlib
description: Standard library modules and how to import them.
quadrant: Reference
---

## Summary

Point standard library modules are ordinary semantic Point files exposed under `std.<name>` imports.

## Import form

```text
module App

record App Config
  name: Text

use std.text
```

Standard modules map to files under `std/`, such as `std/text.point`, `std/json.point`, `std/http.point`, `std/time.point`, `std/fs.point`, and `std/env.point`.

## Why stdlib is small

The standard library stays narrow so agents choose known APIs instead of inventing local externals for common work. More capability can still come through explicit `external` declarations.

## See also

- [Effects](/point/language/effects)
- [Modules](/point/language/modules)
- [Stdlib bridge](/point/stdlib/bridge)
