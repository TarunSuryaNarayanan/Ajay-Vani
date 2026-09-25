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
| **Speech (Client)** | Web Speech API (`webkitSpeechRecognition`, `speechSynthesis`) |
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
  "jspdf": "^2.5.2"
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
- IndexedDB stores complete interview records (transcript, profile, NSQF match, district, language)
- Network listeners trigger immediate sync on reconnection
- Visual offline banner + pending count badge

### Multilingual Voice Support
- 9 Indian dialects via Web Speech API
- Dialect-specific empathetic audio responses (Hindi, Bhojpuri, Bundeli + fallback)
- Server-side keyword matching across Devanagari + transliterated terms

### Government Scheme Integration
- Authentic NSQF QP codes from NSDC
- Real district demand scores (Varanasi, Gorakhpur, Patna, Bundelkhand)
- PM-AJAY GIA ₹50,000 + MUDRA loan guidance
- One-page PDF business proposal generation

## 📁 Project Structure

```
ajay-vani-mobile/
├── public/                 # Static assets (manifest, icons)
├── server/                 # Express backend
│   ├── data/
│   │   ├── nsqfPacks.ts    # 6 NSQF qualification packs with keywords & demand scores
│   │   └── districtJobs.ts # District market registry (centers, ODOP, vacancies)
│   └── index.ts            # API routes + heuristic transcript analyzer
├── src/
│   ├── components/
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
│   │   └── OfflineSyncScreen.tsx
│   ├── services/
│   │   ├── api.ts          # Backend API calls
│   │   └── offlineStorage.ts # IndexedDB operations
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