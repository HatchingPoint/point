# Next.js dashboard benchmark scaffold

Paired TypeScript counterpart to `tests/fixtures/agent-app/` dashboard cases.

| Variant | Maps to Point case | Description |
|---------|-------------------|-------------|
| `base/` | feature-add base | Settings, items list, item detail — no search |
| `golden/` | golden.point | Full app with `/admin/search` route wired |
| `broken-feature-add/` | dashboard-add-search/broken.point | Nav + search page exist; `lib/searchItems.ts` missing |
| `broken-wiring/` | dashboard-search-wiring/broken.point | Search panel imports `searchItem` instead of `searchItems` |

Agent context size is measured by concatenating the files listed in `manifest.json` for each case (not a char-count heuristic).
