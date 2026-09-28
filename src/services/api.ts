import {
  VoiceProcessResult,
  LanguageCode,
  DistrictMarket,
  SkillingCenter,
  GrievanceIssueType,
  GrievanceMetadata,
  GrievanceStatus,
  GrievanceTicket,
  LifecycleEnrollment,
  PostTrainingJobOpening,
} from '../types';
import QRCode from 'qrcode';
import { buildSpokenResponse, normaliseSpokenName } from './spokenResponse';

const API_BASE = '/api';

// Fallback local NLP engine in case network is down (zero-internet offline mode)
export function localFallbackProcess(transcript: string, districtName = "Varanasi", dialect: LanguageCode = "hi-IN"): VoiceProcessResult {
  const lower = transcript.toLowerCase();

  let educationLevel = "अनौपचारिक शिक्षा";
  if (lower.includes("8") || lower.includes("aathvi") || lower.includes("आठवीं")) {
    educationLevel = "8वीं पास";
  } else if (lower.includes("10") || lower.includes("dasvi") || lower.includes("दसवीं") || lower.includes("मैट्रिक")) {
    educationLevel = "10वीं पास";
  } else if (lower.includes("12") || lower.includes("barahvi") || lower.includes("बारहवीं") || lower.includes("इंटर")) {
    educationLevel = "12वीं पास";
  } else if (lower.includes("iti") || lower.includes("आईटीआई")) {
    educationLevel = "आईटीआई प्रमाण पत्र";
  }

  // Detect beneficiary name if spoken
  let beneficiaryName = normaliseSpokenName(undefined, dialect);
  const nameMatch = transcript.match(/(?:naam|नाम|हमार नाम|मेरा नाम)\s+([A-Za-zऀ-ॿ]+)/i);
  if (nameMatch && nameMatch[1]) {
    beneficiaryName = normaliseSpokenName(nameMatch[1], dialect);
  }

  // Match QP
  let qpCode = "ELE/Q5901";
  let roleName = "Solar PV Installer & Electrician";
  let roleNameHi = "सोलर पीवी इंस्टॉलर एवं तकनीशियन";
  let nsqfLevel = 4;
  let sector = "Green Jobs / Renewable Energy";
  let matchScore = 92;
  let vacanciesCount = 120;
  let income = "₹18,000 - ₹26,000 / माह";

  if (lower.includes("doodh") || lower.includes("dairy") || lower.includes("gai") || lower.includes("bhains") || lower.includes("दूध") || lower.includes("डेयरी") || lower.includes("पशु")) {
    qpCode = "AGR/Q6701";
    roleName = "Dairy Farmer & Milk Processing Entrepreneur";
    roleNameHi = "डेयरी उद्यमी एवं दुग्ध संकलन संचालक";
    sector = "Agriculture & Allied";
    matchScore = 94;
    vacanciesCount = 140;
    income = "₹20,000 - ₹35,000 / माह";
  } else if (lower.includes("tractor") || lower.includes("mistri") || lower.includes("diesel") || lower.includes("ट्रैक्टर") || lower.includes("मिस्त्री")) {
    qpCode = "AGR/Q1201";
    roleName = "Tractor & Farm Equipment Repair Specialist";
    roleNameHi = "ट्रैक्टर एवं कृषि उपकरण मरम्मत विशेषज्ञ";
    sector = "Automotive & Machinery";
    matchScore = 91;
    vacanciesCount = 85;
    income = "₹18,000 - ₹28,000 / माह";
  } else if (lower.includes("zari") || lower.includes("silai") || lower.includes("kapda") || lower.includes("जरी") || lower.includes("सिलाई") || lower.includes("कपड़ा")) {
    qpCode = "AMH/Q0101";
    roleName = "Zari & Traditional Hand Embroidery Artisan";
    roleNameHi = "जरी-जरदोजी एवं पारंपरिक हस्तशिल्प कारीगर";
    sector = "Apparel & Handicrafts";
    matchScore = 96;
    vacanciesCount = 115;
    income = "₹15,000 - ₹24,000 / माह";
  }

  // Spoken in the selected language, matching what the server would say online.
  const friendlyAudio = buildSpokenResponse(dialect, {
    beneficiaryName,
    qpCode,
    roleName,
    roleNameHi,
    district: districtName,
    centreCount: vacanciesCount,
  });

  const districtMarket: DistrictMarket = {
    district: districtName,
    state: "Uttar Pradesh",
    odopSector: "Green Energy & ODOP Traditional Trades",
    odopSectorHi: "सोलर ऊर्जा एवं पारंपरिक ओडीओपी उद्योग",
    vacanciesCount,
    centers: [
      {
        id: "ctr-local-1",
        name: `Government ITI ${districtName} PM-AJAY Skill Center`,
        nameHi: `राजकीय आईटीआई ${districtName} कौशल केंद्र (पीएम-अजय)`,
        district: districtName,
        latitude: 25.2818,
        longitude: 82.9863,
        distanceKm: 5.2,
        courseName: `${roleName} Course (${qpCode})`,
        courseNameHi: `${roleNameHi} प्रशिक्षण (300 घंटे)`,
        durationHours: 300,
        benefits: ["निःशुल्क प्रशिक्षण", "मुफ्त टूलकिट एवं यूनिफॉर्म", "दैनिक भोजन व यात्रा भत्ता (₹150/दिन)"],
        benefitsHi: ["निःशुल्क प्रशिक्षण", "मुफ्त टूलकिट एवं यूनिफॉर्म", "दैनिक भोजन व यात्रा भत्ता (₹150/दिन)"],
        coordinatorName: "श्री राजेश कुमार मिश्र",
        coordinatorPhone: "+91 94520 18290",
        address: `करौंदी, बीएचयू परिसर के समीप, ${districtName}`,
        addressHi: `करौंदी, बीएचयू परिसर के समीप, ${districtName}`,
        googleMapsUrl: `https://maps.google.com/?q=25.2818,82.9863`,
        qpCode
      }
    ]
  };

  return {
    success: true,
    profile: {
      beneficiaryName,
      educationLevel,
      traditionalOccupation: roleName,
      employmentPreference: "स्वरोजगार (Self-Employment)",
      mobilityRadius: "जिले के अंदर (15 किमी दायरा)"
    },
    recommendedNSQF: {
      qpCode,
      roleName,
      roleNameHi,
      nsqfLevel,
      sector,
      matchScore,
      estimatedIncome: income
    },
    districtMarket,
    friendlyAudioResponse: friendlyAudio,
    skillVectorHits: [qpCode],
    employmentMode: "स्वरोजगार (Self-Employment)",
    mobilityScope: "जिले के अंदर (15 किमी दायरा)",
    pmAjaySubsidy: { amount: "₹50,000", nsqfLevel, eligible: true }
  };
}

