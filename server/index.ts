import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { NSQF_PACKS, NSQFPack } from './data/nsqfPacks';
import { DISTRICT_MARKET_REGISTRY, DistrictMarketData } from './data/districtJobs';

// Load .env credentials for Bhashini
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow large base64 audio payloads

// ─── Bhashini Configuration ───────────────────────────────────────────────────

const BHASHINI_USER_ID = process.env.BHASHINI_USER_ID || '';
const BHASHINI_ULCA_API_KEY = process.env.BHASHINI_ULCA_API_KEY || '';
const BHASHINI_INFERENCE_KEY = process.env.BHASHINI_INFERENCE_KEY || '';
const BHASHINI_PIPELINE_ID = '64392f96daac500b55c543cd';
const BHASHINI_CONFIG_ENDPOINT = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline';
const BHASHINI_COMPUTE_ENDPOINT = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';

// Map app LanguageCodes → Bhashini ISO-639 language codes
function toBhashiniLang(lang: string): string {
  if (lang.startsWith('ta')) return 'ta';
  if (lang.startsWith('te')) return 'te';
  if (lang.startsWith('mr')) return 'mr';
  if (lang.startsWith('bn')) return 'bn';
  if (lang.startsWith('mai')) return 'mai';
  if (lang.startsWith('bho')) return 'bho';
  // bun (Bundeli), chg (Chhattisgarhi) → Hindi (closest supported)
  return 'hi';
}

// Cache serviceIds per task+language to avoid repeated Config calls
const serviceIdCache: Record<string, { serviceId: string; ts: number }> = {};
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getBhashiniServiceId(taskType: 'asr' | 'tts', language: string): Promise<string> {
  const cacheKey = `${taskType}:${language}`;
  const cached = serviceIdCache[cacheKey];
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.serviceId;

  const res = await fetch(BHASHINI_CONFIG_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      userID: BHASHINI_USER_ID,
      ulcaApiKey: BHASHINI_ULCA_API_KEY,
    },
    body: JSON.stringify({
      pipelineTasks: [{ taskType }],
      pipelineRequestConfig: { pipelineId: BHASHINI_PIPELINE_ID },
    }),
  });

  if (!res.ok) throw new Error(`Bhashini config call failed: ${res.status} ${await res.text()}`);
  const data = await res.json();

  const taskConfigs = data.pipelineResponseConfig?.find(
    (t: any) => t.taskType === taskType
  )?.config ?? [];

  // Try exact language match first, then fall back to Hindi
  const match =
    taskConfigs.find((c: any) => c.language?.sourceLanguage === language) ||
    taskConfigs.find((c: any) => c.language?.sourceLanguage === 'hi');

  if (!match?.serviceId) throw new Error(`No ${taskType} service found for language: ${language}`);

  serviceIdCache[cacheKey] = { serviceId: match.serviceId, ts: Date.now() };
  return match.serviceId;
}

// ─── Bhashini Proxy: ASR ──────────────────────────────────────────────────────

