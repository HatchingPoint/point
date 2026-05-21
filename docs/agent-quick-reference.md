# Point Agent Quick Reference

For coding agents working on `.point` files and compiler output.

## Golden rules

1. Write **semantic blocks only** — never `fn`, `let`, `type`, braces in public source
2. Run `bun run check` after edits
3. Use `point check-json` for structured diagnostics with `ref`, `repair`, `expected`, `actual`
4. Prefer `point://semantic/...` refs when explaining or repairing user source

## Block chooser

| Intent | Block |
|--------|-------|
| Data shape | `record` |
| Pure transform | `calculation` |
| Score / accumulate / decide | `rule` |
| Classify to text | `label` |
| npm/Node call | `external` |
| I/O or side effect | `action` |
| Auth / validation guard | `policy` |
| Multi-step flow | `workflow` |
| React UI | `view` |
| HTTP handler | `route` |
| CLI entry | `command` |

## Common patterns

**Loop over list**

```point
for each item in items
  add item.price to total
```

**Error result**

```point
output user: User or Error
return Error "not found"
```

**Optional**

```point
email: Maybe<Text>
return none
```

**Import std**

```point
use std.http
```

**Import local module**

```point
use Billing from "./billing.point"
```

## Commands (repo root)

```bash
bun run check
bun run check-json examples/math.point
bun run index examples/math.point
bun run explain examples/math.point point://semantic/Math/calculation.annual price
bun run repair-plan examples/math.point
bun run build
bun packages/point/src/cli.ts build-js examples/math.point generated/math.js
bun packages/point/src/cli.ts run examples/hello.point
bun packages/point/src/cli.ts test examples/point-tests.point
point lsp   # Language Server for Neovim, Zed, etc. (stdio)
POINT_INCREMENTAL=1 bun run check
```

## Diagnostic repair loop

1. `point check-json <file>`
2. Read `ref`, `repair`, `relatedRefs`
3. Patch semantic source at the named block/field
4. Re-run check-json until `ok: true`

## Files agents should read first

- `docs/editor-setup.md` — Neovim, Zed, terminal-only workflows
- `docs/language-spec.md` — grammar and CLI
- `docs/semantic-language-design.md` — design intent
- `docs/ai-reference-system.md` — refs and repair metadata
- `examples/` — working fixtures by feature
- `std/README.md` — standard library modules

## Do not

- Expose internal core syntax in `.point` files
- Invent keywords that are not in the grammar/parser
- Treat pricing/readiness examples as built-in language features
- Publish packages without credentials (`NPM_TOKEN`, `VSCE_PAT`)

## Next compiler milestone

Phase 7 ([phase7-ast-plan.md](./phase7-ast-plan.md)): semantic AST, in-memory desugar, retire string core lowering.