export async function processVoiceTranscript(
  transcript: string,
  district = "Varanasi",
  state = "Uttar Pradesh",
  language: LanguageCode = "hi-IN"
): Promise<VoiceProcessResult> {
  try {
    const res = await fetch(`${API_BASE}/voice/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, district, state, language })
    });

    if (!res.ok) {
      throw new Error(`API responded with status ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.warn("API request failed or offline. Using local offline livelihood matcher:", error);
    return localFallbackProcess(transcript, district, language);
  }
}

export async function syncOfflineInterviews(interviews: any[]): Promise<{ success: boolean; syncedCount: number; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/sync/offline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interviews)
    });

    if (!res.ok) {
      throw new Error(`Sync API responded with status ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Sync request failed:", error);
    throw error;
  }
}

export async function transcribeAudioViaBhashini(
  wavBase64: string,
  language: LanguageCode = 'hi-IN'
): Promise<{ success: boolean; transcript: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/bhashini/asr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64: wavBase64, language }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, transcript: '', error: errData.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    if (data.success && data.transcript) {
      return { success: true, transcript: data.transcript };
    }
    return { success: false, transcript: '', error: 'No transcript in response' };
  } catch (error: any) {
    console.warn('[Bhashini ASR Client] Network error:', error.message);
    return { success: false, transcript: '', error: error.message };
  }
}

export async function synthesizeSpeechViaBhashini(
  text: string,
  language: LanguageCode = 'hi-IN'
): Promise<{ success: boolean; audioBase64?: string; samplingRate?: number; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/bhashini/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    if (data.success && data.audioBase64) {
      return { success: true, audioBase64: data.audioBase64, samplingRate: data.samplingRate };
    }
    return { success: false, error: 'No audio in response' };
  } catch (error: any) {
    console.warn('[Bhashini TTS Client] Network error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function generateQRToken(
  beneficiaryName: string,
  aadhaarMasked: string,
  qpCode: string,
  roleNameHi: string,
  district: string
): Promise<{ tokenId: string; qrSvg: string; qrDataUrl: string; beneficiaryName: string; aadhaarMasked: string; nsqfQpCode: string; nsqfRoleNameHi: string; district: string; generatedAt: number }> {
  const tokenId = `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = Date.now();
  const payload = {
    tokenId,
    beneficiaryName,
    aadhaarMasked,
    nsqfQpCode: qpCode,
    nsqfRoleNameHi: roleNameHi,
    district,
    generatedAt: now,
  };

  const payloadJson = JSON.stringify(payload);

  const [qrSvg, qrDataUrl] = await Promise.all([
    QRCode.toString(payloadJson, { type: 'svg', errorCorrectionLevel: 'M', width: 512 }),
    QRCode.toDataURL(payloadJson, {
      errorCorrectionLevel: 'M',
      width: 512,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    }),
  ]);

  try {
    await fetch(`${API_BASE}/qr-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch (e) {
    console.warn('[QR Token] Could not persist token on server:', e);
  }

  return { qrSvg, qrDataUrl, ...payload };
}

export async function verifyQRToken(
  tokenId: string
): Promise<{ success: boolean; token?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/qr-tokens/${encodeURIComponent(tokenId)}`);
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    if (data.success && data.token) {
      return { success: true, token: data.token };
    }
    return { success: false, error: 'Token not found' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function admitToCourse(tokenId: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/qr-tokens/${encodeURIComponent(tokenId)}/admit`, {
      method: 'POST',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, message: errData.error || `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { success: data.success, message: data.message || 'Admission successful' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// ═══ F1 · Grievance Redressal Client ═══════════════════════════════════════

export interface SubmitGrievanceInput {
  issueType: GrievanceIssueType;
  description: string;
  captureMode: 'form' | 'voice';
  language: LanguageCode;
  metadata: GrievanceMetadata;
}

export async function submitGrievance(
  input: SubmitGrievanceInput
): Promise<{ success: boolean; ticket?: GrievanceTicket; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/grievances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, message: data.error || `HTTP ${res.status}` };
    }
    return { success: true, ticket: data.ticket, message: data.message || 'शिकायत दर्ज हो गई।' };
  } catch (error: any) {
    return { success: false, message: error.message || 'नेटवर्क त्रुटि' };
  }
}

export async function fetchGrievances(filter?: { status?: GrievanceStatus; district?: string }): Promise<GrievanceTicket[]> {
  const params = new URLSearchParams();
  if (filter?.status) params.set('status', filter.status);
  if (filter?.district) params.set('district', filter.district);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/grievances${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.tickets || [];
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

export async function fetchGrievanceSummary(): Promise<GrievanceSummary | null> {
  try {
    const res = await fetch(`${API_BASE}/grievances/summary`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.summary || null;
  } catch {
    return null;
  }
}

export async function updateGrievanceStatus(
  ticketId: string,
  status: GrievanceStatus,
  note?: string
): Promise<{ success: boolean; ticket?: GrievanceTicket; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/grievances/${encodeURIComponent(ticketId)}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, message: data.error || `HTTP ${res.status}` };
    return { success: true, ticket: data.ticket, message: 'स्थिति अपडेट हो गई।' };
  } catch (error: any) {
    return { success: false, message: error.message || 'नेटवर्क त्रुटि' };
  }
}

// ═══ F2 · Lifecycle Nudge Client ═══════════════════════════════════════════

export async function enrollForLifecycleNudges(params: {
  beneficiaryId: string;
  beneficiaryName: string;
  district: string;
  whatsappNumber: string;
  enrolledAt?: number;
}): Promise<{ success: boolean; enrollment?: LifecycleEnrollment; whatsappConfigured?: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/lifecycle/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, message: data.error || `HTTP ${res.status}` };
    return {
      success: true,
      enrollment: data.enrollment,
      whatsappConfigured: data.whatsappConfigured,
      message: data.message || 'नामांकन सफल',
    };
  } catch (error: any) {
    return { success: false, message: error.message || 'नेटवर्क त्रुटि' };
  }
}

export async function fetchLifecycleEnrollment(
  beneficiaryId: string
): Promise<{ enrollment: LifecycleEnrollment | null; whatsappConfigured: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/lifecycle/${encodeURIComponent(beneficiaryId)}`);
    if (res.status === 404) return { enrollment: null, whatsappConfigured: false };
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { enrollment: data.enrollment || null, whatsappConfigured: !!data.whatsappConfigured };
  } catch {
    return { enrollment: null, whatsappConfigured: false };
  }
}

/** All enrolled profiles with their WhatsApp threads — Ministry portal view. */
export async function fetchLifecycleEnrollments(): Promise<LifecycleEnrollment[]> {
  try {
    const res = await fetch(`${API_BASE}/lifecycle`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.enrollments || [];
  } catch {
    return [];
  }
}

/** Forces an immediate scheduler pass — used by the demo "Send now" control. */
export async function triggerLifecycleSweep(): Promise<{ dispatchedCount: number; whatsappConfigured: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/lifecycle/sweep`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { dispatchedCount: data.dispatchedCount || 0, whatsappConfigured: !!data.whatsappConfigured };
  } catch {
    return { dispatchedCount: 0, whatsappConfigured: false };
  }
}

export async function fetchLifecycleSchedule(): Promise<{  schedule: { key: string; dayOffset: number; label: string; labelHi: string }[];
  whatsappConfigured: boolean;
}> {
  const res = await fetch(`${API_BASE}/lifecycle/schedule`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ═══ F3 · Post-Course Guidance Client ══════════════════════════════════════

export async function markCourseComplete(params: {
  beneficiaryId: string;
  nsqfQpCode: string;
  district: string;
  completedAt?: number;
}): Promise<{ success: boolean; completedAt?: number; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/course/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, message: data.error || `HTTP ${res.status}` };
    return {
      success: true,
      completedAt: data.record?.completedAt,
      message: 'प्रशिक्षण पूर्ण हो गया।',
    };
  } catch (error: any) {
    return { success: false, message: error.message || 'नेटवर्क त्रुटि' };
  }
}

export async function fetchLocalEmployers(params: {
  district: string;
  qpCode: string;
  nsqfLevel?: number;
}): Promise<{ district: string; openings: PostTrainingJobOpening[]; exactMatches: number }> {
  const query = new URLSearchParams({ district: params.district, qpCode: params.qpCode });
  if (params.nsqfLevel) query.set('nsqfLevel', String(params.nsqfLevel));
  const res = await fetch(`${API_BASE}/post-training/jobs?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return { district: data.district, openings: data.openings || [], exactMatches: data.exactMatches || 0 };
}

// ═══ Twilio Telecom Gateway Client ════════════════════════════════════════════

export interface TwilioGatewayStatus {
  success: boolean;
  configured: boolean;
  smsConfigured: boolean;
  whatsappConfigured: boolean;
  accountSidMasked: string | null;
  smsFrom: string | null;
  whatsappFrom: string | null;
}

export async function fetchTwilioStatus(): Promise<TwilioGatewayStatus> {
  try {
    const res = await fetch(`${API_BASE}/twilio/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      success: false,
      configured: false,
      smsConfigured: false,
      whatsappConfigured: false,
      accountSidMasked: null,
      smsFrom: null,
      whatsappFrom: null,
    };
  }
}

