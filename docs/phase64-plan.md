# Phase 64 — Datagrid text filter

**Status:** Complete  
**Prerequisite:** v0.1.44  
**North star:** Operator tables are searchable without new bind syntax.

## Success criteria

- [x] **P64-1** `datagrid … filter by column` emits local search input + client filter
- [x] **P64-2** Optional `filter by column contains expr` for controlled filter input
- [x] **P64-3** Checker `invalid-datagrid-filter-column`; CSS; format round-trip
- [x] **P64-4** saas-app + operator-dashboard examples; tests

## Non-goals

- Server-side search / pagination
