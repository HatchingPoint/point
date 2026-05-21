---
title: Semantic vs core
description: Point source is semantic; core is an internal typed compiler representation.
quadrant: Explanation
---

## Summary

Point has one public authoring language: semantic `.point` source. Core exists inside the compiler so the checker and emitters have a precise representation.

## Semantic source

Semantic source is what people and agents write:

```point
module Pricing

calculation annual price
  input monthly price: Int
  output annual price: Int
  annual price is monthly price * 12
```

The words in source preserve intent. A calculation is not just any function; it is a pure derived value with named inputs and output.

## Core IR

After parsing, Point lowers semantic source into typed core data structures in memory. Core has implementation-level concepts such as functions, values, calls, loops, assignments, and return values.

Authors do not write core syntax in `.point` files. If you see names like `fn`, `let`, or generated camelCase identifiers, you are looking at compiler internals or emitted target code, not public Point source.

## Why keep the split

Semantic source keeps author intent visible. Core IR gives the compiler a compact, typed representation. Generated JavaScript, TypeScript, or Python is a build artifact.

That split lets Point stay friendly to agents without making the emitter guess from loose text.

## See also

- [Pipeline](/point/concepts/pipeline)
- [Philosophy](/point/concepts/philosophy)
- [Authoring vs runtime](/point/concepts/authoring-vs-runtime)
