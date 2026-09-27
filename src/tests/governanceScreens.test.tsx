import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';

const mockState: Record<string, any> = {};

vi.mock('../context/AppContext', () => ({
  useApp: () => mockState,
}));

vi.mock('../services/speech', () => ({
  speechService: { speak: vi.fn(), startListening: vi.fn(), stopListening: vi.fn() },
}));

vi.mock('../services/pdfGenerator', () => ({
  generateBusinessProposalPDF: vi.fn(),
}));

vi.mock('../services/api', () => ({
  fetchGrievanceSummary: vi.fn(async () => ({
    total: 1,
    open: 1,
    inReview: 0,
    resolved: 0,
    byIssueType: [],
    byDistrict: [],
    voiceVsForm: { voice: 1, form: 0 },
    lastUpdatedAt: null,
  })),
  fetchLifecycleEnrollments: vi.fn(async () => [
    {
      beneficiaryId: '999988887777',
      beneficiaryName: 'Sunita Devi',
      district: 'Varanasi',
      whatsappNumber: '+919452018290',
      enrolledAt: 1,
      lastNudgeAt: 2,
      messages: [
        {
          messageId: 'm1',
          key: 'day-45-checkin',
          direction: 'outbound',
          body: 'Koi dikkat?',
          createdAt: 1,
          deliveredAt: 1,
          status: 'sent',
        },
        {
          messageId: 'm2',
          key: 'beneficiary-reply',
          direction: 'inbound',
          body: 'Teacher nahi aate',
          createdAt: 2,
          deliveredAt: 2,
          status: 'received',
        },
      ],
    },
  ]),
  fetchLifecycleSchedule: vi.fn(async () => ({
    schedule: [{ key: 'day-45-checkin', dayOffset: 45, label: 'Day 45', labelHi: 'दिन 45 जाँच' }],
    whatsappConfigured: false,
  })),
  fetchLocalEmployers: vi.fn(async () => ({
    district: 'Varanasi',
    exactMatches: 1,
    openings: [
      {
        centerId: 'ctr-vns-3',
        centerName: 'ITI Chauka Ghat',
        centerNameHi: 'आईटीआई चौकाघाट',
        employer: 'ITI Chauka Ghat',
        roleTitle: 'Zari Artisan',
        roleTitleHi: 'जरी कारीगर',
        nsqfQpCode: 'AMH/Q0101',
        district: 'Varanasi',
        vacancies: 12,
        monthlyStipend: '₹18,000 / माह',
        contactPhone: '+91 94158 12390',
        address: 'Chauka Ghat',
        distanceKm: 3,
        isCertifiedMatch: true,
      },
    ],
  })),
}));

const { PostTrainingGuidanceScreen } = await import('../screens/PostTrainingGuidanceScreen');
const { MinistryDashboardScreen } = await import('../screens/MinistryDashboardScreen');
const { GrievanceReporter } = await import('../components/Governance/GrievanceReporter');
const { LifecycleNudgePanel } = await import('../components/Governance/LifecycleNudgePanel');

const DAY_MS = 24 * 60 * 60 * 1000;

function baseSession(overrides: Record<string, any> = {}) {
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

let container: HTMLDivElement;
let root: Root;

async function render(node: React.ReactElement) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(node);
  });
}

beforeEach(() => {
  Object.assign(mockState, {    aadhaarSession: null,
    currentResult: null,
    selectedDistrict: 'Varanasi',
    selectedLanguage: 'hi-IN',
    setScreen: vi.fn(),
    logoutAadhaar: vi.fn(),
    qrToken: null,
    generateQRToken: vi.fn(),
    admitToCourse: vi.fn(),
    completeCourse: vi.fn(),
    simulatePostTrainingWindow: vi.fn(),
    grievanceTickets: [],
    reportGrievance: vi.fn(async () => ({ success: true, message: 'दर्ज हो गई' })),
    refreshGrievances: vi.fn(),
    setGrievanceStatus: vi.fn(async () => true),
    isOnline: true,
    pendingGrievanceCount: 0,
    lifecycleEnrollment: null,
    whatsappConfigured: false,
    enrollForNudges: vi.fn(async () => ({ success: true, message: 'नामांकन सफल' })),
    refreshLifecycleInbox: vi.fn(),
    runLifecycleSweepNow: vi.fn(async () => 0),
  });
});

afterEach(async () => {
  if (root) {
    await act(async () => {
      root.unmount();
    });
  }
  container?.remove();
});

describe('PostTrainingGuidanceScreen', () => {
  it('renders the legacy fallback instead of the loop while training is in progress', async () => {
    mockState.aadhaarSession = baseSession();
    await render(<PostTrainingGuidanceScreen />);
    expect(container.textContent).toContain('प्रशिक्षणोत्तर मार्गदर्शन');
    expect(container.textContent).toContain('पुराना पथ');
    expect(container.textContent).not.toContain('अपना खुद का व्यापार शुरू करें');
  });

  it('never renders the loop when completedAt is null even if courseCompleted is true', async () => {
    mockState.aadhaarSession = baseSession({ courseCompleted: true, completedAt: null });
    await render(<PostTrainingGuidanceScreen />);
    expect(container.textContent).toContain('पुराना पथ');
  });

  it('renders all three guided paths for a certified Day-90+ beneficiary', async () => {
    mockState.aadhaarSession = baseSession({
      courseCompleted: true,
      completedAt: Date.now() - 91 * DAY_MS,
    });
    await render(<PostTrainingGuidanceScreen />);
    expect(container.textContent).toContain('पथ A: अपना व्यापार शुरू करें');
    expect(container.textContent).toContain('पथ B: नौकरी खोजें');
    expect(container.textContent).toContain('पथ C: पीएम मुद्रा ऋण');
    expect(container.textContent).toContain('पुराना अनुदान पथ');
  });

  it('shows the day-90 preview notice inside the gate window', async () => {
    mockState.aadhaarSession = baseSession({
      courseCompleted: true,
      completedAt: Date.now() - 10 * DAY_MS,
    });
    await render(<PostTrainingGuidanceScreen />);
    expect(container.textContent).toContain('पूर्वावलोकन');
  });
});

