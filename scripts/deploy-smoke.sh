#!/usr/bin/env bash
# Deploy smoke — build + serve saas-app, login, create member, verify list.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI="${POINT_CLI:-bun $ROOT/packages/point/src/cli.ts}"
SOURCE="${POINT_SOURCE:-packages/point/templates/saas-app/src/app.point}"

mkdir -p "$ROOT/tests/tmp"
SMOKE_DIR="$(mktemp -d "$ROOT/tests/tmp/point-deploy-smoke-XXXXXX")"
cleanup() { rm -rf "$SMOKE_DIR"; }
trap cleanup EXIT

cd "$ROOT"
echo "[deploy-smoke] build saas app"
BUILD_OUT="$SMOKE_DIR/saas-app.js"
$CLI build "$SOURCE" "$BUILD_OUT" >/dev/null

echo "[deploy-smoke] init database"
DB_PATH="$SMOKE_DIR/members.db"
export DATABASE_URL="sqlite:$DB_PATH"
export JWT_SECRET="deploy-smoke-secret"
bun -e "
const mod = await import('file://${BUILD_OUT}');
await mod.initDatabaseCommand();
"

echo "[deploy-smoke] start server"
PORT=$((39000 + RANDOM % 1000))
export PORT
bun -e "
const mod = await import('file://${BUILD_OUT}');
const server = mod.startRoutesServer();
await Bun.write('${SMOKE_DIR}/port.txt', String(server.port));
" &
SERVER_PID=$!
sleep 2
PORT="$(cat "$SMOKE_DIR/port.txt")"
BASE="http://127.0.0.1:$PORT"

HEALTH="$(curl -sf "$BASE/api/health" || true)"
if [[ "$HEALTH" != "ok" ]]; then
  kill "$SERVER_PID" 2>/dev/null || true
  echo "[deploy-smoke] FAIL: /api/health expected ok, got: $HEALTH"
  exit 1
fi

LOGIN="$(curl -sf -X POST "$BASE/api/login" -H 'content-type: application/json' -d '{"email":"pilot@example.com","password":"demo"}' || true)"
TOKEN="$(bun -e "const body=JSON.parse(process.argv[1]); if(!body.token) process.exit(1); console.log(body.token);" "$LOGIN" 2>/dev/null || true)"
if [[ -z "$TOKEN" ]]; then
  kill "$SERVER_PID" 2>/dev/null || true
  echo "[deploy-smoke] FAIL: /api/login missing token"
  exit 1
fi

CREATE="$(curl -sf -X POST "$BASE/api/members" \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"name":"Deploy Smoke","role":"Member"}' || true)"
if [[ "$CREATE" != *"Deploy Smoke"* ]]; then
  kill "$SERVER_PID" 2>/dev/null || true
  echo "[deploy-smoke] FAIL: POST /api/members did not persist member"
  exit 1
fi

MEMBERS="$(curl -sf "$BASE/api/members" || true)"
if [[ "$MEMBERS" != *"Deploy Smoke"* ]] || [[ "$MEMBERS" != *"Alex Chen"* ]]; then
  kill "$SERVER_PID" 2>/dev/null || true
  echo "[deploy-smoke] FAIL: GET /api/members missing seeded + created members"
  exit 1
fi

kill "$SERVER_PID" 2>/dev/null || true
wait "$SERVER_PID" 2>/dev/null || true
echo "[deploy-smoke] PASS"
