# AJAY-VANI Mobile App

**AI-Driven Multilingual Voice Livelihood Assistant for PM-AJAY**

A voice-first Progressive Web App (PWA) that replaces intimidating government forms with empathetic, dialect-aware voice interviews. Converts rural beneficiary voice responses into NSQF Qualification Packs, matches them to local district job demand (ODOP & MSMEs), and provides audio guidance on PM-AJAY GIA ₹50,000 subsidies & MUDRA loans.

## 🎯 Project Overview

| Aspect | Details |
|--------|---------|
| **Target Users** | SC Beneficiaries (Low Digital Literacy, Dialect Speakers), Rural Youth, Gram Sahayaks (ASHA/Anganwadi Workers) |
| **Platform** | Progressive Web App (PWA) — Installable on Android/iOS, works offline |
| **Core Mission** | Voice-first civic tool for livelihood access under PM-AJAY scheme |
| **Languages Supported** | Hindi, Bhojpuri, Bundeli, Chhattisgarhi, Maithili, Tamil, Telugu, Marathi, Bengali |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS (custom design tokens) |
| **State Management** | React Context API |
| **Offline Storage** | IndexedDB via `idb` |
| **PWA** | `vite-plugin-pwa` with Service Worker |
| **Backend** | Express.js + TypeScript (tsx) |
| **Speech (Client)** | Silero VAD + WebRTC MediaRecorder for voice activity detection |
| **Speech (ASR)** | Bhashini Bharati (online) with IndicWhisper ONNX (offline, per-language pack) |
| **Speech (TTS)** | Bhashini server-side TTS (online) with Piper ONNX (offline, Hindi only) |
| **AI Classification** | Heuristic keyword matching (server-side) — designed for Gemini/Groq integration |

### Key Dependencies

```json
"dependencies": {
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "express": "^4.21.0",
  "idb": "^8.0.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.5.2",
  "jspdf": "^2.5.2",
  "@ricky0123/vad-web": "^0.0.31",
  "onnxruntime-web": "^1.30.0",
  "@huggingface/transformers": "^4.3.0",
  "qrcode": "^1.5.4",
  "compression": "^1.8.2"
}
```

## ✨ Features

### Core Screens

1. **Language & Dialect Selection** — Large native-script tiles with voice preview (9 dialects)
2. **Empathetic Voice Assistant** — Big mic button, live waveform, real-time transcript, audio replay
3. **NSQF Skill Profile** — Extracted profile + matched QP code (e.g., `ELE/Q5901`), feasibility match score
4. **Skilling Centers & Jobs** — Nearby PM-AJAY centers, ODOP vacancies, direct coordinator call
5. **Micro-Finance Guide** — Step-by-step audio for GIA ₹50k subsidy & MUDRA loan, PDF proposal generator
6. **Offline Sync Monitor** — Queue interviews locally, auto-sync when online, status indicators

### Offline-First Architecture

- **Voice pipeline:** Silero VAD (v5 ONNX) + WebRTC MediaRecorder for audio capture; Bhashini ASR is tried first, then local ONNX Whisper (transformers.js) when a language pack is downloaded and cached.
- **Language packs:** Each language ships as an independently downloadable pack (ASR weights + optionally TTS voice). Packs are triggered at language selection (C15), content-addressed (C10), served from `/models/` behind `MODEL_BASE_URL`, and verified with sha256 on download.
- **Offline TTS:** Available for **Hindi only** via Piper ONNX (`hi_IN-pratham-medium`). The other 8 languages (bho, bun, chg, mai, ta, te, mr, bn) use Bhashini Enhanced TTS online — there is no permissively-licensed, browser-viable offline TTS for them (see model feasibility in the plan).
- **Storage:** IndexedDB stores complete interview records (transcript, profile, NSQF match, district, language)
- **Network listeners** trigger immediate sync on reconnection
- **Visual offline banner** + pending count badge

### Multilingual Voice Support
- **9 Indian dialects** supported: Hindi, Bhojpuri, Bundeli, Chhattisgarhi, Maithili, Tamil, Telugu, Marathi, Bengali
- **bho/bun/chg/mai** resolve to the Hindi ASR pack as an explicit, visible alias — never a silent substitution. Server-side, these also map to Hindi in the Bhashini proxy.
- **Offline ASR:** IndicWhisper ONNX (transformers.js, q8_0) per language pack — downloaded on first use
- **Offline TTS:** Piper ONNX, Hindi only (`hi_IN-pratham-medium`)
- **Dialect-specific empathetic audio responses** (Hindi, Bhojpuri, Bundeli + fallback)
- **Server-side keyword matching** across Devanagari + transliterated terms

### Offline Voice Coverage (E24)

