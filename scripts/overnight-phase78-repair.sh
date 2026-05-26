#!/usr/bin/env bash
# Phase 78 repair ticker — single-shot repair fixtures + gate floor (parallel with phase78).
set -euo pipefail
PROMPT='Read docs/phase-roadmap.md and docs/agent-plateau.md. If repair gate is below 36: add one high-value single-shot agent-repair fixture (platform UI or agent loop). Register in agent-repair-sufficiency.ts, bump minSingleShotCases in agent-repair-gate.ts, export agent-repair-cases, LSP parity if new code. bun run ci. Append codex-progress. Commit if green. Skip if gate already 36+ and backlog empty.'
SLEEP_SECONDS="${OVERNIGHT_SLEEP_SECONDS:-3600}"
echo "AGENT_LOOP_TICK_phase78_repair {\"prompt\":\"$PROMPT\"}"
while true; do
  sleep "$SLEEP_SECONDS"
  echo "AGENT_LOOP_TICK_phase78_repair {\"prompt\":\"$PROMPT — next repair fixture or skip.\"}"
done
