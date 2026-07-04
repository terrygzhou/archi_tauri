#!/bin/bash
# Run cargo tauri dev with logging — captures all output to a file
set -e
cd "$(dirname "$0")"

LOGDIR=".logs"
mkdir -p "$LOGDIR"
LOG="$LOGDIR/$(date +%Y%m%d-%H%M%S).log"

echo "=== Archi Tauri Dev ==="
echo "Log: $LOG"
echo "Watch: tail -f $LOG"
echo ""

# Stream to both terminal and file
exec > >(tee "$LOG") 2>&1

cargo tauri dev
