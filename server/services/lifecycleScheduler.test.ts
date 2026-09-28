/**
 * Tests for the F2 lifecycle scheduler: due-date maths, one-shot dispatch per
 * key, and inbound replies landing on the beneficiary's profile stream.
 *
 * Twilio is stubbed and no credentials are set, so every dispatch takes the
 * documented dry-mode path (recorded as `failed` so the slot retries later).
 * The in-memory enrollment store is module-global, so each test enrolls its own
 * beneficiary id to stay isolated.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('twilio', () => ({
  default: () => ({ messages: { create: vi.fn(async () => ({ sid: 'SM1' })) } }),
}));

import {
  LIFECYCLE_SCHEDULE,
  enrollLifecycle,
  getEnrollment,
  isNudgeDue,
  listEnrollments,
  recordInboundReply,
  runLifecycleSweep,
} from './lifecycleScheduler';
import { LifecycleEnrollment } from '../../src/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

let seq = 0;

// The enrollment store is module-global and every sweep visits all of it, so
// each test gets its own beneficiary id AND its own phone number. That keeps
// both the due-date sweep and inbound-reply matching scoped to one profile.
function uniqueId() {
  seq += 1;
  return `test-bene-${seq}`;
}

function uniquePhone() {
  return `9${String(80000000 + seq).padStart(9, '0')}`;
}

// Id and phone must come from the same counter value, otherwise two profiles in
// the same test can collide on a number.
function nextProfile() {
  const id = uniqueId();
  return { id, phone: uniquePhone() };
}

function enroll(
  overrides: Partial<Parameters<typeof enrollLifecycle>[0]> = {},
  enrolledAt = NOW
): LifecycleEnrollment {
  return enrollLifecycle({
    beneficiaryId: uniqueId(),
    beneficiaryName: 'रमेश कुमार',
    district: 'Varanasi',
    whatsappNumber: uniquePhone(),
    enrolledAt,
    ...overrides,
  });
}

describe('enrollLifecycle', () => {
  it('records the Enroll timestamp and normalises the number', () => {
    const id = uniqueId();
    const enrollment = enrollLifecycle({
      beneficiaryId: id,
      beneficiaryName: 'सीता देवी',
      district: 'Gorakhpur',
      whatsappNumber: '9839144521',
      enrolledAt: NOW,
    });
    expect(enrollment.beneficiaryId).toBe(id);
    expect(enrollment.beneficiaryName).toBe('सीता देवी');
    expect(enrollment.whatsappNumber).toBe('+919839144521');
    expect(enrollment.enrolledAt).toBe(NOW);
    expect(enrollment.messages).toEqual([]);
    expect(getEnrollment(id)).toEqual(enrollment);
  });

  it('re-enrolling keeps the original timestamp so the schedule stays stable', () => {
    const id = uniqueId();
    const first = enrollLifecycle({
      beneficiaryId: id,
      beneficiaryName: 'A',
      district: 'Varanasi',
      whatsappNumber: '9452018290',
      enrolledAt: NOW,
    });
    const again = enrollLifecycle({
      beneficiaryId: id,
      beneficiaryName: 'A',
      district: 'Varanasi',
      whatsappNumber: '98765 43210',
      enrolledAt: NOW + 5 * DAY_MS,
    });
    expect(again).toBe(first);
    expect(again.enrolledAt).toBe(NOW);
    expect(again.whatsappNumber).toBe('+919876543210');
  });

  it('registers a separate profile per beneficiary id', () => {
    const before = listEnrollments().length;
    enroll();
    enroll();
    expect(listEnrollments().length).toBe(before + 2);
  });
});

describe('isNudgeDue', () => {
  const [day45, day90] = LIFECYCLE_SCHEDULE;

  it('is false before the day offset', () => {
    const enrollment = enroll({}, NOW);
    expect(isNudgeDue(enrollment, day45, NOW + 44 * DAY_MS)).toBe(false);
    expect(isNudgeDue(enrollment, day90, NOW + 89 * DAY_MS)).toBe(false);
  });

  it('is true at and after the day offset', () => {
    const enrollment = enroll({}, NOW);
    expect(isNudgeDue(enrollment, day45, NOW + 45 * DAY_MS)).toBe(true);
    expect(isNudgeDue(enrollment, day90, NOW + 90 * DAY_MS)).toBe(true);
  });

  it('is false once that key has already been dispatched', () => {
    const enrollment = enroll({}, NOW);
    enrollment.messages.push({
      messageId: 'm1',
      key: day45.key,
      direction: 'outbound',
      body: 'sent',
      createdAt: NOW,
      deliveredAt: NOW,
      status: 'failed',
    });
    expect(isNudgeDue(enrollment, day45, NOW + 100 * DAY_MS)).toBe(false);
  });
});

describe('runLifecycleSweep', () => {
  it('dispatches the Day-45 nudge exactly once, even across repeated sweeps', async () => {
    const enrollment = enroll({}, NOW);

    await runLifecycleSweep(NOW + 45 * DAY_MS);
    await runLifecycleSweep(NOW + 46 * DAY_MS);

    const day45 = enrollment.messages.filter((m) => m.key === 'day-45-checkin');
    expect(day45).toHaveLength(1);
    expect(day45[0].direction).toBe('outbound');
    // No credentials in tests: the send is skipped but the slot stays retryable.
    expect(day45[0].status).toBe('failed');
    expect(day45[0].error).toBe('not-configured');
    expect(day45[0].body).toContain(enrollment.beneficiaryName);
  });

  it('fires the Day-90 nudge only after both offsets have passed', async () => {
    const enrollment = enroll({}, NOW);

    await runLifecycleSweep(NOW + 45 * DAY_MS);
    expect(enrollment.messages.filter((m) => m.key === 'day-90-completion')).toHaveLength(0);

    await runLifecycleSweep(NOW + 90 * DAY_MS);
    const day90 = enrollment.messages.filter((m) => m.key === 'day-90-completion');
    expect(day90).toHaveLength(1);
    expect(day90[0].body).toContain('AJAY-VANI');
    expect(day90[0].body).toContain('₹50,000');
  });

  it('leaves lastNudgeAt unset when nothing was delivered', async () => {
    const enrollment = enroll({}, NOW);
    await runLifecycleSweep(NOW + 95 * DAY_MS);
    expect(enrollment.lastNudgeAt).toBeNull();
  });
});

describe('recordInboundReply', () => {
  it('appends the Day-45 reply to the matching profile stream', () => {
    const { id, phone } = nextProfile();
    enrollLifecycle({
      beneficiaryId: id,
      beneficiaryName: 'सुनीता',
      district: 'Varanasi',
      whatsappNumber: phone,
      enrolledAt: NOW,
    });

    const match = recordInboundReply(`whatsapp:+${phone}`, 'teacher nahi aate hain');
    expect(match?.beneficiaryId).toBe(id);
    expect(match?.messages.at(-1)).toMatchObject({
      key: 'beneficiary-reply',
      direction: 'inbound',
      status: 'received',
      body: 'teacher nahi aate hain',
    });
  });

  it('matches on the bare number as well as the whatsapp: prefix', () => {
    const { id, phone } = nextProfile();
    enrollLifecycle({
      beneficiaryId: id,
      beneficiaryName: 'A',
      district: 'Varanasi',
      whatsappNumber: phone,
      enrolledAt: NOW,
    });
    expect(recordInboundReply(phone, 'ok')?.beneficiaryId).toBe(id);
  });

  it('returns null for a number that never enrolled', () => {
    expect(recordInboundReply('whatsapp:+910000000000', 'hello')).toBeNull();
  });
});