describe('MinistryDashboardScreen', () => {
  it('renders grievance and WhatsApp conversation streams from the API', async () => {
    await render(<MinistryDashboardScreen />);
    await act(async () => {});
    expect(container.textContent).toContain('मंत्रालय निगरानी डैशबोर्ड');
    expect(container.textContent).toContain('Sunita Devi');
    expect(container.textContent).toContain('1 उत्तर');
    expect(container.textContent).toContain('Twilio क्रेडेंशियल अनुपस्थित');
  });
});

describe('GrievanceReporter', () => {
  it('renders the report form collapsed behind the microphone button', async () => {
    await render(<GrievanceReporter />);
    expect(container.textContent).toContain('Report Issue');
    expect(container.textContent).not.toContain('मंत्रालय डैशबोर्ड भेजें');
  });

  it('blocks submission without a description', async () => {
    await render(<GrievanceReporter />);
    const toggle = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('शिकायत दर्ज करें')
    );
    await act(async () => {
      toggle?.click();
    });
    const submit = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('शिकायत मंत्रालय डैशबोर्ड भेजें')
    );
    await act(async () => {
      submit?.click();
    });
    expect(mockState.reportGrievance).not.toHaveBeenCalled();
    expect(container.textContent).toContain('कृपया शिकायत का विवरण लिखें');
  });

  it("lists only this beneficiary's own tickets with Ministry status", async () => {
    mockState.aadhaarSession = baseSession();
    mockState.grievanceTickets = [
      {
        ticketId: 'grv_mine',
        issueType: 'trainer-absent',
        issueTypeHi: 'प्रशिक्षक उपस्थित नहीं',
        description: 'teacher teen din se nahi aaya',
        captureMode: 'voice',
        language: 'bho-IN',
        status: 'in-review',
        forwardedToMinistry: true,
        forwardedAt: 1,
        externalPortalForwarded: false,
        resolvedNote: null,
        createdAt: 1,
        updatedAt: 2,
        metadata: {
          beneficiaryId: '999988887777',
          beneficiaryName: 'रमेश कुमार',
          district: 'Varanasi',
          trainingCenterId: 'ctr-vns-1',
          trainingCenterName: 'ITI',
          nsqfQpCode: 'ELE/Q5901',
          aadhaarMasked: 'XXXX XXXX 7777',
        },
      },
      {
        ticketId: 'grv_other',
        issueType: 'extortion',
        issueTypeHi: 'रिश्वत',
        description: 'someone else',
        captureMode: 'form',
        language: 'hi-IN',
        status: 'open',
        forwardedToMinistry: true,
        forwardedAt: 1,
        externalPortalForwarded: false,
        resolvedNote: null,
        createdAt: 1,
        updatedAt: 1,
        metadata: {
          beneficiaryId: '111111111111',
          beneficiaryName: 'अन्य',
          district: 'Patna',
          trainingCenterId: 'ctr-pat-1',
          trainingCenterName: 'ITI Patna',
          nsqfQpCode: 'ELE/Q5901',
          aadhaarMasked: 'XXXX XXXX 1111',
        },
      },
    ];
    await render(<GrievanceReporter />);
    expect(container.textContent).toContain('आपकी दर्ज शिकायतें (1)');
    expect(container.textContent).toContain('grv_mine');
    expect(container.textContent).toContain('जाँच जारी');
    expect(container.textContent).not.toContain('grv_other');
  });
});

describe('LifecycleNudgePanel', () => {
  it('renders nothing without an authenticated session', async () => {
    await render(<LifecycleNudgePanel />);
    expect(container.textContent).toBe('');
  });

  it('offers enrollment when no enrollment exists', async () => {
    mockState.aadhaarSession = baseSession();
    await render(<LifecycleNudgePanel />);
    expect(container.textContent).toContain('Enroll');
    expect(container.textContent).toContain('दिन 45');
  });

  it('shows the message thread and sweep control once enrolled', async () => {
    mockState.aadhaarSession = baseSession({ whatsappNumber: '+919452018290' });
    mockState.lifecycleEnrollment = {
      beneficiaryId: '999988887777',
      beneficiaryName: 'रमेश कुमार',
      district: 'Varanasi',
      whatsappNumber: '+919452018290',
      enrolledAt: 1,
      lastNudgeAt: 2,
      messages: [
        {
          messageId: 'm1',
          key: 'day-45-checkin',
          direction: 'outbound',
          body: 'Namaste ji, training kaisa chal raha hai?',
          createdAt: 1,
          deliveredAt: 1,
          status: 'sent',
        },
      ],
    };
    await render(<LifecycleNudgePanel />);
    expect(container.textContent).toContain('Send now');
    expect(container.textContent).toContain('नामांकित');
  });
});