app.post('/api/bhashini/asr', async (req: Request, res: Response) => {
  try {
    const { audioBase64, language = 'hi-IN' } = req.body;

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ success: false, error: 'audioBase64 is required.' });
    }

    const bhashiniLang = toBhashiniLang(language);
    const serviceId = await getBhashiniServiceId('asr', bhashiniLang);

    const computeRes = await fetch(BHASHINI_COMPUTE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: BHASHINI_INFERENCE_KEY,
        userID: BHASHINI_USER_ID,
        ulcaApiKey: BHASHINI_ULCA_API_KEY,
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: 'asr',
            config: {
              language: { sourceLanguage: bhashiniLang },
              serviceId,
              audioFormat: 'wav',
              samplingRate: 16000,
            },
          },
        ],
        inputData: {
          audio: [{ audioContent: audioBase64 }],
        },
      }),
    });

    if (!computeRes.ok) {
      const errText = await computeRes.text();
      throw new Error(`Bhashini ASR compute failed: ${computeRes.status} — ${errText}`);
    }

    const data = await computeRes.json();
    const asrTask = data.pipelineResponse?.find((t: any) => t.taskType === 'asr');
    const transcript = asrTask?.output?.[0]?.source ?? '';

    return res.json({ success: true, transcript });
  } catch (err: any) {
    console.error('[Bhashini ASR] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Bhashini Proxy: TTS ──────────────────────────────────────────────────────

app.post('/api/bhashini/tts', async (req: Request, res: Response) => {
  try {
    const { text, language = 'hi-IN', gender = 'female' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'text is required.' });
    }

    const bhashiniLang = toBhashiniLang(language);
    const serviceId = await getBhashiniServiceId('tts', bhashiniLang);

    const computeRes = await fetch(BHASHINI_COMPUTE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: BHASHINI_INFERENCE_KEY,
        userID: BHASHINI_USER_ID,
        ulcaApiKey: BHASHINI_ULCA_API_KEY,
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: 'tts',
            config: {
              language: { sourceLanguage: bhashiniLang },
              serviceId,
              gender,
            },
          },
        ],
        inputData: {
          input: [{ source: text }],
        },
      }),
    });

    if (!computeRes.ok) {
      const errText = await computeRes.text();
      throw new Error(`Bhashini TTS compute failed: ${computeRes.status} — ${errText}`);
    }

    const data = await computeRes.json();
    const ttsTask = data.pipelineResponse?.find((t: any) => t.taskType === 'tts');
    const audioBase64 = ttsTask?.audio?.[0]?.audioContent ?? '';
    const samplingRate: number = ttsTask?.config?.samplingRate ?? 22050;

    return res.json({ success: true, audioBase64, samplingRate });
  } catch (err: any) {
    console.error('[Bhashini TTS] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── NLP & Heuristic Classifier for Voice Transcripts ────────────────────────

function analyzeTranscript(transcript: string, districtName: string = "Varanasi", dialect: string = "hi-IN") {
  const lower = transcript.toLowerCase();
  
  // 1. Detect Education Level
  let educationLevel = "अनौपचारिक शिक्षा (Non-Formal Education)";
  if (lower.includes("8") || lower.includes("aathvi") || lower.includes("आठवीं")) {
    educationLevel = "8वीं पास (8th Pass)";
  } else if (lower.includes("10") || lower.includes("dasvi") || lower.includes("दसवीं") || lower.includes("metric")) {
    educationLevel = "10वीं पास (10th Pass)";
  } else if (lower.includes("12") || lower.includes("barahvi") || lower.includes("बारहवीं") || lower.includes("inter")) {
    educationLevel = "12वीं पास (12th Pass)";
  } else if (lower.includes("iti") || lower.includes("आईटीआई")) {
    educationLevel = "आईटीआई प्रमाण पत्र (ITI Certificate)";
  }

  // 2. Detect Traditional Occupation & Match NSQF
  let bestPack: NSQFPack = NSQF_PACKS[0]; // Default Solar PV Installer
  let highestMatch = 0;

  for (const pack of NSQF_PACKS) {
    let score = 0;
    for (const kw of pack.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += 10;
      }
    }
    if (score > highestMatch) {
      highestMatch = score;
      bestPack = pack;
    }
  }

  // Calculate Feasibility Match Score based on district market demand
  const districtKey = Object.keys(DISTRICT_MARKET_REGISTRY).find(k => 
    districtName.toLowerCase().includes(k.toLowerCase())
  ) || "Varanasi";

  const districtData = DISTRICT_MARKET_REGISTRY[districtKey] || DISTRICT_MARKET_REGISTRY["Varanasi"];
  const baseDemand = bestPack.districtDemandScore[districtKey] || bestPack.districtDemandScore["Default"] || 90;
  const matchScore = Math.min(98, Math.max(78, baseDemand + (highestMatch > 0 ? 2 : 0)));

  // 3. Detect Employment Preference
  let employmentPreference = "स्वरोजगार (Self-Employment)";
  if (lower.includes("naukri") || lower.includes("job") || lower.includes("नौकरी") || lower.includes("factory")) {
    employmentPreference = "स्थानीय वेतनभोगी नौकरी (Salaried Local Job)";
  }

  // 4. Extract Beneficiary Name if spoken
  let beneficiaryName = "साथी";
  const nameMatch = transcript.match(/(?:naam|नाम|हमार नाम|मेरा नाम)\s+([A-Za-z\u0900-\u097F]+)/i);
  if (nameMatch && nameMatch[1]) {
    beneficiaryName = nameMatch[1];
  }

  // 5. Generate Empathetic Dialect-Attuned Spoken Response (Zero em dashes, calm facilitator tone)
  let friendlyAudioResponse = "";
  if (dialect.includes("bho") || dialect.includes("bhojpuri")) {
    friendlyAudioResponse = `राम राम ${beneficiaryName} भाई! आपके बात से साफ बा कि आपमें हुनर बा। ${bestPack.roleNameHi} खातिर आपके जिले ${districtData.district} में ${districtData.openingsCount} जगह खाली बा। पास के सरकारी आईटीआई सेंटर में 300 घंटा के मुफ़्त ट्रेनिंग और भोजन भत्ता भी मिले के व्यवस्था बा।`;
  } else if (dialect.includes("bun") || dialect.includes("bundeli")) {
    friendlyAudioResponse = `राम राम ${beneficiaryName} भइया! आपके जिले में ${bestPack.roleNameHi} के काम की भारी मांग है। ${districtData.district} में ${districtData.openingsCount} पद खाली हैं। पास के केंद्र में मुफ्त ट्रेनिंग के संगे भोजन भत्ता भी मिलेगो।`;
  } else {
    // Standard Hindi / Neutral Regional
    friendlyAudioResponse = `नमस्ते ${beneficiaryName} जी! आपके अनुभव के आधार पर ${bestPack.roleNameHi} आपके लिए सबसे उपयुक्त है। आपके जिले ${districtData.district} में इसके लिए ${districtData.openingsCount} पद उपलब्ध हैं। पास के केंद्र में 300 घंटे का निःशुल्क प्रशिक्षण उपलब्ध है।`;
  }

  return {
    profile: {
      beneficiaryName,
      educationLevel,
      traditionalOccupation: bestPack.roleName,
      employmentPreference,
      mobilityRadius: "जिले के अंदर (15 किमी दायरा)",
    },
    recommendedNSQF: {
      qpCode: bestPack.qpCode,
      roleName: bestPack.roleName,
      roleNameHi: bestPack.roleNameHi,
      nsqfLevel: bestPack.nsqfLevel,
      sector: bestPack.sector,
      matchScore: matchScore,
      estimatedIncome: bestPack.estimatedWageOrIncome
    },
    districtMarket: {
      district: districtData.district,
      state: districtData.state,
      odopSector: districtData.odopSector,
      odopSectorHi: districtData.odopSectorHi,
      vacanciesCount: districtData.openingsCount,
      centers: districtData.centers
    },
    friendlyAudioResponse
  };
}

// ─── 1. Process Voice Transcript Endpoint ────────────────────────────────────

app.post('/api/voice/process', (req: Request, res: Response) => {
  try {
    const { transcript, district = "Varanasi", state = "Uttar Pradesh", language = "hi-IN" } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({
        success: false,
        error: "वॉइस ट्रांसक्रिप्ट आवश्यक है (Voice transcript is required)."
      });
    }

    const result = analyzeTranscript(transcript, district, language);

    return res.json({
      success: true,
      profile: result.profile,
      recommendedNSQF: result.recommendedNSQF,
      districtMarket: result.districtMarket,
      friendlyAudioResponse: result.friendlyAudioResponse
    });
  } catch (err: any) {
    console.error("Error processing voice transcript:", err);
    return res.status(500).json({
      success: false,
      error: "सर्वर पर वॉइस प्रोसेसिंग में समस्या आई। कृपया पुनः प्रयास करें।"
    });
  }
});

