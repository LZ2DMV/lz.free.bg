#!/usr/bin/env bash
# =============================================================================
# download-srtm.sh
# Download SRTM3 (90m) elevation tiles for Bulgaria into ./srtm/
# These files are served as static assets for the in-browser terrain profile.
#
# Usage (from the project root):
#   bash download-srtm.sh
#
# If the tiles are already present in generate-coverage/srtm/ they are copied
# locally instead of re-downloading (~170 MB saved).
#
# Source: viewfinderpanoramas.org (free, no account required)
# Coverage: Bulgaria lat 41–44°N, lon 22–29°E (zones K34, K35)
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")"

SRTM_DIR="srtm"
CACHE_DIR="generate-coverage/srtm"
BASE_URL="http://viewfinderpanoramas.org/dem3"
ZONES=("K34" "K35")

mkdir -p "$SRTM_DIR"

# If the generate-coverage/srtm/ cache already has the files, just copy them.
if [[ -d "$CACHE_DIR" ]] && ls "$CACHE_DIR"/*.hgt &>/dev/null; then
    echo "=== Copying HGT tiles from $CACHE_DIR (already downloaded) ==="
    cp -n "$CACHE_DIR"/*.hgt "$SRTM_DIR"/
    echo "    Done."
else
    echo "=== Downloading SRTM3 tiles for Bulgaria ==="
    TMP_DIR=$(mktemp -d)
    trap 'rm -rf "$TMP_DIR"' EXIT

    for zone in "${ZONES[@]}"; do
        zip_file="$TMP_DIR/${zone}.zip"
        echo "  Downloading ${zone}.zip ..."
        wget -q --show-progress -O "$zip_file" "${BASE_URL}/${zone}.zip"
        echo "  Extracting ${zone}.zip ..."
        unzip -n -j "$zip_file" '*.hgt' -d "$SRTM_DIR" 2>/dev/null || true
    done
fi

COUNT=$(ls "$SRTM_DIR"/*.hgt 2>/dev/null | wc -l)
echo ""
echo "=== $COUNT HGT tiles in $SRTM_DIR/ ==="
ls -lh "$SRTM_DIR"/*.hgt 2>/dev/null || echo "  No HGT files found — check for errors above."
