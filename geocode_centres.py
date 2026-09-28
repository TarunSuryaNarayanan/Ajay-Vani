"""Street-level geocoding for training_centres_district_coords.csv via Nominatim.
Run locally (needs internet):  pip install requests && python geocode_centres.py
Respects Nominatim's 1 request/sec limit; caches results so it can be resumed.
Falls back to town/district-level queries and records the precision reached."""
import csv, json, os, re, time, requests

SRC, DST, CACHE = "training_centres_district_coords.csv", "training_centres_geocoded.csv", "geocode_cache.json"
UA = {"User-Agent": "govCentres-geocoder/1.0 (contact: YOUR_REAL_EMAIL_HERE)"}  # set your email
cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}

def q(text):
    if text in cache: return cache[text]
    for attempt in range(5):
        time.sleep(1.5)
        try:
            r = requests.get("https://nominatim.openstreetmap.org/search", headers=UA, timeout=30,
                params={"q": text, "format": "json", "limit": 1, "countrycodes": "in"})
        except requests.RequestException as e:
            print("network error, retrying:", e); time.sleep(10 * (attempt + 1)); continue
        if r.status_code == 200:
            try:
                j = r.json()
            except ValueError:
                print("non-JSON 200 response, retrying:", r.text[:120]); time.sleep(10 * (attempt + 1)); continue
            cache[text] = (float(j[0]["lat"]), float(j[0]["lon"])) if j else None
            json.dump(cache, open(CACHE, "w"))
            return cache[text]
        if r.status_code in (403, 429, 503):
            print(f"HTTP {r.status_code} - backing off. If 403 persists, set a real email in UA.")
            time.sleep(30 * (attempt + 1)); continue
        print("HTTP", r.status_code, r.text[:120]); break
    return None   # not cached, so a rerun will retry it

def tidy(s): return re.sub(r"[#,]+|\bNEAR\b.*", " ", s, flags=re.I).strip()

rows = list(csv.DictReader(open(SRC, encoding="utf-8")))
for r in rows:
    dist = r["district"].title()
    tries = [
        ("address", f'{tidy(r["address1"])} {tidy(r["address2"])}, {dist}, Karnataka'),
        ("address2", f'{tidy(r["address2"])}, {dist}, Karnataka'),
        ("centre", f'{r["centre_name"]}, {dist}, Karnataka'),
    ]
    for prec, text in tries:
        hit = q(text)
        if hit:
            r["lat"], r["lng"], r["precision"] = hit[0], hit[1], prec
            break   # otherwise keep the district-level fallback already in the row
w = csv.DictWriter(open(DST, "w", newline="", encoding="utf-8"), fieldnames=rows[0].keys())
w.writeheader(); w.writerows(rows)
print("done ->", DST)
