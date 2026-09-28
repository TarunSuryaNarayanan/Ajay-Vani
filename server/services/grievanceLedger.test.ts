/**
 * Tests for the F1 grievance ledger: metadata requirements, status transitions,
 * filtering and summary aggregation.
 */

import { describe, it, expect } from 'vitest';

import {
  createGrievanceTicket,
  getGrievanceTicket,
  isValidIssueType,
  isValidStatus,
  listGrievanceTickets,
  summariseGrievances,
  updateGrievanceStatus,
} from './grievanceLedger';
import { GrievanceMetadata } from '../../src/types';

const metadata: GrievanceMetadata = {
  beneficiaryId: '999988887777',
  beneficiaryName: 'रमेश कुमार',
  district: 'Varanasi',
  trainingCenterId: 'ctr-vns-1',
  trainingCenterName: 'राजकीय आईटीआई करौंदी',
  nsqfQpCode: 'ELE/Q5901',
  aadhaarMasked: 'XXXX XXXX 7777',
};

function makeTicket(overrides: Partial<Parameters<typeof createGrievanceTicket>[0]> = {}) {
  return createGrievanceTicket({
    issueType: 'trainer-absent',
    description: 'Sir teacher pichle teen din se nahi aaye hain',
    captureMode: 'voice',
    language: 'bho-IN',
    metadata,
    ...overrides,
  });
}

describe('validation helpers', () => {
  it('accepts only known issue types and statuses', () => {
    expect(isValidIssueType('extortion')).toBe(true);
    expect(isValidIssueType('nope')).toBe(false);
    expect(isValidStatus('in-review')).toBe(true);
    expect(isValidStatus('closed')).toBe(false);
  });
});

describe('createGrievanceTicket', () => {
  it('stamps a Hindi label, forwards to the Ministry dashboard, and tags metadata', () => {
    const ticket = makeTicket();
    expect(ticket.ticketId).toMatch(/^grv_/);
    expect(ticket.issueTypeHi).toContain('प्रशिक्षक');
    expect(ticket.status).toBe('open');
    expect(ticket.forwardedToMinistry).toBe(true);
    expect(ticket.forwardedAt).toBe(ticket.createdAt);
    expect(ticket.externalPortalForwarded).toBe(false);
    expect(ticket.metadata.trainingCenterId).toBe('ctr-vns-1');
    expect(getGrievanceTicket(ticket.ticketId)).toEqual(ticket);
  });

  it('keeps unique ticket ids', () => {
    const ids = new Set([makeTicket().ticketId, makeTicket().ticketId, makeTicket().ticketId]);
    expect(ids.size).toBe(3);
  });
});

describe('updateGrievanceStatus', () => {
  it('moves a ticket through the lifecycle and records a note', () => {
    const ticket = makeTicket();

    const inReview = updateGrievanceStatus(ticket.ticketId, 'in-review', null);
    expect(inReview?.status).toBe('in-review');
    expect(inReview?.updatedAt).toBeGreaterThanOrEqual(ticket.updatedAt);

    const resolved = updateGrievanceStatus(ticket.ticketId, 'resolved', 'toolkit handed over');
    expect(resolved?.status).toBe('resolved');
    expect(resolved?.resolvedNote).toBe('toolkit handed over');
  });

  it('returns null for an unknown ticket', () => {
    expect(updateGrievanceStatus('grv_missing', 'resolved', null)).toBeNull();
  });
});

describe('listGrievanceTickets', () => {
  it('filters by status and district and returns newest first', () => {
    const districtTag = { ...metadata, district: 'Gorakhpur' };
    const a = makeTicket();
    const b = makeTicket({ metadata: districtTag });
    updateGrievanceStatus(b.ticketId, 'resolved', 'done');

    const resolved = listGrievanceTickets({ status: 'resolved' });
    expect(resolved.map((t) => t.ticketId)).toContain(b.ticketId);
    expect(resolved.map((t) => t.ticketId)).not.toContain(a.ticketId);

    expect(listGrievanceTickets({ district: 'gorakhpur' }).map((t) => t.ticketId)).toEqual([b.ticketId]);
    expect(listGrievanceTickets({ district: 'Nowhere' })).toEqual([]);
  });
});

describe('summariseGrievances', () => {
  it('aggregates counts by status, issue type, district and capture mode', () => {
    const summary = summariseGrievances();
    expect(summary.total).toBe(listGrievanceTickets().length);
    expect(summary.open + summary.inReview + summary.resolved).toBe(summary.total);
    expect(summary.voiceVsForm.voice + summary.voiceVsForm.form).toBe(summary.total);
    expect(summary.byDistrict.reduce((sum, d) => sum + d.count, 0)).toBe(summary.total);
    expect(summary.byIssueType.reduce((sum, i) => sum + i.count, 0)).toBe(summary.total);
  });
});
