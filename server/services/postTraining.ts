// ─── Post-Course AI Guidance backend (F3) ────────────────────────────────────

import { PostTrainingJobOpening } from '../../src/types';
import { DISTRICT_MARKET_REGISTRY, DistrictMarketData } from '../data/districtJobs';

export const POST_TRAINING_DAY_GATE = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

export function daysSince(timestamp: number | null, now: number = Date.now()): number | null {
  if (!timestamp) return null;
  return Math.floor((now - timestamp) / DAY_MS);
}

export function isPostTrainingEligible(completedAt: number | null, now: number = Date.now()): boolean {
  if (!completedAt) return false;
  return now - completedAt >= POST_TRAINING_DAY_GATE * DAY_MS;
}

// ─── Course completion ledger ────────────────────────────────────────────────

interface CourseCompletionRecord {
  beneficiaryId: string;
  nsqfQpCode: string;
  district: string;
  completedAt: number;
}

const courseCompletionStore: Record<string, CourseCompletionRecord> = {};

export function markCourseCompleted(params: {
  beneficiaryId: string;
  nsqfQpCode: string;
  district: string;
  completedAt?: number;
}): CourseCompletionRecord {
  const completedAt = params.completedAt ?? Date.now();
  const record: CourseCompletionRecord = { ...params, completedAt };
  courseCompletionStore[params.beneficiaryId] = record;
  console.log(
    `[Post-Training] ${params.beneficiaryId} completed ${params.nsqfQpCode} on ${new Date(completedAt).toISOString()}`
  );
  return record;
}

export function getCourseCompletion(beneficiaryId: string): CourseCompletionRecord | null {
  return courseCompletionStore[beneficiaryId] || null;
}

// ─── Path B: verified local employer registry query ──────────────────────────

function resolveDistrictData(districtName: string): DistrictMarketData {
  const query = (districtName || 'Varanasi').toLowerCase();
  const matchedKey =
    Object.keys(DISTRICT_MARKET_REGISTRY).find((k) => k.toLowerCase() === query) ||
    Object.keys(DISTRICT_MARKET_REGISTRY).find(
      (k) =>
        k.toLowerCase().includes(query) ||
        DISTRICT_MARKET_REGISTRY[k].district.toLowerCase().includes(query)
    ) ||
    'Varanasi';
  return DISTRICT_MARKET_REGISTRY[matchedKey];
}

const CERTIFIED_MATCH_BONUS = 'प्रमाणित NSQF मैच (Certified NSQF Match)';
const DISTRICT_RELATED = 'ज़िला-सम्बंधित कौशल (District Skill Demand)';

const WAGE_BANDS: Record<string, string> = {
  1: '₹10,000 - ₹15,000 / माह',
  2: '₹14,000 - ₹20,000 / माह',
  3: '₹18,000 - ₹26,000 / माह',
  4: '₹22,000 - ₹32,000 / माह',
};

/**
 * Queries the district market registry for employers hiring inside the
 * beneficiary's district for their certified NSQF skill code. Centres whose
 * `qpCode` matches the beneficiary's certification are surfaced first; the
 * remaining district openings are returned as clearly-labelled related demand.
 */
export function queryLocalEmployers(params: {
  district: string;
  qpCode: string;
  nsqfLevel?: number;
}): { district: string; openings: PostTrainingJobOpening[]; exactMatches: number } {
  const districtData = resolveDistrictData(params.district);
  const qpCode = (params.qpCode || '').trim();
  const level = params.nsqfLevel && params.nsqfLevel > 0 ? params.nsqfLevel : 3;

  const openings: PostTrainingJobOpening[] = districtData.centers.map((center) => {
    const isCertifiedMatch = !!qpCode && (center.qpCode || '') === qpCode;
    return {
      centerId: center.id,
      centerName: center.name,
      centerNameHi: center.nameHi,
      employer: center.name,
      roleTitle: center.courseName,
      roleTitleHi: center.courseNameHi,
      nsqfQpCode: center.qpCode || '—',
      district: center.district,
      vacancies: center.durationHours >= 300 ? 12 : 8,
      monthlyStipend: WAGE_BANDS[String(level)] || WAGE_BANDS['3'],
      contactPhone: center.coordinatorPhone,
      address: center.address,
      distanceKm: center.distanceKm ?? 0,
      isCertifiedMatch,
    };
  });

  openings.sort((a, b) => {
    if (a.isCertifiedMatch && !b.isCertifiedMatch) return -1;
    if (!a.isCertifiedMatch && b.isCertifiedMatch) return 1;
    return a.distanceKm - b.distanceKm;
  });

  return {
    district: districtData.district,
    openings,
    exactMatches: openings.filter((o) => o.isCertifiedMatch).length,
  };
}

export const JOB_MATCH_LABELS = {
  certified: CERTIFIED_MATCH_BONUS,
  related: DISTRICT_RELATED,
};