| Language | Offline ASR | Offline TTS | Notes |
|----------|-------------|-------------|-------|
| Hindi (hi) | IndicWhisper ONNX | Piper ONNX | Full offline capability |
| Tamil (ta) | IndicWhisper ONNX | Bhashini only | No permissive offline TTS |
| Telugu (te) | IndicWhisper ONNX | Bhashini only | No permissive offline TTS |
| Marathi (mr) | IndicWhisper ONNX | Bhashini only | No permissive offline TTS |
| Bengali (bn) | IndicWhisper ONNX | Bhashini only | No permissive offline TTS |
| Bhojpuri (bho) | Aliased to Hindi | Bhashini only | No dedicated offline model |
| Bundeli (bun) | Aliased to Hindi | Bhashini only | No dedicated offline model |
| Chhattisgarhi (chg) | Aliased to Hindi | Bhashini only | No dedicated offline model |
| Maithili (mai) | Aliased to Hindi | Bhashini only | No dedicated offline model |

**8 of 9 languages have no offline TTS.** This is a research finding, not a scope cut — Meta MMS is CC-BY-NC (non-commercial), Indic Parler-TTS is 2.3 GB, and Piper has no voices outside Hindi. If full offline voice is a hard requirement, revisiting the PWA-vs-native decision (sherpa-onnx) is the highest-leverage move.

### Government Scheme Integration
- Authentic NSQF QP codes from NSDC
- Real district demand scores (Varanasi, Gorakhpur, Patna, Bundelkhand)
- PM-AJAY GIA ₹50,000 + MUDRA loan guidance
- One-page PDF business proposal generation

### Advanced Governance & Post-Course System

Three additive features on top of the existing flow. **Nothing legacy was replaced** — every
pre-existing screen, endpoint and fallback path still works and remains the default whenever a
new gate is not satisfied.

**F1 · Voice-Based Grievance Redressal (whistleblowing engine)**
- Prominent "Report Issue" microphone on the beneficiary dashboard; the typed complaint form
  (issue-type dropdown + free text) is the **default** capture path and the mic is an alternative
  dictation route that feeds the same field via ASR
- Every ticket is auto-tagged with beneficiary ID, active district and assigned training centre
  (`buildGrievanceMetadata` in `src/services/governance.ts`)
- `POST /api/grievances`, `GET /api/grievances`, `GET /api/grievances/summary`,
  `POST /api/grievances/:id/status`, backed by an in-memory ledger that mirrors the QR token store
- Forwarded to the in-app **Ministry Monitoring Dashboard** (Header 🏛️ button). External portal
  forwarding stays behind the `GOVERNMENT_PORTAL_URL` flag while the portal is in development
- Offline complaints queue locally and flush on reconnection

**F2 · Automated Lifecycle Nudges via WhatsApp (Twilio)**
- Enrollment timestamp recorded on the "Enroll" click (`server/services/lifecycleScheduler.ts`)
- **Day 45** check-in and **Day 90** completion nudges, fired by a tick-based scheduler
  (`LIFECYCLE_SWEEP_INTERVAL_MS`, default 60s). `POST /api/lifecycle/sweep` forces a pass for demos
