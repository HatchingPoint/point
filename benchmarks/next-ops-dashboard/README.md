# Next.js ops dashboard benchmark scaffold

Paired TypeScript counterpart to `tests/fixtures/agent-app/` ops cases (job-queue pattern).

| Variant | Maps to Point case | Description |
|---------|-------------------|-------------|
| `base/` | feature-add base | Simple job list — no chart, datagrid, or enqueue |
| `golden/` | golden.point | Full ops dashboard with chart, datagrid, enqueue form |
| `broken-feature-add/` | ops-add-dashboard/broken.point | Dashboard scaffold present; calls `fetchOpsPanel` — `lib/fetchOpsDashboard.ts` missing |
| `broken-chart-wiring/` | ops-dashboard-chart-wiring/broken.point | Chart uses `dataKey="title"` instead of `"label"` |
| `broken-sort-wiring/` | ops-dashboard-sort-wiring/broken.point | Datagrid `sortBy="title"` instead of `"score"` |
| `broken-filter-wiring/` | ops-dashboard-filter-wiring/broken.point | Datagrid `filterColumn="title"` instead of `"name"` |
| `broken-page-size-wiring/` | ops-dashboard-page-size-wiring/broken.point | Datagrid `pageSize={0}` instead of positive integer |
| `broken-refresh-wiring/` | ops-dashboard-refresh-wiring/broken.point | Live refresh interval without data loader |

Agent context size is measured by concatenating the files listed in `manifest.json` for each case (not a char-count heuristic).
