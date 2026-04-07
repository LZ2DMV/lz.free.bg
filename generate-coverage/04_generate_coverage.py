#!/usr/bin/env python3
"""
04_generate_coverage.py
=======================
Fetch Bulgarian amateur radio repeaters from the API and generate RF coverage
overlay PNG images for each one using Signal Server (ITM/Longley-Rice model).

Run from the generate-coverage/ directory:
    cd generate-coverage && python3 04_generate_coverage.py [options]

Options:
    --callsign CALL     Process only this callsign (useful for testing)
    --radius KM         Coverage radius in km (default: 300)
    --jobs N            Max parallel Signal Server jobs (default: 5)
    --res PIXELS        Pixels per tile: 300/600/1200 (default: 600)
    --hd                Use signalserverHD + *-hd.sdf tiles (SRTM1 30m data)
    --force             Re-generate even if the repeater record has not changed
    --dry-run           Print commands without executing

Requirements:
    pip install requests numpy

Freshness tracking
------------------
Each generated PNG has its API 'updated' timestamp embedded as a PNG tEXt
Comment chunk (keyword "Comment", value "lz.updated:<ISO-8601>").  The same
value is stored in coverage/manifest.json under each callsign's "updated" key.

On subsequent runs the script compares the API 'updated' field against the
manifest entry.  If they match and the PNG exists, the repeater is skipped.
The PNG comment acts as a self-contained fallback: even if manifest.json is
deleted the PNG carries its own freshness information and the script can
recover it.

Output:
    ../coverage/<CALLSIGN>.png   — transparent coverage overlay (green gradient)
    ../coverage/manifest.json    — bounds + updated index loaded by lz.js

Manifest format (per callsign):
    {
      "LZ0ARB": {
        "bounds":  ["coverage/LZ0ARB.png", <south>, <west>, <north>, <east>],
        "updated": "2022-12-01T00:00:00.000Z"
      }
    }

Signal Server bounds output line (stdout/stderr):
    [timestamp] [info] Area boundaries:<north> | <east> | <south> | <west>
"""

import argparse
import concurrent.futures
import datetime
import json
import math
import os
import re
import shutil
import struct
import subprocess
import sys
import zlib
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("ERROR: 'requests' package required.  Run: pip install requests")

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    print("WARNING: 'numpy' not found — terrain elevation lookup disabled.")
    print("         Antenna height will default to 10m AGL for all repeaters.")
    print("         Install with: pip install numpy")

# ---------------------------------------------------------------------------
# Paths (all relative to this script's directory)
# ---------------------------------------------------------------------------
SCRIPT_DIR   = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
COVERAGE_OUT = PROJECT_ROOT / "coverage"
SDF_DIR      = SCRIPT_DIR / "sdf"
BUILD_DIR    = SCRIPT_DIR / "Signal-Server" / "build"
DEFAULT_SCF  = SCRIPT_DIR / "lz-coverage.scf"
# Signal Server's -color parser stops at the first '.' in the path, so paths
# containing dots (e.g. our lz.free.bg project directory) silently break it.
# We copy the chosen SCF to /tmp/lz_coverage.scf (dot-free path) before each run.
_SCF_DEST = Path("/tmp/lz_coverage.scf")
SRTM_DIR     = SCRIPT_DIR / "srtm"

API_URL = "https://api.varna.radio/v1"

# PNG tEXt comment keyword written by this script
PNG_COMMENT_PREFIX = "lz.updated:"

# ---------------------------------------------------------------------------
# RF propagation parameters
# ---------------------------------------------------------------------------
DEFAULT_ERP_W      = 40     # Watts ERP when repeater power is unknown/zero
DEFAULT_TXH_AGL    = 10     # metres AGL when altitude is unknown
RX_HEIGHT          = 2      # metres AGL — typical handheld receiver
RX_THRESHOLD_DBUVM = 15     # dBuV/m — show only usable signal areas (~-95dBm for FM handheld)
PROP_MODEL         = 1      # 1=ITM (Longley-Rice), best for VHF/UHF
PROP_ENV           = 3      # 3=Rural (most of Bulgaria is rural/suburban)
CLIMATE            = 5      # 5=Continental temperate (Bulgaria)
TERRAIN_CODE       = 3      # 3=Farmland (mixed terrain default)

# ---------------------------------------------------------------------------
# PNG tEXt chunk helpers (no extra dependencies)
# ---------------------------------------------------------------------------

_PNG_SIG = b'\x89PNG\r\n\x1a\n'