- Inbound Day-45 replies arrive at `POST /api/whatsapp/inbound` and route straight back to the
  beneficiary's profile stream — visible in their own dashboard inbox and in the Ministry
  dashboard's conversation view (`GET /api/lifecycle`)
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` are **optional** — the server
  boots and runs without them and sends degrade to a logged, retryable no-op

**F3 · Post-Course AI Guidance (second conversation loop)**
- `AadhaarSession.courseCompleted` + nullable `completedAt`, set by the dashboard's
  "Complete Training" button and persisted per beneficiary
- The `post-training-guidance` screen opens automatically on Day 90+ login. Everyone else stays on
  the legacy `beneficiary-dashboard`; the screen itself also guards against a null `completedAt`
- **Path A** — certified trade auto-populated into the existing PM-AJAY ₹50,000 proposal PDF plus a
  BDO physical-submission checklist
- **Path B** — `GET /api/post-training/jobs` filters the district registry by the beneficiary's
  `qpCode` and district; certified matches rank first
- **Path C** — step-by-step PM MUDRA loan (up to ₹10 lakh) guidance
- The original `micro-finance` screen stays reachable from the new screen as a legacy fallback

## 📁 Project Structure

```
ajay-vani-mobile/
├── public/                 # Static assets (manifest, icons)
├── server/                 # Express backend
│   ├── data/
│   │   ├── nsqfPacks.ts    # 6 NSQF qualification packs with keywords & demand scores
│   │   └── districtJobs.ts # District market registry (centers, ODOP, vacancies)
│   ├── services/
│   │   ├── grievanceLedger.ts     # F1 grievance ticket ledger + summary aggregation
│   │   ├── lifecycleScheduler.ts  # F2 enrollment store, Day-45/90 scheduler, replies
│   │   ├── whatsapp.ts            # Twilio WhatsApp sender (optional credentials)
│   │   └── postTraining.ts        # F3 completion ledger, Day-90 gate, job queries
│   └── index.ts            # API routes + heuristic transcript analyzer
├── src/
│   ├── components/
│   │   ├── Governance/     # GrievanceReporter, LifecycleNudgePanel
│   │   ├── Layout/         # MobileContainer, Header, OfflineBanner
│   │   └── Modals/         # PrivacyPolicyModal, TermsModal
│   ├── context/
│   │   └── AppContext.tsx  # Global state (screen, language, district, offline queue, sync)
│   ├── screens/
│   │   ├── LanguageSelectionScreen.tsx
│   │   ├── VoiceChatScreen.tsx
│   │   ├── NSQFProfileScreen.tsx
│   │   ├── SkillingJobsScreen.tsx
│   │   ├── MicroFinanceScreen.tsx
│   │   ├── PostTrainingGuidanceScreen.tsx  # F3 second conversation loop
│   │   ├── MinistryDashboardScreen.tsx     # F1 grievance destination
│   │   └── OfflineSyncScreen.tsx
│   ├── services/
│   │   ├── api.ts              # Backend API calls
│   │   ├── audioCapture.ts     # Silero VAD + WebRTC MediaRecorder
│   │   ├── speech.ts           # ASR/TTS orchestrator (Bhashini + local ONNX)
│   │   ├── governance.ts       # F1/F2/F3 pure helpers + Day-90 gating
│   │   ├── modelPackManager.ts # Pack manifest + state machine
│   │   ├── packDownloader.ts   # Download with resume + sha256 verification
│   │   ├── offlineStorage.ts   # IndexedDB operations
│   │   └── translations.ts     # UI strings for all 9 languages
│   ├── types/
│   │   └── index.ts        # TypeScript interfaces
│   ├── App.tsx             # Root component + screen router
│   ├── main.tsx            # Entry point + SW registration
│   └── index.css           # Tailwind + design tokens
├── package.json
├── vite.config.ts
├── tailwind.config.js      # Custom design tokens (color-action, color-trust, etc.)
├── tsconfig.json
└── design.md               # Design system specification
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone and install
cd "Ajay Vani Mobile App"
npm install

# Development (runs client + server concurrently)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Start production server
npm run start
```

### Development URLs
- **Frontend (Vite):** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/health

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/voice/process` | Process voice transcript → returns profile, NSQF match, district market, audio response |
| `POST` | `/api/sync/offline` | Batch sync offline interview records |
| `GET` | `/api/district-data` | Get skilling centers & market data for a district |
| `GET` | `/api/health` | Service health check |
| `POST` | `/api/grievances` | **F1** Create a grievance ticket (auto-tagged, forwarded to Ministry dashboard) |
| `GET` | `/api/grievances` | **F1** List tickets (`?status=`, `?district=`) |
| `GET` | `/api/grievances/summary` | **F1** Aggregated counts by status, issue type, district |
| `POST` | `/api/grievances/:id/status` | **F1** Move a ticket to `in-review` / `resolved` |
| `POST` | `/api/lifecycle/enroll` | **F2** Record the Enroll timestamp for WhatsApp nudges |
| `GET` | `/api/lifecycle` | **F2** All enrolled profiles with their WhatsApp threads |
| `GET` | `/api/lifecycle/:beneficiaryId` | **F2** Enrollment + message thread for a profile inbox |
| `POST` | `/api/lifecycle/sweep` | **F2** Force a scheduler pass now (demo control) |
| `POST` | `/api/whatsapp/inbound` | **F2** Twilio inbound webhook — replies route to the profile stream |
| `POST` | `/api/course/complete` | **F3** Record training completion (`completedAt`) |
| `GET` | `/api/post-training/jobs` | **F3** Local employers for a district + NSQF code |

### Environment Configuration

Copy `.env.example` to `.env`. Everything except the Bhashini keys is optional — the server boots
and degrades gracefully when they are unset.

