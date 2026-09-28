export type LanguageCode =
  | 'hi-IN'
  | 'en-IN'
  | 'bho-IN'
  | 'bun-IN'
  | 'chg-IN'
  | 'mai-IN'
  | 'ta-IN'
  | 'te-IN'
  | 'mr-IN'
  | 'bn-IN';

export interface DialectOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  region: string;
  sampleGreeting: string;
}

export interface BeneficiaryProfile {
  beneficiaryName: string;
  educationLevel: string;
  traditionalOccupation: string;
  employmentPreference: string;
  mobilityRadius: string;
}

export interface RecommendedNSQF {
  qpCode: string;
  roleName: string;
  roleNameHi: string;
  nsqfLevel: number;
  sector: string;
  matchScore: number;
  estimatedIncome: string;
}

export interface SkillingCenter {
  id: string;
  name: string;
  nameHi: string;
  district: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  courseName: string;
  courseNameHi: string;
  durationHours: number;
  benefits: string[];
  benefitsHi: string[];
  coordinatorName: string;
  coordinatorPhone: string;
  address: string;
  addressHi: string;
  googleMapsUrl?: string;
  pincode?: string;
  qpCode?: string;
}

export interface DistrictMarket {
  district: string;
  state: string;
  odopSector: string;
  odopSectorHi: string;
  vacanciesCount: number;
  centers: SkillingCenter[];
}

export interface VoiceProcessResult {
  success: boolean;
  profile: BeneficiaryProfile;
  recommendedNSQF: RecommendedNSQF;
  districtMarket: DistrictMarket;
  friendlyAudioResponse: string;
  skillVectorHits?: string[];
  employmentMode?: string;
  mobilityScope?: string;
  pmAjaySubsidy?: { amount: string; nsqfLevel: number; eligible: boolean };
}

export interface OfflineInterview {
  id: string;
  timestamp: number;
  transcript: string;
  district: string;
  language: LanguageCode;
  profile?: BeneficiaryProfile;
  recommendedNSQF?: RecommendedNSQF;
  isSynced: boolean;
}

export interface QRToken {
  tokenId: string;
  beneficiaryName: string;
  aadhaarMasked: string;
  nsqfQpCode: string;
  nsqfRoleNameHi: string;
  district: string;
  generatedAt: number;
  isUsed: boolean;
  qrDataUrl?: string;
}

export interface AadhaarSession {
  aadhaarNumber: string;
  maskedAadhaar: string;
  isVerified: boolean;
  beneficiaryName: string;
  scCategoryVerified: boolean;
  district: string;
  grantStep: number; // 1: Profiling, 2: Proposal, 3: BDO Approval Pending, 4: Disbursed
  stipendDaysAttended: number;
  stipendTotalEarned: number;
  // Post-Course AI Guidance (F3). `completedAt` stays null until training ends.
  courseCompleted: boolean;
  completedAt: number | null;
  // Lifecycle Nudge enrollment timestamp (F2) — recorded when the user clicks Enroll.
  lifecycleEnrolledAt: number | null;
  whatsappNumber: string | null;
}

// ─── F1: Voice-Based Grievance Redressal ─────────────────────────────────────

export type GrievanceIssueType =
  | 'trainer-absent'
  | 'extortion'
  | 'missing-toolkit'
  | 'stipend-delay'
  | 'document-fraud'
  | 'other';

export type GrievanceCaptureMode = 'form' | 'voice';

export type GrievanceStatus = 'open' | 'in-review' | 'resolved';

export interface GrievanceMetadata {
  beneficiaryId: string;
  beneficiaryName: string;
  district: string;
  trainingCenterId: string;
  trainingCenterName: string;
  nsqfQpCode: string;
  aadhaarMasked: string;
}

export interface GrievanceTicket {
  ticketId: string;
  issueType: GrievanceIssueType;
  issueTypeHi: string;
  description: string;
  captureMode: GrievanceCaptureMode;
  language: LanguageCode;
  status: GrievanceStatus;
  forwardedToMinistry: boolean;
  forwardedAt: number | null;
  externalPortalForwarded: boolean;
  resolvedNote: string | null;
  createdAt: number;
  updatedAt: number;
  metadata: GrievanceMetadata;
}

// ─── F2: Automated Lifecycle Nudges via WhatsApp ─────────────────────────────

export type LifecycleNudgeKey = 'day-45-checkin' | 'day-90-completion';

export type LifecycleMessageDirection = 'outbound' | 'inbound';

export interface LifecycleMessage {
  messageId: string;
  key: LifecycleNudgeKey | 'beneficiary-reply';
  direction: LifecycleMessageDirection;
  body: string;
  createdAt: number;
  deliveredAt: number | null;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'received';
  error?: string;
}

export interface LifecycleEnrollment {
  beneficiaryId: string;
  beneficiaryName: string;
  district: string;
  whatsappNumber: string;
  enrolledAt: number;
  lastNudgeAt: number | null;
  messages: LifecycleMessage[];
}

// ─── F3: Post-Course AI Guidance ─────────────────────────────────────────────

export type PostTrainingPath = 'business' | 'job' | 'mudra';

export interface PostTrainingJobOpening {
  centerId: string;
  centerName: string;
  centerNameHi: string;
  employer: string;
  roleTitle: string;
  roleTitleHi: string;
  nsqfQpCode: string;
  district: string;
  /**
   * Live vacancy counts are not part of a training-centre dataset, so these stay
   * null rather than being estimated. The UI must show the unavailable state
   * instead of implying a hiring figure we cannot substantiate.
   */
  vacancies: number | null;
  monthlyStipend: string | null;
  contactPhone: string;
  address: string;
  distanceKm: number;
  isCertifiedMatch: boolean;
  dataSource?: 'demo' | 'government';
}

export type ScreenType = 
  | 'language-select' 
  | 'voice-chat' 
  | 'nsqf-profile' 
  | 'skilling-jobs' 
  | 'micro-finance' 
  | 'offline-sync'
  | 'aadhaar-login'
  | 'aadhaar-otp'
  | 'beneficiary-dashboard'
  | 'post-training-guidance'
  | 'ministry-dashboard';
