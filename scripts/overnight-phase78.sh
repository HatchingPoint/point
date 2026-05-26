#!/usr/bin/env bash
# Phase 78 overnight ticker — ops scaffold + notes form app-repair → v0.1.56.
set -euo pipefail
PROMPT='Read docs/phase78-plan.md and docs/codex-goal-phase78.md. Execute the next unchecked P78-N goal. Respect file ownership table. Run bun run ci before commit. Bump agent-app and model-eval gates when adding cases. Append docs/codex-progress.md. If all P78 boxes checked and ci green, run P78-4 ship (bump, tag v0.1.56, push, LandingPage sync:agent-app-cases).'
SLEEP_SECONDS="${OVERNIGHT_SLEEP_SECONDS:-2700}"
echo "AGENT_LOOP_TICK_phase78 {\"prompt\":\"$PROMPT\"}"
while true; do
  sleep "$SLEEP_SECONDS"
  echo "AGENT_LOOP_TICK_phase78 {\"prompt\":\"$PROMPT — continue next unchecked P78 goal.\"}"
done