def read_png_updated(path: Path) -> str | None:
    """
    Read the 'lz.updated:…' value embedded in a PNG tEXt Comment chunk.
    Returns the ISO-8601 timestamp string, or None if not present/unreadable.
    """
    try:
        with open(path, 'rb') as f:
            if f.read(8) != _PNG_SIG:
                return None
            while True:
                hdr = f.read(8)
                if len(hdr) < 8:
                    break
                length = struct.unpack('>I', hdr[:4])[0]
                chunk_type = hdr[4:]
                data = f.read(length)
                f.read(4)  # CRC — skip
                if chunk_type == b'tEXt':
                    # tEXt format: keyword\x00text (Latin-1)
                    try:
                        nul = data.index(b'\x00')
                        keyword = data[:nul].decode('latin-1')
                        text    = data[nul + 1:].decode('latin-1')
                        if keyword.lower() == 'comment' and text.startswith(PNG_COMMENT_PREFIX):
                            return text[len(PNG_COMMENT_PREFIX):]
                    except (ValueError, UnicodeDecodeError):
                        pass
                if chunk_type == b'IEND':
                    break
    except OSError:
        pass
    return None


def _write_png_text_chunk(keyword: str, text: str) -> bytes:
    """Build a raw PNG tEXt chunk."""
    payload = keyword.encode('latin-1') + b'\x00' + text.encode('latin-1')
    crc = zlib.crc32(b'tEXt' + payload) & 0xFFFFFFFF
    return struct.pack('>I', len(payload)) + b'tEXt' + payload + struct.pack('>I', crc)


def inject_png_comment(png_path: Path, comment: str) -> None:
    """
    Insert a tEXt Comment chunk into an existing PNG, right after the IHDR chunk.
    Overwrites the file in-place (writes to a temp file then replaces).
    """
    data = png_path.read_bytes()
    if not data.startswith(_PNG_SIG):
        raise ValueError(f"Not a PNG: {png_path}")

    new_chunk = _write_png_text_chunk('Comment', comment)

    # Find the end of the IHDR chunk (sig=8 + length=4 + type=4 + data=13 + crc=4 = 33)
    insert_at = 8 + 4 + 4 + 13 + 4  # byte 33

    tmp = png_path.with_suffix('.tmp.png')
    tmp.write_bytes(data[:insert_at] + new_chunk + data[insert_at:])
    tmp.replace(png_path)


# ---------------------------------------------------------------------------
# Elevation lookup from local SRTM3 HGT files (requires numpy)
# ---------------------------------------------------------------------------

def _read_hgt_elevation(lat: float, lon: float) -> int | None:
    """
    Read terrain elevation (metres ASL) at (lat, lon) from a local SRTM3 .hgt tile.
    SRTM3 tiles are 1201×1201 big-endian signed 16-bit integers, 3-arc-second spacing.
    """
    if not HAS_NUMPY:
        return None

    lat_int = int(math.floor(lat))
    lon_int = int(math.floor(lon))
    ns = f"N{lat_int:02d}" if lat_int >= 0 else f"S{-lat_int:02d}"
    ew = f"E{lon_int:03d}" if lon_int >= 0 else f"W{-lon_int:03d}"
    hgt_path = SRTM_DIR / f"{ns}{ew}.hgt"

    if not hgt_path.exists():
        return None

    try:
        data = np.frombuffer(hgt_path.read_bytes(), dtype=">i2").reshape(1201, 1201)
        row = int(round((1.0 - (lat - lat_int)) * 1200))
        col = int(round((lon - lon_int) * 1200))
        row = max(0, min(row, 1200))
        col = max(0, min(col, 1200))
        elev = int(data[row, col])
        return elev if elev > -32768 else None  # -32768 = NODATA sentinel
    except Exception as e:
        print(f"    Warning: HGT read error for {hgt_path.name}: {e}")
        return None


def compute_txh_agl(altitude_asl: int, lat: float, lon: float) -> float:
    """
    Compute antenna height above ground level.

    Subtracts the SRTM terrain elevation from the repeater's altitude (ASL)
    and adds a 5 m mast height.  Falls back to DEFAULT_TXH_AGL when either
    value is unavailable.
    """
    if not altitude_asl or altitude_asl <= 0:
        return DEFAULT_TXH_AGL

    terrain = _read_hgt_elevation(lat, lon)
    if terrain is None:
        return DEFAULT_TXH_AGL

    agl = altitude_asl - terrain
    if agl < 2:
        agl = DEFAULT_TXH_AGL
    return float(agl + 5)