| Variable | Required | Purpose |
|----------|----------|---------|
| `BHASHINI_USER_ID` / `BHASHINI_ULCA_API_KEY` / `BHASHINI_INFERENCE_KEY` | For online ASR/TTS | Bhashini ASR + TTS proxy |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` | For F2 sends | WhatsApp nudges; unset = dry mode |
| `LIFECYCLE_SWEEP_INTERVAL_MS` | No | Scheduler cadence (default 60000) |
| `GOVERNMENT_PORTAL_URL` | No | External grievance portal; unset = Ministry dashboard only |
| `OGD_API_KEY` | For `npm run data:fetch` | Free data.gov.in key, used only by the fetch script to pull the real training-centre snapshot. The server never calls data.gov.in at runtime. See [docs/DATA_SOURCE.md](docs/DATA_SOURCE.md). |


### Request/Response Example

**POST /api/voice/process**
```json
// Request
{
  "transcript": "Mera naam Ramesh hai, main gaon me bijli ka kaam karta hoon aur solar seekhna chahta hoon.",
  "district": "Varanasi",
  "state": "Uttar Pradesh",
  "language": "hi-IN"
}

// Response
{
  "success": true,
  "profile": {
    "beneficiaryName": "Ramesh",
    "educationLevel": "8वीं पास (8th Pass)",
    "traditionalOccupation": "Electrical Repair",
    "employmentPreference": "स्वरोजगार (Self-Employment)",
    "mobilityRadius": "जिले के अंदर (15 किमी दायरा)"
  },
  "recommendedNSQF": {
    "qpCode": "ELE/Q5901",
    "roleName": "Solar PV Installer",
    "roleNameHi": "सोलर पीवी इंस्टॉलर एवं तकनीशियन",
    "nsqfLevel": 4,
    "sector": "Green Jobs / Renewable Energy",
    "matchScore": 92,
    "estimatedIncome": "₹18,000 - ₹26,000 / माह"
  },
  "districtMarket": {
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "odopSector": "Solar",
    "odopSectorHi": "सोलर",
    "vacanciesCount": 120,
    "centers": [...]
  },
  "friendlyAudioResponse": "नमस्ते Ramesh जी! आपके अनुभव के आधार पर सोलर पीवी इंस्टॉलर एवं तकनीशियन आपके लिए सबसे उपयुक्त है..."
}
```

## 🎨 Design System

Defined in `design.md` and implemented via `tailwind.config.js`:

### Color Tokens
| Token | Hex | Usage |
|-------|-----|-------|
| `color-action` | `#FC8A15` | Primary actions (mic, CTAs) |
| `color-surface` | `#F6F6F6` | App background |
| `color-positive` | `#1EE494` | Success states only |
| `color-trust` | `#009378` | Structure (headers, nav, avatar) |
| `color-ink` | `#14231F` | Primary text |
| `color-ink-muted` | `#54655F` | Secondary text |
| `color-line` | `#E1E0DB` | Borders/dividers |
| `color-alert` | `#C6482E` | Errors |

### Typography
- **Font:** Noto Sans + Noto Sans Devanagari (matched weights)
- **Scale:** Display 28/34, Body 18/26, Caption 14/20
- **No all-caps, no em dashes, no single-word accent styling**

### Components
- **Buttons:** 8px radius rectangles (not pills), min 56×56px touch targets
- **Mic button:** 96×96px circle (single justified exception)
- **Cards:** 8px radius, 1px border, no shadow (document-like)
- **Icons:** Custom 2px stroke line-icon set (no emoji)

## 📱 PWA Features

- **Installable** — `manifest.json` with icons at required sizes
- **Offline-capable** — Service Worker caches shell + IndexedDB for data
- **Theme color** — Matches `color-trust` (`#009378`)
- **Service Worker** — Registered in production via `main.tsx`

## 🔐 Pre-Launch Checklist

Per `design.md §10`:
- [ ] Custom domain connected
- [ ] Favicon added (brand mark)
- [ ] "Made with AI" badge removed
- [ ] Privacy Policy page written & linked
- [ ] Terms & Conditions page written & linked
- [ ] Manifest & SW configured for installability
- [ ] All copy reviewed (no placeholder text, no emoji icons)
- [ ] All metrics verified live from API (no hardcoded values)

## 📄 Documentation

- **Developer Guide:** `AJAY_VANI_Mobile_App_Developer_Guide.md` — Screen specs, API contracts, task checklist
- **Design System:** `design.md` — Visual specification, tokens, components, accessibility

## 🤝 Contributing

This is a government livelihood scheme tool. Contributions should prioritize:
1. Accessibility for low-literacy users
2. Offline-first reliability
3. Authentic government data (NSQF codes, PM-AJAY schemes)
4. Calm, authoritative tone — no marketing language

## 📜 License

Private project for PM-AJAY implementation. Not for public distribution without authorization.

---

**Built for:** Ministry of Social Justice & Empowerment — PM-AJAY Scheme  
**Target Beneficiaries:** SC Communities across Uttar Pradesh, Bihar, Madhya Pradesh (Bundelkhand)