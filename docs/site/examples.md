---
title: Examples
description: Working Point examples by language area.
quadrant: Tutorial
---

## Summary

Examples in the Point repo are working fixtures used by checks and tests. They are the best source for small, runnable patterns.

## Start here

- `examples/hello.point` for a minimal command
- `examples/math.point` for records, calculations, rules, and labels
- the standard-library usage fixture for std imports
- `examples/route.point` for HTTP routes
- `examples/view.point` for views
- `examples/workflow.point` for orchestration
- `examples/point-tests.point` for tests
- `examples/adopters/hatchingpoint/readiness-widget.point` for an interactive listing readiness widget (see [live demo](https://hatchingpoint.com/point/examples#live-demo))

## Live demo

Try the App Store listing readiness widget on the public docs site — toggle checklist items and watch score and status update using the same rules as `readiness-widget.point`:

[Open live demo →](https://hatchingpoint.com/point/examples#live-demo)

## Agent workflow

When copying an example, keep the semantic block structure and run:

```bash
point check your-file.point
point fmt your-file.point
```

## See also

- [Language overview](/point/language/overview)
- [Applications](/point/language/applications)
- [Run, test, REPL](/point/toolchain/run-test-repl)
