#!/usr/bin/env bash
# Cursor/Codex overnight helper — prints the loop prompt every 45 minutes.
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROMPT_FILE="$REPO_ROOT/docs/codex-goal-phase26-overnight.prompt.txt"
SLEEP_SECONDS="${OVERNIGHT_SLEEP_SECONDS:-2700}"
echo "AGENT_LOOP_TICK_phase26 {\"prompt\":\"Read and execute $PROMPT_FILE — Phase 26 Wave 2 then Phase 27. Run release ritual when waves complete.\"}"
while true; do
  sleep "$SLEEP_SECONDS"
  echo "AGENT_LOOP_TICK_phase26 {\"prompt\":\"Read and execute $PROMPT_FILE — continue next unchecked goal.\"}"
done
