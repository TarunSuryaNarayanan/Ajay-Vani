#!/usr/bin/env python3
"""
Re-parse the CMKKY PDF-extracted CSV into a clean per-centre listing, fixing
two-column artefacts where the PDF's layout split a district name across
columns (DAKSHINA KANNADA -> KANNADA, BENGALURU RURAL -> RURAL).

Usage:
    python3 scripts/parse-cmkky-csv.py
"""

import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "training-center-details-_2_.csv"
OUT = ROOT / "data" / "karnataka-training-centres.csv"

# Multi-word districts that the naive token split breaks. Order matters: the
# longer fragment is matched first so "DAKSHINA KANNADA" doesn't collapse to
# "KANNADA" before the pair is seen.
MULTI_WORD = {
    ("DAKSHINA", "KANNADA"): "DAKSHINA KANNADA",
    ("BENGALURU", "RURAL"): "BENGALURU RURAL",
}

# Known Karnataka district tokens, used to detect the district field inside a
# VTP row. The district is the token immediately before the CAAF number.
DISTRICT_TOKENS = {
    "BAGALAKOTE", "BALLARI", "BELAGAVI", "BENGALURU", "BIDAR",
    "CHAMARAJANAGARA", "CHIKBALLAPUR", "CHIKMAGALURU", "CHITRADURGA",
    "DAKSHINA", "DAVANGERE", "DHARWAD", "GADAG", "HASSAN", "HAVERI",
    "KALABURGI", "KODAGU", "KOLAR", "KOPPAL", "MANDYA", "MYSURU",
    "RAICHURU", "RAMANAGARA", "RURAL", "SHIVAMOGA", "TUMKURU",
    "UDUPI", "URBAN", "VIJAYAPURA", "YADGIR", "KANNADA",
}


def parse_records():
    with open(RAW, newline="") as f:
        rows = list(csv.reader(f))

    records = []
    for r in rows:
        if not r:
            continue
        line = r[0].strip()
        m = re.match(r"^(VTP\d+)\s+(.*)$", line)
        if not m:
            continue
        records.append((m.group(1), m.group(2)))

    print(f"parsed {len(records)} VTP records")
    return records


def split_district(tokens, caaf_i):
    """Return (district, centre_name_tokens) given the CAAF index."""
    # District is the token immediately before CAAF. Handle multi-word names
    # where the first fragment is also a standalone district token.
    if caaf_i >= 2 and (tokens[caaf_i - 2], tokens[caaf_i - 1]) in MULTI_WORD:
        district = MULTI_WORD[(tokens[caaf_i - 2], tokens[caaf_i - 1])]
        centre_tokens = tokens[1:caaf_i - 2]
    elif caaf_i >= 1 and tokens[caaf_i - 1] in DISTRICT_TOKENS:
        district = tokens[caaf_i - 1]
        centre_tokens = tokens[1:caaf_i - 1]
    else:
        # Fall back: scan backwards for the first known district token.
        district = ""
        for j in range(caaf_i - 1, 0, -1):
            if tokens[j] in DISTRICT_TOKENS:
                district = tokens[j]
                centre_tokens = tokens[1:j]
                break
        else:
            centre_tokens = tokens[1:caaf_i]
    return district, centre_tokens


def main() -> int:
    records = parse_records()

    out = []
    skipped = 0
    for vtp_no, rest in records:
        toks = rest.split()
        caaf_i = next((i for i, t in enumerate(toks) if re.fullmatch(r"CAAF\d+", t)), None)
        if caaf_i is None:
            skipped += 1
            continue
        caaf = toks[caaf_i]
        district, centre_tokens = split_district(toks, caaf_i)
        centre = " ".join(centre_tokens).strip()
        tail = toks[caaf_i + 1:]
        job_role = tail[-1] if tail else ""
        address = " ".join(tail[:-1]).strip()
        out.append([vtp_no, district, centre, caaf, address, job_role, "Karnataka", "", ""])

    print(f"usable rows: {len(out)} (skipped {skipped} without CAAF)")

    with open(OUT, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["centre_id", "district", "centre_name", "caaf_no", "address", "job_role", "state", "latitude", "longitude"])
        w.writerows(out)

    from collections import Counter
    print("districts:", dict(Counter(r[1] for r in out).most_common(30)))
    print(f"wrote {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())