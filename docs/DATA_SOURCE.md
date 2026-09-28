# Centre data — where it comes from

## The short version

The skill-development centres the app shows are meant to be **real records from the
Open Government Data platform (data.gov.in)**, refreshed by hand, not a live feed.

Right now **no snapshot is committed** in this repository. Until one is fetched, the
app falls back to a small built-in demo registry and labels every row
`dataSource: 'demo'`, and the UI shows a red "Demo data" banner saying so. That is
deliberate: the demo registry contains hand-written centres with plausible-looking
coordinator names and phone numbers, and passing those off as government data to a
judge or a beneficiary would be a false claim.

## Getting a real snapshot

data.gov.in requires a **free API key** for every dataset — the `/resource` API and
the file downloads both return `Authorization field missing` without one.

1. Register at <https://www.data.gov.in/> and copy your API key.
2. Open the dataset page you want (e.g. an MSDE/NSDC PMKVY or ITI centre listing),
   click the **API** tab, and copy the resource UUID out of
   `https://www.data.gov.in/resource/<uuid>?api-key=YOUR_KEY`.
3. Paste that UUID into `scripts/government-datasets.config.json` (the
   `resourceUuid` field of the matching dataset). The `fieldMap` next to it lists
   the candidate column names; adjust if the real headers differ.
4. Fetch:

```bash
OGD_API_KEY=<your key> npm run data:fetch
```

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
