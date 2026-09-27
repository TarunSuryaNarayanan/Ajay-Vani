import { describe, it, expect } from 'vitest';
import {
  buildGrievanceMetadata,
  daysSinceCompletion,
  daysUntilPostTraining,
  isPostTrainingEligible,
  isValidWhatsAppNumber,
  landingScreenFor,
  simulateDay90Window,
  GRIEVANCE_ISSUE_OPTIONS,
  POST_TRAINING_DAY_GATE,
} from './governance';
import { AadhaarSession, SkillingCenter, VoiceProcessResult } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

function session(overrides: Partial<AadhaarSession> = {}): AadhaarSession {
  return {
    aadhaarNumber: '999988887777',
    maskedAadhaar: 'XXXX XXXX 7777',
    isVerified: true,
    beneficiaryName: 'रमेश कुमार',
    scCategoryVerified: true,
    district: 'Varanasi',
    grantStep: 3,
    stipendDaysAttended: 30,
    stipendTotalEarned: 4500,
    courseCompleted: false,
    completedAt: null,
    lifecycleEnrolledAt: null,
    whatsappNumber: null,
    ...overrides,
  };
}

const centers: SkillingCenter[] = [
  {
    id: 'ctr-vns-1',
    name: 'Government ITI Karaundi',
    nameHi: 'राजकीय आईटीआई करौंदी',
    district: 'Varanasi',
    latitude: 0,
    longitude: 0,
    distanceKm: 5,
    courseName: 'Solar PV (ELE/Q5901)',
    courseNameHi: 'सोलर पीवी',
    durationHours: 300,
    benefits: [],
    benefitsHi: [],
    coordinatorName: 'X',
    coordinatorPhone: '+91 90000 00000',
    address: 'Karaundi',
    addressHi: 'करौंदी',
    qpCode: 'ELE/Q5901',
  },
  {
    id: 'ctr-vns-3',
    name: 'ITI Chauka Ghat',
    nameHi: 'आईटीआई चौकाघाट',
    district: 'Varanasi',
    latitude: 0,
    longitude: 0,
    distanceKm: 3,
    courseName: 'Zari (AMH/Q0101)',
    courseNameHi: 'जरी',
    durationHours: 300,
    benefits: [],
    benefitsHi: [],
    coordinatorName: 'Y',
    coordinatorPhone: '+91 90000 00001',
    address: 'Chauka Ghat',
    addressHi: 'चौकाघाट',
    qpCode: 'AMH/Q0101',
  },
];

describe('isPostTrainingEligible', () => {
  it('is false while the course is in progress (completedAt is null)', () => {
    expect(isPostTrainingEligible(session({ courseCompleted: false, completedAt: null }), NOW)).toBe(false);
    expect(isPostTrainingEligible(null, NOW)).toBe(false);
  });

  it('is false when courseCompleted is false even with a timestamp', () => {
    expect(isPostTrainingEligible(session({ courseCompleted: false, completedAt: NOW }), NOW)).toBe(false);
  });

  it('opens exactly at the Day 90 gate, not before', () => {
    const justBefore = NOW - (POST_TRAINING_DAY_GATE * DAY_MS) + 1;
    const exactly = NOW - POST_TRAINING_DAY_GATE * DAY_MS;
    expect(isPostTrainingEligible(session({ courseCompleted: true, completedAt: justBefore }), NOW)).toBe(false);
    expect(isPostTrainingEligible(session({ courseCompleted: true, completedAt: exactly }), NOW)).toBe(true);
  });
});

describe('landingScreenFor', () => {
  it('keeps the legacy dashboard as the fallback for everyone else', () => {
    expect(landingScreenFor(null)).toBe('beneficiary-dashboard');
    expect(landingScreenFor(session({ courseCompleted: true, completedAt: NOW }), NOW)).toBe(
      'beneficiary-dashboard'
    );
  });

  it('routes certified Day-90+ beneficiaries into the second loop', () => {
    expect(landingScreenFor(session({ courseCompleted: true, completedAt: NOW - 91 * DAY_MS }), NOW)).toBe(
      'post-training-guidance'
    );
  });
});

describe('day counters', () => {
  it('reports elapsed days and remaining days to the gate', () => {
    expect(daysSinceCompletion(NOW - 100 * DAY_MS, NOW)).toBe(100);
    expect(daysSinceCompletion(null, NOW)).toBeNull();
    expect(daysUntilPostTraining(session({ completedAt: NOW - 80 * DAY_MS }), NOW)).toBe(10);
    expect(daysUntilPostTraining(session({ completedAt: NOW - 95 * DAY_MS }), NOW)).toBe(0);
    expect(daysUntilPostTraining(session(), NOW)).toBe(POST_TRAINING_DAY_GATE);
  });

  it('simulates a past Day-90 window', () => {
    expect(simulateDay90Window(NOW, NOW)).toBeLessThanOrEqual(NOW - POST_TRAINING_DAY_GATE * DAY_MS);
  });
});

describe('buildGrievanceMetadata', () => {
  it('auto-tags beneficiary id, district and the matching training centre', () => {
    const result = {
      recommendedNSQF: { qpCode: 'AMH/Q0101' },
      districtMarket: { centers },
    } as unknown as VoiceProcessResult;

    const meta = buildGrievanceMetadata({ session: session(), result, selectedDistrict: 'Varanasi' });
    expect(meta.beneficiaryId).toBe('999988887777');
    expect(meta.district).toBe('Varanasi');
    expect(meta.trainingCenterId).toBe('ctr-vns-3');
    expect(meta.nsqfQpCode).toBe('AMH/Q0101');
    expect(meta.aadhaarMasked).toBe('XXXX XXXX 7777');
  });

  it('falls back to the first centre when no QP match exists', () => {
    const meta = buildGrievanceMetadata({ session: session(), result: null, selectedDistrict: 'Varanasi', centers });
    expect(meta.trainingCenterId).toBe('ctr-vns-1');
  });

  it('still produces all mandated fields with no session and no centres', () => {
    const meta = buildGrievanceMetadata({ session: null, result: null, selectedDistrict: 'Gorakhpur' });
    expect(meta.beneficiaryId).toBe('unknown-beneficiary');
    expect(meta.district).toBe('Gorakhpur');
    expect(meta.trainingCenterId).toBe('unassigned');
  });
});

describe('grievance categories and phone validation', () => {
  it('exposes the corruption categories required by the spec', () => {
    const values = GRIEVANCE_ISSUE_OPTIONS.map((o) => o.value);
    expect(values).toContain('trainer-absent');
    expect(values).toContain('extortion');
    expect(values).toContain('missing-toolkit');
  });

  it('accepts 10-digit and +91 numbers only', () => {
    expect(isValidWhatsAppNumber('9452018290')).toBe(true);
    expect(isValidWhatsAppNumber('+91 94520 18290')).toBe(true);
    expect(isValidWhatsAppNumber('12345')).toBe(false);
    expect(isValidWhatsAppNumber('')).toBe(false);
  });
});