def compute_radius_km(altitude_asl: int | float | None, fallback_radius: int) -> int:
    """
    Choose coverage radius based on repeater altitude ASL.

    Rules:
      - altitude > 1000 m  -> 500 km
      - altitude > 500 m   -> 350 km
      - altitude <= 500 m  -> 250 km

    If altitude is missing/invalid, use fallback_radius.
    """
    if altitude_asl is None:
        return fallback_radius

    try:
        alt = float(altitude_asl)
    except (TypeError, ValueError):
        return fallback_radius

    if alt > 1000:
        return 500
    if alt > 500:
        return 350
    return 200


# ---------------------------------------------------------------------------
# Signal Server runner
# ---------------------------------------------------------------------------

def run_signalserver(
    rep: dict,
    out_prefix: Path,
    *,
    radius_km: int,
    res: int,
    use_hd: bool,
    dry_run: bool,
) -> tuple[str, str, str, str] | None:
    """
    Run signalserver for one repeater.
    Returns (north, east, south, west) strings, or None on failure.
    """
    binary = BUILD_DIR / ("signalserverHD" if use_hd else "signalserver")
    if not binary.exists():
        print(f"  ERROR: binary not found: {binary}")
        return None

    lat      = rep["latitude"]
    lon      = rep["longitude"]
    freq_hz  = rep.get("freq", {}).get("tx") or 0
    freq_mhz = freq_hz / 1e6
    if freq_mhz < 20:
        print(f"  SKIP: invalid TX frequency {freq_hz} Hz")
        return None

    erp_w = rep.get("power") or 0
    if erp_w <= 0:
        erp_w = DEFAULT_ERP_W

    txh = compute_txh_agl(rep.get("altitude") or 0, lat, lon)

    # signalserver requires output basename ≥ 5 chars
    out_str = str(out_prefix)
    if len(out_prefix.stem) < 5:
        out_str = str(out_prefix.parent / f"rep_{out_prefix.stem}")

    cmd = [
        str(binary),
        "-sdf",   str(SDF_DIR),
        "-lat",   str(lat),
        "-lon",   str(lon),
        "-txh",   str(txh),
        "-f",     f"{freq_mhz:.4f}",
        "-erp",   str(erp_w),
        "-rxh",   str(RX_HEIGHT),
        "-rt",    str(RX_THRESHOLD_DBUVM),
        "-m",                            # metric units
        "-pm",    str(PROP_MODEL),
        "-pe",    str(PROP_ENV),
        "-cl",    str(CLIMATE),
        "-te",    str(TERRAIN_CODE),
        "-R",     str(radius_km),
        "-res",   str(res),
        "-color", str(_SCF_DEST.with_suffix("")),  # dot-free /tmp path; Signal Server appends .scf
        "-o",     out_str,
    ]

    print(f"  CMD: {' '.join(cmd)}")
    if dry_run:
        return None

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    output = result.stdout + result.stderr

    if result.returncode != 0:
        print(f"  ERROR (exit {result.returncode}):")
        for line in output.splitlines()[-10:]:
            print(f"    {line}")
        return None

    # Parse "Area boundaries: north | east | south | west"
    m = re.search(
        r"Area boundaries[: ]+([+-]?\d+\.\d+)\s*\|\s*([+-]?\d+\.\d+)"
        r"\s*\|\s*([+-]?\d+\.\d+)\s*\|\s*([+-]?\d+\.\d+)",
        output,
    )
    if not m:
        print("  ERROR: Could not parse 'Area boundaries' from Signal Server output.")
        print("  Last 5 lines of output:")
        for line in output.splitlines()[-5:]:
            print(f"    {line}")
        return None

    return m.group(1), m.group(2), m.group(3), m.group(4)  # north, east, south, west


