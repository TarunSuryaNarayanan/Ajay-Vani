# 📱 AJAY-VANI Mobile App: Developer Implementation & Architecture Specification

**Project Name:** AJAY-VANI (*AI-Driven Multilingual Voice Livelihood Assistant for PM-AJAY*)  
**Target Users:** SC Beneficiaries (Low Digital Literacy, Dialect Speakers), Rural Youth, Gram Sahayaks (ASHA/Anganwadi Workers)  
**Target Platform:** Mobile App (React Native / Expo OR Progressive Web App - PWA)  

---

## 🎯 1. Overview & Core Developer Objective

This document is the complete developer blueprint for building the **AJAY-VANI Mobile App**.

The mobile app's core mission is to **replace intimidating text-heavy government forms with an empathetic, voice-first interview in native Indian dialects** (Bhojpuri, Bundeli, Chhattisgarhi, Malvi, etc.). It converts rural beneficiary voice responses into **NSQF Qualification Packs**, matches them to **local district job demand (ODOP & MSMEs)**, and provides audio guidance on **PM-AJAY GIA ₹50,000 subsidies & MUDRA loans**.

---

## 🛠️ 2. Recommended Tech Stack & Free Dependencies

The teammate developer should build this app using the **JavaScript / React Native / PWA ecosystem** with **100% Free APIs**:

| Layer | Framework / Library | Purpose & Package Name |
| :--- | :--- | :--- |
| **App Framework** | **React Native (Expo)** OR **React.js + Vite PWA** | Cross-platform mobile development for Android/iOS. |
| **Speech-to-Text (STT)** | **`@react-native-voice/voice`** OR **Web Speech API (`webkitSpeechRecognition`)** | Captures Hindi & regional dialect speech natively from device mic. **(100% Free)** |
| **Text-to-Speech (TTS)** | **`expo-speech`** OR **Web Speech Synthesis (`window.speechSynthesis`)** | Plays back warm audio responses in Hindi (`hi-IN`) and regional voices. **(100% Free)** |
| **Conversational AI** | **Google Gemini 1.5 Flash API (`@google/genai`)** OR **Groq API** | 100% Free Developer Tier (15 RPM). Extracts profile JSON from voice transcripts. **(100% Free)** |
| **Offline Storage** | **`@react-native-async-storage/async-storage`** OR **`IndexedDB` (idb)** | Stores voice interviews locally when zero internet is available. **(100% Free)** |
| **Audio Waveform UI** | **`react-native-audio-recorder-player`** OR **HTML5 Audio Visualizer** | Renders dynamic microphone waveform pulses while the user speaks. |
| **UI Components** | **React Native Paper** / **Tailwind CSS (`nativewind`)** | Accessible, high-contrast, large-button UI tailored for low-literacy users. |

---

## 📱 3. Complete Screen-by-Screen Specification & Flow

```
┌─────────────────────────────┐
│ Screen 1: Dialect Selection │ ──► Choose Language (Hindi, Bhojpuri, Bundeli, Tamil, etc.)
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│ Screen 2: Voice Chatbot UI  │ ──► Tap Big Mic ➔ Speak Aspirations ➔ Hear Empathetic Audio
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│ Screen 3: NSQF Skill Profile│ ──► View Extracted Skills + Matched NSQF QP Code (e.g. AGR/Q6701)
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│ Screen 4: Skilling & Jobs   │ ──► Locate Nearby PM-AJAY Centers & District ODOP Vacancies
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│ Screen 5: Micro-Finance Guide│──► Step-by-step Audio Guide for GIA ₹50k Subsidy & MUDRA Loan
└─────────────────────────────┘
```

---

### **Screen 1: Language & Dialect Selection Screen**
* **Goal:** Allow user or Gram Sahayak to pick native language/dialect in 1 tap.
* **UI Design:** Large visual tiles with regional script & voice preview button:
  * 🇮🇳 **Hindi (हिंदी)**
  * 🗣️ **Bhojpuri (भोजपुरी)**
  * 🗣️ **Bundeli (बुंदेली)**
  * 🗣️ **Chhattisgarhi (छत्तीसगढ़ी)**
  * 🗣️ **Maithili (मैथिली)**
  * 🇮🇳 **Tamil / Telugu / Marathi / Bengali**
* **Logic:** Sets `selectedLanguage` and `selectedDialect` in global app state/Context.

---

### **Screen 2: Empathetic Voice Assistant Chat Screen (THE CORE SCREEN)**
* **Goal:** Main conversational interview screen. ZERO text entry required.
* **UI Components:**
  1. **Empathetic Avatar (Gram Sahayak):** Animated visual avatar responding to voice.
  2. **Big Microphone Pulse Button:** Single large mic button ("Tap to Speak / बोलने के लिए दबाएं").
  3. **Live Waveform Visualizer:** Shows audio input intensity when beneficiary speaks.
  4. **Live Transcript Box:** Displays spoken text in real-time.
  5. **Audio Replay Button:** Allows beneficiary to re-listen to AI responses anytime.
