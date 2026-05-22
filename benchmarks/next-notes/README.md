# Next.js notes benchmark scaffold

Paired TypeScript counterpart to `tests/fixtures/agent-app/notes-add-detail/`.

| Variant | Description |
|---------|-------------|
| `base/` | Notes list + create — no detail route |
| `golden/` | Detail route with `getNote` loader |
| `broken-detail-add/` | Detail page exists; `lib/getNote.ts` missing |
