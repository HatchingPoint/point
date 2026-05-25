#!/usr/bin/env bash
# Phase 29 overnight ticker — Python std mirror (parallel with Phase 27 & 28).
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROMPT='Read docs/phase29-plan.md and docs/codex-goal-phase29.md. Execute next unchecked P29-N. Respect Phase 27/28 file ownership — only emit-python.ts, python_std/, python tests. bun run ci before commit. Append docs/codex-progress.md.'
SLEEP_SECONDS="${OVERNIGHT_SLEEP_SECONDS:-2700}"
echo "AGENT_LOOP_TICK_phase29 {\"prompt\":\"$PROMPT\"}"
while true; do
  sleep "$SLEEP_SECONDS"
  echo "AGENT_LOOP_TICK_phase29 {\"prompt\":\"$PROMPT — continue next unchecked P29 goal.\"}"
done
