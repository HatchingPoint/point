# Phase 58 — std.image capability

**Status:** Complete — v0.1.43  
**Prerequisite:** v0.1.42  
**North star:** Image resize/format in the box via sharp wrapper.

## Success criteria

- [ ] **P58-1** std/image.point + src/std/image.ts (resize, metadata, format convert)
- [ ] **P58-2** Register capabilities image; package export; sync std
- [ ] **P58-3** examples/tools/image-thumbnail.point; tests/std-image.test.ts
- [ ] **P58-4** docs stdlib overview

## File ownership

std/image*, capabilities.ts — isolated from parse.ts

## Non-goals

- FAL/ASC-specific blocks
