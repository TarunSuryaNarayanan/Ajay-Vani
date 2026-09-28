#!/usr/bin/env node
/**
 * Pulls the real government training-centre snapshot from the Open Government
 * Data platform (data.gov.in) and writes it into the repo.
 *
 *   OGD_API_KEY=<your key> npm run data:fetch
 *
 * The key is free: register at https://www.data.gov.in/ and copy the API key
 * from your account. The platform requires it for both the /resource API and
 * the file downloads, so there is no keyless path.
 *
 * Hard rules, because this data is shown to government beneficiaries:
 *   - a missing key, an unconfigured resource UUID, an API error or an empty
 *     result is a loud failure, never a silent fallback;
 *   - a good existing snapshot is never overwritten by an empty one;
 *   - nothing is invented. No coordinates, phone numbers, vacancies, wages or
 *     QP codes are ever synthesised.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { normaliseRow } from '../server/data/centres/normalise.ts';

dotenv.config();

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH =
  process.argv.includes('--config')
    ? path.resolve(ROOT, process.argv[process.argv.indexOf('--config') + 1])
    : path.join(ROOT, 'scripts', 'government-datasets.config.json');
const SNAPSHOT_JSON = path.join(ROOT, 'server', 'data', 'centres', 'govCentresSnapshot.json');
const SNAPSHOT_TS = path.join(ROOT, 'server', 'data', 'centres', 'govCentres.generated.ts');

const PAGE_SIZE = 1000;
const MAX_ROWS = 20000;

function fail(message) {
  console.error(`\n[data:fetch] FAILED — ${message}\n`);
  process.exit(1);
}

function parseCsv(text) {
  // Minimal RFC4180 parser: handles quoted fields and embedded commas.
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    if (row.some((cell) => cell !== '')) rows.push(row);
  }
  if (!rows.length) return [];

  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) =>
    header.reduce((acc, headerCell, idx) => {
      acc[headerCell] = (cells[idx] ?? '').trim();
      return acc;
    }, {})
  );
}

/**
 * Read a local CSV/JSON file and return raw row objects.
 * Used by `npm run data:fetch:local` for offline snapshots that were
 * downloaded manually (e.g. when the data.gov.in API tab is unreachable).
 */
async function fetchLocalFile(filePath) {
  const text = await readFile(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.records)) return parsed.records;
    if (parsed && Array.isArray(parsed.rows)) return parsed.rows;
    throw new Error('local JSON is not an array or {records:[...]} shape');
  }
  return parseCsv(text);
}

