# Pure logic examples

Modules here have no views, routes, workflows, or commands — only calculations, rules, labels, and actions.

Run the math-only demo without writing emit files into the project:

```bash
point run examples/pure/math-only.point
point run --bundle examples/pure/math-only.point
```

`--bundle` forces in-memory execution (no OS temp `.js`). For eligible modules, `point run` uses that path automatically.