export async function sendTwilioTestMessage(params: {
  phoneNumber: string;
  message?: string;
  channel?: 'sms' | 'whatsapp' | 'auto';
}): Promise<{
  success: boolean;
  channel: 'sms' | 'whatsapp';
  messageSid: string | null;
  reason: string;
  mode: string;
  preview: string;
}> {
  const res = await fetch(`${API_BASE}/twilio/send-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return await res.json();
}

export async function sendTwilioOtp(params: {
  phoneNumber: string;
  channel?: 'sms' | 'whatsapp';
  aadhaarNumber?: string;
}): Promise<{
  success: boolean;
  sentViaTwilio: boolean;
  channel: string;
  messageSid: string | null;
  demoOtp?: string;
  message: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/twilio/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch {
    return {
      success: true,
      sentViaTwilio: false,
      channel: params.channel || 'sms',
      messageSid: null,
      demoOtp: '1234',
      message: 'ऑफलाइन/ड्राई मोड: 1234 का उपयोग करें',
    };
  }
}

export async function verifyTwilioOtp(params: {
  phoneNumber: string;
  code: string;
}): Promise<{ success: boolean; valid: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/twilio/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch {
    const valid = params.code.trim() === '1234';
    return { success: valid, valid, message: valid ? 'सत्यापित' : 'अमान्य कोड' };
  }
}

export async function sendTwilioAdmissionAlert(params: {
  phoneNumber: string;
  beneficiaryName: string;
  roleName: string;
  centreName: string;
  tokenId: string;
}): Promise<{ success: boolean; sentViaTwilio: boolean; messageSid: string | null; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/twilio/send-admission-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch {
    return { success: false, sentViaTwilio: false, messageSid: null, message: 'नेटवर्क त्रुटि' };
  }
}

