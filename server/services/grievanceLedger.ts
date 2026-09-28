// ─── Grievance Redressal Ledger (F1) ────────────────────────────────────────
//
// Whistleblowing engine: voice or form complaints become structured tickets that
// are auto-tagged with beneficiary ID, district and training centre, then
// forwarded to the Ministry Monitoring Dashboard. Mirrors the in-memory QR
// token store used for paperless enrollment.

import {
  GrievanceIssueType,
  GrievanceMetadata,
  GrievanceStatus,
  GrievanceTicket,
} from '../../src/types';

const GOV_PORTAL_URL = process.env.GOVERNMENT_PORTAL_URL || '';

export const GRIEVANCE_ISSUE_LABELS: Record<GrievanceIssueType, string> = {
  'trainer-absent': 'प्रशिक्षक उपस्थित नहीं (Absent Trainer)',
  extortion: 'रिश्वत/Extortion',
  'missing-toolkit': 'टूलकिट/किट उपलब्ध नहीं (Missing Toolkit)',
  'stipend-delay': 'वजीफा/भत्ता में देरी (Stipend Delay)',
  'document-fraud': 'दस्तावेज़ धोखाधड़ी (Document Fraud)',
  other: 'अन्य (Other)',
};

const VALID_ISSUE_TYPES = Object.keys(GRIEVANCE_ISSUE_LABELS) as GrievanceIssueType[];
const VALID_STATUSES: GrievanceStatus[] = ['open', 'in-review', 'resolved'];

const grievanceStore: Record<string, GrievanceTicket> = {};

function makeTicketId(): string {
  return `grv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export function isValidIssueType(value: unknown): value is GrievanceIssueType {
  return typeof value === 'string' && (VALID_ISSUE_TYPES as string[]).includes(value);
}

export function isValidStatus(value: unknown): value is GrievanceStatus {
  return typeof value === 'string' && (VALID_STATUSES as string[]).includes(value);
}

/**
 * Optional external portal forwarding. Deferred until the government portal
 * exists — the in-app Ministry dashboard is always the primary destination.
 */
export async function forwardToGovernmentPortal(ticket: GrievanceTicket): Promise<boolean> {
  if (!GOV_PORTAL_URL) return false;
  try {
    const res = await fetch(GOV_PORTAL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    });
    if (!res.ok) {
      console.warn(`[Grievance] Portal forward failed for ${ticket.ticketId}: HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn(`[Grievance] Portal forward failed for ${ticket.ticketId}:`, err?.message || err);
    return false;
  }
}

export interface CreateGrievanceInput {
  issueType: GrievanceIssueType;
  description: string;
  captureMode: 'form' | 'voice';
  language: string;
  metadata: GrievanceMetadata;
}

export function createGrievanceTicket(input: CreateGrievanceInput): GrievanceTicket {
  const now = Date.now();
  const ticket: GrievanceTicket = {
    ticketId: makeTicketId(),
    issueType: input.issueType,
    issueTypeHi: GRIEVANCE_ISSUE_LABELS[input.issueType] || GRIEVANCE_ISSUE_LABELS.other,
    description: input.description,
    captureMode: input.captureMode,
    language: (input.language as GrievanceTicket['language']) || 'hi-IN',
    status: 'open',
    forwardedToMinistry: true, // every ticket lands on the Ministry dashboard feed
    forwardedAt: now,
    externalPortalForwarded: false,
    resolvedNote: null,
    createdAt: now,
    updatedAt: now,
    metadata: input.metadata,
  };

  grievanceStore[ticket.ticketId] = ticket;
  console.log(
    `[Grievance] ${ticket.ticketId} | ${ticket.issueType} | ${ticket.metadata.beneficiaryName} (${ticket.metadata.beneficiaryId}) | ` +
      `district=${ticket.metadata.district} | centre=${ticket.metadata.trainingCenterId} | mode=${ticket.captureMode}`
  );

  // Fire-and-forget: portal forwarding must never block ticket creation.
  forwardToGovernmentPortal(ticket).then((forwarded) => {
    if (forwarded) {
      ticket.externalPortalForwarded = true;
      ticket.updatedAt = Date.now();
    }
  });

  return ticket;
}

export function listGrievanceTickets(filter?: { status?: GrievanceStatus; district?: string }): GrievanceTicket[] {
  let tickets = Object.values(grievanceStore);
  if (filter?.status) {
    tickets = tickets.filter((t) => t.status === filter.status);
  }
  if (filter?.district) {
    const district = filter.district.toLowerCase();
    tickets = tickets.filter((t) => t.metadata.district?.toLowerCase() === district);
  }
  return tickets.sort((a, b) => b.createdAt - a.createdAt);
}

export function getGrievanceTicket(ticketId: string): GrievanceTicket | null {
  return grievanceStore[ticketId] || null;
}

export function updateGrievanceStatus(
  ticketId: string,
  status: GrievanceStatus,
  note: string | null
): GrievanceTicket | null {
  const ticket = grievanceStore[ticketId];
  if (!ticket) return null;
  ticket.status = status;
  ticket.resolvedNote = note;
  ticket.updatedAt = Date.now();
  console.log(`[Grievance] ${ticketId} → ${status}${note ? ` (${note})` : ''}`);
  return ticket;
}

export interface GrievanceSummary {
  total: number;
  open: number;
  inReview: number;
  resolved: number;
  byIssueType: { issueType: GrievanceIssueType; label: string; count: number }[];
  byDistrict: { district: string; count: number }[];
  voiceVsForm: { voice: number; form: number };
  lastUpdatedAt: number | null;
}

export function summariseGrievances(): GrievanceSummary {
  const tickets = Object.values(grievanceStore);
  const byIssueType = VALID_ISSUE_TYPES.map((issueType) => ({
    issueType,
    label: GRIEVANCE_ISSUE_LABELS[issueType],
    count: tickets.filter((t) => t.issueType === issueType).length,
  })).filter((row) => row.count > 0);

  const districtMap = new Map<string, number>();
  for (const t of tickets) {
    const d = t.metadata.district || 'अज्ञात';
    districtMap.set(d, (districtMap.get(d) || 0) + 1);
  }

  return {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inReview: tickets.filter((t) => t.status === 'in-review').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    byIssueType,
    byDistrict: [...districtMap.entries()]
      .map(([district, count]) => ({ district, count }))
      .sort((a, b) => b.count - a.count),
    voiceVsForm: {
      voice: tickets.filter((t) => t.captureMode === 'voice').length,
      form: tickets.filter((t) => t.captureMode === 'form').length,
    },
    lastUpdatedAt: tickets.length ? Math.max(...tickets.map((t) => t.updatedAt)) : null,
  };
}
