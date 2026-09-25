import { VoiceProcessResult, LanguageCode, DistrictMarket } from '../types';

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
        distanceKm: 5.2,
        courseName: `${roleName} Course (${qpCode})`,
        courseNameHi: `${roleNameHi} प्रशिक्षण (300 घंटे)`,
        durationHours: 300,
        benefits: ["निःशुल्क प्रशिक्षण", "मुफ्त टूलकिट एवं यूनिफॉर्म", "दैनिक भोजन व यात्रा भत्ता (₹150/दिन)"],
        benefitsHi: ["निःशुल्क प्रशिक्षण", "मुफ्त टूलकिट एवं यूनिफॉर्म", "दैनिक भोजन व यात्रा भत्ता (₹150/दिन)"],
        coordinatorName: "श्री राजेश कुमार मिश्र",
        coordinatorPhone: "+91 94520 18290",
        address: `${districtName} केंद्र परिसर, उत्तर प्रदेश`,
        addressHi: `${districtName} केंद्र परिसर, उत्तर प्रदेश`
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
    friendlyAudioResponse: friendlyAudio
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
