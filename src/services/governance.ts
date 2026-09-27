import {
  AadhaarSession,
  GrievanceIssueType,
  GrievanceMetadata,
  PostTrainingJobOpening,
  ScreenType,
  SkillingCenter,
  VoiceProcessResult,
} from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

export const POST_TRAINING_DAY_GATE = 90;
const UNKNOWN_CENTER_ID = 'unassigned';
const UNKNOWN_CENTER_NAME = 'आवंटित नहीं (Not yet assigned)';

// ─── F1 · Grievance metadata auto-tagging ────────────────────────────────────

export interface GrievanceIssueOption {
  value: GrievanceIssueType;
  label: string;
  voicePrompt: string;
}

export const GRIEVANCE_ISSUE_OPTIONS: GrievanceIssueOption[] = [
  {
    value: 'trainer-absent',
    label: 'प्रशिक्षक बार-बार नहीं आ रहे (Absent Trainer)',
    voicePrompt: 'बताइए, कौन सा प्रशिक्षक कितने दिनों से नहीं आया?',
  },
  {
    value: 'extortion',
    label: 'रिश्वत या अनियमित पैसे की माँग (Extortion / Bribe)',
    voicePrompt: 'किसने कितने रुपये की माँग की? किसके सामने?',
  },
  {
    value: 'missing-toolkit',
    label: 'टूलकिट या किट नहीं मिली (Missing Toolkit)',
    voicePrompt: 'कौन सी किट नहीं मिली और कब पकड़ा गया?',
  },
  {
    value: 'stipend-delay',
    label: 'वजीफा/भत्ता में देरी (Stipend Delayed)',
    voicePrompt: 'कितने दिनों का भत्ता बाकी है?',
  },
  {
    value: 'document-fraud',
    label: 'दस्तावेज़ या रिकॉर्ड में गड़बड़ी (Document Fraud)',
    voicePrompt: 'किस दस्तावेज़ में क्या गड़बड़ी मिली?',
  },
  {
    value: 'other',
    label: 'अन्य कोई समस्या (Other Issue)',
    voicePrompt: 'अपनी समस्या अपने शब्दों में बताइए।',
  },
];

export const GRIEVANCE_DICTATION_PROMPT =
  'शिकायत दर्ज करने के लिए माइक बटन दबाएं और अपनी समस्या अपनी भाषा में बोलिए। बोलने के बाद आप भरा हुआ फ़ॉर्म जाँच सकते हैं।';

/**
 * Spec §1.4 — every ticket carries the beneficiary's ID, active district and
 * assigned training centre. The centre is resolved from the reconciled centre
 * list on the current result, falling back to the first district centre.
 */
export function buildGrievanceMetadata(params: {
  session: AadhaarSession | null;
  result: VoiceProcessResult | null;
  selectedDistrict: string;
  centers?: SkillingCenter[];
}): GrievanceMetadata {
  const { session, result, selectedDistrict, centers } = params;

  const availableCenters = centers ?? result?.districtMarket?.centers ?? [];
  const qpCode = result?.recommendedNSQF?.qpCode;
  const center =
    availableCenters.find((c) => c.qpCode && qpCode && c.qpCode === qpCode) ||
    availableCenters[0] ||
    null;

  return {
    beneficiaryId: session?.aadhaarNumber || 'unknown-beneficiary',
    beneficiaryName: session?.beneficiaryName || result?.profile?.beneficiaryName || '',
    district: session?.district || selectedDistrict || result?.districtMarket?.district || '',
    trainingCenterId: center?.id || UNKNOWN_CENTER_ID,
    trainingCenterName: center?.nameHi || center?.name || UNKNOWN_CENTER_NAME,
    nsqfQpCode: qpCode || center?.qpCode || '',
    aadhaarMasked: session?.maskedAadhaar || '',
  };
}

// ─── F2 · Lifecycle nudge helpers ────────────────────────────────────────────

export function isValidWhatsAppNumber(raw: string): boolean {
  if (!raw) return false;
  const digits = raw.trim().replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
}

export const LIFECYCLE_SCHEDULE_PREVIEW = [
  { day: 45, labelHi: 'दिन 45 जाँच', key: 'day-45-checkin' as const },
  { day: 90, labelHi: 'दिन 90 समापन सूचना', key: 'day-90-completion' as const },
];

// ─── F3 · Post-Course AI Guidance gating ─────────────────────────────────────

export function daysSinceCompletion(completedAt: number | null, now: number = Date.now()): number | null {
  if (!completedAt) return null;
  return Math.floor((now - completedAt) / DAY_MS);
}

/**
 * Day-90 gate. `completedAt` is nullable and stays null while training is in
 * progress, so this can never be true before the course is actually finished.
 */
export function isPostTrainingEligible(
  session: Pick<AadhaarSession, 'courseCompleted' | 'completedAt'> | null,
  now: number = Date.now()
): boolean {
  if (!session || !session.courseCompleted || !session.completedAt) return false;
  return now - session.completedAt >= POST_TRAINING_DAY_GATE * DAY_MS;
}

