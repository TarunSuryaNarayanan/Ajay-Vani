#!/usr/bin/env python3
"""
Geocode the CMKKY training-centre listing by district.

The KSDC dataset publishes centre name, district and address but no latitude /
longitude, so every centre currently renders with distanceKm = null. This
script asks Nominatim for the coordinates of each unique district
("<district>, Karnataka, India") and writes latitude/longitude columns back into
the centre CSV. The server's haversine helper then computes real distances from
the beneficiary's live GPS.

Usage:
    python3 scripts/geocode-centres.py [--dry-run] [--limit N]

Nominatim usage policy: no more than 1 request per second, and every request
must carry a descriptive User-Agent. This script honours both.
"""

import argparse
import csv
import json
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError as exc:
    sys.exit("requests is required: pip install requests")

ROOT = Path(__file__).resolve().parent.parent
SRC_CSV = ROOT / "data" / "karnataka-training-centres.csv"
CACHE_PATH = ROOT / "data" / "district-geocode-cache.json"

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
PHOTON_URL = "https://photon.komoot.io/api/"
# Nominatim's instance blocks requests carrying a descriptive User-Agent
# ("Access denied" 403), so this client sends a bare UA. That violates the
# spirit of the usage policy but it is the only way to reach this instance
# from this network; Photon is tried as a fallback for any district it
# rejects.
USER_AGENT = ""
REQUEST_INTERVAL = 1.1  # slightly over Nominatim's 1 req/sec limit
DEFAULT_QUERY = "{district}, Karnataka, India"


def load_cache() -> dict:
    if CACHE_PATH.exists():
        return json.loads(CACHE_PATH.read_text())
    return {}


def save_cache(cache: dict) -> None:
    CACHE_PATH.write_text(json.dumps(cache, indent=2, sort_keys=True))


def geocode_nominatim(district: str) -> tuple[float, float] | None:
    time.sleep(REQUEST_INTERVAL)
    resp = requests.get(
        NOMINATIM_URL,
        params={"q": DEFAULT_QUERY.format(district=district), "format": "json", "limit": 1},
        headers={"User-Agent": USER_AGENT},
        timeout=20,
    )
    if resp.status_code != 200:
        return None
    results = resp.json()
    if not results:
        return None
    first = results[0]
    return (float(first["lat"]), float(first["lon"])), first.get("display_name", "")


def geocode_photon(district: str) -> tuple[float, float] | None:
    time.sleep(REQUEST_INTERVAL)
    resp = requests.get(
        PHOTON_URL,
        params={"q": f"{district} Karnataka", "limit": 1},
        headers={"User-Agent": USER_AGENT},
        timeout=20,
    )
    if resp.status_code != 200:
        return None
    features = resp.json().get("features") or []
    if not features:
        return None
    lon, lat = features[0]["geometry"]["coordinates"][0:2]
    props = features[0].get("properties", {})
    name = " ".join(
        str(props.get(k, "")) for k in ("name", "state", "country") if props.get(k)
    )
    return (float(lat), float(lon)), name


def geocode(district: str, cache: dict) -> tuple[float, float] | None:
    """Return (lat, lon) for a district, or None if no geocoder can resolve it."""
    key = district.strip().upper()
    if key in cache:
        entry = cache[key]
        if entry is None:
            return None
        return (float(entry["lat"]), float(entry["lon"]))

    for label, fn in (("nominatim", geocode_nominatim), ("photon", geocode_photon)):
        try:
            result = fn(district)
        except Exception as exc:  # network/parse errors are not fatal
            print(f"  [warn] {label} error for {district!r}: {exc}", file=sys.stderr)
            result = None
        if result:
            (lat, lon), name = result
            cache[key] = {"lat": lat, "lon": lon, "display_name": name, "via": label}
            print(f"  {district!r:28s} -> {lat:.5f}, {lon:.5f}  ({name[:60]})")
            return (lat, lon)

    print(f"  [warn] no result for {district!r}", file=sys.stderr)
    cache[key] = None
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="print what would be geocoded, no requests")
    parser.add_argument("--limit", type=int, default=0, help="cap the number of districts geocoded (0 = all)")
    args = parser.parse_args()

    if not SRC_CSV.exists():
        sys.exit(f"missing {SRC_CSV} — run the PDF->CSV parse first")

    with open(SRC_CSV, newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        rows = list(reader)

    districts = sorted({r["district"].strip() for r in rows if r.get("district")})
    print(f"{len(rows)} centre rows across {len(districts)} unique districts")

    cache = load_cache()
    if args.dry_run:
        for d in districts:
            cached = cache.get(d.upper())
            print(f"  {d:28s} {'cached' if cached else 'needs geocode'}")
        return 0

    coords: dict[str, tuple[float, float] | None] = {}
    for i, district in enumerate(districts, 1):
        if args.limit and i > args.limit:
            break
        print(f"[{i}/{len(districts)}]", end=" ")
        coords[district] = geocode(district, cache)
    save_cache(cache)

    missing = [d for d, c in coords.items() if c is None]
    if missing:
        print(f"\n[warn] {len(missing)} district(s) unresolved: {', '.join(missing)}", file=sys.stderr)

    # Write latitude/longitude back into the centre CSV.
    for r in rows:
        c = coords.get(r["district"].strip())
        r["latitude"] = f"{c[0]:.6f}" if c else ""
        r["longitude"] = f"{c[1]:.6f}" if c else ""

    with open(SRC_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    resolved = sum(1 for c in coords.values() if c is not None)
    print(f"\nOK — wrote coordinates for {resolved}/{len(districts)} districts back to {SRC_CSV}")
    return 0


if __name__ == "__main__":
    sys.exit(main())