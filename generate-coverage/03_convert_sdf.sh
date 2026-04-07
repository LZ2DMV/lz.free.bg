#!/usr/bin/env bash
# =============================================================================
# 03_convert_sdf.sh
# Convert SRTM .hgt elevation tiles into Signal-Server .sdf format.
#
# Run from the generate-coverage/ directory:
#   cd generate-coverage && bash 03_convert_sdf.sh [--hd]
#
# Options:
#   --hd   Use srtm2sdf-hd for SRTM1 (30m) input tiles instead of SRTM3 (90m).
#          Produces *-hd.sdf files; use signalserverHD for generation.
#
# Output: sdf/*.sdf  (or sdf/*-hd.sdf for --hd)
#
# NOTE (breaking change since Oct 1 2023 in W3AXL fork):
#   SDF filenames now use underscores instead of colons, e.g.:
#     40_50_0_10.sdf  (was 40:50:0:10.sdf)
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")"

HD=false
if [[ "${1:-}" == "--hd" ]]; then
    HD=true
fi

SRTM_DIR="srtm"
SDF_DIR="sdf"
TOOLS_DIR="Signal-Server/utils/sdf/usgs2sdf/build"

mkdir -p "$SDF_DIR"

if $HD; then
    TOOL="$TOOLS_DIR/srtm2sdf-hd"
    echo "=== Converting HGT → SDF (HD/SRTM1 mode) ==="
else
    TOOL="$TOOLS_DIR/srtm2sdf"
    echo "=== Converting HGT → SDF (standard/SRTM3 mode) ==="
fi

if [[ ! -x "$TOOL" ]]; then
    echo "ERROR: $TOOL not found. Run 02_build_tools.sh first."
    exit 1
fi

HGT_FILES=("$SRTM_DIR"/*.hgt)
if [[ ${#HGT_FILES[@]} -eq 0 || ! -f "${HGT_FILES[0]}" ]]; then
    echo "ERROR: No .hgt files found in $SRTM_DIR/. Run 01_download_srtm.sh first."
    exit 1
fi

expected_sdf_candidates_from_hgt() {
    local hgt_path="$1"
    local hd_suffix=""
    local tile
    local ns lat ew lon
    local lat_start lat_end lon_start_a lon_end_a lon_start_b lon_end_b

    tile="$(basename "$hgt_path" .hgt)"

    if [[ "$tile" =~ ^([NS])([0-9]{2})([EW])([0-9]{3})$ ]]; then
        ns="${BASH_REMATCH[1]}"
        lat="${BASH_REMATCH[2]}"
        ew="${BASH_REMATCH[3]}"
        lon="${BASH_REMATCH[4]}"
    else
        echo ""
        return 0
    fi

    lat=$((10#$lat))
    lon=$((10#$lon))

    if [[ "$ns" == "N" ]]; then
        lat_start="$lat"
    else
        lat_start=$((-lat))
    fi
    lat_end=$((lat_start + 1))

    # Primary mapping used by current datasets.
    if [[ "$ew" == "E" ]]; then
        lon_start_a=$((306 + lon))
    else
        lon_start_a=$((306 - lon))
    fi
    lon_end_a=$((lon_start_a + 1))

    # Alternate mapping seen in some inputs/tools where east tiles resolve like west-indexed longitudes.
    if [[ "$ew" == "E" ]]; then
        lon_start_b=$((359 - lon))
    else
        lon_start_b=$((359 + lon))
    fi
    lon_end_b=$((lon_start_b + 1))

    if $HD; then
        hd_suffix="-hd"
    fi

    echo "${lat_start}_${lat_end}_${lon_start_a}_${lon_end_a}${hd_suffix}.sdf"
    if [[ "$lon_start_b" -ne "$lon_start_a" ]]; then
        echo "${lat_start}_${lat_end}_${lon_start_b}_${lon_end_b}${hd_suffix}.sdf"
    fi
}

# Convert from the sdf output directory so SDF files land there directly
cd "$SDF_DIR"
TOOL_ABS="$(cd .. && pwd)/$TOOL"
SRTM_ABS="$(cd .. && pwd)/$SRTM_DIR"

# Snapshot files that existed before this run.
declare -A preexisting_sdf=()
shopt -s nullglob
for sdf_file in *.sdf; do
    preexisting_sdf["$sdf_file"]=1
done
shopt -u nullglob

converted=0
skipped=0
for hgt in "$SRTM_ABS"/*.hgt; do
    base="$(basename "$hgt" .hgt)"
    matched_sdf=""
    while IFS= read -r candidate; do
        [[ -z "$candidate" ]] && continue
        if [[ -n "${preexisting_sdf[$candidate]:-}" ]]; then
            matched_sdf="$candidate"
            break
        fi
    done < <(expected_sdf_candidates_from_hgt "$hgt")

    if [[ -n "$matched_sdf" ]]; then
        echo "  Skipping $base (already converted: $matched_sdf)"
        ((skipped++)) || true
        continue
    fi

    echo "  Converting $base ..."
    "$TOOL_ABS" -d /dev/null "$hgt" 2>&1 | grep -v "^$" || true
    ((converted++)) || true
done
cd - >/dev/null

echo ""
echo "=== SDF files in $SDF_DIR/ ==="
ls -lh "$SDF_DIR"/*.sdf 2>/dev/null | head -20 || echo "  No SDF files produced — check output above."
echo ""
echo "Converted $converted tile(s)."
echo "Skipped $skipped tile(s) (already converted)."
echo "Next step: python3 04_generate_coverage.py"
