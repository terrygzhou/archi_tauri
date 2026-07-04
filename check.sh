#!/bin/bash
# Pre-flight check — verifies all prerequisites are installed
set -e
cd "$(dirname "$0")"

echo "=== Pre-flight Checks ==="

# Node
if command -v node &>/dev/null; then
  echo "✓ Node $(node --version)"
else
  echo "✗ Node not installed"
  exit 1
fi

# Cargo
if command -v cargo &>/dev/null; then
  echo "✓ Cargo $(cargo --version)"
else
  echo "✗ Rust/Cargo not installed"
  exit 1
fi

# Tauri CLI
if command -v tauri &>/dev/null; then
  echo "✓ Tauri CLI $(tauri --version)"
else
  echo "✗ Tauri CLI not installed — run: cargo install tauri-cli --version '^2'"
  exit 1
fi

# Dependencies
if [ ! -d node_modules ]; then
  echo "→ Installing node deps..."
  npm install
fi

if [ ! -d web/node_modules ]; then
  echo "→ Installing web deps..."
  cd web && npm install && cd ..
fi

echo ""
echo "✓ All checks passed. Run: cargo tauri dev"
