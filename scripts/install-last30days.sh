#!/usr/bin/env bash
# Install the last30days research engine, pinned to a known-good commit.
# Used at Railway build time (see nixpacks.toml) and locally (run once).
#
# The engine is pure Python 3.12+ stdlib — no pip dependencies.
# Pinned rather than pulling latest: third-party code should not change
# underneath production without a deliberate version bump here.
set -euo pipefail

# v3.3.2 — bump deliberately after testing a newer release
PINNED_SHA="122158415ae421da83e739f2668032f6bc78d39c"
REPO_URL="https://github.com/mvanhorn/last30days-skill.git"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TARGET_DIR="$PROJECT_ROOT/tools/last30days"
TMP_DIR="$(mktemp -d)"

trap 'rm -rf "$TMP_DIR"' EXIT

if [ -f "$TARGET_DIR/.pinned-sha" ] && [ "$(cat "$TARGET_DIR/.pinned-sha")" = "$PINNED_SHA" ]; then
  echo "last30days already installed at pinned SHA — skipping."
  exit 0
fi

echo "Installing last30days engine @ ${PINNED_SHA:0:12}…"
git init -q "$TMP_DIR"
git -C "$TMP_DIR" remote add origin "$REPO_URL"
git -C "$TMP_DIR" fetch -q --depth 1 origin "$PINNED_SHA"
git -C "$TMP_DIR" checkout -q FETCH_HEAD

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"
cp -r "$TMP_DIR/skills/last30days/scripts/." "$TARGET_DIR/"
echo "$PINNED_SHA" > "$TARGET_DIR/.pinned-sha"

echo "Installed to $TARGET_DIR"
python3 --version || echo "WARNING: python3 not found — the engine requires Python 3.12+"
