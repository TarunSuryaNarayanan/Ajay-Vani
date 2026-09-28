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

// ─── Path B: local training/certification partner lookup ─────────────────────

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

export const JOB_MATCH_LABELS = {
  certified: CERTIFIED_MATCH_BONUS,
  related: DISTRICT_RELATED,
};

/**
 * Path B. What this can honestly return is the list of training/certification
 * partners in the district for the beneficiary's trade, with their real contact
 * details — NOT job vacancies.
 *
 * A centre dataset carries no vacancy counts, no wage bands and no hiring
 * employer, so those are deliberately left null instead of being derived from
 * course duration or NSQF level. Showing "12 vacancies, ₹22,000/month" next to a
 * real-looking centre would be inventing facts in front of a government
 * beneficiary, so the UI renders the null case explicitly.
 */
export function queryLocalEmployers(params: {
  district: string;
  qpCode: string;
  nsqfLevel?: number;
}): {
  district: string;
  openings: PostTrainingJobOpening[];
  exactMatches: number;
  liveVacancyData: false;
  notice: string;
} {
  const districtData = resolveDistrictData(params.district);
  const qpCode = (params.qpCode || '').trim();

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
      // Not present in a centre dataset. Left null on purpose — see above.
      vacancies: null,
      monthlyStipend: null,
      contactPhone: center.coordinatorPhone,
      address: center.address,
      distanceKm: center.distanceKm ?? 0,
      isCertifiedMatch,
      dataSource: 'demo',
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
    liveVacancyData: false,
    notice:
      'This list shows training and certification partners in your district, not live job vacancies. Vacancy counts and wages are not published in this dataset.',
  };
}
