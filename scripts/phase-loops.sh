#!/usr/bin/env bash
# Manage detached overnight loops for Phase 28, 29, integrator, and expansion.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$REPO_ROOT/logs/loops"
PID_DIR="$LOG_DIR"

LOOPS=(
  "phase28|scripts/overnight-phase28.sh"
  "phase29|scripts/overnight-phase29.sh"
  "p28_p29_integrator|scripts/overnight-p28-p29-integrator.sh"
  "phase_expansion|scripts/overnight-phase-expansion.sh"
)

mkdir -p "$LOG_DIR"

kill_zombies() {
  # Agent-owned shells from prior /loop sessions (not managed by pid files).
  pkill -f 'AGENT_LOOP_TICK_phase28' 2>/dev/null || true
  pkill -f 'AGENT_LOOP_TICK_phase29' 2>/dev/null || true
  pkill -f 'AGENT_LOOP_TICK_p28_p29_integrator' 2>/dev/null || true
  pkill -f 'AGENT_LOOP_TICK_phase_expansion' 2>/dev/null || true
  pkill -f 'AGENT_LOOP_TICK_phase27' 2>/dev/null || true
  pkill -f 'AGENT_LOOP_TICK_phase26' 2>/dev/null || true
  pkill -f 'AGENT_LOOP_TICK_P28' 2>/dev/null || true
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
    for entry in "${LOOPS[@]}"; do
      name="${entry%%|*}"
      script="${entry#*|}"
      start_one "$name" "$script"
    done
    echo ""
    echo "Chat mapping (one dedicated Agent chat each, auto-run ON):"
    echo "  phase28            → /loop 45m  (or tail -f logs/loops/phase28.log)"
    echo "  phase29            → docs/codex-goal-phase29.md"
    echo "  p28_p29_integrator → exit gate + release ritual"
    echo "  phase_expansion    → docs/codex-goal-phase-expansion.md"
    ;;
  stop)
    for entry in "${LOOPS[@]}"; do
      stop_one "${entry%%|*}"
    done
    kill_zombies
    ;;
  restart)
    "$0" stop
    sleep 1
    "$0" start
    ;;
  status)
    echo "Phase loops:"
    status_one phase28 45m
    status_one phase29 45m
    status_one p28_p29_integrator 2h
    status_one phase_expansion 2h
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}" >&2
    exit 1
    ;;
esac
