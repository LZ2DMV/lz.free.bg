#!/usr/bin/env bash
# =============================================================================
# 01_download_srtm.sh
# Download SRTM3 (90m) elevation tiles for the Balkans / SE Europe region
# from viewfinderpanoramas.org.
#
# Run from the generate-coverage/ directory:
#   cd generate-coverage && bash 01_download_srtm.sh
#
# Output: srtm/*.hgt  (one file per 1°×1° tile)
#
# Region covered (Serbia, Bulgaria, Romania, Greece, Turkey, N. Macedonia…):
#   lat 35–50°N, lon 18–36°E
#
# Viewfinderpanoramas zones used (each ZIP covers a ~6°×5° block):
#   Row J (lat 35–40°N): J34 J35 J36          — Greece, northern Turkey
#   Row K (lat 40–45°N): K34 K35 K36          — Bulgaria, Serbia, Black Sea
#   Row L (lat 45–50°N): L34 L35 L36          — Romania, Moldova
#
# Zone column mapping (empirically confirmed for row K):
#   *34 → lon 18–24°E   *35 → lon 24–30°E   *36 → lon 30–36°E
#
# If you want SRTM1 (30m, HD) quality, download tiles individually from
# NASA Earthdata (https://earthdata.nasa.gov, free account required).
# Name them N42E025.hgt etc., place in srtm/, then run 03_convert_sdf.sh -hd.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")"

SRTM_DIR="srtm"
mkdir -p "$SRTM_DIR"

BASE_URL="http://viewfinderpanoramas.org/dem3"

ZONES=(
    "J34" "J35" "J36"   # lat 35-40°N: Greece, northern Turkey
    "K34" "K35" "K36"   # lat 40-45°N: Bulgaria, Serbia, Black Sea coast
    "L34" "L35" "L36"   # lat 45-50°N: Romania, Moldova
)

echo "=== Downloading SRTM3 tiles for SE Europe (${#ZONES[@]} zones) ==="
for zone in "${ZONES[@]}"; do
    zip_file="$SRTM_DIR/${zone}.zip"
    if [[ -f "$zip_file" ]]; then
        echo "  [skip] ${zone}.zip already downloaded"
    else
        echo "  Downloading ${zone}.zip ..."
        wget -q --show-progress -O "$zip_file" "${BASE_URL}/${zone}.zip" || {
            echo "  [warn] ${zone}.zip not available — skipping"
            rm -f "$zip_file"
            continue
        }
    fi

    echo "  Extracting ${zone}.zip ..."
    # Files are stored as <ZONE>/<TILENAME>.hgt inside the ZIP.
    # -j strips the leading directory; '*.hgt' matches all HGT files.
    unzip -n -j "$zip_file" '*.hgt' -d "$SRTM_DIR" 2>/dev/null || true
done

echo ""
COUNT=$(find "$SRTM_DIR" -maxdepth 1 -name '*.hgt' | wc -l)
echo "=== $COUNT HGT tiles in $SRTM_DIR/ ==="
find "$SRTM_DIR" -maxdepth 1 -name '*.hgt' -exec ls -lh {} + 2>/dev/null || echo "  No HGT files found — check the download above for errors."
echo ""
echo "Next step: bash 02_build_tools.sh"
