#!/usr/bin/env bash
# Manage detached overnight loops for Phase 78 + expansion.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$REPO_ROOT/logs/loops"
PID_DIR="$LOG_DIR"

LOOPS=(
  "phase78|scripts/overnight-phase78.sh|45m"
  "phase78_repair|scripts/overnight-phase78-repair.sh|60m"
  "phase_expansion|scripts/overnight-phase-expansion.sh|2h"
)

mkdir -p "$LOG_DIR"

kill_zombies() {
  pkill -f 'AGENT_LOOP_TICK_phase78' 2>/dev/null || true
  pkill -f 'AGENT_LOOP_TICK_phase78_repair' 2>/dev/null || true
  pkill -f 'AGENT_LOOP_TICK_phase_expansion' 2>/dev/null || true
}

loop_pid() {
  local name="$1"
  local pidfile="$PID_DIR/$name.pid"
  if [[ -f "$pidfile" ]]; then
    cat "$pidfile"
  fi
}

is_running() {
  local pid
  pid="$(loop_pid "$1" || true)"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

start_one() {
  local name="$1"
  local script="$2"
  local pidfile="$PID_DIR/$name.pid"
  local logfile="$LOG_DIR/$name.log"

  if is_running "$name"; then
    echo "already running: $name (pid $(loop_pid "$name"))"
    return 0
  fi

  rm -f "$pidfile"
  nohup bash "$REPO_ROOT/$script" >>"$logfile" 2>&1 &
  local pid=$!
  echo "$pid" >"$pidfile"
  disown "$pid" 2>/dev/null || true
  echo "started: $name pid $pid log $logfile"
}

stop_one() {
  local name="$1"
  local pidfile="$PID_DIR/$name.pid"
  if ! is_running "$name"; then
    rm -f "$pidfile"
    echo "not running: $name"
    return 0
  fi
  kill "$(cat "$pidfile")" 2>/dev/null || true
  rm -f "$pidfile"
  echo "stopped: $name"
}

status_one() {
  local name="$1"
  local interval="$2"
  if is_running "$name"; then
    echo "  $name: RUNNING pid $(loop_pid "$name") interval $interval log logs/loops/$name.log"
  else
    echo "  $name: stopped"
  fi
}

cmd="${1:-status}"
case "$cmd" in
  start)
    kill_zombies
    chmod +x "$REPO_ROOT/scripts/overnight-phase78.sh" \
      "$REPO_ROOT/scripts/overnight-phase78-repair.sh" \
      "$REPO_ROOT/scripts/overnight-phase-expansion.sh"
    for entry in "${LOOPS[@]}"; do
      IFS='|' read -r name script _ <<<"$entry"
      start_one "$name" "$script"
    done
    echo ""
    echo "Open dedicated Cursor Agent chats (auto-run ON), one per loop:"
    echo "  Chat 1 → /loop 45m  Read docs/codex-goal-phase78.md — execute next P78 goal"
    echo "  Chat 2 → /loop 60m  Repair gate expansion — overnight-phase78-repair prompt"
    echo "  Chat 3 → /loop 2h   docs/codex-goal-phase-expansion.md — draft phase 79+"
    echo ""
    echo "Or tail logs: tail -f logs/loops/phase78.log"
    ;;
  stop)
    for entry in "${LOOPS[@]}"; do
      IFS='|' read -r name _ _ <<<"$entry"
      stop_one "$name"
    done
    kill_zombies
    ;;
  restart)
    "$0" stop
    sleep 1
    "$0" start
    ;;
  status)
    echo "Phase 78 loops:"
    for entry in "${LOOPS[@]}"; do
      IFS='|' read -r name _ interval <<<"$entry"
      status_one "$name" "$interval"
    done
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}" >&2
    exit 1
    ;;
esac
