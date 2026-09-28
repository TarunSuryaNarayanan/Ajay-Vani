// Pure, dependency-free normaliser shared by the fetcher and the unit tests.
// It knows nothing about the network: it takes one raw CSV/JSON row plus the
// fieldMap of the dataset it came from and returns the canonical GovCentre shape,
// or null when the row is unusable (no centre name, no district).

export interface FieldMap {
  centreName: string[];
  scheme: string[];
  trade: string[];
  state: string[];
  district: string[];
  address: string[];
  pincode: string[];
  latitude: string[];
  longitude: string[];
  coordinatorName: string[];
  phone: string[];
  email: string[];
  lastUpdated: string[];
}

export interface RawRow {
  [key: string]: unknown;
}

export interface GovCentre {
  centreName: string;
  scheme: string;
  trade?: string;
  state: string;
  district: string;
  address?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  coordinatorName?: string;
  phone?: string;
  email?: string;
  sourceRow: RawRow;
  sourceDataset: string;
  sourceResourceId: string;
}

const SCHEME_ALIASES: Record<string, string> = {
  pmkvy: 'PMKVY', 'pradhan mantri kaushal vikas yojana': 'PMKVY',
  pmkk: 'PMKK', 'pradhan mantri kaushal kendra': 'PMKK',
  iti: 'ITI', 'industrial training institute': 'ITI',
  sdc: 'SDC', 'skill development centre': 'SDC', 'skill development center': 'SDC',
  naps: 'NAPS', jss: 'JSS',
};

function pick(row: RawRow, keys: string[] | undefined): string | undefined {
  if (!row || typeof row !== 'object') return undefined;
  // A config entry does not have to map every field; a missing list means the
  // dataset has no such column, which is not an error.
  if (!Array.isArray(keys)) return undefined;
  for (const key of keys) {
    if (typeof key !== 'string' || !key) continue;
    const direct = row[key];
    if (typeof direct === 'string' && direct.trim()) return direct.trim();
    // OGD CSV JSON often lower-cases keys; do a case-insensitive fallback scan.
    const lowerKey = key.toLowerCase();
    for (const [k, v] of Object.entries(row)) {
      if (k.toLowerCase() === lowerKey && typeof v === 'string' && v.trim()) return v.trim();
    }
  }
  return undefined;
}

function toNumber(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function normaliseScheme(raw: string | undefined): string {
  if (!raw) return '';
  const key = raw.toLowerCase().replace(/[-_:]/g, ' ');
  for (const [alias, canonical] of Object.entries(SCHEME_ALIASES)) {
    if (key.includes(alias)) return canonical;
  }
  // Unknown scheme: keep the raw value verbatim rather than inventing PMKVY.
  return raw.trim();
}

function cleanDistrict(raw: string | undefined): string {
  if (!raw) return '';
  // Strip a trailing state token like "Varanasi, Uttar Pradesh" -> "Varanasi".
  return raw.split(/[,;]/)[0].trim();
}

/**
 * Normalise one raw row into a GovCentre, or null when the row cannot be used.
 * Rules:
 *  - drop rows with no district or no centre name
 *  - never invent coordinates, phone numbers, openings, wages, benefits or QP codes
 *  - qpCode is deliberately NOT part of the canonical shape: we only carry it
 *    when the source genuinely contains it (and even then we do not claim it
 *    is an NSQF code we verified).
 */
export function normaliseRow(
  row: RawRow,
  fieldMap: FieldMap,
  sourceDataset: string,
  sourceResourceId: string
): GovCentre | null {
  const centreName = pick(row, fieldMap.centreName);
  const district = cleanDistrict(pick(row, fieldMap.district));
  if (!centreName || !district) return null;

  const latitude = toNumber(pick(row, fieldMap.latitude) as unknown);
  const longitude = toNumber(pick(row, fieldMap.longitude) as unknown);
  // Guard against obviously invalid lat/long so we never render 0,0 as a real centre.
  const validLat = latitude !== undefined && Math.abs(latitude) <= 90 ? latitude : undefined;
  const validLon = longitude !== undefined && Math.abs(longitude) <= 180 ? longitude : undefined;

  return {
    centreName,
    scheme: normaliseScheme(pick(row, fieldMap.scheme)),
    trade: pick(row, fieldMap.trade),
    state: pick(row, fieldMap.state) || '',
    district,
    address: pick(row, fieldMap.address),
    pincode: pick(row, fieldMap.pincode),
    latitude: validLat,
    longitude: validLon,
    coordinatorName: pick(row, fieldMap.coordinatorName),
    phone: pick(row, fieldMap.phone),
    email: pick(row, fieldMap.email),
    sourceRow: row,
    sourceDataset,
    sourceResourceId,
  };
}