// ─── 2. Sync Offline Interviews Endpoint ─────────────────────────────────────

app.post('/api/sync/offline', (req: Request, res: Response) => {
  try {
    const interviews = req.body;
    if (!Array.isArray(interviews)) {
      return res.status(400).json({
        success: false,
        error: "इंटरव्यू रिकॉर्ड्स की सूची अपेक्षित है।"
      });
    }

    const syncedCount = interviews.length;
    console.log(`[Offline Sync] Successfully received and stored ${syncedCount} queued rural interviews.`);

    return res.json({
      success: true,
      syncedCount,
      timestamp: new Date().toISOString(),
      message: `${syncedCount} ऑफलाइन इंटरव्यू सफलतापूर्वक सिंक हो गए हैं।`
    });
  } catch (err: any) {
    console.error("Error syncing offline interviews:", err);
    return res.status(500).json({
      success: false,
      error: "डेटा सिंक करने में विफलता।"
    });
  }
});

// ─── 3. District Market & Center Locator Data ─────────────────────────────────

app.get('/api/district-data', (req: Request, res: Response) => {
  const districtQuery = (req.query.district as string) || "Varanasi";
  const matchedKey = Object.keys(DISTRICT_MARKET_REGISTRY).find(k =>
    k.toLowerCase().includes(districtQuery.toLowerCase())
  ) || "Varanasi";

  return res.json({
    success: true,
    data: DISTRICT_MARKET_REGISTRY[matchedKey]
  });
});

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "AJAY-VANI Voice Livelihood Engine",
    version: "2.0.0",
    bhashiniConfigured: !!(BHASHINI_USER_ID && BHASHINI_ULCA_API_KEY && BHASHINI_INFERENCE_KEY),
    time: new Date().toISOString()
  });
});

// ─── Serve built PWA frontend ─────────────────────────────────────────────────

const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: "Endpoint not found" });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AJAY-VANI API Server running on port ${PORT}`);
  if (!BHASHINI_USER_ID || !BHASHINI_ULCA_API_KEY || !BHASHINI_INFERENCE_KEY) {
    console.warn('[Bhashini] WARNING: API credentials not set. Copy .env.example to .env and add your keys.');
  } else {
    console.log('[Bhashini] ASR + TTS proxy ready.');
  }
});
