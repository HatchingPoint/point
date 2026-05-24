# Phase 53 — std.pty capability

**Status:** Complete  
**Prerequisite:** Phase 49 (v0.1.41)  
**North star:** PTY spawn/read/write in the box via `capabilities pty` + runtime shim.

## Success criteria

- [x] **P53-1** `packages/point/std/pty.point` — spawn PTY, write stdin, stream output lines/bytes
- [x] **P53-2** `packages/point/src/std/pty.ts` — Bun runtime (POSIX `terminal` PTY option with pipe fallback)
- [x] **P53-3** Register `pty` in `capabilities.ts`; export from package; sync std modules
- [x] **P53-4** Tests: unit tests for pty shim (mock or short-lived shell)
- [x] **P53-5** Docs: capabilities catalog + stdlib overview (process vs pty note)

## Non-goals

- Terminal UI (Phase 54)
- macOS-only xcodebuild wrappers

## File ownership

| Owns | Does not touch |
|------|----------------|
| `std/pty.point`, `src/std/pty.ts` | `parse.ts`, view emit |
| `capabilities.ts`, package exports | job-queue example |

## After Phase 53

Phase 54 — terminal view primitive.