export function daysUntilPostTraining(
  session: Pick<AadhaarSession, 'courseCompleted' | 'completedAt'> | null,
  now: number = Date.now()
): number {
  if (!session?.completedAt) return POST_TRAINING_DAY_GATE;
  const remaining = POST_TRAINING_DAY_GATE * DAY_MS - (now - session.completedAt);
  return remaining <= 0 ? 0 : Math.ceil(remaining / DAY_MS);
}

/**
 * Login landing screen. The Day-90 Post-Training AI Loop is additive: any
 * beneficiary who has not cleared the gate lands on the legacy dashboard.
 */
export function landingScreenFor(session: AadhaarSession | null, now: number = Date.now()): ScreenType {
  return isPostTrainingEligible(session, now) ? 'post-training-guidance' : 'beneficiary-dashboard';
}

/**
 * Demo helper: shifts a recorded completion date back past the Day-90 gate so
 * the post-training loop can be exercised without waiting 90 days.
 */
export function simulateDay90Window(completedAt: number | null, now: number = Date.now()): number {
  return now - POST_TRAINING_DAY_GATE * DAY_MS - 60 * 1000;
}

// ─── F3 · Path A / C guidance copy ───────────────────────────────────────────

export const BDO_SUBMISSION_CHECKLIST = [
  {
    title: 'चरण 1: प्रस्ताव तैयार करें',
    body: 'नीचे दिए बटन से 1-पृष्ठ पीएम-अजय व्यापार प्रस्ताव (PDF) डाउनलोड करें। इसमें आपका पंजीकृत विवरण और प्रमाणित NSQF ट्रेड पहले से भरा होगा।',
  },
  {
    title: 'चरण 2: आधार एवं जाति प्रमाण पत्र',
    body: 'आधार कार्ड, अनुसूचित जाति प्रमाण पत्र और बैंक पासबुक की स्कैन कॉपी साथ रखें।',
  },
  {
    title: 'चरण 3: ग्राम सहायक से सत्यापन',
    body: 'अपने ग्राम सहायक / अंचलवार कर्मचारी से दस्तावेज़ सत्यापन (attestation) कराएं।',
  },
  {
    title: 'चरण 4: बीडीओ कार्यालय में भौतिक जमा',
    body: 'प्रस्ताव, ₹50,000 अनुदान के लिए भरा आवेदन और ऊपर की सभी प्रमाणित प्रतियाँ खंड विकास अधिकारी (BDO) के कार्यालय में जमा करें।',
  },
  {
    title: 'चरण 5: पंजीकरण एवं अनुदान ट्रैकिंग',
    body: 'जमा रसीद अपने डैशबोर्ड पर सेव करें। अनुदान स्वीकृति और राशि हस्तांतरण की स्थिति इसी ऐप के अनुदान ट्रैकर में दिखती है।',
  },
];

export const MUDRA_LOAN_STEPS = [
  {
    title: '1. बैंक शाखा में आवेदन',
    body: 'अपने निकटतम बैंक / बीआरसी केंद्र में "प्रधानमंत्री मुद्रा योजना (शिशु/किशोर/तरुण) फॉर्म" भरें। आधार, पैन और जाति प्रमाण पत्र अनिवार्य हैं।',
  },
  {
    title: '2. ₹50,000 अनुदान का प्रमाण',
    body: 'पीएम-अजय अनुदान स्वीकृति पत्र / बीडीओ सत्यापन संलग्न करें — इससे अनुदान की राशि ऋण से घट जाती है।',
  },
  {
    title: '3. व्यापार योजना (Project Report)',
    body: '2-3 पृष्ठ की योजना बनाएं: उत्पाद, कच्चा माल, जगह, अनुमानित लागत, बाज़ार और वित्तीय विवरण।',
  },
  {
    title: '4. बैंक सत्यापन एवं स्वीकृति',
    body: 'बैंक आपके केंद्र/ODOP इकाई का भ्रमण कर स्वीकृति देता है। मुद्रा ऋण ₹10 लाख तक, बिना कॉलेटरल के स्वीकृत हो सकता है।',
  },
  {
    title: '5. पहला किस्ता एवं शिक्षुता',
    body: 'स्वीकृति के बाद पहली किस्ता मिलते ही शिपा/ट्रेनिंग शुरू करें और रजिस्टर रजिस्टर बनवाएं।',
  },
];

export const POST_TRAINING_VOICE_PROMPTS = {
  business: 'क्या आप अपना खुद का व्यापार शुरू करना चाहते हैं?',
  job: 'क्या आप किसी कंपनी में नौकरी ढूंढना चाहते हैं?',
  mudra: 'क्या आप मुद्रा ऋण लेकर व्यापार बड़ा करना चाहते हैं?',
};

export function jobMatchLabel(job: PostTrainingJobOpening): string {
  return job.isCertifiedMatch ? 'प्रमाणित NSQF मैच' : 'ज़िला-सम्बंधित माँग';
}

export function formatPostTrainingElapsed(days: number): string {
  return days > 0 ? `${days} दिन पूरे` : 'आज ही पूरा हुआ';
}
