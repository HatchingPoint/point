#!/usr/bin/env bash
# P28/P29 integrator ticker — release when exit gates pass.
set -euo pipefail
PROMPT='Check docs/phase28-plan.md and docs/phase29-plan.md exit gates. If both complete: bun run ci, bump version, CHANGELOG, tag v0.1.21, push. If only one track is done, commit that track only. Append docs/codex-progress.md.'
SLEEP_SECONDS="${OVERNIGHT_SLEEP_SECONDS:-7200}"
echo "AGENT_LOOP_TICK_p28_p29_integrator {\"prompt\":\"$PROMPT\"}"
while true; do
  sleep "$SLEEP_SECONDS"
  echo "AGENT_LOOP_TICK_p28_p29_integrator {\"prompt\":\"$PROMPT\"}"
done