* **Voice Pipeline Logic:**
  ```javascript
  // 1. Start Audio Capture
  Voice.start('hi-IN');

  // 2. On Speech Recognized
  Voice.onSpeechResults = async (e) => {
    const userTranscript = e.value[0];
    
    // 3. Send Payload to Node.js Backend API
    const response = await fetch('http://YOUR_SERVER_IP:5000/api/voice/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: userTranscript, district: 'Varanasi', language: 'hi-IN' })
    });
    
    const data = await response.json();
    
    // 4. Play Native Audio Output
    Speech.speak(data.friendlyAudioResponse, { language: 'hi-IN', pitch: 1.0, rate: 0.9 });
  };
  ```

---

### **Screen 3: NSQF Skill Profile & Feasibility Match Screen**
* **Goal:** Display structured beneficiary profile extracted by AI.
* **UI Components:**
  * **Informal Experience Badge:** e.g., *"Traditional Trade: Tractor & Electrical Repair"*
  * **Matched NSQF Role Card:**
    * **Role Name:** Solar PV Installer & Electrician
    * **Official QP Code:** `ELE/Q5901` *(Authentic Govt Code)*
    * **NSQF Level:** Level 4
    * **Feasibility Match Score:** `92% Match` (based on local district demand)
  * **Mobility Badge:** *"Prefers Local Work within District (15km radius)"*

---

### **Screen 4: Nearby Skilling Centers & Job Opportunities Screen**
* **Goal:** Connect candidate to real local skilling centers & job openings under PM-AJAY.
* **UI Components:**
  * **Center Locator Cards:**
    * 📍 *Government ITI Varanasi Skill Center (5.2 km away)*
    * 🎓 *Course: Short-Term Solar Maintenance (300 Hours - Free with Food Allowance)*
    * 📞 *Direct Call Coordinator Button*
  * **Local Market Demand Badge:** *"ODOP Sector: High demand for Solar Technicians in District Varanasi (120 Openings)"*

---

### **Screen 5: AI Voice Micro-Finance & Subsidy Advisor Screen**
* **Goal:** Guide self-employment beneficiaries on funding assets.
* **UI Components:**
  * **Audio Explanation Player:** *"PM-AJAY GIA scheme gives up to ₹50,000 direct subsidy for SC entrepreneurs taking MUDRA loans."*
  * **Step-by-Step Checklist:**
    1. ✅ Aadhaar & Caste Certificate Verification
    2. ✅ 1-Page Micro-Business Proposal (Auto-generated by AI)
    3. ✅ Submission to Block Development Officer (BDO)
  * **Button:** *"Generate 1-Page Business Proposal PDF"*

---

### **Screen 6: Offline Mode & Data Sync Monitor**
* **Goal:** Handle zero-internet environments in remote rural blocks.
* **Logic:**
  ```javascript
  import NetInfo from "@react-native-community/netinfo";
  import AsyncStorage from '@react-native-async-storage/async-storage';

  // Monitor Network
  NetInfo.addEventListener(state => {
    if (!state.isConnected) {
      // Store Voice Interview in Local Queue
      AsyncStorage.setItem(`offline_interview_${Date.now()}`, JSON.stringify(interviewData));
    } else {
      // Auto Sync Queued Records to Server
      syncQueuedInterviews();
    }
  });
  ```

---

## 🔌 4. REST API Endpoints Contract (Connecting to Node.js Backend)

Your teammate developer should connect the mobile app to these Express API endpoints:

### **1. Process Voice Transcript:**
* **POST** `/api/voice/process`
* **Request Payload:**
  ```json
  {
    "transcript": "Mera naam Ramesh hai, main gaon me bijli ka kaam karta hoon aur solar seekhna chahta hoon.",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "language": "hi-IN"
  }
  ```
* **Response Payload:**
  ```json
  {
    "success": true,
    "profile": {
      "educationLevel": "8th Pass",
      "traditionalOccupation": "Electrical Repair",
      "employmentPreference": "Self-Employment"
    },
    "recommendedNSQF": {
      "qpCode": "ELE/Q5901",
      "roleName": "Solar PV Installer",
      "nsqfLevel": 4,
      "matchScore": 92
    },
    "friendlyAudioResponse": "Ram Ram Ramesh Bhaiya! Solar panel maintenance me aapke zile me 120 vacancies hain. Level 4 course paas ke center me available hai."
  }
  ```

### **2. Sync Offline Interviews:**
* **POST** `/api/sync/offline`
* **Request Payload:** Array of offline interview objects stored in `AsyncStorage`.

---

## 📋 5. Teammate Developer Task Checklist

Give this checklist directly to your teammate developer:

- [ ] **Step 1:** Initialize Expo / React Native App (`npx create-expo-app ajay-vani-mobile`).
- [ ] **Step 2:** Install dependencies (`@react-native-voice/voice`, `expo-speech`, `axios`, `nativewind`).
- [ ] **Step 3:** Build **Language Selection Screen** (Screen 1) with large native script tiles.
- [ ] **Step 4:** Build **Empathetic Voice Assistant Screen** (Screen 2) with big animated microphone button.
- [ ] **Step 5:** Connect microphone speech recognizer to backend `/api/voice/process`.
- [ ] **Step 6:** Trigger native text-to-speech output (`Speech.speak`) when AI response arrives.
- [ ] **Step 7:** Build **NSQF Skill Profile Screen** (Screen 3) showing matched QP code & local market feasibility score.
- [ ] **Step 8:** Add **NetInfo offline listener** & local `AsyncStorage` queue for zero-internet rural demo!
