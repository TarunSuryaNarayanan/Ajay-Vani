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
  let beneficiaryName = "साथी";
  const nameMatch = transcript.match(/(?:naam|नाम|हमार नाम|मेरा नाम)\s+([A-Za-z\u0900-\u097F]+)/i);
  if (nameMatch && nameMatch[1]) {
    beneficiaryName = nameMatch[1];
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

  let friendlyAudio = "";
  if (dialect.includes("bho")) {
    friendlyAudio = `राम राम ${beneficiaryName} भाई! आपके अनुभव के आधार पर ${roleNameHi} खातिर आपके जिले ${districtName} में ${vacanciesCount} जगह उपलब्ध बा। पास के सरकारी सेंटर में 300 घंटा के मुफ़्त कोर्स और भोजन भत्ता के सुविधा बा।`;
  } else if (dialect.includes("bun")) {
    friendlyAudio = `राम राम ${beneficiaryName} भइया! आपके जिले ${districtName} में ${roleNameHi} के काम में ${vacanciesCount} पद खाली हैं। पास के केंद्र में मुफ्त ट्रेनिंग के संगे भोजन भत्ता भी मिलेगो।`;
  } else {
    friendlyAudio = `नमस्ते ${beneficiaryName} जी! आपके अनुभव के आधार पर ${roleNameHi} आपके लिए सबसे उत्तम है। आपके जिले ${districtName} में इसके लिए ${vacanciesCount} पद उपलब्ध हैं। पास के सरकारी केंद्र में 300 घंटे का निःशुल्क प्रशिक्षण उपलब्ध है।`;
  }

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
): Promise<{ tokenId: string; qrSvg: string; qrDataUrl: string }> {
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
  const qrSvg = QRCode.toString(payloadJson, { type: 'svg', errorCorrectionLevel: 'M', width: 512 }).then(
    (svg: string) => svg
  );

  // Also generate a data URL version for canvas rendering
  const qrDataUrl = await QRCode.toDataURL(payloadJson, {
    errorCorrectionLevel: 'M',
    width: 512,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
  });

  const svgResult = await qrSvg;

  try {
    await fetch(`${API_BASE}/qr-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(payload),
    }).catch(() => {});
  } catch (e) {
    console.warn('[QR Token] Could not persist token on server:', e);
  }

  return { tokenId, qrSvg: svgResult, qrDataUrl };
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
