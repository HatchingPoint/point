#!/usr/bin/env bash
# Phase 28 overnight ticker — agent loop hardening (parallel with Phase 27).
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROMPT='Read docs/phase28-plan.md and docs/codex-goal-phase28.md. Execute next unchecked P28-N. Respect Phase 27 file ownership — do NOT edit parse.ts theme, check-themes, ui-style theme toggle, or SQL codegen. bun run ci before commit. Append docs/codex-progress.md.'
SLEEP_SECONDS="${OVERNIGHT_SLEEP_SECONDS:-2700}"
echo "AGENT_LOOP_TICK_phase28 {\"prompt\":\"$PROMPT\"}"
while true; do
  sleep "$SLEEP_SECONDS"
  echo "AGENT_LOOP_TICK_phase28 {\"prompt\":\"$PROMPT — continue next unchecked P28 goal.\"}"
done