async function fetchAllRecords(resourceUuid, apiKey, apiBase) {
  const records = [];
  let offset = 0;
  let lastUpdated = null;
  let meta = {};

  while (records.length < MAX_ROWS) {
    const url =
      `${apiBase}/resource/${resourceUuid}` +
      `?api-key=${encodeURIComponent(apiKey)}&format=json&limit=${PAGE_SIZE}&offset=${offset}`;

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const body = await res.text();

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${url} — ${body.slice(0, 200)}`);
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      throw new Error(`Response was not JSON (first 120 bytes): ${body.slice(0, 120)}`);
    }

    if (payload.error) {
      throw new Error(`API error: ${payload.error}`);
    }

    if (!Array.isArray(payload.records)) {
      throw new Error(
        `Response has no "records" array. Keys: ${Object.keys(payload).join(', ')}`
      );
    }

    if (!meta.title) {
      meta = {
        title: payload.title || '',
        updated: payload.updated_date || null,
        updatedEpoch: payload.updated || null,
        org: Array.isArray(payload.org) ? payload.org.join(', ') : payload.org || '',
        total: typeof payload.total === 'number' ? payload.total : null,
      };
    }
    if (!lastUpdated && meta.updated) lastUpdated = meta.updated;

    records.push(...payload.records);
    if (payload.records.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return { records, lastUpdated, meta };
}

async function main() {
  const apiKey = process.env[process.env.OGD_KEY_VAR || 'OGD_API_KEY'];
  const useLocal = process.argv.includes('--local');
  const discoverUuid = (() => {
    const i = process.argv.indexOf('--discover');
    return i >= 0 ? process.argv[i + 1] : null;
  })();

  const config = JSON.parse(await readFile(CONFIG_PATH, 'utf8'));

  // --discover <uuid>: fetch one page and print the real field names so the
  // fieldMap in the config can be validated before a fetch is attempted. This
  // is the only mode that works without a configured dataset entry.
  if (discoverUuid) {
    if (!apiKey) {
      fail(
        '--discover still needs an OGD_API_KEY: the /resource endpoint refuses ' +
          'requests without one ("Authorization field missing").'
      );
    }
    const apiBase = config._apiBase || 'https://api.data.gov.in';
    const url =
      `${apiBase}/resource/${discoverUuid}` +
      `?api-key=${encodeURIComponent(apiKey)}&format=json&limit=5`;
    let body;
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      body = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
    } catch (err) {
      fail(`discover ${discoverUuid}: ${err.message}`);
    }
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      fail(`discover ${discoverUuid}: response was not JSON: ${body.slice(0, 120)}`);
    }
    if (payload.error) fail(`discover ${discoverUuid}: API error: ${payload.error}`);
    const records = Array.isArray(payload.records) ? payload.records : [];
    console.log(`\n[data:fetch] discover ${discoverUuid}`);
    console.log(`  title   : ${payload.title || '(none)'}`);
    console.log(`  updated : ${payload.updated_date || payload.updated || '(none)'}`);
    console.log(`  total   : ${typeof payload.total === 'number' ? payload.total : '(unknown)'}`);
    console.log(`  fields  : ${(Array.isArray(payload.fields) ? payload.fields : []).map((f) => f.id || f.name).join(', ') || '(no field metadata)'}`);
    if (records.length) {
      console.log(`  sample row keys: ${Object.keys(records[0]).join(', ')}`);
      console.log(`  sample row: ${JSON.stringify(records[0]).slice(0, 400)}`);
    } else {
      console.log('  (no records returned — the UUID may be wrong or the key lacks access)');
    }
    console.log();
    return;
  }

  const apiBase = config._apiBase || 'https://api.data.gov.in';

  const configured = (config.datasets || []).filter(
    (d) => (d.resourceUuid || '').trim() || (d.localFile || '').trim()
  );
  const missing = (config.datasets || []).filter(
    (d) => !(d.resourceUuid || '').trim() && !(d.localFile || '').trim()
  );

  if (!useLocal && !configured.length) {
    fail(
      'No dataset in scripts/government-datasets.config.json has a resourceUuid.\n' +
        `  ${missing.length} dataset(s) are configured but unverified. Open the dataset page on\n` +
        '  data.gov.in, click the API tab, and copy the resource UUID from\n' +
        '  https://www.data.gov.in/resource/<uuid>?api-key=YOUR_KEY into the config.\n' +
        '  (config._uuidGuidance explains this in full.)'
    );
  }

  if (useLocal && !apiKey) {
    // Local mode still wants the key present so the same script path is used,
    // but it does not need to hit the network. Accept the key-less local run.
    process.stdout.write('[data:fetch] --local mode: reading CSVs from disk, no network calls.\n');
  } else if (!apiKey) {
    fail(
      'OGD_API_KEY is not set.\n' +
        '  data.gov.in requires a free API key for every dataset.\n' +
        '  Register at https://www.data.gov.in/ , copy your key, then run:\n' +
        '      OGD_API_KEY=<key> npm run data:fetch'
    );
  }

  const allRecords = [];
  const usedDatasets = [];
  let lastUpdated = null;

  for (const dataset of configured) {
    process.stdout.write(`[data:fetch] ${dataset.name} — ${dataset.title}\n`);

    let rows;
    if (useLocal) {
      const localPath = dataset.localFile
        ? path.resolve(ROOT, dataset.localFile)
        : null;
      if (!localPath || !existsSync(localPath)) {
        fail(
          `${dataset.name}: --local mode but no localFile for this dataset ` +
            `(looked for ${localPath || 'no path set'}).`
        );
      }
      try {
        rows = await fetchLocalFile(localPath);
      } catch (err) {
        fail(`${dataset.name}: could not read local file ${localPath}: ${err.message}`);
      }
      if (!lastUpdated) lastUpdated = dataset.lastUpdated || null;
    } else {
      let result;
      try {
        result = await fetchAllRecords(dataset.resourceUuid, apiKey, apiBase);
      } catch (err) {
        fail(`${dataset.name}: ${err.message}`);
      }
      rows = result.records;
      if (!lastUpdated && result.lastUpdated) lastUpdated = result.lastUpdated;
    }

    const stateFilter = (dataset.stateFilter || []).map((s) => s.toLowerCase());
    const districtFilter = (dataset.districtFilter || []).map((d) => d.toLowerCase());

    let kept = 0;
    for (const row of rows) {
      const centre = normaliseRow(row, dataset.fieldMap, dataset.title, dataset.resourceUuid || `local:${dataset.name}`);
      if (!centre) continue;
      if (stateFilter.length && !stateFilter.includes(centre.state.toLowerCase())) continue;
      if (districtFilter.length && !districtFilter.includes(centre.district.toLowerCase())) continue;
      allRecords.push(centre);
      kept += 1;
    }

    usedDatasets.push({
      name: dataset.name,
      resourceId: dataset.resourceUuid || `local:${dataset.localFile || dataset.name}`,
      records: kept,
    });
    process.stdout.write(`           ${kept} usable record(s) after district/state filter\n`);
  }

  if (!allRecords.length) {
    fail(
      'The API returned rows but none survived normalisation/filtering.\n' +
        '  Refusing to write an empty snapshot over existing data. Check the fieldMap\n' +
        '  candidates in the config against the real field names in the API response.'
    );
  }

  const snapshot = {
    provenance: {
      fetchedAt: new Date().toISOString(),
      publisher: usedDatasets.map((d) => d.name).join('+'),
      datasetTitle: usedDatasets.map((d) => d.name).join(' + '),
      resourceId: usedDatasets.map((d) => d.resourceId).join(','),
      sourceUrl: `https://api.data.gov.in/resource/${usedDatasets.map((d) => d.resourceId).join(',')}`,
      lastUpdated,
      licence: 'Government Open Data License – India (GODL)',
      recordCount: allRecords.length,
      filtersApplied: {
        states: [...new Set(allRecords.map((r) => r.state).filter(Boolean))],
        districts: [...new Set(allRecords.map((r) => r.district).filter(Boolean))],
      },
    },
    records: allRecords,
  };

  await writeFile(SNAPSHOT_JSON, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  const tsModule = `/**
 * GENERATED FILE — written by \`npm run data:fetch\`. Do not edit by hand.
 *
 * Source: Open Government Data platform (data.gov.in)
 * Fetched: ${snapshot.provenance.fetchedAt}
 * Dataset last updated: ${lastUpdated || 'unknown'}
 * Licence: ${snapshot.provenance.licence}
 * Records: ${allRecords.length}
 *
 * This is a periodic snapshot, not a live feed. Re-run the fetch script to refresh.
 */
import type { GovCentreSnapshot } from './govCentres.types';

export const GOV_CENTRES_SNAPSHOT: GovCentreSnapshot = ${JSON.stringify(snapshot)};
`;

  await writeFile(SNAPSHOT_TS, tsModule, 'utf8');

  console.log(
    `\n[data:fetch] OK — ${allRecords.length} real centre record(s) written.\n` +
      `  districts: ${snapshot.provenance.filtersApplied.districts.join(', ') || 'none'}\n` +
      `  snapshot last updated by publisher: ${lastUpdated || 'not reported'}\n` +
      `  ${SNAPSHOT_JSON}\n  ${SNAPSHOT_TS}\n`
  );
}

if (existsSync(SNAPSHOT_JSON)) {
  // Only informational: an existing snapshot is protected by the empty-result
  // guard inside main(), which exits before any write.
  console.log('[data:fetch] existing snapshot found; it will only be replaced on success.');
}

main().catch((err) => fail(err?.stack || String(err)));
