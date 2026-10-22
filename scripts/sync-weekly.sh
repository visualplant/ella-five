#!/usr/bin/env bash
# Copy Ella's weekly snapshots into the repo so they ship with the next build. Run before committing a deploy.
set -euo pipefail
SRC="${1:-/workspace/ella/weekly}"; DEST="$(cd "$(dirname "$0")/.." && pwd)/data/weekly"
mkdir -p "$DEST"; shopt -s nullglob
for f in "$SRC"/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9].json; do node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))' "$f" && cp "$f" "$DEST/"; done
ls "$DEST"
