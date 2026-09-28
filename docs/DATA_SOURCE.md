# Centre data — where it comes from

## The short version

The skill-development centres the app shows are **real records from the Open
Government Data platform (data.gov.in)**, refreshed by hand, not a live feed.

A snapshot **is** committed: `server/data/centres/govCentres.generated.ts`
contains 637 training-centre records from the Karnataka CMKKY (Chamarajanagar
Kaushal Karnataka Yojana) dataset, loaded offline via
`npm run data:fetch:local` from `data/karnataka-training-centres.csv`.

Until a dataset with GPS coordinates is loaded, `GET /api/centres?lat=…&lon=…`
returns `distanceKm: null` for these rows (the source publishes centre name,
district and address but no latitude/longitude). The UI renders that as
"दूरी उपलब्ध नहीं" rather than a fabricated number. The haversine path in
`server/data/centres/distance.ts` activates automatically the moment a dataset
with coordinates is loaded.

## Getting a real snapshot

data.gov.in requires a **free API key** for every dataset — the `/resource` API
and the file downloads both return `Authorization field missing` without one.

1. Register at <https://www.data.gov.in/> and copy your API key.
2. Find the dataset you want. The current site is a client-rendered SPA, so the
   resource UUID is **not** in the page HTML — it is in the URL of the dataset's
   API tab (`https://www.data.gov.in/resource/<uuid>`) and in search-result links
   (`https://www.data.gov.in/apis/<uuid>`). Logged-in crawlers see it; anonymous
   fetches get boilerplate. The CKAN catalog API (`/api/3/action/*`) returns a
   302 login wall, so it cannot be enumerated programmatically.
3. Validate the UUID and the column names before committing a fetch:

   ```bash
   OGD_API_KEY=<your key> npm run data:discover <uuid>
   ```

   This fetches one page and prints the dataset title, last-updated date, total
   row count, the real field names, and a sample row. Use it to confirm the UUID
   is right and to fix the `fieldMap` candidates in
   `scripts/government-datasets.config.json`.
4. Paste the UUID into the matching `resourceUuid` field, adjust `fieldMap` if
   the discover output shows different column names, then fetch:

   ```bash
   OGD_API_KEY=<your key> npm run data:fetch
   ```

### Offline / local-file mode

If you have a centre listing as a CSV or JSON (downloaded manually, or from a
state portal such as Karnataka's KSDC list), load it without the API key:

```bash
npm run data:fetch:local
```

Each dataset entry needs a `localFile` path (relative to the repo root) instead
of a `resourceUuid`. The script applies the same normaliser and the same
district/state filters, so a local file can replace a network dataset one at a
time. The smoke test in `scripts/local-datasets.config.json` shows the shape.

## What the script refuses to do

The script writes:

- `server/data/centres/govCentresSnapshot.json` — the raw snapshot plus provenance
- `server/data/centres/govCentres.generated.ts` — the same data as a TS module the
  server imports at build time

## What the script refuses to do

- It will not run without `OGD_API_KEY` (exits non-zero with instructions).
- It will not run while every `resourceUuid` in the config is still empty.
- It will not overwrite an existing good snapshot with an empty one.
- It never invents coordinates, phone numbers, distances, vacancy counts, wage
  bands, benefits, course durations or NSQF QP codes. Fields the source does not
  publish are left absent and rendered as "not available".

## What the data is and is not

`data.gov.in` publishes **counts and listings by district/state**, typically updated
quarterly or annually. It does **not** publish live seat or vacancy availability. So:

- "N training centres are listed in your district" is a statement the data supports.
- "N jobs are available" is **not**, and the app does not say it. The post-training
  job path renders vacancy and wage as unavailable for the same reason.

## Provenance in the UI

`GET /api/centres?district=…` returns:

```jsonc
{
  "source": "data.gov.in",        // or "demo"
  "provenance": {                 // null when source is "demo"
    "publisher": "…", "datasetTitle": "…", "resourceId": "…",
    "sourceUrl": "…", "lastUpdated": "…", "licence": "Government Open Data License – India (GODL)",
    "recordCount": 1234, "fetchedAt": "…"
  },
  "count": 12,
  "centres": [ /* … */ ],
  "notice": "…"                  // present when demo rows were substituted
}
```

`SkillingJobsScreen` renders that provenance directly, so a viewer can see the
publisher, the dataset's own last-updated date, the record count and the licence.

## Suggested wording for the demo video

> "Centre data in this app comes from the Open Government Data platform, data.gov.in,
> published by the Ministry of Skill Development and Entrepreneurship. It is a
> snapshot, refreshed when we run our fetch script, because these datasets are
> updated periodically by the department. It gives us verified real-world centre
> names, addresses and contact details. It does not tell us how many seats are free
> right now, so we do not claim that."

## Tests

- `server/data/centres/governmentCentres.test.ts` — district matching (case and
  partial), demo/no-snapshot behaviour, provenance shape, and `normaliseRow`
  guarantees (drops incomplete rows, refuses to fabricate coordinates).
