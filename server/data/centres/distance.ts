// ─── Geodesic distance helper ─────────────────────────────────────────────────
//
// Pure, dependency-free Haversine. Used by the /api/centres endpoint to turn a
// beneficiary's live GPS coordinates into real per-centre distances instead of
// the static `distanceKm` values baked into the demo registry.
//
// The demo registry keeps its hardcoded distances as a fallback for centres
// that have no coordinates, but whenever a centre carries real lat/long AND the
// caller supplied their own location, the computed value wins.

const EARTH_RADIUS_KM = 6371;

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

/**
 * Great-circle distance between two lat/lon pairs, in kilometres.
 * Returns NaN when either coordinate is missing or out of range.
 */
export function haversineKm(
  aLat: number | null | undefined,
  aLon: number | null | undefined,
  bLat: number | null | undefined,
  bLon: number | null | undefined
): number {
  if (
    aLat == null || aLon == null || bLat == null || bLon == null ||
    !Number.isFinite(aLat) || !Number.isFinite(aLon) ||
    !Number.isFinite(bLat) || !Number.isFinite(bLon) ||
    Math.abs(aLat) > 90 || Math.abs(bLat) > 90 ||
    Math.abs(aLon) > 180 || Math.abs(bLon) > 180
  ) {
    return NaN;
  }

  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(Math.max(0, h)));
}

export interface DistanceResult {
  centreId: string;
  centreName: string;
  distanceKm: number | null;
  /** True when the value came from the dataset, false when it was computed. */
  fromDataset: boolean;
}

/**
 * Attach a real distance to every centre. Centres with no coordinates keep
 * their dataset value (or null); centres with coordinates get the computed
 * distance when the caller supplied a location.
 */
export function attachDistances(
  centres: Array<{
    id: string;
    name?: string;
    latitude?: number | null;
    longitude?: number | null;
    distanceKm?: number | null;
  }>,
  userLat: number | null,
  userLon: number | null
): DistanceResult[] {
  return centres.map((c) => {
    const computed = haversineKm(userLat, userLon, c.latitude, c.longitude);
    if (Number.isFinite(computed)) {
      return { centreId: c.id, centreName: c.name || c.id, distanceKm: computed, fromDataset: false };
    }
    return {
      centreId: c.id,
      centreName: c.name || c.id,
      distanceKm: typeof c.distanceKm === 'number' && Number.isFinite(c.distanceKm) ? c.distanceKm : null,
      fromDataset: true,
    };
  });
}