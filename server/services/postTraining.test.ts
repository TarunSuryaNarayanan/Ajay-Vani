/**
 * Tests for the F3 post-training backend: the Day-90 gate, the completion
 * ledger, and the Path B employer query that ranks certified NSQF matches first.
 */

import { describe, it, expect } from 'vitest';
import {
  POST_TRAINING_DAY_GATE,
  daysSince,
  getCourseCompletion,
  isPostTrainingEligible,
  markCourseCompleted,
  queryLocalEmployers,
} from './postTraining';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

describe('Day-90 gate', () => {
  it('is false without a completion timestamp', () => {
    expect(isPostTrainingEligible(null, NOW)).toBe(false);
  });

  it('is false inside the window and true at the boundary', () => {
    expect(isPostTrainingEligible(NOW - (POST_TRAINING_DAY_GATE * DAY_MS) + 1, NOW)).toBe(false);
    expect(isPostTrainingEligible(NOW - POST_TRAINING_DAY_GATE * DAY_MS, NOW)).toBe(true);
    expect(isPostTrainingEligible(NOW - 120 * DAY_MS, NOW)).toBe(true);
  });

  it('reports elapsed days, and null for an unfinished course', () => {
    expect(daysSince(NOW - 100 * DAY_MS, NOW)).toBe(100);
    expect(daysSince(null, NOW)).toBeNull();
  });
});

describe('course completion ledger', () => {
  it('records and retrieves a completion', () => {
    const record = markCourseCompleted({
      beneficiaryId: '999988887777',
      nsqfQpCode: 'ELE/Q5901',
      district: 'Varanasi',
      completedAt: NOW,
    });
    expect(record.completedAt).toBe(NOW);
    expect(getCourseCompletion('999988887777')).toEqual(record);
  });

  it('returns null for a beneficiary who never completed', () => {
    expect(getCourseCompletion('000000000000')).toBeNull();
  });
});

describe('queryLocalEmployers (Path B)', () => {
  it('ranks the centre matching the beneficiary qpCode first', () => {
    const result = queryLocalEmployers({ district: 'Varanasi', qpCode: 'AMH/Q0101', nsqfLevel: 3 });
    expect(result.district).toBe('Varanasi');
    expect(result.exactMatches).toBe(1);
    expect(result.openings[0].isCertifiedMatch).toBe(true);
    expect(result.openings[0].nsqfQpCode).toBe('AMH/Q0101');
  });

  it('falls back to district openings when nothing matches the code', () => {
    const result = queryLocalEmployers({ district: 'Varanasi', qpCode: 'ZZZ/Q9999' });
    expect(result.exactMatches).toBe(0);
    expect(result.openings.length).toBeGreaterThan(0);
    expect(result.openings.every((o) => o.isCertifiedMatch === false)).toBe(true);
  });

  it('resolves the district case-insensitively and defaults to Varanasi', () => {
    expect(queryLocalEmployers({ district: 'gorakhpur', qpCode: '' }).district).toBe('Gorakhpur');
    expect(queryLocalEmployers({ district: 'Atlantis', qpCode: '' }).district).toBe('Varanasi');
  });

  it('carries the call and dial details the UI needs', () => {
    const result = queryLocalEmployers({ district: 'Varanasi', qpCode: 'ELE/Q5901', nsqfLevel: 4 });
    for (const opening of result.openings) {
      expect(opening.contactPhone).toMatch(/^\+91/);
      expect(opening.address.length).toBeGreaterThan(0);
      expect(opening.distanceKm).toBeGreaterThanOrEqual(0);
    }
  });

  it('never invents vacancy counts or wage bands', () => {
    // A training-centre dataset publishes no vacancies and no wages, so the API
    // must not manufacture them from course duration or NSQF level.
    for (const level of [1, 2, 3, 4]) {
      const result = queryLocalEmployers({ district: 'Varanasi', qpCode: 'ELE/Q5901', nsqfLevel: level });
      for (const opening of result.openings) {
        expect(opening.vacancies).toBeNull();
        expect(opening.monthlyStipend).toBeNull();
      }
    }
  });

  it('flags the missing live vacancy data and tags the data source', () => {
    const result = queryLocalEmployers({ district: 'Varanasi', qpCode: 'ELE/Q5901' });
    expect(result.liveVacancyData).toBe(false);
    expect(result.notice).toMatch(/not live job vacancies/i);
    expect(result.openings.every((o) => o.dataSource === 'demo')).toBe(true);
  });
});