def ppm_to_png(ppm_path: Path, png_path: Path, updated: str) -> bool:
    """
    Convert PPM → transparent PNG, embed 'updated' as a tEXt Comment chunk,
    and set the file mtime to the repeater's updated timestamp.
    """
    if not ppm_path.exists():
        print(f"  ERROR: PPM file not found: {ppm_path}")
        return False

    # Use 'magick' (ImageMagick v7) if available, fall back to legacy 'convert'
    im_cmd = "magick" if subprocess.run(["which", "magick"], capture_output=True).returncode == 0 else "convert"
    # Pipeline:
    #   -fuzz 5% -transparent white  → remove background + near-white weak-signal edge pixels
    #   -blur 0x4                    → smooth pixelation (Gaussian sigma=4px)
    #   -channel alpha -evaluate multiply 0.45  → 45% opacity, map shows through
    result = subprocess.run(
        [im_cmd, str(ppm_path),
         "-fuzz", "12%", "-transparent", "white",
         "-blur", "0x4",
         "-channel", "alpha", "-evaluate", "multiply", "0.60",
         str(png_path)],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"  ERROR converting PPM to PNG: {result.stderr}")
        return False

    ppm_path.unlink(missing_ok=True)

    # Embed the repeater's API 'updated' value as a PNG tEXt Comment
    try:
        inject_png_comment(png_path, f"{PNG_COMMENT_PREFIX}{updated}")
    except Exception as e:
        print(f"  Warning: could not embed PNG comment: {e}")

    return True


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate RF coverage PNGs for Bulgarian repeaters."
    )
    parser.add_argument("--callsign", help="Process only this callsign")
    parser.add_argument("--radius",   type=int, default=300,
                        help="Coverage radius in km (default: 300)")
    parser.add_argument("--jobs",     type=int, default=5,
                        help="Max parallel Signal Server jobs (default: 5)")
    parser.add_argument("--res",      type=int, default=600,
                        choices=[300, 600, 1200, 3600],
                        help="Pixels per tile (default: 600)")
    parser.add_argument("--hd",       action="store_true",
                        help="Use signalserverHD (SRTM1 30m tiles)")
    parser.add_argument("--color",    default=str(DEFAULT_SCF), metavar="FILE",
                        help=f"SCF color palette file (default: {DEFAULT_SCF.name})")
    parser.add_argument("--force",    action="store_true",
                        help="Regenerate even if repeater record is unchanged")
    parser.add_argument("--dry-run",  action="store_true",
                        help="Print commands, don't execute")
    args = parser.parse_args()
    if args.jobs < 1:
        sys.exit("ERROR: --jobs must be >= 1")

    scf_path = Path(args.color).resolve()

    # Sanity checks (skip binary/sdf checks in dry-run)
    if not args.dry_run:
        if not (BUILD_DIR / "signalserver").exists():
            sys.exit(f"ERROR: signalserver binary not found at {BUILD_DIR}/\n"
                     "       Make sure the Signal-Server was compiled first.")
        if not SDF_DIR.exists() or not list(SDF_DIR.glob("*.sdf")):
            sys.exit(f"ERROR: No .sdf tiles found in {SDF_DIR}/\n"
                     "       Run 01_download_srtm.sh and 03_convert_sdf.sh first.")
        # Accept either 'magick' (IMv7) or legacy 'convert'
        if (subprocess.run(["which", "magick"],   capture_output=True).returncode != 0 and
                subprocess.run(["which", "convert"], capture_output=True).returncode != 0):
            sys.exit("ERROR: ImageMagick not found.  Install: sudo apt install imagemagick")

    COVERAGE_OUT.mkdir(exist_ok=True)

    if not scf_path.exists():
        sys.exit(f"ERROR: color palette file not found: {scf_path}")
    # Copy the SCF palette to /tmp so Signal Server's parser (which stops at
    # the first '.' in the -color path) can find it reliably.
    shutil.copy2(scf_path, _SCF_DEST)
    print(f"Color palette: {scf_path}")

    # ---- Fetch repeaters -------------------------------------------------------
    print(f"Fetching repeaters from {API_URL} ...")
    try:
        resp = requests.get(API_URL, timeout=30)
        resp.raise_for_status()
        all_reps = resp.json()
    except Exception as e:
        sys.exit(f"ERROR fetching repeaters: {e}")

    repeaters = [r for r in all_reps if not r.get("disabled")]
    if args.callsign:
        repeaters = [r for r in repeaters
                     if r["callsign"].upper() == args.callsign.upper()]
        if not repeaters:
            sys.exit(f"Callsign '{args.callsign}' not found in API.")

    print(f"Processing {len(repeaters)} repeater(s).\n")

    # ---- Load existing manifest ------------------------------------------------
    # Manifest format:
    #   { callsign: { "bounds": [url, south, west, north, east], "updated": ISO } }
    manifest_path = COVERAGE_OUT / "manifest.json"
    manifest: dict = {}
    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text())
        except Exception:
            manifest = {}

    ok = 0
    skipped = 0
    failed = 0
    pending = []

    for rep in repeaters:
        callsign   = rep["callsign"]
        api_updated = rep.get("updated") or ""
        png_path   = COVERAGE_OUT / f"{callsign}.png"
        radius_km = compute_radius_km(rep.get("altitude"), args.radius)

        print(f"[{callsign}] lat={rep.get('latitude')} lon={rep.get('longitude')} "
              f"alt={rep.get('altitude')}m power={rep.get('power')}W "
              f"freq_tx={rep.get('freq', {}).get('tx', 0)/1e6:.4f}MHz "
              f"radius={radius_km}km "
              f"updated={api_updated}")

        # ---- Freshness check ---------------------------------------------------
        if not args.force and png_path.exists():
            # Fast path: compare manifest 'updated' against API 'updated'
            manifest_entry = manifest.get(callsign, {})
            manifest_updated = (manifest_entry.get("updated") or ""
                                if isinstance(manifest_entry, dict) else "")

            if manifest_updated and manifest_updated == api_updated:
                print(f"  [skip] up-to-date (updated={api_updated})")
                skipped += 1
                continue

            # Fallback: read 'updated' embedded in the PNG file itself.
            # This handles the case where manifest.json was deleted or is stale
            # but the PNG still carries its own freshness metadata.
            png_updated = read_png_updated(png_path)
            if png_updated and png_updated == api_updated:
                print(f"  [skip] PNG comment up-to-date (updated={api_updated})")
                # Repair the manifest entry from the PNG's embedded data so
                # future runs use the fast path.
                if isinstance(manifest_entry, dict) and manifest_entry.get("bounds"):
                    manifest[callsign]["updated"] = png_updated
                skipped += 1
                continue

            print(f"  Repeater record changed — regenerating "
                  f"(was: {manifest_updated or png_updated or 'unknown'}, "
                  f"now: {api_updated})")

        pending.append({
            "rep": rep,
            "callsign": callsign,
            "api_updated": api_updated,
            "radius_km": radius_km,
            "png_path": png_path,
        })

    def generate_one(item: dict) -> dict:
        rep = item["rep"]
        callsign = item["callsign"]
        api_updated = item["api_updated"]
        radius_km = item["radius_km"]
        png_path = item["png_path"]

        out_prefix = COVERAGE_OUT / callsign
        ppm_path   = COVERAGE_OUT / f"{callsign}.ppm"

        bounds = run_signalserver(
            rep, out_prefix,
            radius_km=radius_km,
            res=args.res,
            use_hd=args.hd,
            dry_run=args.dry_run,
        )

        if args.dry_run:
            return {"callsign": callsign, "status": "dry"}

        if bounds is None:
            return {"callsign": callsign, "status": "failed"}

        north, east, south, west = bounds
        print(f"  Bounds [{callsign}]: N={north} E={east} S={south} W={west}")

        if not ppm_to_png(ppm_path, png_path, api_updated):
            return {"callsign": callsign, "status": "failed"}

        # Append ?v=<updated> so browsers invalidate their cache when the
        # repeater record (and thus the coverage image) changes.
        v = api_updated.replace(":", "%3A") if api_updated else ""
        rel_url = f"coverage/{callsign}.png?v={v}" if v else f"coverage/{callsign}.png"

        return {
            "callsign": callsign,
            "status": "ok",
            "manifest_entry": {
                "bounds": [rel_url, float(south), float(west), float(north), float(east)],
                "updated": api_updated,
            },
            "png_path": png_path,
        }

    if pending:
        print(f"\nGenerating {len(pending)} repeater(s) with up to {args.jobs} parallel job(s)...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.jobs) as executor:
            future_to_item = {executor.submit(generate_one, item): item for item in pending}
            for future in concurrent.futures.as_completed(future_to_item):
                item = future_to_item[future]
                callsign = item["callsign"]
                try:
                    result = future.result()
                except Exception as e:
                    print(f"  FAILED — skipping {callsign}: {e}")
                    failed += 1
                    continue

                status = result.get("status")
                if status == "ok":
                    manifest[callsign] = result["manifest_entry"]
                    png_path = result["png_path"]
                    print(f"  OK → {png_path.relative_to(PROJECT_ROOT)}")
                    ok += 1
                elif status == "failed":
                    print(f"  FAILED — skipping {callsign}")
                    failed += 1

    # ---- Write manifest --------------------------------------------------------
    if not args.dry_run:
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
        print(f"\nManifest written: {manifest_path.relative_to(PROJECT_ROOT)}")

    print(f"\nDone. OK={ok}  skipped={skipped}  failed={failed}")


if __name__ == "__main__":
    main()
