#!/usr/bin/env bash
# =============================================================================
# download-srtm.sh
# Download SRTM3 (90m) elevation tiles for the Balkans / SE Europe region
# into ./srtm/ — served as static assets for the in-browser terrain profile.
#
# Usage (from the project root):
#   bash download-srtm.sh
#
# If the tiles are already present in generate-coverage/srtm/ they are copied
# locally instead of re-downloading.
#
# Source: viewfinderpanoramas.org (free, no account required)
# Coverage: lat 35–50°N, lon 18–36°E (Serbia, Bulgaria, Romania, Greece, Turkey…)
#
# Zone column mapping (empirically confirmed for row K):
#   *34 → lon 18–24°E   *35 → lon 24–30°E   *36 → lon 30–36°E
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")"

SRTM_DIR="srtm"
CACHE_DIR="generate-coverage/srtm"
BASE_URL="http://viewfinderpanoramas.org/dem3"

ZONES=(
    "J34" "J35" "J36"   # lat 35-40°N: Greece, northern Turkey
    "K34" "K35" "K36"   # lat 40-45°N: Bulgaria, Serbia, Black Sea coast
    "L34" "L35" "L36"   # lat 45-50°N: Romania, Moldova
)

mkdir -p "$SRTM_DIR"

# If generate-coverage/srtm/ already has tiles, copy new ones from there first.
if [[ -d "$CACHE_DIR" ]] && find "$CACHE_DIR" -maxdepth 1 -name '*.hgt' -quit 2>/dev/null | grep -q .; then
    echo "=== Copying cached HGT tiles from $CACHE_DIR ==="
    cp -n "$CACHE_DIR"/*.hgt "$SRTM_DIR"/
    echo "    Done."
fi

# Download any zones not yet represented in srtm/.
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

DOWNLOADED=0
for zone in "${ZONES[@]}"; do
    # Check if at least one tile from this zone is already present.
    # Zone files are named e.g. K34/N42E022.hgt — we can't easily tell which
    # tiles belong to which zone after extraction, so skip if zip was already
    # processed (tracked by a sentinel file).
    sentinel="$SRTM_DIR/.done_${zone}"
    if [[ -f "$sentinel" ]]; then
        echo "  [skip] $zone already extracted"
        continue
    fi

    zip_file="$TMP_DIR/${zone}.zip"
    echo "  Downloading ${zone}.zip ..."
    if wget -q --show-progress -O "$zip_file" "${BASE_URL}/${zone}.zip"; then
        echo "  Extracting ${zone}.zip ..."
        unzip -n -j "$zip_file" '*.hgt' -d "$SRTM_DIR" 2>/dev/null || true
        touch "$sentinel"
        DOWNLOADED=$((DOWNLOADED + 1))
    else
        echo "  [warn] ${zone}.zip not available — skipping"
        rm -f "$zip_file"
    fi
done

COUNT=$(find "$SRTM_DIR" -maxdepth 1 -name '*.hgt' | wc -l)
echo ""
echo "=== $COUNT HGT tiles in $SRTM_DIR/ ($DOWNLOADED new zones downloaded) ==="
find "$SRTM_DIR" -maxdepth 1 -name '*.hgt' -exec ls -lh {} + 2>/dev/null || echo "  No HGT files found — check for errors above."
