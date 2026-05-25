# Phase 59 — Apple toolkit pattern

**Status:** Done  
**Prerequisite:** v0.1.42  
**North star:** macOS build tooling via documented process wrappers, not language keywords.

## Success criteria

- [ ] **P59-1** examples/toolkit/apple-cli.point — xcodebuild, simctl, generic process actions
- [ ] **P59-2** workflow example: build + stream logs (uses process/pty)
- [ ] **P59-3** README with macOS host requirement; docs ecosystem page note
- [ ] **P59-4** tests/check smoke for example

## File ownership

examples/toolkit/ only — no std.apple keyword unless capability wrapper is trivial

## Non-goals

- ASC-specific syntax, Surgent repo edits
