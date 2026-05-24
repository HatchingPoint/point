# Phase 54 — Terminal view + script runner

**Status:** Implemented (checkpoint in `docs/codex-progress.md`)  
**Prerequisite:** Phase 53 recommended (can stub with line stream)  
**North star:** Operator terminal in the box — `terminal` view block subscribing to a stream route.

## Success criteria

- [x] **P54-1** View syntax: `terminal subscribe to stream <name>` (or path)
- [x] **P54-2** Emit: xterm.js (or minimal ANSI pre) + WebSocket hook; CSS in point-ui.css
- [x] **P54-3** Stream message types for stdout/stderr/exit (extend or reuse Log Line pattern)
- [x] **P54-4** Example: `examples/app/script-runner/` — run shell script, stream to terminal view
- [x] **P54-5** Tests: parse, emit snapshot, build smoke

## Non-goals

- Full PTY resize protocol (follow-up)
- 3D command center

## File ownership

| Owns | Does not touch |
|------|----------------|
| terminal parse/desugar/emit | `emit-data-load.ts` |
| `examples/app/script-runner/**` | `std/pty.ts` (consume only) |
| `tests/terminal-view.test.ts` | |

## After Phase 54

Integrator: CI green, roadmap update, optional v0.1.42 ship.
