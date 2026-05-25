#!/usr/bin/env bash
# Phase expansion meta ticker — roadmap analyze + draft phases (planning only).
set -euo pipefail
PROMPT='Read docs/codex-goal-phase-expansion.md. Run bun packages/point/src/cli.ts roadmap-analyze. Execute exactly one expansion slice (A–D). Planning and docs only — no compiler changes. Append docs/codex-progress.md. Commit when a draft phaseNN plan + codex-goal are ready.'
SLEEP_SECONDS="${OVERNIGHT_SLEEP_SECONDS:-7200}"
echo "AGENT_LOOP_TICK_phase_expansion {\"prompt\":\"$PROMPT\"}"
while true; do
  sleep "$SLEEP_SECONDS"
  echo "AGENT_LOOP_TICK_phase_expansion {\"prompt\":\"$PROMPT\"}"
done
