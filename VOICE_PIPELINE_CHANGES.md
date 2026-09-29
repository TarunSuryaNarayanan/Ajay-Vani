# Voice Pipeline Changes — `fix-voice-pipeliine` branch

> **Branch created from:** `app1`  
> **Purpose:** Fix the microphone / speech recognition pipeline so it listens long enough for users to finish speaking before classifying them.  
> **Date:** 2026-09-29

---

## Files Changed

### 1. `src/services/webSpeechAsr.ts`

**What changed:**
- Added a `resetSilenceTimer()` helper that starts an **8-second countdown** every time the user speaks a word or begins talking. This timer is reset each time new speech is detected, and only fires (submitting the result) after 8 full seconds of complete silence.
- Fixed `onerror` handler to **ignore `no-speech`, `network`, and `aborted` errors** when the mic is in continuous mode, instead of treating them as fatal errors that kill the session.
- Fixed `onend` handler so that if Chrome's browser engine auto-closes the microphone (which it does after every sentence), the code **automatically restarts the mic** within 50 ms. If that restart fails (e.g. the engine is still resetting internally), it retries every 100 ms until it succeeds.

**Why:**  
Chrome's Web Speech API was firing `onend` after every single sentence, which caused the mic to close and the result to be submitted immediately, before the user had a chance to say more. The fix keeps the mic alive as a "continuous stream" that only submits when the user is truly done talking (8s of silence) or manually taps the stop button.

---

### 2. `src/services/audioCapture.ts`

**What changed:**
- Increased the `SILENCE_TIMEOUT_MS` constant from **1,500 ms (1.5 seconds)** to **8,000 ms (8 seconds)**.

**Why:**  
The offline Voice Activity Detection (VAD) engine uses this constant to decide how long to wait after the user stops talking before it processes the audio. With 1.5 seconds, the user could not take a natural breath or pause between sentences without the system cutting them off. 8 seconds gives enough headroom for normal conversational pauses.

---

### 3. `src/services/speech.ts`

**What changed:**
- Restored the `onVADSpeechEnd` callback (which was temporarily blanked out during debugging) back to its correct form: it now calls `handleManualStop()` and submits the audio for transcription when the silence threshold is reached.
- Added `onInterimResult` callback forwarding so that interim/partial transcript results from `webSpeechAsrService.recognize()` are passed directly to the calling screen in real-time via `onResult(text, false)`.

**Why:**  
- Restoring `onVADSpeechEnd` ensures the offline pipeline auto-submits when the user is done speaking (instead of requiring a manual button tap).
- Forwarding interim results enables live, word-by-word text feedback on the Aadhaar entry and conversation screens, so the user can see what's being transcribed as they speak.

---

### 4. `src/screens/AadhaarLoginScreen.tsx`

**What changed:**
- Captured the value of `aadhaarInput` at the moment the mic button is tapped into a `const initialInput` variable.
- Changed the input accumulation logic to `setAadhaarInput((initialInput + digits).slice(0, 12))` instead of using the `prev =>` callback pattern.

**Why:**  
The previous `prev =>` callback was **additive** — every time an interim result came in (which contains the *full* spoken string so far, not just the new part), it would append the full string *again*, causing digits to duplicate. By snapshotting `initialInput` at the start and combining it with the latest full interim transcript, digit duplication is eliminated and the input fills in naturally in real-time.

---

### 5. `src/services/api.ts` — `localFallbackProcess()`

**What changed:**
- Changed the **default fallback job** from "Solar PV Installer & Electrician" to a neutral **"General Helper & Trainee"** with a low match score (70%). Solar PV is now only matched when the user explicitly mentions keywords like "solar", "bijli", "wire", or "electric".
- Replaced all `string.includes()` checks with **regex patterns** (`/keyword1|keyword2|.../i.test(lower)`) so matching is case-insensitive and works with a broader set of natural language variations.
- Added missing keyword variations:
  - Garment/stitching: `silne`, `kapde`, `kapdon`, `सिलने`, `कपड़े`, `कपड़ों`
  - Dairy: `डेरी` (alternate spelling)
  - Machinery: `mechanic`
  - Electrical: `bijli`, `wire`, `electric`, `सोलर`, `बिजली`, `वायर`

**Why:**  
The old code defaulted to "Solar PV Technician" for *any* input that didn't contain a very specific keyword. So if a user said "namasthe" or "mera naam Sanjana hai" without mentioning a trade, they were incorrectly classified as a solar panel installer. The new logic correctly produces a neutral result for unclassified inputs and only matches a specific trade when the user actually mentions it.

---

## Summary of User Impact

| Problem | Before | After |
|---|---|---|
| Mic cuts off after first sentence | Submits after 1.5s silence | Waits 8s of silence before submitting |
| Need to tap mic twice | Chrome killed mic, user retapped to re-open | Mic auto-restarts seamlessly within 50ms |
| "Namaste" → classified as Solar PV | Solar PV was the hardcoded default | Neutral "General Helper" until a trade keyword is spoken |
| Aadhaar digits duplicated in real-time | `prev + newDigits` kept doubling | Snapshot-based accumulation eliminates duplication |
| Partial transcript errors killed the session | `network`/`no-speech` errors were fatal | Non-fatal errors are silently ignored in continuous mode |

---

## What Was NOT Changed

- `app1` branch — **zero changes pushed there**. All changes in this document exist exclusively on this branch.
- No UI layout or visual components were modified.
- No server-side files were modified.
- No other screens (e.g. `VoiceChatScreen.tsx` logic for classification routing) were modified.
