#!/usr/bin/env bash
# Pilot quickstart — one script for external evaluators (saas-app path).
# Usage: bash scripts/pilot-quickstart.sh [app-name] [target-dir]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI="${POINT_CLI:-bun $ROOT/packages/point/src/cli.ts}"
APP_NAME="${1:-my-saas-app}"
TARGET_DIR="${2:-.}"
APP_DIR="$(cd "$TARGET_DIR" && pwd)/$APP_NAME"

if [[ -e "$APP_DIR" ]]; then
  echo "Target already exists: $APP_DIR" >&2
  exit 1
fi

echo "[pilot] create saas-app as $APP_NAME in $TARGET_DIR"
$CLI create "$APP_NAME" --template saas-app "$APP_DIR"
cd "$APP_DIR"

echo "[pilot] check"
$CLI check src/app.point

echo "[pilot] demo"
$CLI demo src/app.point

echo "[pilot] init database"
mkdir -p data
export DATABASE_URL="${DATABASE_URL:-sqlite:./data/members.db}"
$CLI launch src/app.point init database

echo ""
echo "Pilot quickstart complete in $APP_DIR"
echo ""
echo "Next steps:"
echo "  cd $APP_DIR"
echo "  bun install && bun run dev     # Vite admin UI + API (http://localhost:5173)"
echo "  $CLI serve src/app.point --port 3456   # production-style single port"
echo ""
echo "Deploy:"
echo "  Set JWT_SECRET and DATABASE_URL on your host"
echo "  Use bundled render.yaml — build: bun install && bun run build, start: bun run serve"
echo "  See docs/external-pilot-checklist.md for the full pilot week"
