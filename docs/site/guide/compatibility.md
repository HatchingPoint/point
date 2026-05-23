---
title: Compatibility
description: Current stability guarantees, versioning expectations, supported runtimes, and migration guidance.
quadrant: Explanation
---

## Summary

Point is a young language with a real compiler, CLI, LSP, formatter, docs, examples, standard library, and generated targets. The current public source language is semantic `.point`; generated JavaScript, TypeScript, Python, and internal core IR are implementation outputs.

Use this page to understand what is stable enough to build on and what should be treated as evolving.

## Version line

The current package version in this repository is:

```text
@hatchingpoint/point@0.1.19
```

Check the registry:

```bash
npm view @hatchingpoint/point version
```

Release history is summarized in [Changelog](/point/changelog).

## Compatibility tiers

| Surface | Status | Guidance |
|---------|--------|----------|
| Semantic `.point` blocks | Public, evolving | Use docs and examples as the authoring contract |
| CLI commands | Public, evolving | Safe for local dev and CI; pin package versions for production |
| `point://semantic/...` refs | Public for agents | Prefer semantic refs over generated names |
| Formatter output | Public convention | Run `point fmt` or `fmt-check` in projects |
| JavaScript emit | Primary target | Default build/run target |
| TypeScript emit | Supported target | Use when host apps need typed imports |
| Python emit | Partial target | Best for compatible logic/actions/routes/workflows; check docs and generated output |
| Stdlib modules | Public, narrow | Use `std.*` for common host bridges |
| Internal core IR | Private | Do not author or depend on `fn`/`let`/`type` core syntax |
| Generated JS/TS/Python names | Private-ish | Do not use as stable docs or agent repair refs |

## Runtime support

Point runs on Bun today.

| Use case | Runtime |
|----------|---------|
| CLI and compiler | Bun |
| `point run` | Bun/Node-compatible emitted JavaScript, executed by Bun |
| Full-stack dev | Bun API server plus Vite host |
| Static app build | Vite output from generated app code |
| LSP | stdio process launched through `point lsp` |

Install Bun before using the CLI if your environment does not already include it.

## Source compatibility

Prefer source that follows documented semantic blocks:

```point
record User
  name: Text

calculation greeting
  input user: User
  output message: Text
  message is "Hello, " + user.name
```

Avoid depending on:

- Generated function names.
- Generated file layout beyond documented `point build*` outputs.
- Internal semantic AST JSON shape unless you are working on compiler tooling.
- Core IR source syntax.
- Undocumented parser conveniences.

## Package pinning

For applications and libraries, pin `@hatchingpoint/point` in `package.json` rather than relying on a global CLI:

```json
{
  "devDependencies": {
    "@hatchingpoint/point": "^0.1.19"
  }
}
```

For CI, install dependencies first and run the local scripts:

```bash
bun install
bun run check
```

For strict reproducibility, use the lockfile produced by your package manager.

## Migration practice

When upgrading Point:

1. Read [Changelog](/point/changelog).
2. Run `point fmt-check` or `point fmt-check-all`.
3. Run `point check` or project-wide checks.
4. Run `point check-json` if an agent will repair issues.
5. Rebuild generated outputs.
6. Run app or integration tests.

Use diagnostics and stable refs for repairs:

```bash
point check-json src/app.point
point explain src/app.point point://semantic/App/rule.cart total
point repair-plan src/app.point
```

## Breaking changes

Before `1.0`, language and CLI surfaces can still evolve. The project tries to make changes through:

- Formatter and parser compatibility where practical.
- Structured diagnostics with repair hints.
- Examples and conformance fixtures.
- Changelog entries for public-facing changes.

Treat public docs as the source of truth for current behavior. Treat phase plans and internal design docs as development history, not compatibility promises.

## Editor compatibility

VS Code/Cursor use the Point extension and local CLI detection. Other editors can launch the same stdio language server:

```bash
point lsp
```

When possible, use project-local `.point/lsp.mjs` created by `point init` or `point create` so team members share the same compiler version.

## See also

- [Installation](/point/guide/installation)
- [Project structure](/point/guide/project-structure)
- [Changelog](/point/changelog)
- [CLI reference](/point/reference/cli)
