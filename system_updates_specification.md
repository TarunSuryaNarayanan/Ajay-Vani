# System Update Specification: Bug Fixes, Architecture Alignment & Feature Implementations

This document details the critical bug fixes, functional enhancements, and architectural specifications for the skill recommendation and enrollment platform.

---

## 🛠️ Phase 1: Bug Fixes & Conversational Alignment

### 1. Explicit User Prompt for Nearby Centers
* **Issue:** The platform automatically transitions or loads nearby training centers without explicit user interaction.
* **Fix:** Introduce an explicit action step. The application must prompt the user to click a **"Next"** (or **"Find Nearest Centers"**) button before calculating, rendering, or displaying nearby center results.

### 2. Conversational Loop & 7-Parameter NSQF Matching Engine Integration
* **Issue:** The conversational flow breaks, causing failure in extracting and mapping parameters to the NSQF matching engine.
* **Fix:** Fix and validate the conversational state machine to reliably capture and map all 7 parameters from the architecture model below:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       7-PARAMETER NSQF MATCHING ENGINE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Spoken Skill Vector Hits    → Scans keywords in Devanagari & English    │
│ 2. Education Level Classifier  → Scans 8th/10th/12th/ITI/Non-formal        │
│ 3. District ODOP Demand Match  → Maps Varanasi/Gorakhpur/Jhansi/Patna     │
│                                  registry                                   │
│ 4. Employment Mode Classifier → Distinguishes Self-Employment vs Salaried   │
│ 5. Beneficiary Name Extractor  → Extracts spoken name via regex             │
│ 6. Mobility Scope              → Enforces 15 km local district radius        │
│ 7. PM-AJAY Subsidy & Level Fit → Matches NSQF Level (1-4) & ₹50k GIA grant   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Language Routing & Localization Bug
* **Issue:** Selecting non-Hindi options during language selection still redirects the user to the Hindi interface page.
* **Fix:** Correct language routing so that selecting any language directs the user to the corresponding localized route/view rather than defaulting to the Hindi page.

### 4. Speech Recognition Overhaul
* **Issue:** Speech recognition engine is completely broken/unresponsive.
* **Fix:** Rebuild and debug the Speech Recognition integration module. Conduct aggressive end-to-end testing across various input voices, dialects, and browser environments to guarantee reliable voice capture and transcription.

### 5. AI Course Suggestion vs. Center Offering Reconciliation
* **Issue:** Mismatch between AI-recommended courses and the actual training programs available at the target center (e.g., selecting "Solar Technician" returns unrelated course listings at centers).
* **Fix:** Align the recommendation pipeline output with active center capabilities so that suggested courses strictly match available training programs at the selected center.

---

## 🚀 Phase 2: Implementation & Feature Additions

### 6. Real PMKK/ITI Training Center Dataset Integration (`data.gov.in`)
* **Data Sourcing:** Download the official PMKK (Pradhan Mantri Kaushal Kendra) and ITI (Industrial Training Institute) dataset from `data.gov.in`.
* **Data Pipeline:** Convert the CSV dataset into structured JSON and connect it to the backend endpoint.
* **Filtering:** Dynamically filter centers based on the user's selected district, returning verified real-world locations, addresses, and coordinator contact details.
* **Demo Note:** A explicit mention must be included during the presentation/video highlighting that the data represents a static snapshot sourced directly from `data.gov.in`.

### 7. Controlled District Selection via UI Dropdown
* **Behavior:** To avoid speech-to-text extraction errors for district selection during live demos, bypass voice extraction for district selection.
* **Audio Guidance:** Play audio prompt:  
  > *"Namaste! Kripaya screen par दिए गए list se apna jila (district) chune."*
* **UI Component:** Render a simple dropdown containing only the 4 supported demo districts:
  * **Varanasi**
  * **Gorakhpur**
  * **Jhansi**
  * **Patna**

### 8. Paperless "Digital QR Token" Offline Enrollment
* **Dashboard Generation:** Upon login and course confirmation, issue a unique **"Digital QR Token"** on the beneficiary's dashboard.
* **Verification Workflow:**
  1. Center clerk scans the beneficiary's QR code using any smartphone camera.
  2. The scan redirects to a secure web verification endpoint displaying:
     * Beneficiary's eKYC-verified photo.
     * Aadhaar verification status.
     * AI-assigned NSQF course (e.g., *Solar PV Installer*).
  3. The clerk clicks an **"Admit to Course"** button directly on the verification web page to complete paperless admission (similar to the CoWIN verification model).

---

> ⚠️ **CRITICAL DEVELOPMENT MANDATE:**  
> **DO NOT discard, overwrite, or replace any existing system features, functionality, or fallback implementations.** If a conflict occurs between existing code and these updates, retain the original code as a operational fallback mechanism.