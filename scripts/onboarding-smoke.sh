#!/usr/bin/env bash
# Onboarding smoke — simulates a stranger's first hour with Point (no monorepo checkout).
# Usage: bash scripts/onboarding-smoke.sh [--template saas-app|full-stack-app]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI="${POINT_CLI:-bun $ROOT/packages/point/src/cli.ts}"
TEMPLATE="saas-app"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --template)
      TEMPLATE="${2:-saas-app}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

SMOKE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/point-onboarding-XXXXXX")"
cleanup() { rm -rf "$SMOKE_DIR"; }
trap cleanup EXIT

APP_NAME="onboarding-smoke"
echo "[onboarding-smoke] scaffold $TEMPLATE in $SMOKE_DIR"
$CLI create "$APP_NAME" --template "$TEMPLATE" "$SMOKE_DIR/$APP_NAME"

APP_DIR="$SMOKE_DIR/$APP_NAME"
cd "$APP_DIR"

echo "[onboarding-smoke] point check"
$CLI check src/app.point

echo "[onboarding-smoke] point demo"
$CLI demo src/app.point | grep -q "Next steps"

echo "[onboarding-smoke] point launch admin demo"
RESULT="$($CLI launch src/app.point admin demo)"
echo "$RESULT" | grep -q "ready"

if [[ "$TEMPLATE" == "saas-app" ]]; then
  echo "[onboarding-smoke] init database"
  mkdir -p data
  DATABASE_URL=sqlite:./data/members.db JWT_SECRET=onboarding-smoke-secret $CLI launch src/app.point init database
  export DATABASE_URL=sqlite:./data/members.db
  export JWT_SECRET=onboarding-smoke-secret
fi

echo "[onboarding-smoke] point build-app"
$CLI build-app src/app.point

PORT=$((38000 + RANDOM % 1000))
export PORT
echo "[onboarding-smoke] serve on port $PORT"
$CLI serve src/app.point --port "$PORT" &
SERVE_PID=$!
sleep 2

HEALTH="$(curl -sf "http://127.0.0.1:$PORT/api/health" || true)"
if [[ "$HEALTH" != "ok" ]]; then
  kill "$SERVE_PID" 2>/dev/null || true
  echo "[onboarding-smoke] FAIL: /api/health expected ok, got: $HEALTH"
  exit 1
fi

MEMBERS="$(curl -sf "http://127.0.0.1:$PORT/api/members" || true)"
	if [[ "$MEMBERS" != *"members"* ]] || [[ "$MEMBERS" != *"Alex Chen"* ]]; then
  kill "$SERVE_PID" 2>/dev/null || true
  echo "[onboarding-smoke] FAIL: /api/members missing seeded SQL members (expected Alex Chen)"
  exit 1
fi

kill "$SERVE_PID" 2>/dev/null || true
wait "$SERVE_PID" 2>/dev/null || true

echo "[onboarding-smoke] PASS template=$TEMPLATE"
