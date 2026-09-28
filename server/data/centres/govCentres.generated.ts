/**
 * GENERATED FILE — do not edit by hand.
 *
 * This module is written by `npm run data:fetch` (scripts/fetch-government-centres.mjs)
 * whenever a real data.gov.in snapshot is pulled. It exists so the server can import
 * the snapshot at compile time instead of reading JSON at runtime.
 *
 * The exported value is `null` until the first successful fetch. `null` means
 * "no real government snapshot has been produced yet" — it is NOT a snapshot with
 * zero records, and it must never be treated as one. The loader in
 * governmentCentres.ts maps `null` to "no data" so the server can fall back to the
 * demo registry with an explicit demo tag instead of presenting an empty dataset
 * as if it were government data.
 */

import type { GovCentreSnapshot } from './govCentres.types';

export const GOV_CENTRES_SNAPSHOT: GovCentreSnapshot | null = null;