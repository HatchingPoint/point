---
title: Philosophy
description: Why Point uses semantic product logic instead of cloning Python or TypeScript syntax.
quadrant: Explanation
---

## Summary

Point is general-purpose in capability, but semantic in surface syntax. The language is shaped around the concepts people and agents need to inspect: data, derivations, rules, labels, effects, policies, workflows, routes, views, and commands.

## Semantic product logic

Most general-purpose languages ask authors to model product ideas through implementation forms first: classes, functions, variables, mutable state, and framework code. Point starts one level higher.

A `record` says "this is the data shape." A `calculation` says "this value is derived." A `rule` says "this score or decision accumulates from conditions." A `label` says "this value classifies into user-facing text." These are still programming constructs, but they preserve intent.

```point
label score status
  input score: Int
  output Text
  when score >= 90 return "excellent"
  otherwise return "keep going"
```

## Not a Python or TypeScript clone

Point has general-purpose language features: records, lists, optional values, result values, modules, actions, tests, views, routes, commands, a standard library, formatting, LSP, and TypeScript emit.

Its source is intentionally not a clone of `def`, `class`, `let`, braces, or framework boilerplate. Those constructs are useful implementation details, but they are not the only way to express software.

## Lowering without exposing core syntax

The compiler lowers semantic source into an internal typed core IR. That core has familiar compiler-level concepts such as functions, types, loops, assignment, and calls, but production `.point` authors do not write core syntax.

This split keeps the source approachable while giving the checker and emitters a precise representation. The emitted TypeScript is boring on purpose: readable, typed target code for existing JavaScript stacks.

## Honest limits

Point is not a standalone VM today. The main production target is TypeScript or JavaScript, and source mapping is currently stronger at declaration boundaries than at every expression inside generated code.

That tradeoff is deliberate for now. Point can be useful immediately inside existing stacks while the language and tooling mature.

## See also

- [Why Point exists](/point/concepts/why-point-exists)
- [Proof of concept](/point/concepts/proof-of-concept)
- [How Point is novel](/point/concepts/how-point-is-novel)
- [Point vs other languages for AI engineering](/point/ai/vs-other-languages)
- [Semantic vs core](/point/concepts/semantic-vs-core)
- [Pipeline](/point/concepts/pipeline)
- [Stable refs](/point/ai/stable-refs)
