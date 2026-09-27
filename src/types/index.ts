export type LanguageCode = 
  | 'hi-IN' 
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
  | 'beneficiary-dashboard';
