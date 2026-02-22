#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT_DIR/release"
OUT_FILE="$OUT_DIR/discord-ticket-suite.zip"

mkdir -p "$OUT_DIR"
rm -f "$OUT_FILE"

cd "$ROOT_DIR"
zip -r "$OUT_FILE" \
  . \
  -x "*.git*" "node_modules/*" "release/*" >/dev/null

echo "✅ Created package: $OUT_FILE"
