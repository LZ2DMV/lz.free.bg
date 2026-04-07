#!/usr/bin/env bash
# =============================================================================
# 01_download_srtm.sh
# Download SRTM3 (90m) elevation tiles for Bulgaria from viewfinderpanoramas.org
#
# Run from the generate-coverage/ directory:
#   cd generate-coverage && bash 01_download_srtm.sh
#
# Output: srtm/*.hgt  (one file per 1°×1° tile)
#
# Bulgaria spans roughly lat 41–44°N, lon 22–29°E.
# Viewfinderpanoramas organises SRTM3 data in 5°×5° zones:
#   K31 → lat 40–45°N, lon 20–25°E  (contains N41–N44, E22–E24)
#   K32 → lat 40–45°N, lon 25–30°E  (contains N41–N44, E25–E29)
#
# If you want SRTM1 (30m, HD) quality instead, download tiles individually
# from NASA Earthdata (https://earthdata.nasa.gov, free account required) or
# the OpenTopography bulk download service.  Name them N42E025.hgt etc. and
# place them in srtm/, then run 03_convert_sdf.sh with the -hd flag.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")"

SRTM_DIR="srtm"
mkdir -p "$SRTM_DIR"

BASE_URL="http://viewfinderpanoramas.org/dem3"

# Viewfinder Panoramas row K = lat 40-45°N.
# Zones are NOT clean 5-degree columns; each zip only contains tiles where
# elevation data exists.  Empirically, for Bulgaria (lat 41-44°N, lon 22-29°E):
#   K34 → contains E020-E023 tiles (western Bulgaria: Sofia, Plovdiv area)
#   K35 → contains E024-E029 tiles (central/eastern Bulgaria)
# K36 covers E030+ which is beyond Bulgaria.
ZONES=("K34" "K35")

echo "=== Downloading SRTM3 tiles for Bulgaria ==="
for zone in "${ZONES[@]}"; do
    zip_file="$SRTM_DIR/${zone}.zip"
    if [[ -f "$zip_file" ]]; then
        echo "  [skip] ${zone}.zip already downloaded"
    else
        echo "  Downloading ${zone}.zip ..."
        wget -q --show-progress -O "$zip_file" "${BASE_URL}/${zone}.zip"
    fi

    echo "  Extracting ${zone}.zip ..."
    # Files are stored as <ZONE>/<TILENAME>.hgt inside the ZIP.
    # -j strips the leading directory; '*.hgt' matches any HGT file in any subdirectory.
    unzip -n -j "$zip_file" '*.hgt' -d "$SRTM_DIR" 2>/dev/null || true
done

echo ""
echo "=== Downloaded HGT files ==="
ls -lh "$SRTM_DIR"/*.hgt 2>/dev/null || echo "  No HGT files found — check the download above for errors."
echo ""
echo "Next step: bash 02_build_tools.sh"
