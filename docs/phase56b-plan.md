# Phase 56b — Agent repair for UI + platform syntax

**Status:** Done  
**Prerequisite:** v0.1.42  
**North star:** CI repair gate covers Phases 48–54 syntax.

## Success criteria

- [ ] **P56b-1** Fixtures: refresh-without-load, terminal-stream-conflict, invalid-submit-url (or similar)
- [ ] **P56b-2** Fixtures: table unknown column, button navigate typo, bind field typo
- [ ] **P56b-3** Regenerate or extend benchmarks/agent-repair-cases.json
- [ ] **P56b-4** agent-repair-gate still passes; bump gate count in docs if needed

## File ownership

tests/fixtures/agent-repair/, benchmarks/, tests/agent-repair*.test.ts only

## Non-goals

- Surgent repo edits
