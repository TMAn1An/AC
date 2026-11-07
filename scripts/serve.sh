#!/usr/bin/env bash
# Serve the prototype on http://localhost:${PORT:-8080}
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-8080}"
echo "Shital prototype: http://localhost:${PORT}"
exec python3 -m http.server "$PORT" --directory prototype
