# Phase 39 — In-the-box launch syntax

## Goal

Stupid-simple discover + launch for built-in capabilities and command entrypoints.

## Deliverables

- [x] `capabilities http json` — one-line import sugar (parse, format, scan)
- [x] `point commands <file>` — catalog with copy-paste run lines
- [x] `point run <file> <command name>` — named command launch
- [x] `point launch <file> <command name>` — alias (requires name)
- [x] `point box <file>` — capabilities + commands in one screen
- [x] `docs/site/language/in-the-box.md`
- [x] Tests: `tests/launch-syntax.test.ts`, capabilities format/parse tests
- [x] CLI reference + README + product-map sync

## Verify

```bash
bun run ci
point commands examples/command.point
point launch examples/command.point hello cli
point box examples/capabilities-demo.point
```

## Ship

Version **0.1.31**, tag, push, npm publish via CI.
