#!/usr/bin/env bash
# =============================================================================
# 02_build_tools.sh
# Ensure Signal-Server repo exists, build Signal-Server if needed,
# and build the srtm2sdf / srtm2sdf-hd conversion utilities.
#
# These are NOT built by the main Signal-Server cmake — they live under
# Signal-Server/utils/sdf/usgs2sdf/ and need their own build.
#
# Run from the generate-coverage/ directory:
#   cd generate-coverage && bash 02_build_tools.sh
#
# Outputs:
# - Signal-Server/build/signalserver
# Output: Signal-Server/utils/sdf/usgs2sdf/build/{srtm2sdf,srtm2sdf-hd}
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")"

REPO_URL="https://github.com/W3AXL/Signal-Server"
REPO_DIR="Signal-Server"
SERVER_BUILD_DIR="$REPO_DIR/build"
SERVER_BIN="$SERVER_BUILD_DIR/signalserver"
REBUILD_SERVER=0

UTILS_DIR="Signal-Server/utils/sdf/usgs2sdf"
BUILD_DIR="$UTILS_DIR/build"

get_jobs() {
    local ignore_count="$1"
    local jobs
    jobs="$(nproc --ignore="$ignore_count" 2>/dev/null || nproc)"
    if [[ -z "$jobs" || "$jobs" -lt 1 ]]; then
        jobs=1
    fi
    echo "$jobs"
}

if [[ ! -d "$REPO_DIR/.git" ]]; then
    echo "=== Cloning Signal-Server ==="
    git clone "$REPO_URL" "$REPO_DIR"
else
    echo "Signal-Server repo already present — pulling latest changes."
    pushd "$REPO_DIR" >/dev/null
    old_head="$(git rev-parse HEAD)"
    git pull --ff-only
    new_head="$(git rev-parse HEAD)"
    if [[ "$old_head" != "$new_head" ]]; then
        REBUILD_SERVER=1
        echo "Signal-Server updated by pull — main build will be rebuilt."
    else
        echo "Signal-Server already up to date."
    fi
    popd >/dev/null
fi

if [[ -x "$SERVER_BIN" && "$REBUILD_SERVER" -eq 0 ]]; then
    echo "Signal-Server already built — skipping main build."
    echo "Delete $SERVER_BUILD_DIR to force rebuild."
else
    echo "=== Building Signal-Server ==="
    mkdir -p "$SERVER_BUILD_DIR"
    pushd "$SERVER_BUILD_DIR" >/dev/null
    cmake ../src
    make -j"$(get_jobs 4)"
    popd >/dev/null
    echo "Built: $SERVER_BIN"
fi

if [[ -x "$BUILD_DIR/srtm2sdf" && -x "$BUILD_DIR/srtm2sdf-hd" ]]; then
    echo "srtm2sdf and srtm2sdf-hd already built — skipping."
    echo "Delete $BUILD_DIR to force a rebuild."
else
    echo "=== Building srtm2sdf utilities ==="
    mkdir -p "$BUILD_DIR"
    pushd "$BUILD_DIR" >/dev/null
    cmake ..
    make -j"$(get_jobs 4)"
    popd >/dev/null
    echo "Built: $BUILD_DIR/srtm2sdf"
    echo "Built: $BUILD_DIR/srtm2sdf-hd"
fi

echo ""
echo "Next step: bash 03_convert_sdf.sh"
