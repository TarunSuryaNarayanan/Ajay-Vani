// Snapshot loader + query helpers for the government training-centre dataset.
// The snapshot is produced by `npm run data:fetch` (scripts/fetch-government-centres.mjs)
// and committed as a generated TS module so the server can import it without a
// runtime JSON read. When no snapshot has been produced yet, the loader reports
// that explicitly — it never falls back to demo data on its own.

import { GovCentreSnapshot, GovCentre, SnapshotProvenance } from './govCentres.types';
import { GOV_CENTRES_SNAPSHOT } from './govCentres.generated';

export const SNAPSHOT_SOURCE = 'data.gov.in' as const;

export function getSnapshot(): GovCentreSnapshot | null {
  return GOV_CENTRES_SNAPSHOT ?? null;
}

export function getSnapshotProvenance(): SnapshotProvenance | null {
  const snap = getSnapshot();
  return snap ? snap.provenance : null;
}

/** Case- and whitespace-insensitive district matching with partial support. */
export function matchDistrict(records: GovCentre[], district: string): GovCentre[] {
  if (!district || !district.trim()) return [];
  const q = district.trim().toLowerCase();
  return records.filter((r) => {
    const d = (r.district || '').toLowerCase();
    if (!d) return false;
    return d === q || d.includes(q) || q.includes(d);
  });
}

export interface SearchOptions {
  scheme?: string;
  limit?: number;
}

/**
 * Search the snapshot for centres in a district. Returns an object whose
 * `source` field is always 'data.gov.in' when a snapshot exists — the caller
 * decides whether to fall back to the demo registry and must tag those rows
 * itself (see server/index.ts GET /api/centres).
 */
export function searchGovernmentCentres(
  district: string,
  options: SearchOptions = {}
): {
  found: boolean;
  source: 'data.gov.in';
  provenance: SnapshotProvenance | null;
  centres: GovCentre[];
} {
  const snap = getSnapshot();
  if (!snap || !snap.records.length) {
    return {
      found: false,
      source: 'data.gov.in',
      provenance: null,
      centres: [],
    };
  }

  let results = matchDistrict(snap.records, district);
  if (options.scheme) {
    const scheme = options.scheme.toLowerCase();
    results = results.filter((r) => (r.scheme || '').toLowerCase().includes(scheme));
  }
  if (options.limit && options.limit > 0) results = results.slice(0, options.limit);

  return {
    found: results.length > 0,
    source: 'data.gov.in',
    provenance: snap.provenance,
    centres: results,
  };
}